from typing import List, Optional

from simulation.params import SimulationParams
from simulation.state import (
    ENCARGADO_ESPERANDO_PC,
    EVENT_FIN_INSCRIPCION,
    EVENT_FIN_MANTENIMIENTO,
    EVENT_INICIO_MANTENIMIENTO,
    EVENT_LLEGADA_ALUMNO,
    EVENT_REGRESO_ALUMNO,
    PC_LIBRE,
    Event,
    SimulationState,
)
from simulation.handlers.event_handlers import (
    admit_or_defer_student,
    dequeue_and_start_enrollment,
    finish_maintenance_visit_if_done,
    schedule_maintenance,
    start_maintenance_visit,
    technician_take_pc_or_wait,
)


class Simulation:
    def __init__(self, params: SimulationParams, observers: Optional[List] = None) -> None:
        self.params = params
        self.state = SimulationState(params.num_pcs)
        self.state.params = params

        # Mapa interno de eventos: los nombres publicos se formatean al procesar cada evento.
        self._event_handlers = {
            EVENT_LLEGADA_ALUMNO: self._handle_student_arrival,
            EVENT_REGRESO_ALUMNO: self._handle_student_return,
            EVENT_INICIO_MANTENIMIENTO: self._handle_maintenance_start,
            EVENT_FIN_INSCRIPCION: self._handle_registration_complete,
            EVENT_FIN_MANTENIMIENTO: self._handle_maintenance_complete,
        }

        self.observers = []
        if observers:
            for observer in observers:
                self.observers.append(observer(self.state) if isinstance(observer, type) else observer)

    def run(self, max_time: float) -> SimulationState:
        """Ejecuta el motor de eventos discretos hasta el horizonte indicado."""
        self.state.event = "inicialización"
        self.state.fresh_row()
        self.state.initialize_events(self.params)
        self._notify_observers(event=None)

        while self.state.current_time < max_time:
            event = self.state.get_next_event()
            if event is None or event.time > max_time:
                break

            self.state.current_time = event.time
            self.state.fresh_row()
            self._event_handlers[event.type](event)
            self._notify_observers(event)

        # Al cortar por horizonte, solo acumulamos tiempos; no cambiamos el estado visible final.
        for pc in self.state.pcs:
            pc.advance_clock(max_time)

        if self.state.encargado.state == ENCARGADO_ESPERANDO_PC and self.state.encargado.esperando_desde is not None:
            self.state.technician_visit_idle_accumulated += max_time - self.state.encargado.esperando_desde

        self.state.current_time = max_time
        return self.state

    def _notify_observers(self, event: Optional[Event]) -> None:
        """Publica cada fila del vector a loggers, DB u otros observadores."""
        for observer in self.observers:
            observer.trigger(event)

    def _format_event_name(self, event: Event) -> str:
        if event.type in (EVENT_LLEGADA_ALUMNO, EVENT_REGRESO_ALUMNO):
            return f"{event.type} {event.student_id}"
        if event.type in (EVENT_FIN_INSCRIPCION, EVENT_FIN_MANTENIMIENTO):
            pc_id = event.pc_index + 1 if event.pc_index is not None else ""
            return f"{event.type} PC{pc_id}"
        return event.type

    def _handle_student_arrival(self, event: Event) -> None:
        student = self.state.create_student()
        event.student_id = student.id
        self.state.event = self._format_event_name(event)

        self.state.stats.total_students_arrived += 1
        self.state.stats.total_new_students_arrived += 1
        self.state.schedule_student_arrival()
        admit_or_defer_student(self.state, student)

    def _handle_student_return(self, event: Event) -> None:
        _, student_id = self.state.pop_student_return()
        event.student_id = student_id
        self.state.event = self._format_event_name(event)

        student = self.state.students_by_id.get(student_id)
        if student is None:
            return
        self.state.stats.total_students_arrived += 1
        # Si vuelve y la cola sigue llena, se registra el rechazo final y se destruye en memoria.
        admit_or_defer_student(self.state, student, schedule_return_when_full=False)

    def _handle_maintenance_start(self, event: Event) -> None:
        self.state.event = self._format_event_name(event)
        start_maintenance_visit(self.state)

    def _handle_registration_complete(self, event: Event) -> None:
        pc_index = event.pc_index
        assert pc_index is not None
        self.state.event = self._format_event_name(event)

        pc = self.state.pcs[pc_index]
        student_id = pc.current_student_id
        pc.current_student_id = None
        pc.change_state(PC_LIBRE, self.state.current_time)
        self.state.next_registration_complete[pc_index] = None
        self.state.stats.registrations_completed += 1

        if student_id is not None:
            student = self.state.students_by_id.get(student_id)
            if student is not None:
                student.completed_registration_at = self.state.current_time
            self.state.finalize_student(student_id, "INSCRIPTO")

        # La prioridad del encargado se aplica al liberar la PC, sin interrumpir inscripciones.
        if self.state.encargado.state == ENCARGADO_ESPERANDO_PC:
            technician_take_pc_or_wait(self.state)
        elif self.state.queue_student_ids:
            dequeue_and_start_enrollment(self.state, pc_index)

    def _handle_maintenance_complete(self, event: Event) -> None:
        pc_index = None
        for idx, pc in enumerate(self.state.pcs):
            if pc.state == "M":
                pc_index = idx
                break
        assert pc_index is not None
        event.pc_index = pc_index
        self.state.event = self._format_event_name(event)

        pc = self.state.pcs[pc_index]
        pc.change_state(PC_LIBRE, self.state.current_time)
        self.state.next_maintenance_complete = None

        if self.state.queue_student_ids:
            dequeue_and_start_enrollment(self.state, pc_index)

        if not finish_maintenance_visit_if_done(self.state):
            technician_take_pc_or_wait(self.state)

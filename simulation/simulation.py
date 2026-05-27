import heapq
from typing import List, Optional

from simulation.params import SimulationParams
from simulation.state import SimulationState, Event
from simulation.handlers.event_handlers import (
    admit_or_defer_student,
    dequeue_and_start_enrollment,
    find_unmaintained_pc,
    schedule_maintenance,
    schedule_technician_return,
    technician_take_pc_or_wait,
)
from utils.random_generator import exponential


class Simulation:
    def __init__(self, params: SimulationParams, handlers: Optional[List] = None) -> None:
        self.params = params
        self.state = SimulationState(params.num_pcs)
        self.state.params = params  # Los helpers acceden a parámetros vía state.params.

        # Dispatch table de eventos internos. Agregar evento = un método + entrada acá.
        self._event_handlers = {
            'student_arrival': self._handle_student_arrival,
            'registration_complete': self._handle_registration_complete,
            'technician_arrival': self._handle_technician_arrival,
            'maintenance_complete': self._handle_maintenance_complete,
            'student_return': self._handle_student_return,
        }

        # Observadores externos (loggers, persistencia). Aceptan clase o instancia.
        self.handlers = []
        if handlers:
            for h in handlers:
                self.handlers.append(h(self.state) if isinstance(h, type) else h)

    def run(self, max_time: float) -> SimulationState:
        """Ejecuta el bucle de eventos hasta max_time."""
        # 1. Programar eventos iniciales y emitir la fila 0.
        self.state.event = 'inicialización'
        self.state.fresh_row()
        self.state.initialize_events(self.params)
        self._notify_observers(event=None)

        # 2. Bucle principal.
        while self.state.current_time < max_time:
            event = self.state.get_next_event()
            if event is None or event.time > max_time:
                break

            self.state.current_time = event.time
            self.state.event = (
                f"{event.type}_pc{event.pc_index + 1}" if event.pc_index is not None else event.type
            )
            self.state.fresh_row()

            self._event_handlers[event.type](event)
            self._notify_observers(event)

        # 3. Finalización: acumular tiempos hasta el horizonte pedido.
        for pc in self.state.servers:
            pc.change_state('idle', max_time)

        if self.state.technician_state == 'waiting':
            self.state.technician_visit_idle_accumulated += max_time - self.state.technician_visit_idle_start

        self.state.current_time = max_time
        return self.state

    def _notify_observers(self, event: Optional[Event]) -> None:
        for h in self.handlers:
            h.trigger(event)

    # ----- Event handlers -----

    def _handle_student_arrival(self, event: Event) -> None:
        state = self.state
        state.stats.total_students_arrived += 1
        state.stats.total_new_students_arrived += 1

        # El flujo externo de alumnos sigue aunque éste se vaya y vuelva más tarde.
        rnd, interval = exponential(state.params.mean_arrival_time)
        state.row.student_rnd = rnd
        state.row.student_arrival_time = interval
        state.next_student_arrival = state.current_time + interval

        admit_or_defer_student(state)

    def _handle_registration_complete(self, event: Event) -> None:
        state = self.state
        pc_index = event.pc_index
        assert pc_index is not None
        pc = state.servers[pc_index]

        pc.change_state('idle', state.current_time)
        state.next_registration_complete[pc_index] = None
        state.stats.registrations_completed += 1

        # Prioridad: si el técnico estaba esperando por esta PC, la toma.
        if state.technician_state == 'waiting' and not state.technician_pcs_maintained[pc_index]:
            state.technician_visit_idle_accumulated += state.current_time - state.technician_visit_idle_start
            schedule_maintenance(state, pc_index)
        elif len(state.queue) > 0:
            dequeue_and_start_enrollment(state, pc_index)

    def _handle_technician_arrival(self, event: Event) -> None:
        state = self.state
        state.technician_pcs_maintained = [False] * len(state.servers)
        state.technician_visit_idle_accumulated = 0.0
        state.next_technician_arrival = None  # Está físicamente en la sala.

        technician_take_pc_or_wait(state)

    def _handle_maintenance_complete(self, event: Event) -> None:
        state = self.state
        pc_index = state.technician_current_pc
        assert pc_index is not None

        state.technician_pcs_maintained[pc_index] = True
        state.servers[pc_index].change_state('idle', state.current_time)
        state.next_maintenance_complete = None
        state.technician_current_pc = None

        # PC recién liberada: si había alumnos en cola, el primero la toma.
        if len(state.queue) > 0:
            dequeue_and_start_enrollment(state, pc_index)

        # ¿Quedan PCs sin mantener?
        if find_unmaintained_pc(state) is None:
            # Visita completada.
            state.stats.total_technician_visits += 1
            state.stats.total_technician_idle_time += state.technician_visit_idle_accumulated
            state.technician_state = 'absent'
            schedule_technician_return(state)
        else:
            technician_take_pc_or_wait(state)

    def _handle_student_return(self, event: Event) -> None:
        state = self.state
        heapq.heappop(state.student_returns)
        state.stats.total_students_arrived += 1
        admit_or_defer_student(state)

import heapq
from collections import deque
from dataclasses import dataclass, field
from typing import Deque, Dict, List, Optional, Tuple

from utils.random_generator import exponential


PC_LIBRE = "L"
PC_INSCRIPCION = "I"
PC_MANTENIMIENTO = "M"

ALUMNO_ESPERANDO_VOLVER = "EV"
ALUMNO_ESPERANDO_FILA = "EF"

ENCARGADO_ESPERANDO_MANTENIMIENTO = "EM"
ENCARGADO_ESPERANDO_PC = "EPC"

EVENT_INICIO_MANTENIMIENTO = "inicio_mantenimiento"
EVENT_LLEGADA_ALUMNO = "llegada_alumno"
EVENT_REGRESO_ALUMNO = "regreso_alumno"
EVENT_FIN_INSCRIPCION = "fin_inscripcion"
EVENT_FIN_MANTENIMIENTO = "fin_mantenimiento"

EVENT_PRIORITIES = {
    EVENT_FIN_INSCRIPCION: 0,
    EVENT_FIN_MANTENIMIENTO: 0,
    EVENT_INICIO_MANTENIMIENTO: 1,
    EVENT_LLEGADA_ALUMNO: 3,
    EVENT_REGRESO_ALUMNO: 3,
}


@dataclass
class Event:
    time: float
    type: str
    pc_index: Optional[int] = None
    student_id: Optional[int] = None


@dataclass
class Row:
    """Audit columns for the current event row (RNDs + sampled times)."""
    student_rnd: Optional[float] = None
    student_arrival_time: Optional[float] = None
    registration_rnd: Optional[float] = None
    registration_time: Optional[float] = None
    maintenance_rnd: Optional[float] = None
    maintenance_time: Optional[float] = None
    technician_return_rnd: Optional[float] = None
    technician_return_time: Optional[float] = None


@dataclass
class PC:
    id: int
    state: str = PC_LIBRE
    current_student_id: Optional[int] = None
    last_state_change: float = 0.0
    busy_time: float = 0.0
    maintenance_time: float = 0.0

    def change_state(self, new_state: str, current_time: float) -> None:
        duration = current_time - self.last_state_change
        if self.state == PC_INSCRIPCION:
            self.busy_time += duration
        elif self.state == PC_MANTENIMIENTO:
            self.maintenance_time += duration
        self.state = new_state
        self.last_state_change = current_time

    def advance_clock(self, current_time: float) -> None:
        duration = current_time - self.last_state_change
        if self.state == PC_INSCRIPCION:
            self.busy_time += duration
        elif self.state == PC_MANTENIMIENTO:
            self.maintenance_time += duration
        self.last_state_change = current_time

    def snapshot(self) -> dict:
        return {"id": self.id, "state": self.state}


@dataclass
class Alumno:
    id: int
    state: str
    first_arrival_time: float
    last_event_time: float
    attempts: int = 0
    times_returned_later: int = 0
    total_waiting_time: float = 0.0
    waiting_started_at: Optional[float] = None
    return_time: Optional[float] = None
    completed_registration_at: Optional[float] = None
    final_state: Optional[str] = None

    @property
    def minuto_vuelta(self) -> Optional[float]:
        return self.return_time / 60.0 if self.return_time is not None else None

    @property
    def esperando_en_fila_desde(self) -> Optional[float]:
        return self.waiting_started_at / 60.0 if self.waiting_started_at is not None else None

    def snapshot(self) -> dict:
        return {
            "id": self.id,
            "state": self.state,
            "minuto_vuelta": self.minuto_vuelta,
            "esperando_en_fila_desde": self.esperando_en_fila_desde,
            "attempts": self.attempts,
            "times_returned_later": self.times_returned_later,
            "total_waiting_time": self.total_waiting_time,
            "first_arrival_time": self.first_arrival_time,
            "last_event_time": self.last_event_time,
            "completed_registration_at": self.completed_registration_at,
        }

    def record(self) -> dict:
        return {
            "student_id": self.id,
            "final_state": self.final_state or self.state,
            "attempts": self.attempts,
            "times_returned_later": self.times_returned_later,
            "total_waiting_time": self.total_waiting_time,
            "first_arrival_time": self.first_arrival_time,
            "last_event_time": self.last_event_time,
            "return_time": self.return_time,
            "completed_registration_at": self.completed_registration_at,
        }


@dataclass
class Encargado:
    state: str = ENCARGADO_ESPERANDO_MANTENIMIENTO
    pcs_pendientes_mantenimiento: List[int] = field(default_factory=list)
    esperando_desde: Optional[float] = None

    def snapshot(self) -> dict:
        return {
            "state": self.state,
            "pcs_pendientes_mantenimiento": list(self.pcs_pendientes_mantenimiento),
            "esperando_desde": self.esperando_desde,
        }


@dataclass
class SimulationStats:
    total_students_arrived: int = 0
    total_new_students_arrived: int = 0
    total_students_returned: int = 0
    students_queued_and_waited: int = 0
    total_waiting_time: float = 0.0
    registrations_completed: int = 0
    total_technician_visits: int = 0
    total_technician_idle_time: float = 0.0


class SimulationState:
    def __init__(self, num_servers: int = 6):
        self.current_time: float = 0.0
        self.event: str = "inicialización"
        self.params = None

        self.pcs: List[PC] = [PC(id=i + 1) for i in range(num_servers)]
        self.servers = self.pcs

        self.students_by_id: Dict[int, Alumno] = {}
        self.student_history: Dict[int, Alumno] = {}
        self.finalized_student_records: List[dict] = []
        self.next_student_id: int = 1
        self.queue_student_ids: Deque[int] = deque()
        self.queue = self.queue_student_ids

        self.encargado = Encargado()
        self.technician_visit_idle_accumulated: float = 0.0

        self.stats = SimulationStats()

        self.next_student_arrival: Optional[float] = None
        self.next_maintenance_start: Optional[float] = None
        self.next_maintenance_complete: Optional[float] = None
        self.next_registration_complete: List[Optional[float]] = [None] * num_servers
        self.student_return_events: List[Tuple[float, int]] = []

        self.row: Row = Row()

    def fresh_row(self) -> None:
        self.row = Row()

    def create_student(self, current_time: Optional[float] = None) -> Alumno:
        now = self.current_time if current_time is None else current_time
        student = Alumno(
            id=self.next_student_id,
            state="",
            first_arrival_time=now,
            last_event_time=now,
        )
        self.next_student_id += 1
        self.students_by_id[student.id] = student
        self.student_history[student.id] = student
        return student

    def finalize_student(self, student_id: int, final_state: str) -> None:
        student = self.students_by_id.pop(student_id, None)
        if student is None:
            return
        student.final_state = final_state
        student.last_event_time = self.current_time
        self.finalized_student_records.append(student.record())

    def schedule_student_arrival(self) -> None:
        rnd, tpo = exponential(self.params.mean_arrival_time)
        self.row.student_rnd = rnd
        self.row.student_arrival_time = tpo
        self.next_student_arrival = self.current_time + tpo

    def initialize_events(self, params) -> None:
        self.params = params
        self.schedule_student_arrival()
        if params.initial_maintenance_at_start:
            self.next_maintenance_start = self.current_time
        else:
            from simulation.handlers.event_handlers import schedule_next_maintenance_start

            schedule_next_maintenance_start(self)

    def get_next_event(self) -> Optional[Event]:
        candidates = []
        if self.next_student_arrival is not None:
            candidates.append((self.next_student_arrival, EVENT_PRIORITIES[EVENT_LLEGADA_ALUMNO], EVENT_LLEGADA_ALUMNO, None, None))
        if self.next_maintenance_start is not None:
            candidates.append((self.next_maintenance_start, EVENT_PRIORITIES[EVENT_INICIO_MANTENIMIENTO], EVENT_INICIO_MANTENIMIENTO, None, None))
        if self.next_maintenance_complete is not None:
            candidates.append((self.next_maintenance_complete, EVENT_PRIORITIES[EVENT_FIN_MANTENIMIENTO], EVENT_FIN_MANTENIMIENTO, None, None))
        for i, t in enumerate(self.next_registration_complete):
            if t is not None:
                candidates.append((t, EVENT_PRIORITIES[EVENT_FIN_INSCRIPCION], EVENT_FIN_INSCRIPCION, i, None))
        if self.student_return_events:
            t, student_id = self.student_return_events[0]
            candidates.append((t, EVENT_PRIORITIES[EVENT_REGRESO_ALUMNO], EVENT_REGRESO_ALUMNO, None, student_id))
        if not candidates:
            return None
        time, _, event_type, pc_index, student_id = min(candidates, key=lambda x: (x[0], x[1]))
        return Event(time=time, type=event_type, pc_index=pc_index, student_id=student_id)

    def push_student_return(self, time: float, student_id: int) -> None:
        heapq.heappush(self.student_return_events, (time, student_id))

    def pop_student_return(self) -> Tuple[float, int]:
        return heapq.heappop(self.student_return_events)

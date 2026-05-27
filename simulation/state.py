from collections import deque
from dataclasses import dataclass, field
from typing import List, Optional

from utils.random_generator import uniform, exponential


EVENT_PRIORITIES = {
    # Finished work releases capacity before new external demand at the same clock tick.
    'maintenance_complete': 0,
    'registration_complete': 0,
    'technician_arrival': 1,
    'student_arrival': 3,
    'student_return': 3,
}


@dataclass
class Event:
    time: float
    type: str
    pc_index: Optional[int] = None


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
class ServerState:
    id: int
    state: str = 'idle'  # 'idle', 'busy', 'maintenance'
    last_state_change: float = 0.0
    busy_time: float = 0.0
    maintenance_time: float = 0.0

    def change_state(self, new_state: str, current_time: float):
        """Cambia el estado de la PC y acumula el tiempo transcurrido en el estado anterior."""
        duration = current_time - self.last_state_change
        if self.state == 'busy':
            self.busy_time += duration
        elif self.state == 'maintenance':
            self.maintenance_time += duration

        self.state = new_state
        self.last_state_change = current_time

    def __repr__(self):
        return f"Server(id={self.id}, state={self.state}, busy_time={self.busy_time:.1f}, maint_time={self.maintenance_time:.1f})"


@dataclass
class SimulationStats:
    # Estadísticas de Alumnos
    total_students_arrived: int = 0      # Total de intentos de arribo (incluyendo retornos)
    total_new_students_arrived: int = 0  # Total de alumnos nuevos del flujo exponencial
    total_students_returned: int = 0     # Intentos de alumnos que se retiraron porque la cola estaba llena
    students_queued_and_waited: int = 0  # Alumnos que entraron en cola y esperaron un tiempo > 0
    total_waiting_time: float = 0.0      # Sumatoria del tiempo de espera de alumnos que hicieron cola

    # Inscripciones exitosas completadas
    registrations_completed: int = 0

    # Estadísticas del Técnico de Sistemas
    total_technician_visits: int = 0       # Cantidad de visitas de mantenimiento completadas (al terminar las 6 PCs)
    total_technician_idle_time: float = 0.0  # Sumatoria del tiempo ocioso del técnico en visitas finalizadas

    def __repr__(self):
        return (f"Stats(arrived={self.total_students_arrived}, "
                f"new_arrived={self.total_new_students_arrived}, "
                f"returned={self.total_students_returned}, "
                f"waited={self.students_queued_and_waited}, "
                f"total_wait={self.total_waiting_time:.1f}, "
                f"visits={self.total_technician_visits}, "
                f"tech_idle={self.total_technician_idle_time:.1f})")


class SimulationState:
    def __init__(self, num_servers: int = 6):
        self.current_time: float = 0.0
        self.event: str = 'start'

        # Servidores (PCs)
        self.servers: List[ServerState] = [ServerState(id=i + 1) for i in range(num_servers)]

        # Cola de alumnos: tiempos de llegada de los alumnos en espera (FIFO)
        self.queue = deque()

        # Estado del Técnico de Sistemas
        self.technician_state: str = 'absent'  # 'absent', 'working', 'waiting'
        self.technician_pcs_maintained: List[bool] = [False] * num_servers
        self.technician_current_pc: Optional[int] = None
        self.technician_visit_idle_start: float = 0.0
        self.technician_visit_idle_accumulated: float = 0.0

        # Estadísticas acumuladas
        self.stats = SimulationStats()

        # Planificación de Eventos Futuros (FEL - Future Event List)
        self.next_student_arrival: Optional[float] = None
        self.next_technician_arrival: Optional[float] = None
        self.next_maintenance_complete: Optional[float] = None
        self.next_registration_complete: List[Optional[float]] = [None] * num_servers
        self.student_returns: List[float] = []

        # Fila actual de auditoría (RNDs + tiempos sampleados)
        self.row: Row = Row()

    def fresh_row(self) -> None:
        """Inicia una nueva fila vacía para auditar el evento que se va a procesar."""
        self.row = Row()

    def initialize_events(self, params) -> None:
        """Programa los eventos iniciales para arrancar la simulación."""
        # Diferido para evitar import circular state ↔ event_handlers helpers.
        from simulation.handlers.event_handlers import schedule_technician_return

        # 1. Primer arribo de alumno (exponencial con media 2' = 120s)
        rnd, tpo = exponential(params.mean_arrival_time)
        self.row.student_rnd = rnd
        self.row.student_arrival_time = tpo
        self.next_student_arrival = self.current_time + tpo

        # 2. Primer arribo del técnico (1 hora ± 3')
        schedule_technician_return(self)

    def get_next_event(self) -> Optional[Event]:
        """Busca y retorna el próximo evento programado."""
        candidates = []

        if self.next_student_arrival is not None:
            candidates.append((self.next_student_arrival, EVENT_PRIORITIES['student_arrival'], 'student_arrival', None))

        if self.next_technician_arrival is not None:
            candidates.append((self.next_technician_arrival, EVENT_PRIORITIES['technician_arrival'], 'technician_arrival', None))

        if self.next_maintenance_complete is not None:
            candidates.append((self.next_maintenance_complete, EVENT_PRIORITIES['maintenance_complete'], 'maintenance_complete', None))

        for i, t in enumerate(self.next_registration_complete):
            if t is not None:
                candidates.append((t, EVENT_PRIORITIES['registration_complete'], 'registration_complete', i))

        if self.student_returns:
            candidates.append((self.student_returns[0], EVENT_PRIORITIES['student_return'], 'student_return', None))

        if not candidates:
            return None

        time, _, event_type, pc_index = min(candidates, key=lambda x: (x[0], x[1]))
        return Event(time=time, type=event_type, pc_index=pc_index)

    def __repr__(self):
        return (f"State(time={self.current_time:.1f}, event={self.event}, "
                f"queue_len={len(self.queue)}, tech={self.technician_state}, "
                f"servers={self.servers})")

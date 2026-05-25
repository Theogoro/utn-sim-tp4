from collections import deque

from utils.random_generator import uniform, exponential


EVENT_PRIORITIES = {
    # Finished work releases capacity before new external demand at the same clock tick.
    'maintenance_complete': 0,
    'registration_complete': 0,
    'technician_arrival': 1,
    'student_arrival': 3,
    'student_return': 3,
}

class ServerState:
    def __init__(self, server_id: int):
        self.id = server_id
        self.state = 'idle'  # 'idle', 'busy', 'maintenance'
        self.last_state_change = 0.0
        self.busy_time = 0.0
        self.maintenance_time = 0.0

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


class SimulationStats:
    def __init__(self):
        # Estadísticas de Alumnos
        self.total_students_arrived = 0      # Total de intentos de arribo (incluyendo retornos)
        self.total_new_students_arrived = 0  # Total de alumnos nuevos del flujo exponencial
        self.total_students_returned = 0     # Intentos de alumnos que se retiraron porque la cola estaba llena
        self.students_queued_and_waited = 0  # Alumnos que entraron en cola y esperaron un tiempo > 0
        self.total_waiting_time = 0.0        # Sumatoria del tiempo de espera de alumnos que hicieron cola

        # Inscripciones exitosas completadas
        self.registrations_completed = 0

        # Estadísticas del Técnico de Sistemas
        self.total_technician_visits = 0     # Cantidad de visitas de mantenimiento completadas (al terminar las 6 PCs)
        self.total_technician_idle_time = 0.0 # Sumatoria del tiempo ocioso del técnico en visitas finalizadas

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
        self.current_time = 0.0
        self.event = 'start'
        
        # Servidores (PCs)
        self.servers = [ServerState(i + 1) for i in range(num_servers)]
        
        # Cola de alumnos: almacena los tiempos de llegada de los alumnos en espera (FIFO)
        self.queue = deque()
        
        # Estado del Técnico de Sistemas
        self.technician_state = 'absent'  # 'absent', 'working', 'waiting'
        self.technician_pcs_maintained = [False] * num_servers
        self.technician_current_pc = None  # Índice (0-based) de la PC bajo mantenimiento o espera
        self.technician_visit_idle_start = 0.0
        self.technician_visit_idle_accumulated = 0.0

        # Estadísticas acumuladas
        self.stats = SimulationStats()

        # Planificación de Eventos Futuros (FEL - Future Event List)
        self.next_student_arrival = None
        self.next_technician_arrival = None
        self.next_maintenance_complete = None
        self.next_registration_complete = [None] * num_servers
        self.student_returns = []

        # Variables de Auditoría Matemática y RNDs de la Fila Actual (Tabla)
        self.student_rnd = None
        self.student_arrival_time = None
        self.student_next_arrival_time = None
        
        self.registration_rnd = None
        self.registration_time = None
        
        self.maintenance_rnd = None
        self.maintenance_time = None
        
        self.technician_return_rnd = None
        self.technician_return_time = None

    def initialize_events(self, params):
        """Programa los eventos iniciales para arrancar la simulación."""
        # 1. Primer arribo de alumno (exponencial con media 2' = 120s)
        rnd, tpo = exponential(params.mean_arrival_time)
        self.student_rnd = rnd
        self.student_arrival_time = tpo
        self.next_student_arrival = self.student_next_arrival_time = self.current_time + tpo
        
        # 2. Primer arribo del técnico (1 hora ± 3' = 3600s ± 180s)
        rnd_tech, tpo_tech = uniform(
            params.mean_technician_return_time - params.technician_return_time_variation,
            params.mean_technician_return_time + params.technician_return_time_variation
        )
        self.technician_return_rnd = rnd_tech
        self.technician_return_time = tpo_tech
        self.next_technician_arrival = self.current_time + tpo_tech

    def get_next_event(self):
        """Busca y retorna el próximo evento programado en la FEL."""
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
            return None, None, None
            
        next_time, _, event_type, pc_index = min(candidates, key=lambda x: (x[0], x[1]))
        return next_time, event_type, pc_index

    def __repr__(self):
        return (f"State(time={self.current_time:.1f}, event={self.event}, "
                f"queue_len={len(self.queue)}, tech={self.technician_state}, "
                f"servers={self.servers})")

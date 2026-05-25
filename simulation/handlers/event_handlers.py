import heapq

from simulation.handlers.handler_interface import SimulationHandler
from utils.random_generator import uniform, exponential


def find_idle_pc(state):
    for idx, pc in enumerate(state.servers):
        if pc.state == 'idle':
            return idx
    return None


def start_enrollment(state, pc_index: int):
    params = state.params
    pc = state.servers[pc_index]
    pc.change_state('busy', state.current_time)

    rnd_reg, enrollment_time = uniform(params.min_enrollment, params.max_enrollment)
    state.registration_rnd = rnd_reg
    state.registration_time = enrollment_time
    state.next_registration_complete[pc_index] = state.current_time + enrollment_time


def schedule_student_return(state):
    params = state.params
    state.stats.total_students_returned += 1
    heapq.heappush(state.student_returns, state.current_time + params.student_return_time)


def admit_or_defer_student(state):
    params = state.params
    free_pc_index = find_idle_pc(state)

    if free_pc_index is not None:
        start_enrollment(state, free_pc_index)
    elif len(state.queue) >= params.student_wait_threshold:
        schedule_student_return(state)
    else:
        state.queue.append(state.current_time)


class StudentArrivalHandler(SimulationHandler):
    def __init__(self, state):
        self.state = state

    def trigger(self):
        state = self.state
        params = state.params
        
        # 1. Registrar intento de llegada
        state.stats.total_students_arrived += 1
        state.stats.total_new_students_arrived += 1

        # El flujo externo de alumnos continúa aunque este alumno se vaya y vuelva más tarde.
        rnd_arr, arrival_interval = exponential(params.mean_arrival_time)
        state.student_rnd = rnd_arr
        state.student_arrival_time = arrival_interval
        state.student_next_arrival_time = state.next_student_arrival = state.current_time + arrival_interval
        
        # 2. Tomar PC libre, entrar a cola, o volver mas tarde si la cola esta llena.
        admit_or_defer_student(state)


class RegistrationCompleteHandler(SimulationHandler):
    def __init__(self, state):
        self.state = state

    def trigger(self, pc_index: int):
        state = self.state
        params = state.params
        pc = state.servers[pc_index]
        
        # 1. Cambiar estado a libre y desprogramar fin de inscripción
        pc.change_state('idle', state.current_time)
        state.next_registration_complete[pc_index] = None
        state.stats.registrations_completed += 1
        
        # 2. Prioridad del técnico: ¿El técnico está en espera por esta máquina?
        if state.technician_state == 'waiting' and not state.technician_pcs_maintained[pc_index]:
            # Técnico toma la máquina inmediatamente, acumulando su ocio acumulado en esta visita
            idle_duration = state.current_time - state.technician_visit_idle_start
            state.technician_visit_idle_accumulated += idle_duration
            
            state.technician_state = 'working'
            state.technician_current_pc = pc_index
            pc.change_state('maintenance', state.current_time)
            
            # Generar RND y duración uniforme para Mantenimiento
            rnd_maint, maint_duration = uniform(params.min_maintenance_time, params.max_maintenance_time)
            state.maintenance_rnd = rnd_maint
            state.maintenance_time = maint_duration
            state.next_maintenance_complete = state.current_time + maint_duration
            
        # 3. Si el técnico no la toma, ver si hay alumnos esperando en cola
        elif len(state.queue) > 0:
            arrival_time = state.queue.popleft()
            wait_time = state.current_time - arrival_time
            
            state.stats.students_queued_and_waited += 1
            state.stats.total_waiting_time += wait_time
            
            start_enrollment(state, pc_index)


class TechnicianArrivalHandler(SimulationHandler):
    def __init__(self, state):
        self.state = state

    def trigger(self):
        state = self.state
        params = state.params
        
        # Inicializar visita del técnico
        state.technician_pcs_maintained = [False] * len(state.servers)
        state.technician_visit_idle_accumulated = 0.0
        state.next_technician_arrival = None  # Físicamente en la sala
        
        # Buscar la primera PC libre que requiera mantenimiento
        free_pc_index = find_idle_pc(state)
                
        if free_pc_index is not None:
            # Empezar mantenimiento inmediatamente
            state.technician_state = 'working'
            state.technician_current_pc = free_pc_index
            state.servers[free_pc_index].change_state('maintenance', state.current_time)
            
            # Generar RND y duración uniforme para Mantenimiento
            rnd_maint, maint_duration = uniform(params.min_maintenance_time, params.max_maintenance_time)
            state.maintenance_rnd = rnd_maint
            state.maintenance_time = maint_duration
            state.next_maintenance_complete = state.current_time + maint_duration
        else:
            # Todas las PCs están ocupadas con alumnos, el técnico debe esperar
            state.technician_state = 'waiting'
            state.technician_visit_idle_start = state.current_time


class MaintenanceCompleteHandler(SimulationHandler):
    def __init__(self, state):
        self.state = state

    def trigger(self):
        state = self.state
        params = state.params
        
        pc_index = state.technician_current_pc
        pc = state.servers[pc_index]
        
        # 1. Marcar máquina actual como mantenida y liberarla
        state.technician_pcs_maintained[pc_index] = True
        pc.change_state('idle', state.current_time)
        state.next_maintenance_complete = None
        state.technician_current_pc = None
        
        # Si hay alumnos esperando en cola, el primero toma esta PC que se acaba de liberar
        if len(state.queue) > 0:
            arrival_time = state.queue.popleft()
            wait_time = state.current_time - arrival_time
            state.stats.students_queued_and_waited += 1
            state.stats.total_waiting_time += wait_time
            
            start_enrollment(state, pc_index)
            
        # 2. Buscar la siguiente máquina sin mantener en esta visita
        next_to_maintain = None
        for idx, maintained in enumerate(state.technician_pcs_maintained):
            if not maintained:
                next_to_maintain = idx
                break
                
        if next_to_maintain is None:
            # Visita completada para las 6 PCs
            state.stats.total_technician_visits += 1
            state.stats.total_technician_idle_time += state.technician_visit_idle_accumulated
            
            state.technician_state = 'absent'
            
            # Generar RND e intervalo uniforme para Regreso del Técnico (1 hora ± 3')
            rnd_ret, return_interval = uniform(
                params.mean_technician_return_time - params.technician_return_time_variation,
                params.mean_technician_return_time + params.technician_return_time_variation
            )
            state.technician_return_rnd = rnd_ret
            state.technician_return_time = return_interval
            state.next_technician_arrival = state.current_time + return_interval
        else:
            # Aún quedan PCs. ¿Hay alguna libre en este momento?
            free_pc_index = None
            for idx, maintained in enumerate(state.technician_pcs_maintained):
                if not maintained and state.servers[idx].state == 'idle':
                    free_pc_index = idx
                    break
                    
            if free_pc_index is not None:
                # Iniciar mantenimiento en esa PC libre
                state.technician_state = 'working'
                state.technician_current_pc = free_pc_index
                state.servers[free_pc_index].change_state('maintenance', state.current_time)
                
                # Generar RND y duración uniforme para Mantenimiento
                rnd_maint, maint_duration = uniform(params.min_maintenance_time, params.max_maintenance_time)
                state.maintenance_rnd = rnd_maint
                state.maintenance_time = maint_duration
                state.next_maintenance_complete = state.current_time + maint_duration
            else:
                # Todas las restantes a mantener están ocupadas, esperar
                state.technician_state = 'waiting'
                state.technician_visit_idle_start = state.current_time


class StudentReturnHandler(SimulationHandler):
    def __init__(self, state):
        self.state = state

    def trigger(self):
        state = self.state
        params = state.params
        
        # Eliminar el evento de retorno actual
        heapq.heappop(state.student_returns)
        
        # Registrar intento de llegada
        state.stats.total_students_arrived += 1
        
        admit_or_defer_student(state)

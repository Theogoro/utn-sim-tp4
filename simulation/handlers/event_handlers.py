"""Pure helper functions used by Simulation's event-handler methods.

Cada helper muta `state` in-place. No clases, no estado propio.
Los handlers que disparan eventos viven como métodos de `Simulation`.
"""

import heapq

from utils.random_generator import uniform


def find_idle_pc(state):
    for idx, pc in enumerate(state.servers):
        if pc.state == 'idle':
            return idx
    return None


def find_unmaintained_pc(state):
    """Primera PC que aún no recibió mantenimiento en esta visita."""
    for idx, maintained in enumerate(state.technician_pcs_maintained):
        if not maintained:
            return idx
    return None


def find_idle_unmaintained_pc(state):
    """Primera PC libre que aún no recibió mantenimiento en esta visita."""
    for idx, maintained in enumerate(state.technician_pcs_maintained):
        if not maintained and state.servers[idx].state == 'idle':
            return idx
    return None


def start_enrollment(state, pc_index: int):
    """Asigna alumno a la PC: la pone busy, sortea duración y programa fin."""
    params = state.params
    state.servers[pc_index].change_state('busy', state.current_time)

    rnd, dur = uniform(params.min_enrollment, params.max_enrollment)
    state.row.registration_rnd = rnd
    state.row.registration_time = dur
    state.next_registration_complete[pc_index] = state.current_time + dur


def schedule_maintenance(state, pc_index: int):
    """Pone PC en 'maintenance', sortea duración y programa fin del mantenimiento."""
    params = state.params
    state.servers[pc_index].change_state('maintenance', state.current_time)
    state.technician_current_pc = pc_index
    state.technician_state = 'working'

    rnd, dur = uniform(params.min_maintenance_time, params.max_maintenance_time)
    state.row.maintenance_rnd = rnd
    state.row.maintenance_time = dur
    state.next_maintenance_complete = state.current_time + dur


def schedule_technician_return(state):
    """Sortea el próximo arribo del técnico (uniforme alrededor de la media ± variación)."""
    params = state.params
    rnd, ret = uniform(
        params.mean_technician_return_time - params.technician_return_time_variation,
        params.mean_technician_return_time + params.technician_return_time_variation,
    )
    state.row.technician_return_rnd = rnd
    state.row.technician_return_time = ret
    state.next_technician_arrival = state.current_time + ret


def schedule_student_return(state):
    """El alumno se va por cola llena: programa su retorno futuro."""
    params = state.params
    state.stats.total_students_returned += 1
    heapq.heappush(state.student_returns, state.current_time + params.student_return_time)


def admit_or_defer_student(state):
    """Asigna alumno a PC libre, lo encola, o lo manda a volver más tarde."""
    params = state.params
    free = find_idle_pc(state)

    if free is not None:
        start_enrollment(state, free)
    elif len(state.queue) >= params.student_wait_threshold:
        schedule_student_return(state)
    else:
        state.queue.append(state.current_time)


def dequeue_and_start_enrollment(state, pc_index: int):
    """Saca primer alumno de la cola, acumula su tiempo de espera y empieza inscripción."""
    arrival_time = state.queue.popleft()
    state.stats.students_queued_and_waited += 1
    state.stats.total_waiting_time += state.current_time - arrival_time
    start_enrollment(state, pc_index)


def technician_take_pc_or_wait(state):
    """Tras liberarse una PC (o al arribar): el técnico toma la próxima libre sin mantener, o espera."""
    free = find_idle_unmaintained_pc(state)
    if free is not None:
        schedule_maintenance(state, free)
    else:
        state.technician_state = 'waiting'
        state.technician_visit_idle_start = state.current_time

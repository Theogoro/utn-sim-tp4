from utils.random_generator import uniform

from simulation.state import (
    ALUMNO_ESPERANDO_FILA,
    ALUMNO_ESPERANDO_VOLVER,
    ENCARGADO_ESPERANDO_MANTENIMIENTO,
    ENCARGADO_ESPERANDO_PC,
    EVENT_FIN_MANTENIMIENTO,
    PC_INSCRIPCION,
    PC_LIBRE,
    PC_MANTENIMIENTO,
)


def find_idle_pc(state):
    for idx, pc in enumerate(state.pcs):
        if pc.state == PC_LIBRE:
            return idx
    return None


def find_idle_pending_maintenance_pc(state):
    """Busca la primera PC libre entre las pendientes de la visita actual."""
    for pc_id in state.encargado.pcs_pendientes_mantenimiento:
        idx = pc_id - 1
        if state.pcs[idx].state == PC_LIBRE:
            return idx
    return None


def start_enrollment(state, pc_index: int, student_id: int):
    """Asigna un alumno a una PC y agenda el fin de inscripción."""
    student = state.students_by_id[student_id]
    pc = state.pcs[pc_index]
    pc.change_state(PC_INSCRIPCION, state.current_time)
    pc.current_student_id = student_id

    student.state = f"SI {pc.id}"
    student.return_time = None
    student.waiting_started_at = None
    student.last_event_time = state.current_time

    rnd, dur = uniform(state.params.min_enrollment, state.params.max_enrollment)
    state.row.registration_rnd = rnd
    state.row.registration_time = dur
    state.next_registration_complete[pc_index] = state.current_time + dur


def enqueue_student(state, student):
    student.state = ALUMNO_ESPERANDO_FILA
    student.waiting_started_at = state.current_time
    student.return_time = None
    student.last_event_time = state.current_time
    state.queue_student_ids.append(student.id)


def schedule_student_return(state, student):
    """Deja al alumno en EV y agenda su retorno futuro."""
    state.stats.total_students_returned += 1
    student.times_returned_later += 1
    student.state = ALUMNO_ESPERANDO_VOLVER
    student.waiting_started_at = None
    student.return_time = state.current_time + state.params.student_return_time
    student.last_event_time = state.current_time
    state.push_student_return(student.return_time, student.id)


def admit_or_defer_student(state, student, schedule_return_when_full: bool = True):
    """Decide si el alumno entra a PC, espera en cola o se retira.

    `schedule_return_when_full=False` se usa cuando el alumno ya volvió una vez:
    si la cola sigue llena, se registra como rechazado final y sale de memoria activa.
    """
    student.attempts += 1
    student.last_event_time = state.current_time
    free = find_idle_pc(state)

    if free is not None and not (
        state.encargado.state == ENCARGADO_ESPERANDO_PC
        and state.pcs[free].id in state.encargado.pcs_pendientes_mantenimiento
    ):
        start_enrollment(state, free, student.id)
    elif len(state.queue_student_ids) >= state.params.student_wait_threshold:
        if schedule_return_when_full:
            schedule_student_return(state, student)
        else:
            # Rechazo definitivo: ya se contó como "se va para regresar" en la primera
            # salida; aquí no vuelve a esperar, solo se historiza como RECHAZADO.
            state.finalize_student(student.id, "RECHAZADO")
    else:
        enqueue_student(state, student)


def dequeue_and_start_enrollment(state, pc_index: int):
    """Consume la cola FIFO y acumula la espera del alumno que pasa a inscribirse."""
    student_id = state.queue_student_ids.popleft()
    student = state.students_by_id[student_id]
    waited = state.current_time - (student.waiting_started_at or state.current_time)
    student.total_waiting_time += waited
    state.stats.students_queued_and_waited += 1
    state.stats.total_waiting_time += waited
    start_enrollment(state, pc_index, student_id)


def schedule_maintenance(state, pc_index: int):
    """Toma una PC para mantenimiento y agenda su finalización."""
    pc = state.pcs[pc_index]
    pc.change_state(PC_MANTENIMIENTO, state.current_time)
    pc.current_student_id = None
    pc_id = pc.id
    state.encargado.state = f"DM {pc_id}"
    state.encargado.esperando_desde = None
    if pc_id in state.encargado.pcs_pendientes_mantenimiento:
        state.encargado.pcs_pendientes_mantenimiento.remove(pc_id)

    rnd, dur = uniform(state.params.min_maintenance_time, state.params.max_maintenance_time)
    state.row.maintenance_rnd = rnd
    state.row.maintenance_time = dur
    state.next_maintenance_complete = state.current_time + dur


def technician_take_pc_or_wait(state):
    """El encargado toma una PC pendiente libre; si no hay, queda en EPC."""
    pc_index = find_idle_pending_maintenance_pc(state)
    if pc_index is not None:
        if state.encargado.state == ENCARGADO_ESPERANDO_PC and state.encargado.esperando_desde is not None:
            state.technician_visit_idle_accumulated += state.current_time - state.encargado.esperando_desde
        schedule_maintenance(state, pc_index)
        return

    state.encargado.state = ENCARGADO_ESPERANDO_PC
    state.encargado.esperando_desde = state.current_time


def start_maintenance_visit(state):
    """Inicia una ronda: todas las PCs quedan pendientes hasta recibir mantenimiento."""
    state.encargado.pcs_pendientes_mantenimiento = [pc.id for pc in state.pcs]
    state.encargado.state = ENCARGADO_ESPERANDO_MANTENIMIENTO
    state.encargado.esperando_desde = None
    state.technician_visit_idle_accumulated = 0.0
    state.next_maintenance_start = None
    technician_take_pc_or_wait(state)


def schedule_next_maintenance_start(state):
    """Agenda la próxima visita usando la frecuencia 60 +/- variación."""
    rnd, ret = uniform(
        state.params.mean_technician_return_time - state.params.technician_return_time_variation,
        state.params.mean_technician_return_time + state.params.technician_return_time_variation,
    )
    state.row.technician_return_rnd = rnd
    state.row.technician_return_time = ret
    state.next_maintenance_start = state.current_time + ret


def finish_maintenance_visit_if_done(state) -> bool:
    """Cierra la ronda si ya no quedan PCs pendientes."""
    if state.encargado.pcs_pendientes_mantenimiento:
        return False
    state.stats.total_technician_visits += 1
    state.stats.total_technician_idle_time += state.technician_visit_idle_accumulated
    state.encargado.state = ENCARGADO_ESPERANDO_MANTENIMIENTO
    state.encargado.esperando_desde = None
    schedule_next_maintenance_start(state)
    return True

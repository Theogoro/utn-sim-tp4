def format_time(seconds):
    if seconds is None:
        return ""
    total_secs = int(seconds)
    hours = total_secs // 3600
    minutes = (total_secs % 3600) // 60
    secs = total_secs % 60
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"


def build_row(state) -> dict:
    """Arma la fila del vector de estados consumida por consola, DB y API."""
    row = state.row
    # Snapshots dinamicos: evitan atar el vector a una cantidad fija de PCs/alumnos.
    pc_snapshot = [
        {**pc.snapshot(), "fin_inscripcion": state.next_registration_complete[i]}
        for i, pc in enumerate(state.pcs)
    ]
    active_students = [student.snapshot() for student in state.students_by_id.values()]
    queue_ids = list(state.queue_student_ids)
    return {
        "clock": state.current_time,
        "clock_formatted": format_time(state.current_time),
        "event_name": state.event,
        "queue_length": len(queue_ids),
        "pc_states": ",".join(pc["state"] for pc in pc_snapshot),
        "pc_snapshot": pc_snapshot,
        "encargado_snapshot": state.encargado.snapshot(),
        "active_students_snapshot": active_students,
        "queue_student_ids": queue_ids,
        "student_rnd": row.student_rnd,
        "student_arrival_time": row.student_arrival_time,
        "student_next_arrival_time": state.next_student_arrival,
        "registration_rnd": row.registration_rnd,
        "registration_time": row.registration_time,
        "maintenance_rnd": row.maintenance_rnd,
        "maintenance_time": row.maintenance_time,
        "technician_return_rnd": row.technician_return_rnd,
        "technician_return_time": row.technician_return_time,
        "next_maintenance_start_time": state.next_maintenance_start,
        "next_maintenance_complete_time": state.next_maintenance_complete,
        "registrations_completed": state.stats.registrations_completed,
        "total_students_returned": state.stats.total_students_returned,
        "total_students_arrived": state.stats.total_students_arrived,
        "total_new_students_arrived": state.stats.total_new_students_arrived,
        "students_queued_and_waited": state.stats.students_queued_and_waited,
        "total_technician_visits": state.stats.total_technician_visits,
        "total_waiting_time": state.stats.total_waiting_time,
        "total_technician_idle_time": state.stats.total_technician_idle_time,
    }


def _fmt_rnd(v):
    return f"{v:.4f}" if v is not None else ""


def _fmt_secs(v):
    return f"{v:.1f}s" if v is not None else ""


class ConsoleLoggerHandler:
    def __init__(self, state, limit: int = 50):
        self.state = state
        self.limit = limit
        self.counter = 0
        self.header_printed = False

    def trigger(self, event=None):
        if self.counter >= self.limit:
            return
        if not self.header_printed:
            self._print_header()
            self.header_printed = True

        r = build_row(self.state)
        print(
            f"{r['clock_formatted']:>9} | "
            f"{r['event_name'][:28]:<28} | "
            f"{r['queue_length']:>4} | "
            f"{r['pc_states']:<17} | "
            f"{r['encargado_snapshot']['state']:<8} | "
            f"{','.join(map(str, r['encargado_snapshot']['pcs_pendientes_mantenimiento'])):<12} | "
            f"{_fmt_rnd(r['student_rnd']):>8} | "
            f"{_fmt_secs(r['student_arrival_time']):>8} | "
            f"{_fmt_rnd(r['registration_rnd']):>8} | "
            f"{_fmt_secs(r['registration_time']):>8} | "
            f"{_fmt_rnd(r['maintenance_rnd']):>8} | "
            f"{_fmt_secs(r['maintenance_time']):>8} | "
            f"{r['registrations_completed']:>9} | "
            f"{r['total_students_returned']:>6}"
        )
        self.counter += 1

    def _print_header(self):
        print("\n" + "=" * 160)
        print("|                         TABLA DE VECTOR DE ESTADOS DE SIMULACIÓN                         |")
        print("=" * 160)
        print(
            f"{'Reloj':>9} | {'Evento':<28} | {'Cola':>4} | {'PCs':<17} | "
            f"{'Encarg.':<8} | {'Pendientes':<12} | {'RND Lleg':>8} | {'Tpo Lleg':>8} | "
            f"{'RND Insc':>8} | {'Tpo Insc':>8} | {'RND Mant':>8} | {'Tpo Mant':>8} | "
            f"{'InscComp':>9} | {'Rechaz':>6}"
        )
        print("-" * 160)

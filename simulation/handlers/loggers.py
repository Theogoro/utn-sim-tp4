def format_time(seconds):
    """Convierte un instante en segundos al formato hh:mm:ss."""
    if seconds is None:
        return ""
    total_secs = int(seconds)
    hours = total_secs // 3600
    minutes = (total_secs % 3600) // 60
    secs = total_secs % 60
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"


def build_row(state) -> dict:
    """Vector de estado del paso actual en forma de dict. Consumido por todos los loggers."""
    row = state.row
    return {
        "clock": state.current_time,
        "clock_formatted": format_time(state.current_time),
        "event_name": state.event,
        "queue_length": len(state.queue),
        "pc_states": ",".join(pc.state for pc in state.servers),
        "student_rnd": row.student_rnd,
        "student_arrival_time": row.student_arrival_time,
        "student_next_arrival_time": state.next_student_arrival,
        "registration_rnd": row.registration_rnd,
        "registration_time": row.registration_time,
        "maintenance_rnd": row.maintenance_rnd,
        "maintenance_time": row.maintenance_time,
        "technician_return_rnd": row.technician_return_rnd,
        "technician_return_time": row.technician_return_time,
        "registrations_completed": state.stats.registrations_completed,
        "total_students_returned": state.stats.total_students_returned,
    }


def _fmt_rnd(v):
    return f"{v:.4f}" if v is not None else ""


def _fmt_secs(v):
    return f"{v:.1f}s" if v is not None else ""


def _fmt_clock(v):
    return format_time(v) if v is not None else ""


_PC_LETTER = {'idle': 'I', 'busy': 'B', 'maintenance': 'M'}


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
        pc_str = " | ".join(_PC_LETTER[s] for s in r["pc_states"].split(","))

        print(
            f"{r['clock_formatted']:>9} | "
            f"{r['event_name'][:25]:<25} | "
            f"{r['queue_length']:>4} | "
            f"{pc_str} | "
            f"{_fmt_rnd(r['student_rnd']):>8} | "
            f"{_fmt_secs(r['student_arrival_time']):>8} | "
            f"{_fmt_clock(r['student_next_arrival_time']):>8} | "
            f"{_fmt_rnd(r['registration_rnd']):>8} | "
            f"{_fmt_secs(r['registration_time']):>8} | "
            f"{_fmt_rnd(r['maintenance_rnd']):>8} | "
            f"{_fmt_secs(r['maintenance_time']):>8} | "
            f"{_fmt_rnd(r['technician_return_rnd']):>8} | "
            f"{_fmt_secs(r['technician_return_time']):>8} | "
            f"{r['registrations_completed']:>9} | "
            f"{r['total_students_returned']:>6}"
        )

        self.counter += 1
        if self.counter == self.limit:
            print("=" * 174)
            print("... [El resto de la simulación se ejecuta en segundo plano para estabilidad estadística] ...")
            print("=" * 174)

    def _print_header(self):
        print("\n" + "=" * 174)
        print("|                                           TABLA DE VECTOR DE ESTADOS DE SIMULACIÓN (CON AUDITORÍA DE RNDs)                                         |")
        print("=" * 174)
        print(
            f"{'Reloj':>9} | {'Evento':<25} | {'Cola':>4} | "
            f"{'PC1 | PC2 | PC3 | PC4 | PC5 | PC6'} | "
            f"{'RND Lleg':>8} | {'Tpo Lleg':>8} | {'Prox Llg':>8} | "
            f"{'RND Insc':>8} | {'Tpo Insc':>8} | "
            f"{'RND Mant':>8} | {'Tpo Mant':>8} | "
            f"{'RND RegT':>8} | {'Tpo RegT':>8} | "
            f"{'InscComp':>9} | {'Rechaz':>6}"
        )
        print("-" * 174)

from simulation.handlers.handler_interface import SimulationHandler

def format_time(seconds: float) -> str:
    """Convierte un instante en segundos al formato hh:mm:ss."""
    if seconds is None:
        return ""
    total_secs = int(seconds)
    hours = total_secs // 3600
    minutes = (total_secs % 3600) // 60
    secs = total_secs % 60
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"


class ConsoleLoggerHandler(SimulationHandler):
    def __init__(self, state, limit: int = 50):
        self.state = state
        self.limit = limit
        self.counter = 0
        self.header_printed = False

    def trigger(self):
        # Limitar la impresión para no inundar la terminal
        if self.counter >= self.limit:
            return
            
        if not self.header_printed:
            self.print_header()
            self.header_printed = True
            
        state = self.state
        
        # Mapear estado de las PCs a letras simples (I=Idle, B=Busy, M=Maintenance)
        pc_states = []
        for pc in state.servers:
            if pc.state == 'idle':
                pc_states.append('I')
            elif pc.state == 'busy':
                pc_states.append('B')
            elif pc.state == 'maintenance':
                pc_states.append('M')
                
        pc_str = " | ".join(pc_states)
        
        # Formatear RNDs e Intervalos temporales de la fila actual
        rnd_arr = f"{state.student_rnd:.4f}" if state.student_rnd is not None else ""
        tpo_arr = f"{state.student_arrival_time:.1f}s" if state.student_arrival_time is not None else ""
        prox_arr = format_time(state.student_next_arrival_time) if state.student_next_arrival_time is not None else ""
        
        rnd_reg = f"{state.registration_rnd:.4f}" if state.registration_rnd is not None else ""
        tpo_reg = f"{state.registration_time:.1f}s" if state.registration_time is not None else ""
        
        rnd_maint = f"{state.maintenance_rnd:.4f}" if state.maintenance_rnd is not None else ""
        tpo_maint = f"{state.maintenance_time:.1f}s" if state.maintenance_time is not None else ""
        
        rnd_ret = f"{state.technician_return_rnd:.4f}" if state.technician_return_rnd is not None else ""
        tpo_ret = f"{state.technician_return_time:.1f}s" if state.technician_return_time is not None else ""
        
        # Mantener visible el sufijo de PC en eventos como registration_complete_pc1.
        evt_name = state.event[:25]
        
        # Formatear reloj absoluto en hh:mm:ss
        reloj_str = format_time(state.current_time)
        
        # Imprimir fila del vector de estado
        print(f"{reloj_str:>9} | {evt_name:<25} | {len(state.queue):>4} | {pc_str} | {rnd_arr:>8} | {tpo_arr:>8} | {prox_arr:>8} | {rnd_reg:>8} | {tpo_reg:>8} | {rnd_maint:>8} | {tpo_maint:>8} | {rnd_ret:>8} | {tpo_ret:>8} | {state.stats.registrations_completed:>9} | {state.stats.total_students_returned:>6}")
        
        self.counter += 1
        if self.counter == self.limit:
            print("=" * 174)
            print("... [El resto de la simulación se ejecuta en segundo plano para estabilidad estadística] ...")
            print("=" * 174)

    def print_header(self):
        print("\n" + "="*174)
        print("|                                           TABLA DE VECTOR DE ESTADOS DE SIMULACIÓN (CON AUDITORÍA DE RNDs)                                         |")
        print("="*174)
        print(f"{'Reloj':>9} | {'Evento':<25} | {'Cola':>4} | {'PC1 | PC2 | PC3 | PC4 | PC5 | PC6'} | {'RND Lleg':>8} | {'Tpo Lleg':>8} | {'Prox Llg':>8} | {'RND Insc':>8} | {'Tpo Insc':>8} | {'RND Mant':>8} | {'Tpo Mant':>8} | {'RND RegT':>8} | {'Tpo RegT':>8} | {'InscComp':>9} | {'Rechaz':>6}")
        print("-"*174)

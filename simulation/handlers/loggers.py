from simulation.handlers.handler_interface import SimulationHandler

class ConsoleLoggerHandler(SimulationHandler):
    def __init__(self, state, limit: int = 500):
        self.state = state
        self.limit = limit
        self.counter = 0
        self.header_printed = False

    @staticmethod
    def format_time(seconds: float) -> str:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"

    def trigger(self):
        # Limitar la impresión para evitar inundar la terminal
        if self.counter >= self.limit:
            return
            
        if not self.header_printed:
            self.print_header()
            self.header_printed = True
            
        state = self.state
        
        # Mapear estado de las PCs a letras simples
        # I = Idle (Libre), B = Busy (Ocupado), M = Maintenance (Mantenimiento)
        pc_states = []
        for pc in state.servers:
            if pc.state == 'idle':
                pc_states.append('I')
            elif pc.state == 'busy':
                pc_states.append('B')
            elif pc.state == 'maintenance':
                pc_states.append('M')
                
        pc_str = " | ".join(pc_states)
        
        # Mapear PCs mantenidas por el técnico (X = Mantenida, - = Pendiente)
        tech_maint = "".join(['X' if m else '-' for m in state.technician_pcs_maintained])
        
        # Nombre de evento truncado a 23 caracteres
        evt_name = state.event[:23]
        
        # Imprimir fila del vector de estado
        print(f"{self.format_time(state.current_time):>9} | {evt_name:<23} | {len(state.queue):>4} | {pc_str} | {state.technician_state:<8} | {tech_maint:<7} | {state.stats.registrations_completed:>6} | {state.stats.total_students_returned:>6}")
        
        self.counter += 1
        if self.counter == self.limit:
            print("-" * 125)
            print("... [El resto de la simulación se ejecuta en segundo plano para estabilidad estadística] ...")
            print("-" * 125)

    def print_header(self):
        print("\n+-----------------------------------------------------------------------------------------------------------------------------+")
        print("|                                              TABLA DE VECTOR DE ESTADOS DE SIMULACIÓN                                       |")
        print("+-----------------------------------------------------------------------------------------------------------------------------+")
        print(f"{'Reloj':>9} | {'Evento':<23} | {'Cola':>4} | {'PC1 | PC2 | PC3 | PC4 | PC5 | PC6'} | {'Tecnico':<8} | {'PCsMant':<7} | {'Inscrip':>6} | {'Rechaz':>6}")
        print("+-----------------------------------------------------------------------------------------------------------------------------+")

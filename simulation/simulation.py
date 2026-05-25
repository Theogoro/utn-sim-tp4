from typing import List, Optional
from simulation.params import SimulationParams
from simulation.state import SimulationState
from simulation.handlers.event_handlers import (
    StudentArrivalHandler,
    RegistrationCompleteHandler,
    TechnicianArrivalHandler,
    MaintenanceCompleteHandler,
    StudentReturnHandler
)


class Simulation:
  def __init__(self, params: SimulationParams, handlers: Optional[List] = None) -> None:
    self.params: SimulationParams = params
    self.state: SimulationState = self.create_initial_state()
    self.state.params = params  # Vincular parámetros directamente al estado para los handlers
    
    # Inicializar manejadores de eventos internos (responsables de la lógica y mutación de estado)
    self.student_arrival_handler: StudentArrivalHandler = StudentArrivalHandler(self.state)
    self.registration_complete_handler: RegistrationCompleteHandler = RegistrationCompleteHandler(self.state)
    self.technician_arrival_handler: TechnicianArrivalHandler = TechnicianArrivalHandler(self.state)
    self.maintenance_complete_handler: MaintenanceCompleteHandler = MaintenanceCompleteHandler(self.state)
    self.student_return_handler: StudentReturnHandler = StudentReturnHandler(self.state)

    # Configurar diccionario de despacho de manejadores de eventos internos (evita estructura if/elif)
    self.event_handlers = {
        'student_arrival': self.student_arrival_handler,
        'registration_complete': self.registration_complete_handler,
        'technician_arrival': self.technician_arrival_handler,
        'maintenance_complete': self.maintenance_complete_handler,
        'student_return': self.student_return_handler
    }

    # Inicializar observadores externos (responsables del reporte, base de datos, logs, etc.)
    self.handlers = []
    if handlers:
        for handler in handlers:
            if isinstance(handler, type):  # Es una clase de handler, la instanciamos con el estado
                self.handlers.append(handler(self.state))
            else:  # Ya es una instancia configurada
                self.handlers.append(handler)

  def create_initial_state(self) -> SimulationState:
    return SimulationState(self.params.num_pcs)
  
  def run(self, max_time: float) -> SimulationState:
    """Ejecuta el bucle principal de la simulación por pasos de eventos."""
    # 1. Programar eventos iniciales (primer alumno y primer técnico)
    self.state.initialize_events(self.params)
    
    # 2. Bucle principal de eventos
    while self.state.current_time < max_time:
        # Buscar el próximo evento de la FEL y su tiempo
        next_time, event_type, pc_index = self.state.get_next_event()
        
        if next_time is None or next_time > max_time:
            break
            
        # Avanzar el reloj al instante del próximo evento
        self.state.current_time = next_time
        self.state.event = f"{event_type}_{pc_index}" if pc_index is not None else event_type
        
        # Resetear variables de RND y duración temporales al inicio de la fila
        self.state.student_rnd = None
        self.state.student_arrival_time = None
        self.state.registration_rnd = None
        self.state.registration_time = None
        self.state.maintenance_rnd = None
        self.state.maintenance_time = None
        self.state.technician_return_rnd = None
        self.state.technician_return_time = None
        
        # Obtener y disparar el manejador de evento interno usando el diccionario de despacho
        handler = self.event_handlers.get(event_type)
        if handler:
            if event_type == 'registration_complete':
                assert pc_index is not None
                handler.trigger(pc_index)
            else:
                handler.trigger()
            
        # Disparar observadores externos (loggers) al finalizar el procesamiento del evento
        for handler in self.handlers:
            handler.trigger()
            
    # 3. Finalización: acumular tiempos en el estado final para precisión métrica
    for pc in self.state.servers:
        pc.change_state('idle', self.state.current_time)
        
    # Acumular el ocio del técnico si cortamos la simulación a mitad de una espera
    if self.state.technician_state == 'waiting':
        idle_duration = self.state.current_time - self.state.technician_visit_idle_start
        self.state.technician_visit_idle_accumulated += idle_duration
        
    return self.state
from simulation.params import SimulationParams
from simulation.simulation import Simulation


def main():
    # 1. Configurar parámetros de la simulación (tiempos en segundos)
    params = SimulationParams(
        num_pcs=6,
        min_enrollment=300,                     # 5 minutos (mínimo servicio)
        max_enrollment=480,                     # 8 minutos (máximo servicio)
        mean_arrival_time=120,                  # 2 minutos (media llegadas exponencial)
        min_service_time=300,
        max_service_time=480,
        min_maintenance_time=180,               # 3 minutos (mínimo mantenimiento)
        max_maintenance_time=600,               # 10 minutos (máximo mantenimiento)
        mean_technician_return_time=3600,       # 1 hora (regreso técnico)
        technician_return_time_variation=180,   # ±3 minutos (variación regreso técnico)
        student_wait_threshold=5,               # Umbral de cola > 5
        student_return_time=1800,               # 30 minutos (tiempo de retorno alumno)
        initial_maintenance_at_start=True,
    )

    # 2. Inicializar y ejecutar la simulación
    # Pasamos el ConsoleLoggerHandler como observador para imprimir la tabla del vector de estados
    from simulation.handlers.loggers import ConsoleLoggerHandler
    observers = [ConsoleLoggerHandler]
    
    # Ejecutaremos por un período largo (ej. 30 días de simulación continua) para obtener estabilidad estadística
    sim_days = 1
    max_simulation_time = sim_days * 24 * 3600  # En segundos
    
    print("\n" + "="*60)
    print(f" Iniciando Simulación del Sistema de Inscripción ({sim_days} días) ")
    print("="*60)
    
    simulation = Simulation(params, observers=observers)
    final_state = simulation.run(max_simulation_time)
    
    # 3. Procesar y calcular métricas solicitadas
    stats = final_state.stats
    
    # Métrica A: % de alumnos que se van para regresar más tarde
    pct_students_returned = 0.0
    if stats.total_new_students_arrived > 0:
        pct_students_returned = (stats.total_students_returned / stats.total_new_students_arrived) * 100
        
    # Métrica B: Tiempo promedio de espera (solo alumnos que hicieron cola y esperaron)
    avg_waiting_time = 0.0
    if stats.students_queued_and_waited > 0:
        avg_waiting_time = stats.total_waiting_time / stats.students_queued_and_waited
        
    # Métrica C: Promedio de tiempo ocioso del personal de sistemas por visita
    avg_technician_idle_time = 0.0
    if stats.total_technician_visits > 0:
        avg_technician_idle_time = stats.total_technician_idle_time / stats.total_technician_visits
        
    # 4. Imprimir reporte con estética premium en consola
    print("\n+----------------------------------------------------------+")
    print("|             RESULTADOS GENERALES DE SIMULACIÓN           |")
    print("+----------------------------------------------------------+")
    print(f"|  Dias Simulados:            {sim_days:<28} |")
    print(f"|  Alumnos Nuevos Arribados:  {stats.total_new_students_arrived:<28} |")
    print(f"|  Intentos de Arribo:        {stats.total_students_arrived:<28} |")
    print(f"|  Inscripciones Completadas: {stats.registrations_completed:<28} |")
    print(f"|  Visitas del Tecnico:       {stats.total_technician_visits:<28} |")
    print("+----------------------------------------------------------+")
    
    print("\n+----------------------------------------------------------+")
    print("|                  METRICAS DEL ENUNCIADO                  |")
    print("+----------------------------------------------------------+")
    print("| 1. % Alumnos que se van para regresar mas tarde:         |")
    print(f"|    -> {pct_students_returned:.2f}%                                        |")
    print("|                                                          |")
    print("| 2. Tiempo promedio de espera de los alumnos en cola:     |")
    avg_wait_min = avg_waiting_time / 60
    print(f"|    -> {avg_wait_min:.2f} minutos ({avg_waiting_time:.1f} segundos)               |")
    print("|                                                          |")
    print("| 3. Tiempo ocioso promedio del Tecnico por visita:        |")
    avg_idle_min = avg_technician_idle_time / 60
    print(f"|    -> {avg_idle_min:.2f} minutos ({avg_technician_idle_time:.1f} segundos)              |")
    print("+----------------------------------------------------------+\n")


if __name__ == "__main__":
    main()

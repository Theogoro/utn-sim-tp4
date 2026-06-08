from dataclasses import dataclass

# Parametros:
# - Cantidad de equipos: 6
# - Tiempo de inscripción (servicio): Uniforme entre 5' y 8'
# - Tiempo entre llegadas de alumnos: Exponencial negativa con media 2'
# - Tiempo de mantenimiento por equipo: Uniforme entre 3' y 10'
# - Frecuencia de regreso del técnico: 1 hora ± 3' desde que finalizó el mantenimiento de la última máquina
# - Umbral de espera del alumno: más de 5 alumnos esperando → se va y regresa a la media hora
# Todos los parametros de tiempo deberan estar en segundos


@dataclass
class SimulationParams:
    num_pcs: int
    min_enrollment: float
    max_enrollment: float
    mean_arrival_time: float
    min_service_time: float
    max_service_time: float
    min_maintenance_time: float
    max_maintenance_time: float
    mean_technician_return_time: float
    technician_return_time_variation: float
    student_wait_threshold: int
    student_return_time: float
    initial_maintenance_at_start: bool = True

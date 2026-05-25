# Parametros: 
# - Cantidad de equipos: 6
# - Tiempo de inscripción (servicio): Uniforme entre 5' y 8'
# - Tiempo entre llegadas de alumnos: Exponencial negativa con media 2'
# - Tiempo de mantenimiento por equipo: Uniforme entre 3' y 10'
# - Frecuencia de regreso del técnico: 1 hora ± 3' desde que finalizó el mantenimiento de la última máquina
# - Umbral de espera del alumno: más de 5 alumnos esperando → se va y regresa a la media hora

# Todos los parametros de tiempo deberan estar en segundos
class SimulationParams:
    def __init__(self, num_pcs, min_enrollment, max_enrollment, mean_arrival_time, min_service_time, max_service_time, min_maintenance_time, max_maintenance_time, mean_technician_return_time, technician_return_time_variation, student_wait_threshold, student_return_time):
        self.num_pcs = num_pcs
        self.min_enrollment = min_enrollment
        self.max_enrollment = max_enrollment
        self.mean_arrival_time = mean_arrival_time
        self.min_service_time = min_service_time
        self.max_service_time = max_service_time
        self.min_maintenance_time = min_maintenance_time
        self.max_maintenance_time = max_maintenance_time
        self.mean_technician_return_time = mean_technician_return_time
        self.technician_return_time_variation = technician_return_time_variation
        self.student_wait_threshold = student_wait_threshold
        self.student_return_time = student_return_time
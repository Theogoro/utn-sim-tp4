export interface SimulationParams {
    num_pcs: number;
    min_enrollment: number;
    max_enrollment: number;
    mean_arrival_time: number;
    min_service_time: number;
    max_service_time: number;
    min_maintenance_time: number;
    max_maintenance_time: number;
    mean_technician_return_time: number;
    technician_return_time_variation: number;
    student_wait_threshold: number;
    student_return_time: number;
    initial_maintenance_at_start: boolean;
    sim_hours: number;
}
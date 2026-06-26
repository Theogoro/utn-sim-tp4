import { SimulationParams } from "../../types/simulation-params";

export const UTN_PRESETS: SimulationParams =
    {
        num_pcs: 6,
        min_enrollment: 5.0,
        max_enrollment: 8.0,
        mean_arrival_time: 2.0,
        min_service_time: 5.0,
        max_service_time: 8.0,
        min_maintenance_time: 3.0,
        max_maintenance_time: 10.0,
        mean_technician_return_time:
            60.0,
        technician_return_time_variation:
            3.0,
        student_wait_threshold: 5,
        student_return_time: 30.0,
        initial_maintenance_at_start:
            true,
        sim_hours: 24.0,
};
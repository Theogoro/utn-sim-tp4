import { SimulationParams } from "./simulation-params";

export interface SimulationSummary extends SimulationParams {
    id: number;
    created_at: string;
    sim_days: number;
    total_students_arrived: number;
    total_new_students_arrived: number;
    total_students_returned: number;
    registrations_completed: number;
    total_technician_visits: number;
    pct_students_returned: number;
    avg_waiting_time: number;
    avg_technician_idle_time: number;
    pc_utilization?: string | null;
}
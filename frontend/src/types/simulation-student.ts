export interface SimulationStudent {
    id: number;
    simulation_id: number;
    student_id: number;
    final_state: string;
    attempts: number;
    times_returned_later: number;
    total_waiting_time: number;
    first_arrival_time: number | null;
    last_event_time: number | null;
    return_time: number | null;
    completed_registration_at: number | null;
}
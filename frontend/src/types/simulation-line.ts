export interface SimulationLine {
    id: number;
    simulation_id: number;
    line_index: number;
    clock: number;
    clock_formatted: string;
    event_name: string;
    queue_length: number;
    pc_states: string;
    pc_snapshot: Array<{ id: number; state: 'L' | 'I' | 'M' | string; fin_inscripcion: number | null }>;
    encargado_snapshot: {
        state: string;
        pcs_pendientes_mantenimiento: number[];
        esperando_desde: number | null;
    };
    active_students_snapshot: Array<{
        id: number;
        state: string;
        minuto_vuelta: number | null;
        esperando_en_fila_desde: number | null;
        attempts: number;
        times_returned_later: number;
        total_waiting_time: number;
        first_arrival_time: number | null;
        last_event_time: number | null;
        completed_registration_at: number | null;
    }>;
    queue_student_ids: number[];
    student_rnd: number | null;
    student_arrival_time: number | null;
    student_next_arrival_time: number | null;
    registration_rnd: number | null;
    registration_time: number | null;
    maintenance_rnd: number | null;
    maintenance_time: number | null;
    technician_return_rnd: number | null;
    technician_return_time: number | null;
    next_maintenance_start_time: number | null;
    next_maintenance_complete_time: number | null;
    registrations_completed: number;
    total_students_returned: number;
}
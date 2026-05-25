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
  sim_hours: number;
}

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

export interface SimulationLine {
  id: number;
  simulation_id: number;
  line_index: number;
  clock: number;
  clock_formatted: string;
  event_name: string;
  queue_length: number;
  pc_states: string;
  student_rnd: number | null;
  student_arrival_time: number | null;
  student_next_arrival_time: number | null;
  registration_rnd: number | null;
  registration_time: number | null;
  maintenance_rnd: number | null;
  maintenance_time: number | null;
  technician_return_rnd: number | null;
  technician_return_time: number | null;
  registrations_completed: number;
  total_students_returned: number;
}

export interface PaginatedSimulationLines {
  total: number;
  page: number;
  limit: number;
  items: SimulationLine[];
}

export interface PcUtilization {
  id: number;
  busy_time: number;
  maintenance_time: number;
  idle_time: number;
}

export interface PcUtilizationChartDatum {
  name: string;
  'Ocupado (%)': number;
  'Mantenimiento (%)': number;
  'Libre (%)': number;
}

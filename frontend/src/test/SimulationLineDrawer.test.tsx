import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { SimulationLine } from '../types/simulation-line';
import { SimulationLineDrawer } from '../components/simulation-line-drawer/simulation-line-drawer';

const line: SimulationLine = {
  id: 1001,
  simulation_id: 5,
  line_index: 42,
  clock: 3661,
  clock_formatted: '01:01:01',
  event_name: 'llegada_alumno A7',
  queue_length: 4,
  pc_states: 'L,I,M',
  pc_snapshot: [
    { id: 1, state: 'L', fin_inscripcion: null },
    { id: 2, state: 'I', fin_inscripcion: 4000 },
    { id: 3, state: 'M', fin_inscripcion: null },
  ],
  encargado_snapshot: {
    state: 'revisando',
    pcs_pendientes_mantenimiento: [2],
    esperando_desde: 3600,
  },
  active_students_snapshot: [
    {
      id: 7,
      state: 'esperando',
      minuto_vuelta: null,
      esperando_en_fila_desde: 3650,
      attempts: 1,
      times_returned_later: 0,
      total_waiting_time: 11,
      first_arrival_time: 3661,
      last_event_time: 3661,
      completed_registration_at: null,
    },
  ],
  queue_student_ids: [7, 8, 9, 10],
  student_rnd: 0.1234,
  student_arrival_time: 120,
  student_next_arrival_time: 3781,
  registration_rnd: 0.5678,
  registration_time: 180,
  maintenance_rnd: 0.9012,
  maintenance_time: 240,
  technician_return_rnd: 0.3456,
  technician_return_time: 300,
  next_maintenance_start_time: 3900,
  next_maintenance_complete_time: 4200,
  registrations_completed: 12,
  total_students_returned: 3,
  total_students_arrived: 20,
  total_new_students_arrived: 17,
  students_queued_and_waited: 5,
  total_technician_visits: 2,
  total_waiting_time: 660,
  total_technician_idle_time: 120,
};

describe('SimulationLineDrawer', () => {
  const originalGetComputedStyle = window.getComputedStyle;

  beforeAll(() => {
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => originalGetComputedStyle(element));
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('shows line details and calls onClose from the close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<SimulationLineDrawer line={line} open onClose={onClose} />);

    expect(screen.getByText('Línea 42')).toBeInTheDocument();
    expect(screen.getByText('llegada_alumno A7')).toBeInTheDocument();
    expect(screen.getByText('01:01:01')).toBeInTheDocument();
    expect(screen.getByText('Cola')).toBeInTheDocument();
    expect(screen.getByText('4 alumnos')).toBeInTheDocument();
    expect(screen.getByText('revisando')).toBeInTheDocument();
    expect(screen.getByText('PC 2')).toBeInTheDocument();
    expect(screen.getByText('A7')).toBeInTheDocument();
    expect(screen.getByText('0.1234')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Close'));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows long scheduled times using total hours', () => {
    render(
      <SimulationLineDrawer
        line={{ ...line, student_next_arrival_time: 25 * 60 * 60 }}
        open
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('25:00:00')).toBeInTheDocument();
  });
});

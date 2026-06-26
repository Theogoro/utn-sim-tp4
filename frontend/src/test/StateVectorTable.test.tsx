import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { SimulationLine } from '../types/simulation-line';
import StateVectorTable from '../components/state-vector-table/state-vector-table';

const makeLine = (overrides: Partial<SimulationLine> = {}): SimulationLine => ({
  id: 1,
  simulation_id: 1,
  line_index: 1,
  clock: 0,
  clock_formatted: '00:00:00',
  event_name: 'inicializacion',
  queue_length: 0,
  pc_states: 'L,I,M',
  pc_snapshot: [
    { id: 1, state: 'L', fin_inscripcion: null },
    { id: 2, state: 'I', fin_inscripcion: 4000 },
    { id: 3, state: 'M', fin_inscripcion: null },
  ],
  encargado_snapshot: {
    state: 'esperando',
    pcs_pendientes_mantenimiento: [],
    esperando_desde: null,
  },
  active_students_snapshot: [],
  queue_student_ids: [],
  student_rnd: null,
  student_arrival_time: null,
  student_next_arrival_time: null,
  registration_rnd: null,
  registration_time: null,
  maintenance_rnd: null,
  maintenance_time: null,
  technician_return_rnd: null,
  technician_return_time: null,
  next_maintenance_start_time: null,
  next_maintenance_complete_time: null,
  registrations_completed: 0,
  total_students_returned: 0,
  total_students_arrived: 0,
  total_new_students_arrived: 0,
  students_queued_and_waited: 0,
  total_technician_visits: 0,
  total_waiting_time: 0,
  total_technician_idle_time: 0,
  ...overrides,
});

const renderTable = (lines: SimulationLine[]) => render(
  <StateVectorTable
    lines={lines}
    loading={false}
    page={1}
    pageSize={10}
    total={lines.length}
    queueLimit={5}
    onPageChange={vi.fn()}
  />,
);

describe('StateVectorTable', () => {
  const originalGetComputedStyle = window.getComputedStyle;

  beforeAll(() => {
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => originalGetComputedStyle(element));
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('opens the line detail drawer when a row is clicked', async () => {
    const user = userEvent.setup();
    renderTable([
      makeLine({
        id: 2,
        line_index: 7,
        clock: 600,
        clock_formatted: '00:10:00',
        event_name: 'fin_inscripcion PC 2',
        queue_length: 2,
        queue_student_ids: [1, 2],
      }),
    ]);

    await user.click(screen.getByText('Fin Inscripción PC 2'));

    const drawer = screen.getByRole('dialog');
    expect(within(drawer).getByText('Línea 7')).toBeInTheDocument();
    expect(within(drawer).getByText('fin_inscripcion PC 2')).toBeInTheDocument();
    expect(within(drawer).getByText('00:10:00')).toBeInTheDocument();
    expect(within(drawer).getByText('2 alumnos')).toBeInTheDocument();
  });

  it('opens the line detail drawer from the keyboard', async () => {
    const user = userEvent.setup();
    renderTable([
      makeLine({
        id: 3,
        line_index: 9,
        event_name: 'regreso_alumno A4',
      }),
    ]);

    const row = screen.getByRole('button', { name: /Abrir detalle de línea 9/ });
    row.focus();
    await user.keyboard('{Enter}');

    expect(screen.getByText('Línea 9')).toBeInTheDocument();
  });

  it('marks table rows as buttons with accessible label', () => {
    renderTable([
      makeLine({
        id: 4,
        line_index: 11,
      }),
    ]);

    expect(screen.getByRole('button', { name: 'Abrir detalle de línea 11' })).toBeInTheDocument();
  });
});

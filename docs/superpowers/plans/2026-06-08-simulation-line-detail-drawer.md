# Simulation Line Detail Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a clickable vector-line detail drawer and refactor the trace UI into focused React pieces.

**Architecture:** `StateVectorTable` keeps table state and selection. A new `SimulationLineDrawer` renders the selected `SimulationLine` in grouped Ant Design sections. A minimal Vitest setup provides component tests before production code changes.

**Tech Stack:** React 19, TypeScript, Vite, Ant Design, Vitest, Testing Library, jsdom.

---

## File Structure

- Modify: `frontend/package.json`
  - Add `test` script and test dependencies.
- Modify: `frontend/vite.config.js`
  - Add Vitest jsdom config.
- Create: `frontend/src/test/setup.ts`
  - Add jest-dom matchers and browser API shims.
- Create: `frontend/src/components/SimulationLineDrawer.test.tsx`
  - Component tests for row detail display and close behavior.
- Create: `frontend/src/components/StateVectorTable.test.tsx`
  - Integration tests for row click, row highlight, and drawer open.
- Create: `frontend/src/components/SimulationLineDrawer.tsx`
  - Drawer UI for full line detail.
- Modify: `frontend/src/components/StateVectorTable.tsx`
  - Add selected row state, row click/key handling, selected-row class, and drawer render.
- Modify: `frontend/src/index.css`
  - Add cursor/focus styles for clickable trace rows and compact drawer detail styles.

## Task 1: Add Frontend Test Harness

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.js`
- Create: `frontend/src/test/setup.ts`

- [ ] **Step 1: Install test dependencies**

Run:

```powershell
cd frontend
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Expected: `package.json` and `package-lock.json` update with the new dev dependencies.

- [ ] **Step 2: Add the test script**

In `frontend/package.json`, add:

```json
"test": "vitest run"
```

Expected scripts block:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "typecheck": "tsc --noEmit",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run"
}
```

- [ ] **Step 3: Configure Vitest**

Replace `frontend/vite.config.js` with:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
```

- [ ] **Step 4: Add test setup**

Create `frontend/src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverMock;
```

- [ ] **Step 5: Verify empty test harness**

Run:

```powershell
cd frontend
npm test -- --passWithNoTests
```

Expected: PASS or "No test files found" with exit code 0.

- [ ] **Step 6: Commit**

```powershell
git add frontend/package.json frontend/package-lock.json frontend/vite.config.js frontend/src/test/setup.ts
git commit -m "test: add frontend component test harness"
```

## Task 2: Test Drawer Rendering

**Files:**
- Create: `frontend/src/components/SimulationLineDrawer.test.tsx`
- Create: `frontend/src/components/SimulationLineDrawer.tsx`

- [ ] **Step 1: Write the failing drawer test**

Create `frontend/src/components/SimulationLineDrawer.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SimulationLineDrawer } from './SimulationLineDrawer';
import type { SimulationLine } from '../types/simulation';

const line: SimulationLine = {
  id: 10,
  simulation_id: 3,
  line_index: 42,
  clock: 3661,
  clock_formatted: '01:01:01',
  event_name: 'llegada_alumno A7',
  queue_length: 4,
  pc_states: 'L,I,M',
  pc_snapshot: [
    { id: 1, state: 'L' },
    { id: 2, state: 'I' },
    { id: 3, state: 'M' },
  ],
  encargado_snapshot: {
    state: 'revisando',
    pcs_pendientes_mantenimiento: [3],
    esperando_desde: 3600,
  },
  active_students_snapshot: [
    {
      id: 7,
      state: 'esperando',
      minuto_vuelta: null,
      esperando_en_fila_desde: 3500,
      attempts: 2,
      times_returned_later: 1,
      total_waiting_time: 120,
      first_arrival_time: 3400,
      last_event_time: 3600,
      completed_registration_at: null,
    },
  ],
  queue_student_ids: [7, 8, 9, 10],
  student_rnd: 0.1234,
  student_arrival_time: 120,
  student_next_arrival_time: 3780,
  registration_rnd: 0.4567,
  registration_time: 360,
  maintenance_rnd: 0.8912,
  maintenance_time: 480,
  technician_return_rnd: 0.2222,
  technician_return_time: 3600,
  next_maintenance_start_time: 7200,
  next_maintenance_complete_time: 7680,
  registrations_completed: 12,
  total_students_returned: 3,
};

describe('SimulationLineDrawer', () => {
  it('renders grouped detail for the selected simulation line', () => {
    render(<SimulationLineDrawer line={line} open onClose={() => undefined} />);

    expect(screen.getByText('Línea 42')).toBeInTheDocument();
    expect(screen.getByText('llegada_alumno A7')).toBeInTheDocument();
    expect(screen.getByText('01:01:01')).toBeInTheDocument();
    expect(screen.getByText('Cola')).toBeInTheDocument();
    expect(screen.getByText('4 alumnos')).toBeInTheDocument();
    expect(screen.getByText('revisando')).toBeInTheDocument();
    expect(screen.getByText('PC 2')).toBeInTheDocument();
    expect(screen.getByText('A7')).toBeInTheDocument();
    expect(screen.getByText('0.1234')).toBeInTheDocument();
  });

  it('calls onClose when the drawer close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<SimulationLineDrawer line={line} open onClose={onClose} />);
    await user.click(screen.getByLabelText('Close'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
cd frontend
npm test -- SimulationLineDrawer.test.tsx
```

Expected: FAIL because `./SimulationLineDrawer` does not exist.

- [ ] **Step 3: Create minimal drawer implementation**

Create `frontend/src/components/SimulationLineDrawer.tsx`:

```tsx
import { Descriptions, Drawer, Empty, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { SimulationLine } from '../types/simulation';

const { Text } = Typography;

interface SimulationLineDrawerProps {
  line: SimulationLine | null;
  open: boolean;
  onClose: () => void;
}

const formatNumber = (value: number | null, decimals = 4, suffix = '') => (
  value === null ? '-' : `${value.toFixed(decimals)}${suffix}`
);

const formatSecondsAsMinutes = (value: number | null) => (
  value === null ? '-' : `${(value / 60).toFixed(2)} min`
);

const studentColumns: ColumnsType<SimulationLine['active_students_snapshot'][number]> = [
  {
    title: 'Alumno',
    dataIndex: 'id',
    key: 'id',
    render: (id: number) => <Text className="mono">A{id}</Text>,
  },
  { title: 'Estado', dataIndex: 'state', key: 'state' },
  { title: 'Intentos', dataIndex: 'attempts', key: 'attempts' },
  { title: 'Volvió', dataIndex: 'times_returned_later', key: 'times_returned_later' },
  {
    title: 'Espera acum.',
    dataIndex: 'total_waiting_time',
    key: 'total_waiting_time',
    render: (value: number) => formatSecondsAsMinutes(value),
  },
];

export const SimulationLineDrawer = ({ line, open, onClose }: SimulationLineDrawerProps) => (
  <Drawer
    title={line ? `Línea ${line.line_index}` : 'Detalle de línea'}
    open={open}
    onClose={onClose}
    width={620}
    destroyOnHidden
  >
    {!line ? (
      <Empty description="Seleccione una línea para ver el detalle" />
    ) : (
      <div className="line-detail">
        <section className="line-detail-section">
          <h3>Evento</h3>
          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label="Evento">{line.event_name}</Descriptions.Item>
            <Descriptions.Item label="Reloj">{line.clock_formatted}</Descriptions.Item>
            <Descriptions.Item label="Cola">{line.queue_length} alumnos</Descriptions.Item>
            <Descriptions.Item label="Inscripciones">{line.registrations_completed}</Descriptions.Item>
            <Descriptions.Item label="Rechazos">{line.total_students_returned}</Descriptions.Item>
          </Descriptions>
        </section>

        <section className="line-detail-section">
          <h3>Encargado</h3>
          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label="Estado">{line.encargado_snapshot?.state || '-'}</Descriptions.Item>
            <Descriptions.Item label="PCs pendientes">
              {line.encargado_snapshot?.pcs_pendientes_mantenimiento?.length
                ? line.encargado_snapshot.pcs_pendientes_mantenimiento.join(', ')
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Esperando desde">
              {formatSecondsAsMinutes(line.encargado_snapshot?.esperando_desde ?? null)}
            </Descriptions.Item>
          </Descriptions>
        </section>

        <section className="line-detail-section">
          <h3>PCs</h3>
          <div className="line-detail-tags">
            {line.pc_snapshot.map(pc => (
              <Tag key={pc.id} color={pc.state === 'M' ? 'orange' : pc.state === 'I' ? 'blue' : 'green'}>
                PC {pc.id}: {pc.state}
              </Tag>
            ))}
          </div>
        </section>

        <section className="line-detail-section">
          <h3>Alumnos activos</h3>
          <Table
            size="small"
            rowKey="id"
            columns={studentColumns}
            dataSource={line.active_students_snapshot}
            pagination={false}
            locale={{ emptyText: 'Sin alumnos activos' }}
          />
        </section>

        <section className="line-detail-section">
          <h3>RND y tiempos</h3>
          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label="RND llegada">{formatNumber(line.student_rnd)}</Descriptions.Item>
            <Descriptions.Item label="Tiempo llegada">{formatSecondsAsMinutes(line.student_arrival_time)}</Descriptions.Item>
            <Descriptions.Item label="Próx. llegada">{formatSecondsAsMinutes(line.student_next_arrival_time)}</Descriptions.Item>
            <Descriptions.Item label="RND inscripción">{formatNumber(line.registration_rnd)}</Descriptions.Item>
            <Descriptions.Item label="Tiempo inscripción">{formatSecondsAsMinutes(line.registration_time)}</Descriptions.Item>
            <Descriptions.Item label="RND mantenimiento">{formatNumber(line.maintenance_rnd)}</Descriptions.Item>
            <Descriptions.Item label="Tiempo mantenimiento">{formatSecondsAsMinutes(line.maintenance_time)}</Descriptions.Item>
            <Descriptions.Item label="RND regreso técnico">{formatNumber(line.technician_return_rnd)}</Descriptions.Item>
            <Descriptions.Item label="Tiempo regreso técnico">{formatSecondsAsMinutes(line.technician_return_time)}</Descriptions.Item>
          </Descriptions>
        </section>
      </div>
    )}
  </Drawer>
);
```

- [ ] **Step 4: Run drawer test to verify it passes**

Run:

```powershell
cd frontend
npm test -- SimulationLineDrawer.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/components/SimulationLineDrawer.tsx frontend/src/components/SimulationLineDrawer.test.tsx
git commit -m "feat: add simulation line detail drawer"
```

## Task 3: Wire Drawer to State Vector Table

**Files:**
- Create: `frontend/src/components/StateVectorTable.test.tsx`
- Modify: `frontend/src/components/StateVectorTable.tsx`

- [ ] **Step 1: Write failing table interaction test**

Create `frontend/src/components/StateVectorTable.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import StateVectorTable from './StateVectorTable';
import type { SimulationLine } from '../types/simulation';

const makeLine = (overrides: Partial<SimulationLine> = {}): SimulationLine => ({
  id: 1,
  simulation_id: 1,
  line_index: 1,
  clock: 0,
  clock_formatted: '00:00:00',
  event_name: 'inicializacion',
  queue_length: 0,
  pc_states: 'L,I',
  pc_snapshot: [
    { id: 1, state: 'L' },
    { id: 2, state: 'I' },
  ],
  encargado_snapshot: {
    state: 'libre',
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
  ...overrides,
});

describe('StateVectorTable', () => {
  it('opens the detail drawer when a row is clicked', async () => {
    const user = userEvent.setup();
    const line = makeLine({
      id: 2,
      line_index: 7,
      event_name: 'fin_inscripcion PC 2',
      clock_formatted: '00:10:00',
      queue_length: 2,
    });

    render(
      <StateVectorTable
        lines={[line]}
        loading={false}
        page={1}
        pageSize={10}
        total={1}
        queueLimit={5}
        onPageChange={() => undefined}
      />,
    );

    await user.click(screen.getByText('Fin Inscripción PC 2'));

    expect(screen.getByText('Línea 7')).toBeInTheDocument();
    expect(screen.getByText('fin_inscripcion PC 2')).toBeInTheDocument();
    expect(screen.getByText('00:10:00')).toBeInTheDocument();
    expect(screen.getByText('2 alumnos')).toBeInTheDocument();
  });

  it('opens the detail drawer from keyboard focus', async () => {
    const user = userEvent.setup();

    render(
      <StateVectorTable
        lines={[makeLine({ line_index: 9, event_name: 'regreso_alumno A4' })]}
        loading={false}
        page={1}
        pageSize={10}
        total={1}
        queueLimit={5}
        onPageChange={() => undefined}
      />,
    );

    await user.tab();
    await user.keyboard('{Enter}');

    expect(screen.getByText('Línea 9')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
cd frontend
npm test -- StateVectorTable.test.tsx
```

Expected: FAIL because rows do not open the drawer.

- [ ] **Step 3: Wire selected row state**

Modify `frontend/src/components/StateVectorTable.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { Table, Tooltip, Typography } from 'antd';
import { SimulationLineDrawer } from './SimulationLineDrawer';
```

Inside `StateVectorTable`, before `return`:

```tsx
const [selectedLine, setSelectedLine] = useState<SimulationLine | null>(null);
```

Add these props to `<Table />`:

```tsx
rowClassName={(record) => (record.id === selectedLine?.id ? 'active-row trace-row' : 'trace-row')}
onRow={(record) => ({
  tabIndex: 0,
  role: 'button',
  'aria-label': `Abrir detalle de línea ${record.line_index}`,
  onClick: () => setSelectedLine(record),
  onKeyDown: (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedLine(record);
    }
  },
})}
```

Render the drawer after the table:

```tsx
<SimulationLineDrawer
  line={selectedLine}
  open={selectedLine !== null}
  onClose={() => setSelectedLine(null)}
/>
```

- [ ] **Step 4: Run table test to verify it passes**

Run:

```powershell
cd frontend
npm test -- StateVectorTable.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/components/StateVectorTable.tsx frontend/src/components/StateVectorTable.test.tsx
git commit -m "feat: open line detail drawer from state vector table"
```

## Task 4: Add Focus and Drawer Polish

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/components/SimulationLineDrawer.tsx`

- [ ] **Step 1: Write failing accessibility/style assertion**

Add to `frontend/src/components/StateVectorTable.test.tsx`:

```tsx
it('marks table rows as buttons with an accessible label', () => {
  render(
    <StateVectorTable
      lines={[makeLine({ line_index: 11 })]}
      loading={false}
      page={1}
      pageSize={10}
      total={1}
      queueLimit={5}
      onPageChange={() => undefined}
    />,
  );

  expect(screen.getByRole('button', { name: 'Abrir detalle de línea 11' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails or confirms current behavior**

Run:

```powershell
cd frontend
npm test -- StateVectorTable.test.tsx
```

Expected: If Task 3 already added the exact accessible label, PASS. If not, FAIL and fix the row props to match.

- [ ] **Step 3: Add compact row and drawer CSS**

Append to `frontend/src/index.css`:

```css
.trace-row {
  cursor: pointer;
}

.trace-row:focus-visible > td {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.line-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.line-detail-section h3 {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}

.line-detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
```

- [ ] **Step 4: Re-run focused tests**

Run:

```powershell
cd frontend
npm test -- StateVectorTable.test.tsx SimulationLineDrawer.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add frontend/src/index.css frontend/src/components/StateVectorTable.test.tsx frontend/src/components/SimulationLineDrawer.tsx
git commit -m "style: polish simulation line detail interactions"
```

## Task 5: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Run frontend checks**

Run:

```powershell
cd frontend
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 2: Run backend tests**

Run:

```powershell
pytest
```

Expected: existing backend/simulation tests pass.

- [ ] **Step 3: Manual browser verification**

Run servers as needed:

```powershell
uvicorn backend.main:app --reload
cd frontend
npm run dev
```

Verify:

- Open a simulation.
- Go to "Vector de estados".
- Click a row.
- Drawer opens on the right.
- Drawer shows event, clock, queue, technician, PCs, students, RND/times.
- Escape or close button closes it.
- Pagination still works.

- [ ] **Step 4: Review React best practices**

Check:

- Hooks only at top level.
- Props destructured in function signatures.
- Clickable rows have keyboard support.
- Component boundaries stay focused.
- No broad unrelated refactor.

- [ ] **Step 5: Commit any final fixes**

```powershell
git status --short
git add <changed-files>
git commit -m "fix: address line detail verification findings"
```

Only commit if final verification required changes.

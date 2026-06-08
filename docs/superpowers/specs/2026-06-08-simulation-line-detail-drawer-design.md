# Simulation Line Detail Drawer Design

## Goal

Refactor the frontend trace area so a user can click a simulation vector line and inspect the full line detail without losing table context.

## Scope

- Add a right-side detail drawer opened from the vector table.
- Keep the existing paginated, virtualized Ant Design table.
- Preserve the current simulation API shape; no backend changes.
- Improve frontend structure only where it supports the drawer and table readability.

## User Experience

- In the "Vector de estados" tab, each row is clickable.
- The selected row is highlighted.
- A drawer opens from the right and keeps the table visible behind it.
- The drawer title identifies the line index, event, and clock.
- The drawer groups fields into readable sections:
  - Event summary
  - Queue and counters
  - Technician state
  - PC states
  - Active students
  - Random numbers and scheduled times
- The drawer can be closed with the close button or Escape.
- Rows remain keyboard-accessible.

## Components

- `StateVectorTable`
  - Owns `selectedLine`.
  - Opens the drawer when a row is clicked.
  - Highlights the selected row.
  - Passes the selected line to the drawer.

- `SimulationLineDrawer`
  - Receives `line`, `open`, and `onClose`.
  - Renders grouped detail sections from the existing `SimulationLine` type.
  - Uses Ant Design `Drawer`, `Descriptions`, `Table`, `Tag`, and `Empty` where useful.

- Table helpers
  - Keep existing event, queue, PC, and student cell renderers.
  - Extract only small helpers needed to avoid duplicated formatting in the drawer.

## Data Flow

`useSimulationDetails` fetches paginated lines as it does today. `StateVectorTable` receives the current page of `SimulationLine[]`, stores the clicked `SimulationLine`, and renders `SimulationLineDrawer` with that object. No additional network request is needed because the row already contains the full detail currently exposed by the API.

## Testing

- Add React component tests for:
  - Clicking a row opens the drawer.
  - Drawer displays line index, event, clock, queue length, and key snapshot fields.
  - Closing the drawer hides the details.
- Keep existing build/typecheck checks.

## Non-Goals

- No backend endpoint changes.
- No raw JSON-only detail view.
- No new routing.
- No broad redesign outside the simulation trace area.

## Risks

- Ant Design virtual table rows need accessible click handling without breaking pagination or virtual scrolling.
- The current project may not have a test runner configured; if so, add the smallest Vite-compatible test setup needed for component tests.

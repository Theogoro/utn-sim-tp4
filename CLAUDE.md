# CLAUDE.md

Always use the skill superpowers and caveman.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Discrete event simulation platform for UTN exam enrollment (6 PCs, exponential student arrivals, technician maintenance cycles). Backend runs the simulation and stores audit trails; frontend visualizes results.

## Commands

### Backend
```bash
python -m uvicorn backend.main:app --reload   # dev server on :8000
python app.py                                  # standalone CLI run
pytest                                         # all tests
pytest tests/test_service.py                  # single test file
pip install -r requirements.txt
pip install -r requirements-dev.txt           # adds pytest + httpx
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # Vite dev server on :5173
npm run build        # tsc --noEmit && vite build
npm run lint
npm run test         # vitest run (all)
npx vitest run src/test/StateVectorTable.test.tsx   # single test file
```

Swagger UI: http://127.0.0.1:8000/docs

## Architecture

### Backend Layers (Controller → Service → Repository → DB)

- **`backend/controllers/simulations.py`** — 5 HTTP endpoints, thin (no logic)
- **`backend/services/simulation_service.py`** — business logic: converts UI minutes→seconds, instantiates and runs simulation, computes 3 metrics (pct_students_returned, avg_waiting_time, avg_technician_idle_time), persists via repository
- **`backend/repositories/simulation_repository.py`** — all DB access: CRUD on SimulationModel + paginated iteration of lines/students
- **`backend/models.py`** — SQLAlchemy ORM: `SimulationModel` (header), `SimulationLineModel` (FEL audit row, 300+ columns), `SimulationStudentModel`
- **`backend/schemas.py`** — Pydantic I/O contracts
- **`backend/db_logger.py`** — observer that writes every FEL event to DB during simulation run
- **`backend/errors.py`** — `SimulationNotFound`, `SimulationExecutionError`; handlers registered in `main.py`

### Simulation Engine (`simulation/`)

- **`simulation.py`** — DES runner: processes Future Event List (FEL) heap, dispatches to handlers, notifies observers
- **`state.py`** — mutable sim state: PCs array, Alumno/Encargado objects, event heap, student history, time accumulators
- **`params.py`** — dataclass of all parameters (num_pcs, arrival mean, service uniform bounds, maintenance intervals, queue threshold)
- **`handlers/event_handlers.py`** — event dispatch (student arrival, start/end enrollment, maintenance start/end, student retry)
- **`handlers/loggers.py`** — ConsoleLoggerHandler observer; builds row snapshots for DB

### Frontend

- **`src/api/simulations.ts`** — Axios client; base URL `http://127.0.0.1:8000/api`; all API functions typed with generics
- **`src/hooks/useSimulationHistory.ts`** — manages simulation list, active selection, form submission
- **`src/hooks/useSimulationDetails.ts`** — fetches sim details, FEL lines, students, pagination state
- **`src/components/`** — feature-folder layout: each feature has its own dir with component, helpers (columns.tsx, formatters.tsx, renderers.tsx, constants.ts), and nested `sections/`
- **`src/types/`** — TypeScript interfaces for all API response shapes
- No global state library — custom hooks only; Ant Design `message` for notifications

### Database

SQLite at `./simulations.db`. Schema created on startup via `Base.metadata.create_all()` in `backend/main.py`.

## Key Constraints

- UI inputs are in **minutes**; `simulation_service.py` converts to seconds before running simulation — do not pass minutes into the engine directly
- Queue threshold: if >5 students waiting, arrivals leave and retry in 30 min (hardcoded in domain logic)
- Frontend tests require `src/test/setup.ts` mocks for `matchMedia` and `ResizeObserver` (Ant Design compat)

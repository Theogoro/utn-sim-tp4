# Backend Layered Architecture (Controller / Service / Repository)

**Date:** 2026-06-08
**Status:** Approved
**Scope:** Refactor the FastAPI backend from a single-file monolith into a layered
architecture. Pure behavior-preserving refactor — no endpoint, payload, or status
code changes.

## Problem

`backend/main.py` is a ~440-line monolith. Every endpoint mixes three concerns in
one place:

- HTTP handling (request parsing, `HTTPException`, response models)
- Business logic (simulation orchestration, stats computation, xlsx workbook build)
- Data access (inline `db.query(...)` calls, transaction management)

Consequences: hard to unit test (business logic only reachable through HTTP), hard
to reuse (xlsx export and stats math are inlined), and no separation that lets work
be parallelized or reasoned about per-layer.

## Goal

Introduce a strict three-layer architecture:

- **Controller** — HTTP only. Thin handlers, no business logic, no SQL.
- **Service** — business logic only. No HTTP, no SQLAlchemy.
- **Repository** — data access only. The single place that knows SQLAlchemy.

**Hard rule:** SQL lives only in `repositories/`, business logic only in
`services/`, HTTP only in `controllers/`. A layer importing something that belongs
to another layer is a defect.

## Non-Goals

- No change to the simulation engine (`simulation/`, `utils/`).
- No change to the ORM models (`models.py`), Pydantic schemas (`schemas.py`), or
  DB connection setup (`database.py`).
- No new endpoints, no changed paths, payloads, or status codes.
- No frontend changes.

## Target Structure

```
backend/
  main.py                       # bootstrap ONLY: FastAPI(), CORS, create_all,
                                #   include_router, exception handlers
  database.py                   # unchanged (engine, SessionLocal, Base, get_db)
  models.py                     # unchanged (ORM)
  schemas.py                    # unchanged (Pydantic)
  errors.py                     # NEW: domain exceptions
  dependencies.py               # NEW: get_repository / get_service (Depends wiring)
  db_logger.py                  # refactored: writes via repository, never touches session
  controllers/
    __init__.py
    simulations.py              # APIRouter, thin handlers, 1 endpoint = 1 handler
  services/
    __init__.py
    simulation_service.py       # SimulationService: all business logic
    xlsx_export.py              # pure helper: builds the Workbook
  repositories/
    __init__.py
    simulation_repository.py     # SimulationRepository(db): ALL SQL
```

## Layer Contracts

### Repository — `SimulationRepository(db: Session)`

The only class that imports/uses SQLAlchemy. Owns query construction and
transaction primitives so the service never touches the `Session`.

| Method | Purpose |
| --- | --- |
| `create(model) -> SimulationModel` | `add` + `flush` (assigns `id` without commit) |
| `get(simulation_id) -> SimulationModel \| None` | fetch by id |
| `list() -> list[SimulationModel]` | all, ordered by `created_at` desc |
| `count_lines(simulation_id) -> int` | total lines for pagination |
| `get_lines_page(simulation_id, offset, limit) -> list[SimulationLineModel]` | one page, ordered by `line_index` asc |
| `iter_lines(simulation_id) -> Iterator[SimulationLineModel]` | streaming (`yield_per(1000)`) for export |
| `count_students(simulation_id) -> int` | total students for pagination |
| `get_students_page(simulation_id, offset, limit) -> list[SimulationStudentModel]` | one page, ordered by `student_id` asc |
| `iter_students(simulation_id) -> Iterator[SimulationStudentModel]` | streaming for export |
| `add_line(**payload)` | insert one line row (used by logger) |
| `add_student(**payload)` | insert one student row (used by logger) |
| `delete(model)` | delete a simulation (cascade via ORM relationship) |
| `commit()` / `rollback()` / `flush()` / `refresh(model)` | transaction control exposed to the service |

### Service — `SimulationService(repo: SimulationRepository)`

All business logic. No HTTP, no SQLAlchemy. Raises domain errors (below); never
raises `HTTPException`.

| Method | Behavior |
| --- | --- |
| `run_simulation(params_in) -> SimulationModel` | build `SimulationParams`; pre-create model via `repo.create` (flush→id); run `Simulation` wired with `DatabaseLoggerHandler(state, repo, sim_id)`; `logger.flush_student_records(include_active=True)`; compute stats + `pc_utilization`; update model fields; `repo.commit()` + `repo.refresh()`. On any exception: `repo.rollback()` then raise `SimulationExecutionError(str(e))`. |
| `get_simulation(id) -> SimulationModel` | `repo.get`; raise `SimulationNotFound` if `None` |
| `list_simulations() -> list[SimulationModel]` | `repo.list` |
| `get_lines(id, page, limit) -> dict` | verify exists (`SimulationNotFound`); return `{total, page, limit, items: [SimulationLineResponse...]}` |
| `get_students(id, page, limit) -> dict` | verify exists; return `{total, page, limit, items: [SimulationStudentResponse...]}` |
| `get_pc_stats(id) -> list` | verify exists; parse `pc_utilization` JSON (or `[]`) |
| `export_xlsx(id) -> tuple[BytesIO, str]` | verify exists; delegate to `xlsx_export.build_workbook`; return `(buffer, filename)` |
| `delete_simulation(id)` | verify exists; `repo.delete` + `repo.commit` |

### xlsx Export — `xlsx_export.build_workbook(sim, lines_iter, students_iter) -> BytesIO`

Pure function. No DB, no HTTP. Receives the simulation model and two iterators,
returns an in-memory `.xlsx` buffer. Holds the three-sheet layout (Resumen, Vector
de Estados, Detalle Alumnos) currently inlined in `main.py`.

### Controller — `controllers/simulations.py`

`APIRouter(prefix="/api/simulations", tags=["simulations"])`. Endpoints map 1:1 to
current paths and `response_model`s. Each handler: `Depends(get_service)`, call the
service, return. **No `try/except`, no business logic, no SQL.** For the export
endpoint, wrap the returned buffer in `StreamingResponse` with the existing media
type and `Content-Disposition`.

Endpoints preserved exactly:

- `POST /api/simulations` → `run_simulation`
- `GET  /api/simulations` → `list_simulations`
- `GET  /api/simulations/{id}` → `get_simulation`
- `GET  /api/simulations/{id}/lines` → `get_simulation_lines` (page, limit)
- `GET  /api/simulations/{id}/students` → `get_simulation_students` (page, limit)
- `GET  /api/simulations/{id}/pc_stats` → `get_pc_utilization`
- `GET  /api/simulations/{id}/export` → `export_simulation_xlsx`
- `DELETE /api/simulations/{id}` → `delete_simulation`

### db_logger — `DatabaseLoggerHandler`

Refactored to persist through the repository instead of calling `db.add` directly.
Constructor takes `(state, repo, simulation_id, flush_every=500)`. `trigger` calls
`repo.add_line(**payload)`; `flush_student_records` calls `repo.add_student(...)`;
periodic flush calls `repo.flush()`. Streaming + flush semantics unchanged. This
keeps **all** DB writes inside the repository layer.

## Error Handling

Domain exceptions in `backend/errors.py`:

- `SimulationNotFound(Exception)`
- `SimulationExecutionError(Exception)`

Translated to HTTP centrally via `@app.exception_handler` in `main.py` (controllers
stay free of `try/except`):

| Exception | Status | Detail (unchanged from today) |
| --- | --- | --- |
| `SimulationNotFound` | 404 | `"Simulation not found"` |
| `SimulationExecutionError` | 500 | `"Simulation error: {detail}"` |
| Pydantic validation | 422 | FastAPI default (unchanged) |

## Data Flow — `run_simulation`

1. `POST /api/simulations` → controller; Pydantic validates `SimulationParamsCreate`.
2. Controller calls `service.run_simulation(params_in)`.
3. Service builds `SimulationParams`, calls `repo.create(model)` (flush → `id`).
4. Service runs `Simulation` with `DatabaseLoggerHandler(state, repo, id)`; the
   logger streams line + student rows through `repo.add_line/add_student`.
5. Service computes stats and `pc_utilization`, updates the model, `repo.commit()`,
   `repo.refresh()`.
6. Controller returns `SimulationResponse`. On failure the service rolled back and
   raised `SimulationExecutionError` → 500.

## Testing Strategy — Characterization First

Behavior-preservation is proven by a characterization suite written and green
**before** the refactor begins.

1. **New dev dependencies:** `pytest`, `httpx`, in a new `requirements-dev.txt`
   (production `requirements.txt` stays unchanged).
2. **`tests/test_api_characterization.py`** with `fastapi.testclient.TestClient`:
   - Isolated SQLite: override the `get_db` dependency to a temp-file engine with
     `Base.metadata.create_all` — never touches `simulations.db`.
   - `random.seed(...)` fixed for reproducibility.
   - Covers all 8 endpoint behaviors: status codes, JSON shape (keys/types),
     pagination coherence, 404 paths, delete, and the xlsx `content-type` +
     `Content-Disposition` on export.
   - **Anti-fragility:** assert structure, types, and invariants (counts ≥ 0,
     pagination coherent, reproducibility under a fixed seed) — not magic numbers
     from a stochastic simulation.
3. Suite must be **green on the current `main.py`** first. Then refactor. The suite
   staying green is the proof that behavior is preserved.

## Subagent Task Decomposition (detail belongs in the plan)

1. **T1** — characterization tests + dev-deps; green on current code.
2. **T2** — `repositories/simulation_repository.py`.
3. **T3** — `services/simulation_service.py` + `services/xlsx_export.py` + `errors.py`.
4. **T4** — refactor `db_logger.py` to write through the repository.
5. **T5** — `controllers/simulations.py` + `dependencies.py` + slim `main.py`
   (bootstrap + exception handlers); remove all old logic from `main.py`.

Every task runs the full suite and leaves it green. T2–T5 depend on T1; T3 depends
on T2; T4 depends on T2–T3; T5 depends on T2–T4.

## Risks & Mitigations

- **Stochastic simulation breaks naive assertions** → characterization asserts
  structure/invariants under a fixed seed, not exact values.
- **Transaction boundary regressions** (single-commit semantics in
  `run_simulation`) → service owns the unit of work; repository exposes
  `commit/rollback/flush`; characterization exercises the full run + persistence.
- **Import-path coupling** (`main.py` adds repo root to `sys.path`) → preserve that
  bootstrap line; keep imports as `backend.*` and `simulation.*`.

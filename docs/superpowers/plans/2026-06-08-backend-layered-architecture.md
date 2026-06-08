# Backend Layered Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the FastAPI backend from a single-file monolith ([backend/main.py](backend/main.py)) into a strict Controller / Service / Repository layered architecture, preserving every endpoint, payload, and status code.

**Architecture:** Controllers (`APIRouter`) handle HTTP only; a `SimulationService` holds all business logic (simulation orchestration, stats, xlsx export, delete) and knows nothing about HTTP or SQLAlchemy; a `SimulationRepository` is the single place that touches the SQLAlchemy `Session`. Domain exceptions are translated to HTTP centrally via `@app.exception_handler`. Behavior preservation is proven by a characterization test suite written and green **before** the refactor.

**Tech Stack:** Python, FastAPI, SQLAlchemy (SQLite), Pydantic, openpyxl. Tests: pytest + FastAPI `TestClient` (httpx).

**Reference spec:** [docs/superpowers/specs/2026-06-08-backend-layered-architecture-design.md](docs/superpowers/specs/2026-06-08-backend-layered-architecture-design.md)

---

## File Map

| File | Responsibility | Task |
| --- | --- | --- |
| `requirements-dev.txt` | dev-only deps (pytest, httpx) | T1 |
| `tests/test_api_characterization.py` | pins current API behavior (the safety net) | T1 |
| `backend/repositories/simulation_repository.py` | ALL SQL | T2 |
| `tests/test_repository.py` | repository unit tests | T2 |
| `backend/errors.py` | domain exceptions | T3 |
| `backend/services/xlsx_export.py` | pure workbook builder | T3 |
| `tests/test_xlsx_export.py` | xlsx unit test | T3 |
| `backend/db_logger.py` | refactor: write via repository | T4 |
| `backend/services/simulation_service.py` | ALL business logic | T5 |
| `tests/test_service.py` | service unit tests | T5 |
| `backend/dependencies.py` | `get_repository` / `get_service` wiring | T6 |
| `backend/controllers/simulations.py` | thin HTTP handlers (`APIRouter`) | T6 |
| `backend/main.py` | bootstrap only + exception handlers | T6 |

**Convention note:** this project uses implicit namespace packages — there are NO `__init__.py` files anywhere. Do **not** add any. New folders (`repositories/`, `services/`, `controllers/`) are created implicitly by writing the `.py` files into them.

**Run tests from the repo root** so `backend` and `simulation` resolve on `sys.path`:
`python -m pytest tests/ -v`

**Dependency order:** T1 → T2 → T3 → T4 → T5 → T6. T5 depends on T2/T3/T4. T6 depends on T5/T3. Every task ends with the full suite green.

---

## Task 1: Characterization test suite (safety net)

Characterization tests describe current behavior, so they **PASS on the current `main.py`**. Keeping them green through every later task is the proof that behavior is preserved.

**Files:**
- Create: `requirements-dev.txt`
- Create: `tests/test_api_characterization.py`

- [ ] **Step 1: Add dev dependencies**

Create `requirements-dev.txt`:

```
-r requirements.txt
pytest
httpx
```

- [ ] **Step 2: Install dev dependencies**

Run: `python -m pip install -r requirements-dev.txt`
Expected: pytest and httpx install successfully.

- [ ] **Step 3: Write the characterization suite**

Create `tests/test_api_characterization.py`:

```python
import random

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database import Base, get_db
from backend.main import app

# Small, fast simulation parameters (1.0 min service, 0.2 sim hours = 720 s horizon).
SMALL_PARAMS = {
    "num_pcs": 2,
    "min_enrollment": 1.0,
    "max_enrollment": 1.0,
    "mean_arrival_time": 5.0,
    "min_service_time": 1.0,
    "max_service_time": 1.0,
    "min_maintenance_time": 1.0,
    "max_maintenance_time": 1.0,
    "mean_technician_return_time": 30.0,
    "technician_return_time_variation": 0.0,
    "student_wait_threshold": 5,
    "student_return_time": 2.0,
    "initial_maintenance_at_start": True,
    "sim_hours": 0.2,
}

SUMMARY_KEYS = {
    "id", "created_at", "num_pcs", "min_enrollment", "max_enrollment",
    "mean_arrival_time", "min_service_time", "max_service_time",
    "min_maintenance_time", "max_maintenance_time", "mean_technician_return_time",
    "technician_return_time_variation", "student_wait_threshold",
    "student_return_time", "initial_maintenance_at_start", "sim_days", "sim_hours",
    "total_students_arrived", "total_new_students_arrived", "total_students_returned",
    "registrations_completed", "total_technician_visits", "pct_students_returned",
    "avg_waiting_time", "avg_technician_idle_time", "pc_utilization",
}


@pytest.fixture()
def client(tmp_path):
    # Isolated SQLite file engine — never touches the real simulations.db.
    engine = create_engine(
        f"sqlite:///{tmp_path / 'test_sim.db'}",
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    random.seed(12345)
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def _create(client):
    resp = client.post("/api/simulations", json=SMALL_PARAMS)
    assert resp.status_code == 200, resp.text
    return resp.json()


def test_run_simulation_returns_summary_shape(client):
    body = _create(client)
    assert SUMMARY_KEYS.issubset(body.keys())
    assert isinstance(body["id"], int)
    assert body["num_pcs"] == 2
    assert isinstance(body["total_students_arrived"], int)
    assert body["total_students_arrived"] >= 0
    assert isinstance(body["pct_students_returned"], float)
    assert isinstance(body["avg_waiting_time"], float)


def test_list_simulations_returns_list_newest_first(client):
    first = _create(client)
    second = _create(client)
    resp = client.get("/api/simulations")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    ids = [row["id"] for row in data]
    assert {first["id"], second["id"]}.issubset(set(ids))
    assert ids == sorted(ids, reverse=True)


def test_get_simulation_by_id_and_404(client):
    body = _create(client)
    ok = client.get(f"/api/simulations/{body['id']}")
    assert ok.status_code == 200
    assert ok.json()["id"] == body["id"]

    missing = client.get("/api/simulations/99999")
    assert missing.status_code == 404
    assert missing.json()["detail"] == "Simulation not found"


def test_get_lines_pagination_shape(client):
    body = _create(client)
    resp = client.get(f"/api/simulations/{body['id']}/lines?page=1&limit=5")
    assert resp.status_code == 200
    payload = resp.json()
    assert set(payload.keys()) == {"total", "page", "limit", "items"}
    assert payload["page"] == 1
    assert payload["limit"] == 5
    assert isinstance(payload["total"], int)
    assert isinstance(payload["items"], list)
    assert len(payload["items"]) <= 5
    if payload["items"]:
        item = payload["items"][0]
        assert "line_index" in item
        assert isinstance(item["pc_snapshot"], list)
        assert isinstance(item["queue_student_ids"], list)

    assert client.get("/api/simulations/99999/lines").status_code == 404


def test_get_students_pagination_shape(client):
    body = _create(client)
    resp = client.get(f"/api/simulations/{body['id']}/students?page=1&limit=5")
    assert resp.status_code == 200
    payload = resp.json()
    assert set(payload.keys()) == {"total", "page", "limit", "items"}
    assert isinstance(payload["items"], list)

    assert client.get("/api/simulations/99999/students").status_code == 404


def test_pc_stats_shape(client):
    body = _create(client)
    resp = client.get(f"/api/simulations/{body['id']}/pc_stats")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 2  # one entry per PC
    for entry in data:
        assert set(entry.keys()) == {"id", "busy_time", "maintenance_time", "idle_time"}

    assert client.get("/api/simulations/99999/pc_stats").status_code == 404


def test_export_returns_xlsx(client):
    body = _create(client)
    resp = client.get(f"/api/simulations/{body['id']}/export")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    assert f'simulacion_{body["id"]}.xlsx' in resp.headers["content-disposition"]
    assert resp.content[:2] == b"PK"  # xlsx is a zip archive

    assert client.get("/api/simulations/99999/export").status_code == 404


def test_delete_simulation(client):
    body = _create(client)
    deleted = client.delete(f"/api/simulations/{body['id']}")
    assert deleted.status_code == 200
    assert deleted.json()["message"] == f"Simulation {body['id']} deleted successfully"

    assert client.get(f"/api/simulations/{body['id']}").status_code == 404
    assert client.delete("/api/simulations/99999").status_code == 404
```

- [ ] **Step 4: Run the suite against the CURRENT code — it must pass**

Run: `python -m pytest tests/test_api_characterization.py -v`
Expected: all tests PASS (they describe current behavior).

- [ ] **Step 5: Commit**

```bash
git add requirements-dev.txt tests/test_api_characterization.py
git commit -m "test: characterization suite pinning current backend API behavior"
```

---

## Task 2: Repository layer

**Files:**
- Create: `backend/repositories/simulation_repository.py`
- Create: `tests/test_repository.py`

- [ ] **Step 1: Write the failing repository tests**

Create `tests/test_repository.py`:

```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database import Base
from backend.models import SimulationModel
from backend.repositories.simulation_repository import SimulationRepository


@pytest.fixture()
def repo(tmp_path):
    engine = create_engine(
        f"sqlite:///{tmp_path / 'repo.db'}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    db = sessionmaker(bind=engine)()
    try:
        yield SimulationRepository(db)
    finally:
        db.close()


def _make_model():
    return SimulationModel(
        num_pcs=2, min_enrollment=5.0, max_enrollment=8.0, mean_arrival_time=2.0,
        min_service_time=5.0, max_service_time=8.0, min_maintenance_time=3.0,
        max_maintenance_time=10.0, mean_technician_return_time=60.0,
        technician_return_time_variation=3.0, student_wait_threshold=5,
        student_return_time=30.0, initial_maintenance_at_start=True, sim_days=1.0,
    )


def test_create_assigns_id(repo):
    model = repo.create(_make_model())
    assert model.id is not None


def test_get_returns_created(repo):
    model = repo.create(_make_model())
    repo.commit()
    assert repo.get(model.id).id == model.id


def test_get_missing_returns_none(repo):
    assert repo.get(99999) is None


def test_list_orders_by_created_at_desc(repo):
    repo.create(_make_model())
    repo.create(_make_model())
    repo.commit()
    sims = repo.list()
    assert len(sims) == 2
    times = [s.created_at for s in sims]
    assert times == sorted(times, reverse=True)


def test_delete_removes(repo):
    model = repo.create(_make_model())
    repo.commit()
    repo.delete(model)
    repo.commit()
    assert repo.get(model.id) is None


def test_add_line_and_count(repo):
    model = repo.create(_make_model())
    repo.commit()
    repo.add_line(
        simulation_id=model.id, line_index=0, clock=0.0, clock_formatted="00:00:00",
        event_name="inicio", queue_length=0, pc_states="L,L",
        pc_snapshot_json="[]", encargado_snapshot_json="{}",
        active_students_snapshot_json="[]", queue_student_ids_json="[]",
        registrations_completed=0, total_students_returned=0,
    )
    repo.commit()
    assert repo.count_lines(model.id) == 1
    page = repo.get_lines_page(model.id, 0, 50)
    assert len(page) == 1 and page[0].line_index == 0
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python -m pytest tests/test_repository.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'backend.repositories'`.

- [ ] **Step 3: Implement the repository**

Create `backend/repositories/simulation_repository.py`:

```python
from typing import Iterator, List, Optional

from sqlalchemy.orm import Session

from backend.models import (
    SimulationLineModel,
    SimulationModel,
    SimulationStudentModel,
)


class SimulationRepository:
    """Single point of database access for simulations.

    This is the ONLY class that knows about the SQLAlchemy session. It also
    exposes transaction primitives so the service layer never touches the
    Session directly.
    """

    def __init__(self, db: Session) -> None:
        self.db = db

    # --- transaction control ---
    def commit(self) -> None:
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()

    def flush(self) -> None:
        self.db.flush()

    def refresh(self, model) -> None:
        self.db.refresh(model)

    # --- simulations ---
    def create(self, model: SimulationModel) -> SimulationModel:
        self.db.add(model)
        self.db.flush()  # assign id without committing
        return model

    def get(self, simulation_id: int) -> Optional[SimulationModel]:
        return (
            self.db.query(SimulationModel)
            .filter(SimulationModel.id == simulation_id)
            .first()
        )

    def list(self) -> List[SimulationModel]:
        return (
            self.db.query(SimulationModel)
            .order_by(SimulationModel.created_at.desc())
            .all()
        )

    def delete(self, model: SimulationModel) -> None:
        self.db.delete(model)

    # --- lines ---
    def count_lines(self, simulation_id: int) -> int:
        return (
            self.db.query(SimulationLineModel)
            .filter(SimulationLineModel.simulation_id == simulation_id)
            .count()
        )

    def get_lines_page(
        self, simulation_id: int, offset: int, limit: int
    ) -> List[SimulationLineModel]:
        return (
            self.db.query(SimulationLineModel)
            .filter(SimulationLineModel.simulation_id == simulation_id)
            .order_by(SimulationLineModel.line_index.asc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def iter_lines(self, simulation_id: int) -> Iterator[SimulationLineModel]:
        return (
            self.db.query(SimulationLineModel)
            .filter(SimulationLineModel.simulation_id == simulation_id)
            .order_by(SimulationLineModel.line_index.asc())
            .yield_per(1000)
        )

    def add_line(self, **payload) -> None:
        self.db.add(SimulationLineModel(**payload))

    # --- students ---
    def count_students(self, simulation_id: int) -> int:
        return (
            self.db.query(SimulationStudentModel)
            .filter(SimulationStudentModel.simulation_id == simulation_id)
            .count()
        )

    def get_students_page(
        self, simulation_id: int, offset: int, limit: int
    ) -> List[SimulationStudentModel]:
        return (
            self.db.query(SimulationStudentModel)
            .filter(SimulationStudentModel.simulation_id == simulation_id)
            .order_by(SimulationStudentModel.student_id.asc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def iter_students(self, simulation_id: int) -> Iterator[SimulationStudentModel]:
        return (
            self.db.query(SimulationStudentModel)
            .filter(SimulationStudentModel.simulation_id == simulation_id)
            .order_by(SimulationStudentModel.student_id.asc())
            .yield_per(1000)
        )

    def add_student(self, **payload) -> None:
        self.db.add(SimulationStudentModel(**payload))
```

- [ ] **Step 4: Run repository tests AND the characterization suite**

Run: `python -m pytest tests/test_repository.py tests/test_api_characterization.py -v`
Expected: all PASS. (`main.py` is untouched, so characterization stays green.)

- [ ] **Step 5: Commit**

```bash
git add backend/repositories/simulation_repository.py tests/test_repository.py
git commit -m "feat: add SimulationRepository data-access layer"
```

---

## Task 3: Domain errors + pure xlsx export helper

**Files:**
- Create: `backend/errors.py`
- Create: `backend/services/xlsx_export.py`
- Create: `tests/test_xlsx_export.py`

- [ ] **Step 1: Write the domain exceptions**

Create `backend/errors.py`:

```python
class SimulationNotFound(Exception):
    """Raised by the service when a simulation id does not exist."""


class SimulationExecutionError(Exception):
    """Raised by the service when running a simulation fails."""
```

- [ ] **Step 2: Write the failing xlsx test**

Create `tests/test_xlsx_export.py`:

```python
import datetime
import json

from openpyxl import load_workbook

from backend.models import SimulationModel
from backend.services import xlsx_export


def _make_sim():
    sim = SimulationModel(
        num_pcs=2, min_enrollment=5.0, max_enrollment=8.0, mean_arrival_time=2.0,
        min_service_time=5.0, max_service_time=8.0, min_maintenance_time=3.0,
        max_maintenance_time=10.0, mean_technician_return_time=60.0,
        technician_return_time_variation=3.0, student_wait_threshold=5,
        student_return_time=30.0, initial_maintenance_at_start=True, sim_days=1.0,
    )
    sim.id = 1
    sim.created_at = datetime.datetime(2026, 1, 1)
    sim.total_students_arrived = 0
    sim.total_new_students_arrived = 0
    sim.total_students_returned = 0
    sim.registrations_completed = 0
    sim.total_technician_visits = 0
    sim.pct_students_returned = 0.0
    sim.avg_waiting_time = 0.0
    sim.avg_technician_idle_time = 0.0
    sim.pc_utilization = json.dumps(
        [{"id": 1, "busy_time": 0, "maintenance_time": 0, "idle_time": 0}]
    )
    return sim


def test_build_workbook_returns_three_named_sheets():
    buf = xlsx_export.build_workbook(_make_sim(), iter([]), iter([]))
    wb = load_workbook(buf)
    assert wb.sheetnames == ["Resumen", "Vector de Estados", "Detalle Alumnos"]
    assert buf.getvalue()[:2] == b"PK"
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `python -m pytest tests/test_xlsx_export.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'backend.services'`.

- [ ] **Step 4: Implement the pure workbook builder**

Create `backend/services/xlsx_export.py` (ported verbatim from `main.py`'s export endpoint, parameterized over the simulation and two row iterators):

```python
import io
import json
from typing import Iterable

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill


def build_workbook(sim, lines_iter: Iterable, students_iter: Iterable) -> io.BytesIO:
    """Build the 3-sheet .xlsx (Resumen, Vector de Estados, Detalle Alumnos).

    Pure: no DB and no HTTP. `lines_iter` / `students_iter` are iterables of ORM
    line / student rows (streamed by the repository).
    """
    wb = Workbook()

    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="4F46E5", end_color="4F46E5", fill_type="solid")
    section_font = Font(bold=True, size=12, color="6366F1")

    # --- Sheet 1: Resumen ---
    ws_sum = wb.active
    ws_sum.title = "Resumen"
    ws_sum["A1"] = f"Simulación #{sim.id}"
    ws_sum["A1"].font = Font(bold=True, size=14)
    ws_sum["A2"] = f"Ejecutada: {sim.created_at}"

    sections = [
        ("Parámetros", [
            ("Cantidad de PCs", sim.num_pcs),
            ("Tiempo entre llegadas (min)", sim.mean_arrival_time),
            ("Inscripción mín (min)", sim.min_enrollment),
            ("Inscripción máx (min)", sim.max_enrollment),
            ("Mantenimiento mín (min)", sim.min_maintenance_time),
            ("Mantenimiento máx (min)", sim.max_maintenance_time),
            ("Frecuencia regreso técnico (min)", sim.mean_technician_return_time),
            ("Variación regreso técnico ± (min)", sim.technician_return_time_variation),
            ("Límite cola alumnos", sim.student_wait_threshold),
            ("Demora retorno alumno (min)", sim.student_return_time),
            ("Mantenimiento inicial en minuto 0", "Sí" if sim.initial_maintenance_at_start else "No"),
            ("Tiempo simulado (días)", sim.sim_days),
            ("Tiempo simulado (horas)", round(sim.sim_days * 24, 2)),
        ]),
        ("Métricas", [
            ("Alumnos arribados (totales)", sim.total_students_arrived),
            ("Alumnos nuevos", sim.total_new_students_arrived),
            ("Alumnos retirados (rechazados)", sim.total_students_returned),
            ("Inscripciones completadas", sim.registrations_completed),
            ("Visitas del técnico", sim.total_technician_visits),
            ("% intentos rechazados", round(sim.pct_students_returned, 4)),
            ("Espera promedio (seg)", round(sim.avg_waiting_time, 4)),
            ("Espera promedio (min)", round(sim.avg_waiting_time / 60.0, 4)),
            ("Ocio promedio técnico (seg)", round(sim.avg_technician_idle_time, 4)),
            ("Ocio promedio técnico (min)", round(sim.avg_technician_idle_time / 60.0, 4)),
        ]),
    ]

    row = 4
    for title, rows in sections:
        ws_sum.cell(row=row, column=1, value=title).font = section_font
        row += 1
        for label, val in rows:
            ws_sum.cell(row=row, column=1, value=label)
            ws_sum.cell(row=row, column=2, value=val)
            row += 1
        row += 1

    if sim.pc_utilization:
        ws_sum.cell(row=row, column=1, value="Utilización por PC (segundos)").font = section_font
        row += 1
        pc_headers = ["PC", "Ocupado (s)", "Mantenimiento (s)", "Libre (s)"]
        for i, h in enumerate(pc_headers, start=1):
            c = ws_sum.cell(row=row, column=i, value=h)
            c.font = header_font
            c.fill = header_fill
            c.alignment = Alignment(horizontal="center")
        row += 1
        for pc in json.loads(sim.pc_utilization):
            ws_sum.cell(row=row, column=1, value=f"PC {pc.get('id')}")
            ws_sum.cell(row=row, column=2, value=round(pc.get("busy_time", 0), 2))
            ws_sum.cell(row=row, column=3, value=round(pc.get("maintenance_time", 0), 2))
            ws_sum.cell(row=row, column=4, value=round(pc.get("idle_time", 0), 2))
            row += 1

    ws_sum.column_dimensions["A"].width = 38
    ws_sum.column_dimensions["B"].width = 22
    ws_sum.column_dimensions["C"].width = 22
    ws_sum.column_dimensions["D"].width = 22

    # --- Sheet 2: Vector de Estados ---
    ws_vec = wb.create_sheet("Vector de Estados")
    line_headers = [
        "Fila", "Reloj (formato)", "Reloj (seg)", "Evento", "Cola",
        "RND Llegada", "Tpo Llegada (seg)", "Próx. Llegada (seg)", "Alumnos Rechazados",
        "Estados PCs", "Snapshot PCs", "Encargado", "Cola IDs", "Detalle alumnos activos",
        "RND Inscripción", "Tpo Inscripción (seg)", "Inscripciones Completadas",
        "RND Mantenimiento", "Tpo Mantenimiento (seg)",
        "RND Regreso Técnico", "Tpo Regreso Técnico (seg)", "Próx. Mantenimiento (seg)", "Fin Mantenimiento (seg)",
    ]
    for i, h in enumerate(line_headers, start=1):
        c = ws_vec.cell(row=1, column=i, value=h)
        c.font = header_font
        c.fill = header_fill
        c.alignment = Alignment(horizontal="center")

    row = 2
    for ln in lines_iter:
        ws_vec.cell(row=row, column=1, value=ln.line_index)
        ws_vec.cell(row=row, column=2, value=ln.clock_formatted)
        ws_vec.cell(row=row, column=3, value=ln.clock)
        ws_vec.cell(row=row, column=4, value=ln.event_name)
        ws_vec.cell(row=row, column=5, value=ln.queue_length)
        ws_vec.cell(row=row, column=6, value=ln.student_rnd)
        ws_vec.cell(row=row, column=7, value=ln.student_arrival_time)
        ws_vec.cell(row=row, column=8, value=ln.student_next_arrival_time)
        ws_vec.cell(row=row, column=9, value=ln.total_students_returned)
        ws_vec.cell(row=row, column=10, value=ln.pc_states)
        ws_vec.cell(row=row, column=11, value=ln.pc_snapshot_json)
        ws_vec.cell(row=row, column=12, value=ln.encargado_snapshot_json)
        ws_vec.cell(row=row, column=13, value=ln.queue_student_ids_json)
        ws_vec.cell(row=row, column=14, value=ln.active_students_snapshot_json)
        ws_vec.cell(row=row, column=15, value=ln.registration_rnd)
        ws_vec.cell(row=row, column=16, value=ln.registration_time)
        ws_vec.cell(row=row, column=17, value=ln.registrations_completed)
        ws_vec.cell(row=row, column=18, value=ln.maintenance_rnd)
        ws_vec.cell(row=row, column=19, value=ln.maintenance_time)
        ws_vec.cell(row=row, column=20, value=ln.technician_return_rnd)
        ws_vec.cell(row=row, column=21, value=ln.technician_return_time)
        ws_vec.cell(row=row, column=22, value=ln.next_maintenance_start_time)
        ws_vec.cell(row=row, column=23, value=ln.next_maintenance_complete_time)
        row += 1

    widths = [8, 14, 12, 28, 8, 12, 14, 16, 14, 16, 36, 42, 18, 50, 14, 16, 16, 14, 16, 16, 18, 20, 20]
    for i, w in enumerate(widths, start=1):
        ws_vec.column_dimensions[ws_vec.cell(row=1, column=i).column_letter].width = w
    ws_vec.freeze_panes = "A2"

    # --- Sheet 3: Detalle Alumnos ---
    ws_students = wb.create_sheet("Detalle Alumnos")
    student_headers = [
        "Alumno", "Estado final", "Intentos", "Veces que volvió", "Espera total (seg)",
        "Primera llegada (seg)", "Último evento (seg)", "Minuto de vuelta (seg)",
        "Inscripción completada (seg)",
    ]
    for i, h in enumerate(student_headers, start=1):
        c = ws_students.cell(row=1, column=i, value=h)
        c.font = header_font
        c.fill = header_fill
        c.alignment = Alignment(horizontal="center")

    row = 2
    for student in students_iter:
        ws_students.cell(row=row, column=1, value=student.student_id)
        ws_students.cell(row=row, column=2, value=student.final_state)
        ws_students.cell(row=row, column=3, value=student.attempts)
        ws_students.cell(row=row, column=4, value=student.times_returned_later)
        ws_students.cell(row=row, column=5, value=student.total_waiting_time)
        ws_students.cell(row=row, column=6, value=student.first_arrival_time)
        ws_students.cell(row=row, column=7, value=student.last_event_time)
        ws_students.cell(row=row, column=8, value=student.return_time)
        ws_students.cell(row=row, column=9, value=student.completed_registration_at)
        row += 1
    for i, w in enumerate([10, 18, 10, 16, 18, 20, 18, 18, 24], start=1):
        ws_students.column_dimensions[ws_students.cell(row=1, column=i).column_letter].width = w
    ws_students.freeze_panes = "A2"

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf
```

- [ ] **Step 5: Run the xlsx test + characterization suite**

Run: `python -m pytest tests/test_xlsx_export.py tests/test_api_characterization.py -v`
Expected: all PASS. (`main.py` untouched.)

- [ ] **Step 6: Commit**

```bash
git add backend/errors.py backend/services/xlsx_export.py tests/test_xlsx_export.py
git commit -m "feat: add domain errors and pure xlsx export helper"
```

---

## Task 4: Refactor db_logger to write through the repository

`DatabaseLoggerHandler` currently calls `db.add(...)` directly. Change it to take a `SimulationRepository` and call `repo.add_line` / `repo.add_student` / `repo.flush`. To keep `main.py` working until the Task 6 cutover, update its single call site to pass a repository wrapping the same session (temporary bridge — removed in Task 6).

**Files:**
- Modify: `backend/db_logger.py` (full rewrite)
- Modify: `backend/main.py:88-90` (bridge: build a repository for the logger)

- [ ] **Step 1: Rewrite db_logger to use the repository**

Replace the entire contents of `backend/db_logger.py` with:

```python
import json

from simulation.handlers.loggers import build_row


class DatabaseLoggerHandler:
    """Stream each row to the DB via the repository. No in-memory accumulation.

    The caller commits/rolls back at the end. Every `flush_every` events we flush
    to release accumulated ORM instances from the session.
    """

    def __init__(self, state, repo, simulation_id: int, flush_every: int = 500):
        self.state = state
        self.repo = repo
        self.simulation_id = simulation_id
        self.flush_every = flush_every
        self.line_counter = 0
        self.persisted_student_ids = set()

    def trigger(self, event=None) -> None:
        row = build_row(self.state)
        # The DB stores JSON snapshots so the vector does not depend on fixed columns.
        line_payload = {
            "clock": row["clock"],
            "clock_formatted": row["clock_formatted"],
            "event_name": row["event_name"],
            "queue_length": row["queue_length"],
            "pc_states": row["pc_states"],
            "pc_snapshot_json": json.dumps(row["pc_snapshot"]),
            "encargado_snapshot_json": json.dumps(row["encargado_snapshot"]),
            "active_students_snapshot_json": json.dumps(row["active_students_snapshot"]),
            "queue_student_ids_json": json.dumps(row["queue_student_ids"]),
            "student_rnd": row["student_rnd"],
            "student_arrival_time": row["student_arrival_time"],
            "student_next_arrival_time": row["student_next_arrival_time"],
            "registration_rnd": row["registration_rnd"],
            "registration_time": row["registration_time"],
            "maintenance_rnd": row["maintenance_rnd"],
            "maintenance_time": row["maintenance_time"],
            "technician_return_rnd": row["technician_return_rnd"],
            "technician_return_time": row["technician_return_time"],
            "next_maintenance_start_time": row["next_maintenance_start_time"],
            "next_maintenance_complete_time": row["next_maintenance_complete_time"],
            "registrations_completed": row["registrations_completed"],
            "total_students_returned": row["total_students_returned"],
        }
        self.repo.add_line(
            simulation_id=self.simulation_id,
            line_index=self.line_counter,
            **line_payload,
        )
        # Finalized students are persisted as soon as they leave active memory.
        self.flush_student_records()
        self.line_counter += 1
        if self.flush_every and self.line_counter % self.flush_every == 0:
            self.repo.flush()

    def flush_student_records(self, include_active: bool = False) -> None:
        """Persist destroyed students; optionally close out active ones at the end."""
        records = list(self.state.finalized_student_records)
        self.state.finalized_student_records.clear()
        if include_active:
            records.extend(student.record() for student in self.state.students_by_id.values())

        for record in records:
            student_id = record["student_id"]
            if student_id in self.persisted_student_ids:
                continue
            self.repo.add_student(
                simulation_id=self.simulation_id,
                **record,
            )
            self.persisted_student_ids.add(student_id)
```

- [ ] **Step 2: Update the bridge in main.py**

In `backend/main.py`, add this import near the other `backend.*` imports (after line 16):

```python
from backend.repositories.simulation_repository import SimulationRepository
```

Then change the logger construction (currently `logger = DatabaseLoggerHandler(sim.state, db, sim_model.id)`) to wrap the session in a repository:

```python
        sim = Simulation(sim_params)
        logger = DatabaseLoggerHandler(sim.state, SimulationRepository(db), sim_model.id)
        sim.observers = [logger]
```

(The repository shares the same `db` session, so its writes land in the same transaction that `db.commit()` finalizes.)

- [ ] **Step 3: Run the full suite**

Run: `python -m pytest tests/ -v`
Expected: all PASS — characterization green proves the logger refactor preserved behavior.

- [ ] **Step 4: Commit**

```bash
git add backend/db_logger.py backend/main.py
git commit -m "refactor: db_logger writes through SimulationRepository"
```

---

## Task 5: Service layer

**Files:**
- Create: `backend/services/simulation_service.py`
- Create: `tests/test_service.py`

- [ ] **Step 1: Write the failing service tests**

Create `tests/test_service.py`:

```python
import random

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database import Base
from backend.errors import SimulationNotFound
from backend.repositories.simulation_repository import SimulationRepository
from backend.schemas import SimulationParamsCreate
from backend.services.simulation_service import SimulationService


@pytest.fixture()
def service(tmp_path):
    engine = create_engine(
        f"sqlite:///{tmp_path / 'svc.db'}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    db = sessionmaker(bind=engine)()
    try:
        yield SimulationService(SimulationRepository(db))
    finally:
        db.close()


def _small_params():
    return SimulationParamsCreate(
        num_pcs=2, min_enrollment=1.0, max_enrollment=1.0, mean_arrival_time=5.0,
        min_service_time=1.0, max_service_time=1.0, min_maintenance_time=1.0,
        max_maintenance_time=1.0, mean_technician_return_time=30.0,
        technician_return_time_variation=0.0, student_wait_threshold=5,
        student_return_time=2.0, initial_maintenance_at_start=True, sim_hours=0.2,
    )


def test_run_simulation_persists_and_returns_model(service):
    random.seed(7)
    sim = service.run_simulation(_small_params())
    assert sim.id is not None
    assert sim.num_pcs == 2
    assert sim.total_students_arrived >= 0
    assert sim.pc_utilization is not None


def test_run_then_get_and_pc_stats(service):
    random.seed(7)
    sim = service.run_simulation(_small_params())
    assert service.get_simulation(sim.id).id == sim.id
    stats = service.get_pc_stats(sim.id)
    assert isinstance(stats, list) and len(stats) == 2


def test_get_missing_raises(service):
    with pytest.raises(SimulationNotFound):
        service.get_simulation(99999)


def test_get_lines_missing_raises(service):
    with pytest.raises(SimulationNotFound):
        service.get_lines(99999, 1, 50)


def test_delete_missing_raises(service):
    with pytest.raises(SimulationNotFound):
        service.delete_simulation(99999)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `python -m pytest tests/test_service.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'backend.services.simulation_service'`.

- [ ] **Step 3: Implement the service**

Create `backend/services/simulation_service.py`. The stat formulas are ported **verbatim** from `main.py` — note `min_service_time`/`max_service_time` for the engine are deliberately derived from `min_enrollment`/`max_enrollment` (not from the `*_service_time` inputs), and `pct_students_returned` divides by `total_students_arrived`:

```python
import json

from backend.db_logger import DatabaseLoggerHandler
from backend.errors import SimulationExecutionError, SimulationNotFound
from backend.models import SimulationModel
from backend.repositories.simulation_repository import SimulationRepository
from backend.schemas import (
    SimulationLineResponse,
    SimulationParamsCreate,
    SimulationStudentResponse,
)
from backend.services import xlsx_export

from simulation.params import SimulationParams
from simulation.simulation import Simulation


class SimulationService:
    """All backend business logic. No HTTP, no SQLAlchemy session access."""

    def __init__(self, repo: SimulationRepository) -> None:
        self.repo = repo

    def run_simulation(self, params_in: SimulationParamsCreate) -> SimulationModel:
        try:
            sim_params = SimulationParams(
                num_pcs=params_in.num_pcs,
                min_enrollment=params_in.min_enrollment * 60.0,
                max_enrollment=params_in.max_enrollment * 60.0,
                mean_arrival_time=params_in.mean_arrival_time * 60.0,
                min_service_time=params_in.min_enrollment * 60.0,
                max_service_time=params_in.max_enrollment * 60.0,
                min_maintenance_time=params_in.min_maintenance_time * 60.0,
                max_maintenance_time=params_in.max_maintenance_time * 60.0,
                mean_technician_return_time=params_in.mean_technician_return_time * 60.0,
                technician_return_time_variation=params_in.technician_return_time_variation * 60.0,
                student_wait_threshold=params_in.student_wait_threshold,
                student_return_time=params_in.student_return_time * 60.0,
                initial_maintenance_at_start=params_in.initial_maintenance_at_start,
            )
            max_simulation_time = params_in.sim_hours * 3600

            sim_model = SimulationModel(
                num_pcs=params_in.num_pcs,
                min_enrollment=params_in.min_enrollment,
                max_enrollment=params_in.max_enrollment,
                mean_arrival_time=params_in.mean_arrival_time,
                min_service_time=params_in.min_service_time,
                max_service_time=params_in.max_service_time,
                min_maintenance_time=params_in.min_maintenance_time,
                max_maintenance_time=params_in.max_maintenance_time,
                mean_technician_return_time=params_in.mean_technician_return_time,
                technician_return_time_variation=params_in.technician_return_time_variation,
                student_wait_threshold=params_in.student_wait_threshold,
                student_return_time=params_in.student_return_time,
                initial_maintenance_at_start=params_in.initial_maintenance_at_start,
                sim_days=params_in.sim_hours / 24.0,
            )
            self.repo.create(sim_model)  # add + flush -> assigns id

            sim = Simulation(sim_params)
            logger = DatabaseLoggerHandler(sim.state, self.repo, sim_model.id)
            sim.observers = [logger]
            final_state = sim.run(max_simulation_time)
            # Cutting at the horizon can leave active students; persist them as partial final state.
            logger.flush_student_records(include_active=True)

            stats = final_state.stats

            pct_students_returned = 0.0
            if stats.total_students_arrived > 0:
                pct_students_returned = (stats.total_students_returned / stats.total_students_arrived) * 100

            avg_waiting_time = 0.0
            if stats.students_queued_and_waited > 0:
                avg_waiting_time = stats.total_waiting_time / stats.students_queued_and_waited

            avg_technician_idle_time = 0.0
            if stats.total_technician_visits > 0:
                avg_technician_idle_time = stats.total_technician_idle_time / stats.total_technician_visits

            pc_util_list = []
            for pc in final_state.servers:
                idle_time = max(0.0, max_simulation_time - pc.busy_time - pc.maintenance_time)
                pc_util_list.append({
                    "id": pc.id,
                    "busy_time": pc.busy_time,
                    "maintenance_time": pc.maintenance_time,
                    "idle_time": idle_time,
                })

            sim_model.total_students_arrived = stats.total_students_arrived
            sim_model.total_new_students_arrived = stats.total_new_students_arrived
            sim_model.total_students_returned = stats.total_students_returned
            sim_model.registrations_completed = stats.registrations_completed
            sim_model.total_technician_visits = stats.total_technician_visits
            sim_model.pct_students_returned = pct_students_returned
            sim_model.avg_waiting_time = avg_waiting_time
            sim_model.avg_technician_idle_time = avg_technician_idle_time
            sim_model.pc_utilization = json.dumps(pc_util_list)

            self.repo.commit()
            self.repo.refresh(sim_model)
            return sim_model
        except Exception as e:
            self.repo.rollback()
            raise SimulationExecutionError(str(e))

    def get_simulation(self, simulation_id: int) -> SimulationModel:
        sim = self.repo.get(simulation_id)
        if not sim:
            raise SimulationNotFound()
        return sim

    def list_simulations(self):
        return self.repo.list()

    def get_lines(self, simulation_id: int, page: int, limit: int) -> dict:
        self.get_simulation(simulation_id)  # raises SimulationNotFound if absent
        total = self.repo.count_lines(simulation_id)
        offset = (page - 1) * limit
        items = self.repo.get_lines_page(simulation_id, offset, limit)
        return {
            "total": total,
            "page": page,
            "limit": limit,
            "items": [SimulationLineResponse.model_validate(item) for item in items],
        }

    def get_students(self, simulation_id: int, page: int, limit: int) -> dict:
        self.get_simulation(simulation_id)
        total = self.repo.count_students(simulation_id)
        offset = (page - 1) * limit
        items = self.repo.get_students_page(simulation_id, offset, limit)
        return {
            "total": total,
            "page": page,
            "limit": limit,
            "items": [SimulationStudentResponse.model_validate(item) for item in items],
        }

    def get_pc_stats(self, simulation_id: int) -> list:
        sim = self.get_simulation(simulation_id)
        if sim.pc_utilization:
            return json.loads(sim.pc_utilization)
        return []

    def export_xlsx(self, simulation_id: int):
        sim = self.get_simulation(simulation_id)
        buf = xlsx_export.build_workbook(
            sim,
            self.repo.iter_lines(simulation_id),
            self.repo.iter_students(simulation_id),
        )
        filename = f"simulacion_{sim.id}.xlsx"
        return buf, filename

    def delete_simulation(self, simulation_id: int) -> None:
        sim = self.get_simulation(simulation_id)
        self.repo.delete(sim)
        self.repo.commit()
```

- [ ] **Step 4: Run the service tests + full suite**

Run: `python -m pytest tests/ -v`
Expected: all PASS. (`main.py` still uses its inline logic; characterization stays green.)

- [ ] **Step 5: Commit**

```bash
git add backend/services/simulation_service.py tests/test_service.py
git commit -m "feat: add SimulationService business-logic layer"
```

---

## Task 6: Controllers + dependency wiring + slim main.py (cutover)

Replace the inline endpoints in `main.py` with a thin `APIRouter`, wire the service via `Depends`, and translate domain exceptions to HTTP centrally.

**Files:**
- Create: `backend/dependencies.py`
- Create: `backend/controllers/simulations.py`
- Modify: `backend/main.py` (full rewrite — bootstrap only)

- [ ] **Step 1: Write the dependency wiring**

Create `backend/dependencies.py`:

```python
from fastapi import Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.repositories.simulation_repository import SimulationRepository
from backend.services.simulation_service import SimulationService


def get_repository(db: Session = Depends(get_db)) -> SimulationRepository:
    return SimulationRepository(db)


def get_service(
    repo: SimulationRepository = Depends(get_repository),
) -> SimulationService:
    return SimulationService(repo)
```

- [ ] **Step 2: Write the controller (thin HTTP handlers)**

Create `backend/controllers/simulations.py`. Use `""` (not `"/"`) for the collection paths so the URLs stay `/api/simulations` with no trailing slash:

```python
from typing import List

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from backend.dependencies import get_service
from backend.schemas import SimulationParamsCreate, SimulationResponse
from backend.services.simulation_service import SimulationService

router = APIRouter(prefix="/api/simulations", tags=["simulations"])


@router.post("", response_model=SimulationResponse)
def run_simulation(
    params_in: SimulationParamsCreate,
    service: SimulationService = Depends(get_service),
):
    return service.run_simulation(params_in)


@router.get("", response_model=List[SimulationResponse])
def list_simulations(service: SimulationService = Depends(get_service)):
    return service.list_simulations()


@router.get("/{simulation_id}", response_model=SimulationResponse)
def get_simulation(
    simulation_id: int, service: SimulationService = Depends(get_service)
):
    return service.get_simulation(simulation_id)


@router.get("/{simulation_id}/lines")
def get_simulation_lines(
    simulation_id: int,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=1000, description="Items per page"),
    service: SimulationService = Depends(get_service),
):
    return service.get_lines(simulation_id, page, limit)


@router.get("/{simulation_id}/students")
def get_simulation_students(
    simulation_id: int,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=1000, description="Items per page"),
    service: SimulationService = Depends(get_service),
):
    return service.get_students(simulation_id, page, limit)


@router.get("/{simulation_id}/pc_stats")
def get_pc_utilization(
    simulation_id: int, service: SimulationService = Depends(get_service)
):
    return service.get_pc_stats(simulation_id)


@router.get("/{simulation_id}/export")
def export_simulation_xlsx(
    simulation_id: int, service: SimulationService = Depends(get_service)
):
    buf, filename = service.export_xlsx(simulation_id)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.delete("/{simulation_id}")
def delete_simulation(
    simulation_id: int, service: SimulationService = Depends(get_service)
):
    service.delete_simulation(simulation_id)
    return {"message": f"Simulation {simulation_id} deleted successfully"}
```

- [ ] **Step 3: Rewrite main.py as bootstrap only**

Replace the entire contents of `backend/main.py` with:

```python
import sys
import os

# Ensure the root directory is on the path so we can import 'simulation' and 'utils'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.database import engine, Base
from backend.errors import SimulationNotFound, SimulationExecutionError
from backend.controllers import simulations

# Create the database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="UTN Enrollment Simulation API",
    description="Backend API for discrete event simulation of the UTN exam enrollment process.",
    version="1.0.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development we can allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(SimulationNotFound)
async def simulation_not_found_handler(request: Request, exc: SimulationNotFound):
    return JSONResponse(status_code=404, content={"detail": "Simulation not found"})


@app.exception_handler(SimulationExecutionError)
async def simulation_execution_error_handler(request: Request, exc: SimulationExecutionError):
    return JSONResponse(
        status_code=500, content={"detail": f"Simulation error: {str(exc)}"}
    )


app.include_router(simulations.router)
```

- [ ] **Step 4: Run the FULL suite — the real proof**

Run: `python -m pytest tests/ -v`
Expected: ALL tests PASS, including every characterization test. Identical paths, payloads, and status codes through the new layered stack.

- [ ] **Step 5: Sanity-check the app boots and serves docs**

Run: `python -c "from backend.main import app; print([r.path for r in app.routes if getattr(r, 'path', '').startswith('/api')])"`
Expected: prints the 8 `/api/simulations...` routes.

- [ ] **Step 6: Commit**

```bash
git add backend/dependencies.py backend/controllers/simulations.py backend/main.py
git commit -m "refactor: thin controllers + central error handlers; main.py is bootstrap only"
```

---

## Final Verification

- [ ] **Run the entire test suite from the repo root**

Run: `python -m pytest tests/ -v`
Expected: every test passes (characterization, repository, xlsx, service, plus the pre-existing `tests/test_simulation_refactor.py`).

- [ ] **Confirm layer boundaries hold (no leaks)**

Run: `python -m pytest -q && echo "--- boundary grep ---"` then verify by inspection:
- `backend/controllers/simulations.py` contains no `db.query`, no `Session`, no `import json` business logic.
- `backend/services/simulation_service.py` contains no `fastapi` import and no `db.query`.
- `backend/repositories/simulation_repository.py` is the only file (besides `database.py`/`db_logger.py` wiring) that references `self.db.query`.

Run: `git grep -n "db.query" backend/`
Expected: matches only in `backend/repositories/simulation_repository.py`.

Run: `git grep -n "from fastapi" backend/services backend/repositories`
Expected: no matches (service and repository layers are HTTP-free).
```

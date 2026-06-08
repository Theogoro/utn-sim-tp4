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
    # Endpoint orders by created_at desc; assert that contract directly (robust to id/timestamp ties).
    created = [row["created_at"] for row in data]
    assert created == sorted(created, reverse=True)


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

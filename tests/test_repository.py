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

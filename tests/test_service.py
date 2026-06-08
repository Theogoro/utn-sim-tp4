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

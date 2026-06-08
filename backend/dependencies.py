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

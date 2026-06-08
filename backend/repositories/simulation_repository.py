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

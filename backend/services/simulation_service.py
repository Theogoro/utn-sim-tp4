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

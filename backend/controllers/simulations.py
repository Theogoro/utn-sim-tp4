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

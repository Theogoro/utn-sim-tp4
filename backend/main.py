import sys
import os

# Ensure the root directory is on the path so we can import 'simulation' and 'utils'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from backend.database import engine, Base, get_db
from backend.models import SimulationModel, SimulationLineModel
from backend.schemas import SimulationParamsCreate, SimulationResponse, SimulationLineResponse
from backend.db_logger import DatabaseLoggerHandler

from simulation.params import SimulationParams
from simulation.simulation import Simulation

# Create the database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="UTN Enrollment Simulation API",
    description="Backend API for discrete event simulation of the UTN exam enrollment process.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development we can allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/simulations", response_model=SimulationResponse)
def run_simulation(params_in: SimulationParamsCreate, db: Session = Depends(get_db)):
    """
    Executes a discrete event simulation with the provided parameters,
    computes key enrollment metrics, stores the simulation metadata,
    and bulk-inserts all step-by-step trace lines into the database.
    """
    import json
    try:
        # 1. Configure the simulation parameters object
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
            student_return_time=params_in.student_return_time * 60.0
        )
        
        # 2. Run simulation with the DB logger handler to collect state vector rows
        sim = Simulation(sim_params, handlers=[DatabaseLoggerHandler])
        max_simulation_time = params_in.sim_hours * 3600
        final_state = sim.run(max_simulation_time)
        
        # 3. Calculate final enrollment statistics
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

        # Calculate individual PC busy/maint/idle times
        pc_util_list = []
        for pc in final_state.servers:
            total_time = params_in.sim_hours * 3600
            idle_time = max(0.0, total_time - pc.busy_time - pc.maintenance_time)
            pc_util_list.append({
                "id": pc.id,
                "busy_time": pc.busy_time,
                "maintenance_time": pc.maintenance_time,
                "idle_time": idle_time
            })
        pc_utilization_str = json.dumps(pc_util_list)

        # 4. Save simulation run summary
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
            sim_days=params_in.sim_hours / 24.0,
            
            total_students_arrived=stats.total_students_arrived,
            total_new_students_arrived=stats.total_new_students_arrived,
            total_students_returned=stats.total_students_returned,
            registrations_completed=stats.registrations_completed,
            total_technician_visits=stats.total_technician_visits,
            
            pct_students_returned=pct_students_returned,
            avg_waiting_time=avg_waiting_time,
            avg_technician_idle_time=avg_technician_idle_time,
            pc_utilization=pc_utilization_str
        )
        
        db.add(sim_model)
        db.commit()
        db.refresh(sim_model)
        
        # 5. Extract gathered state vector lines and bulk-save
        db_handler = sim.handlers[0]
        lines_to_save = []
        for line in db_handler.lines:
            lines_to_save.append(
                SimulationLineModel(
                    simulation_id=sim_model.id,
                    **line
                )
            )
            
        # Bulk save for extreme performance
        db.bulk_save_objects(lines_to_save)
        db.commit()
        
        return sim_model
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")


@app.get("/api/simulations", response_model=List[SimulationResponse])
def list_simulations(db: Session = Depends(get_db)):
    """
    Returns a list of all simulation summaries, ordered by creation date descending.
    Excludes the detailed vector lines to keep payload size lightweight.
    """
    return db.query(SimulationModel).order_by(SimulationModel.created_at.desc()).all()


@app.get("/api/simulations/{simulation_id}", response_model=SimulationResponse)
def get_simulation(simulation_id: int, db: Session = Depends(get_db)):
    """
    Returns details of a specific simulation by ID.
    """
    sim = db.query(SimulationModel).filter(SimulationModel.id == simulation_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return sim


@app.get("/api/simulations/{simulation_id}/lines")
def get_simulation_lines(
    simulation_id: int, 
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=1000, description="Items per page"),
    db: Session = Depends(get_db)
):
    """
    Returns a paginated list of state vector lines for a given simulation.
    Crucial for front-end rendering performance when running long simulations.
    """
    # Check if simulation exists first
    sim = db.query(SimulationModel).filter(SimulationModel.id == simulation_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
        
    total_count = db.query(SimulationLineModel).filter(SimulationLineModel.simulation_id == simulation_id).count()
    
    offset = (page - 1) * limit
    items = db.query(SimulationLineModel)\
              .filter(SimulationLineModel.simulation_id == simulation_id)\
              .order_by(SimulationLineModel.line_index.asc())\
              .offset(offset)\
              .limit(limit)\
              .all()
              
    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "items": [SimulationLineResponse.from_orm(item) for item in items]
    }


@app.get("/api/simulations/{simulation_id}/pc_stats")
def get_pc_utilization(simulation_id: int, db: Session = Depends(get_db)):
    """
    Computes and returns the state distribution (Idle, Busy, Maintenance)
    for each PC to render utilization charts.
    """
    import json
    sim = db.query(SimulationModel).filter(SimulationModel.id == simulation_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
        
    if sim.pc_utilization:
        return json.loads(sim.pc_utilization)
    return []


@app.delete("/api/simulations/{simulation_id}")
def delete_simulation(simulation_id: int, db: Session = Depends(get_db)):
    """
    Deletes a simulation run and all of its associated lines.
    """
    sim = db.query(SimulationModel).filter(SimulationModel.id == simulation_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
        
    db.delete(sim)
    db.commit()
    return {"message": f"Simulation {simulation_id} deleted successfully"}

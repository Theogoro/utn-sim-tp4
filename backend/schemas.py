from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class SimulationParamsCreate(BaseModel):
    num_pcs: int = Field(default=6, ge=1, description="Number of enrollment PCs")
    min_enrollment: float = Field(default=5.0, ge=0.1, description="Minimum enrollment service time (minutes)")
    max_enrollment: float = Field(default=8.0, ge=0.1, description="Maximum enrollment service time (minutes)")
    mean_arrival_time: float = Field(default=2.0, ge=0.01, description="Mean student arrival time (minutes)")
    min_service_time: float = Field(default=5.0, ge=0.1, description="Minimum service time (minutes, compatibility parameter)")
    max_service_time: float = Field(default=8.0, ge=0.1, description="Maximum service time (minutes, compatibility parameter)")
    min_maintenance_time: float = Field(default=3.0, ge=0.1, description="Minimum maintenance time per PC (minutes)")
    max_maintenance_time: float = Field(default=10.0, ge=0.1, description="Maximum maintenance time per PC (minutes)")
    mean_technician_return_time: float = Field(default=60.0, ge=1.0, description="Mean frequency of technician return (minutes)")
    technician_return_time_variation: float = Field(default=3.0, ge=0.0, description="Technician return time variation +/- (minutes)")
    student_wait_threshold: int = Field(default=5, ge=0, description="Max students waiting in queue before turning back")
    student_return_time: float = Field(default=30.0, ge=0.1, description="Return time for turned-back students (minutes)")
    sim_hours: float = Field(default=24.0, ge=0.1, le=720.0, description="Duration of simulation in hours")


class SimulationLineResponse(BaseModel):
    id: int
    simulation_id: int
    line_index: int
    clock: float
    clock_formatted: str
    event_name: str
    queue_length: int
    pc_states: str
    
    student_rnd: Optional[float] = None
    student_arrival_time: Optional[float] = None
    student_next_arrival_time: Optional[float] = None
    
    registration_rnd: Optional[float] = None
    registration_time: Optional[float] = None
    
    maintenance_rnd: Optional[float] = None
    maintenance_time: Optional[float] = None
    
    technician_return_rnd: Optional[float] = None
    technician_return_time: Optional[float] = None
    
    registrations_completed: int
    total_students_returned: int

    class Config:
        from_attributes = True


class SimulationResponse(BaseModel):
    id: int
    created_at: datetime
    
    # Parameters
    num_pcs: int
    min_enrollment: float
    max_enrollment: float
    mean_arrival_time: float
    min_service_time: float
    max_service_time: float
    min_maintenance_time: float
    max_maintenance_time: float
    mean_technician_return_time: float
    technician_return_time_variation: float
    student_wait_threshold: int
    student_return_time: float
    sim_days: float
    sim_hours: Optional[float] = None

    # Output stats
    total_students_arrived: int
    total_new_students_arrived: int
    total_students_returned: int
    registrations_completed: int
    total_technician_visits: int
    
    # Metrics
    pct_students_returned: float
    avg_waiting_time: float
    avg_technician_idle_time: float
    pc_utilization: Optional[str] = None

    class Config:
        from_attributes = True

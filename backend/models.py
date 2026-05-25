import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database import Base

class SimulationModel(Base):
    __tablename__ = "simulations"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Input Parameters
    num_pcs = Column(Integer, nullable=False)
    min_enrollment = Column(Float, nullable=False)
    max_enrollment = Column(Float, nullable=False)
    mean_arrival_time = Column(Float, nullable=False)
    min_service_time = Column(Float, nullable=False)
    max_service_time = Column(Float, nullable=False)
    min_maintenance_time = Column(Float, nullable=False)
    max_maintenance_time = Column(Float, nullable=False)
    mean_technician_return_time = Column(Float, nullable=False)
    technician_return_time_variation = Column(Float, nullable=False)
    student_wait_threshold = Column(Integer, nullable=False)
    student_return_time = Column(Float, nullable=False)
    sim_days = Column(Float, nullable=False)

    # General Output Stats
    total_students_arrived = Column(Integer, default=0)
    total_new_students_arrived = Column(Integer, default=0)
    total_students_returned = Column(Integer, default=0)
    registrations_completed = Column(Integer, default=0)
    total_technician_visits = Column(Integer, default=0)
    
    # Calculated Metrics
    pct_students_returned = Column(Float, default=0.0)
    avg_waiting_time = Column(Float, default=0.0)
    avg_technician_idle_time = Column(Float, default=0.0)
    pc_utilization = Column(Text, nullable=True)

    # Relationship to Lines
    lines = relationship("SimulationLineModel", back_populates="simulation", cascade="all, delete-orphan")

    @property
    def sim_hours(self) -> float:
        return self.sim_days * 24.0




class SimulationLineModel(Base):
    __tablename__ = "simulation_lines"

    id = Column(Integer, primary_key=True, index=True)
    simulation_id = Column(Integer, ForeignKey("simulations.id", ondelete="CASCADE"), nullable=False)
    
    line_index = Column(Integer, nullable=False)
    clock = Column(Float, nullable=False)
    clock_formatted = Column(String(50), nullable=False)
    event_name = Column(String(100), nullable=False)
    queue_length = Column(Integer, nullable=False)
    
    # Server states joined by commas (e.g., "idle,busy,busy,maintenance,idle,idle")
    pc_states = Column(Text, nullable=False)

    # RNDs and times
    student_rnd = Column(Float, nullable=True)
    student_arrival_time = Column(Float, nullable=True)
    student_next_arrival_time = Column(Float, nullable=True)
    
    registration_rnd = Column(Float, nullable=True)
    registration_time = Column(Float, nullable=True)
    
    maintenance_rnd = Column(Float, nullable=True)
    maintenance_time = Column(Float, nullable=True)
    
    technician_return_rnd = Column(Float, nullable=True)
    technician_return_time = Column(Float, nullable=True)

    # Accumulators on the current row
    registrations_completed = Column(Integer, default=0)
    total_students_returned = Column(Integer, default=0)

    # Back relation
    simulation = relationship("SimulationModel", back_populates="lines")

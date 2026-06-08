import sys
import os

# Ensure the root directory is on the path so we can import 'simulation' and 'utils'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.database import engine, Base
from backend.errors import SimulationNotFound, SimulationExecutionError
from backend.controllers import simulations

# Create the database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="UTN Enrollment Simulation API",
    description="Backend API for discrete event simulation of the UTN exam enrollment process.",
    version="1.0.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development we can allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(SimulationNotFound)
async def simulation_not_found_handler(request: Request, exc: SimulationNotFound):
    return JSONResponse(status_code=404, content={"detail": "Simulation not found"})


@app.exception_handler(SimulationExecutionError)
async def simulation_execution_error_handler(request: Request, exc: SimulationExecutionError):
    return JSONResponse(
        status_code=500, content={"detail": f"Simulation error: {str(exc)}"}
    )


app.include_router(simulations.router)

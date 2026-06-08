class SimulationNotFound(Exception):
    """Raised by the service when a simulation id does not exist."""


class SimulationExecutionError(Exception):
    """Raised by the service when running a simulation fails."""

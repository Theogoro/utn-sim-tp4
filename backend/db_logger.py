from simulation.handlers.loggers import build_row
from backend.models import SimulationLineModel


class DatabaseLoggerHandler:
    """Stream cada fila al session de DB. Sin acumular en memoria.

    El llamador hace commit/rollback al final. Cada `flush_every` eventos
    se hace flush para liberar instancias ORM acumuladas en la session.
    """

    def __init__(self, state, db, simulation_id: int, flush_every: int = 500):
        self.state = state
        self.db = db
        self.simulation_id = simulation_id
        self.flush_every = flush_every
        self.line_counter = 0

    def trigger(self, event=None) -> None:
        self.db.add(SimulationLineModel(
            simulation_id=self.simulation_id,
            line_index=self.line_counter,
            **build_row(self.state),
        ))
        self.line_counter += 1
        if self.flush_every and self.line_counter % self.flush_every == 0:
            self.db.flush()

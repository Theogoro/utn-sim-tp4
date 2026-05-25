from abc import ABC, abstractmethod


class SimulationHandler(ABC):
    
    @abstractmethod
    def __init__(self, state):
        pass
    
    def trigger(self):
        pass
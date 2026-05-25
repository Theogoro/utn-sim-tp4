from simulation.handlers.handler_interface import SimulationHandler
from simulation.handlers.loggers import format_time

class DatabaseLoggerHandler(SimulationHandler):
    def __init__(self, state):
        self.state = state
        self.lines = []
        self.line_counter = 0

    def trigger(self) -> None:
        state = self.state
        
        # Gather PC states
        pc_states_list = [pc.state for pc in state.servers]
        pc_states_str = ",".join(pc_states_list)
        
        # Prepare line data matching database schema
        line_data = {
            "line_index": self.line_counter,
            "clock": state.current_time,
            "clock_formatted": format_time(state.current_time),
            "event_name": state.event,
            "queue_length": len(state.queue),
            "pc_states": pc_states_str,
            "student_rnd": state.student_rnd,
            "student_arrival_time": state.student_arrival_time,
            "student_next_arrival_time": state.student_next_arrival_time,
            "registration_rnd": state.registration_rnd,
            "registration_time": state.registration_time,
            "maintenance_rnd": state.maintenance_rnd,
            "maintenance_time": state.maintenance_time,
            "technician_return_rnd": state.technician_return_rnd,
            "technician_return_time": state.technician_return_time,
            "registrations_completed": state.stats.registrations_completed,
            "total_students_returned": state.stats.total_students_returned,
        }
        
        self.lines.append(line_data)
        self.line_counter += 1

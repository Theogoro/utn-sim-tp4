import random
import unittest

from simulation.params import SimulationParams
from simulation.simulation import Simulation
from simulation.handlers.loggers import build_row


def make_params(**overrides):
    values = {
        "num_pcs": 1,
        "min_enrollment": 1.0,
        "max_enrollment": 1.0,
        "mean_arrival_time": 100.0,
        "min_service_time": 1.0,
        "max_service_time": 1.0,
        "min_maintenance_time": 1.0,
        "max_maintenance_time": 1.0,
        "mean_technician_return_time": 10.0,
        "technician_return_time_variation": 0.0,
        "student_wait_threshold": 0,
        "student_return_time": 2.0,
        "initial_maintenance_at_start": True,
    }
    values.update(overrides)
    return SimulationParams(**values)


class SimulationRefactorTests(unittest.TestCase):
    def setUp(self):
        random.seed(7)

    def test_initial_maintenance_at_start_creates_public_event_and_pc_state(self):
        sim = Simulation(make_params(num_pcs=2))
        sim.run(0.5)

        self.assertEqual("inicio_mantenimiento", sim.state.event)
        self.assertEqual("M", sim.state.pcs[0].state)
        self.assertEqual("L", sim.state.pcs[1].state)
        self.assertEqual("DM 1", sim.state.encargado.state)
        self.assertEqual([2], sim.state.encargado.pcs_pendientes_mantenimiento)

    def test_students_are_removed_from_memory_after_completed_registration(self):
        sim = Simulation(make_params(student_wait_threshold=5, mean_arrival_time=0.2))
        sim.run(4.0)

        completed = [
            student
            for student in sim.state.student_history.values()
            if student.completed_registration_at is not None
        ]
        self.assertGreaterEqual(len(completed), 1)
        for student in completed:
            self.assertNotIn(student.id, sim.state.students_by_id)

    def test_returning_student_keeps_history_but_not_unbounded_active_memory(self):
        sim = Simulation(make_params(student_wait_threshold=0, mean_arrival_time=0.2, student_return_time=0.3))
        sim.run(3.0)

        returned_students = [
            student for student in sim.state.student_history.values()
            if student.times_returned_later > 0
        ]
        self.assertGreaterEqual(len(returned_students), 1)
        self.assertLessEqual(len(sim.state.students_by_id), len(sim.state.queue_student_ids) + sim.state.params.num_pcs + len(sim.state.student_return_events))

    def test_state_vector_row_contains_dynamic_snapshots(self):
        sim = Simulation(make_params(num_pcs=2))
        sim.run(0.5)

        row = build_row(sim.state)

        self.assertEqual([{"id": 1, "state": "M"}, {"id": 2, "state": "L"}], row["pc_snapshot"])
        self.assertEqual("DM 1", row["encargado_snapshot"]["state"])
        self.assertEqual([2], row["encargado_snapshot"]["pcs_pendientes_mantenimiento"])
        self.assertIsInstance(row["active_students_snapshot"], list)
        self.assertIsInstance(row["queue_student_ids"], list)


if __name__ == "__main__":
    unittest.main()

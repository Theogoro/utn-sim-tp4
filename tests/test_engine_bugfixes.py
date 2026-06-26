import random
import unittest

from simulation.params import SimulationParams
from simulation.simulation import Simulation
from simulation.state import (
    ENCARGADO_ESPERANDO_MANTENIMIENTO,
    ENCARGADO_ESPERANDO_PC,
    EVENT_FIN_INSCRIPCION,
    PC_INSCRIPCION,
    PC_MANTENIMIENTO,
    Event,
)
from simulation.handlers.event_handlers import (
    admit_or_defer_student,
    enqueue_student,
    start_enrollment,
)


def make_params(**overrides):
    values = {
        "num_pcs": 2,
        "min_enrollment": 1.0,
        "max_enrollment": 1.0,
        "mean_arrival_time": 100.0,
        "min_service_time": 1.0,
        "max_service_time": 1.0,
        "min_maintenance_time": 1.0,
        "max_maintenance_time": 1.0,
        "mean_technician_return_time": 10.0,
        "technician_return_time_variation": 0.0,
        "student_wait_threshold": 5,
        "student_return_time": 2.0,
        "initial_maintenance_at_start": True,
    }
    values.update(overrides)
    return SimulationParams(**values)


class FreedPcServesQueueTests(unittest.TestCase):
    """Bug #1: técnico EPC must not starve the queue on a PC it cannot take."""

    def setUp(self):
        random.seed(7)

    def test_freed_non_pending_pc_serves_queue_while_technician_waits(self):
        sim = Simulation(make_params(num_pcs=2))
        state = sim.state
        state.current_time = 100.0

        # PC0 (id1): already maintained this visit (NOT pending), busy -> finishing now.
        s0 = state.create_student()
        start_enrollment(state, 0, s0.id)
        # PC1 (id2): busy with a student and still pending maintenance.
        s1 = state.create_student()
        start_enrollment(state, 1, s1.id)

        # Técnico waiting (EPC) for PC1, the only pending PC, which is still busy.
        state.encargado.state = ENCARGADO_ESPERANDO_PC
        state.encargado.pcs_pendientes_mantenimiento = [2]
        state.encargado.esperando_desde = 90.0

        # One student waiting in the queue.
        q = state.create_student()
        enqueue_student(state, q)

        sim._handle_registration_complete(
            Event(time=100.0, type=EVENT_FIN_INSCRIPCION, pc_index=0)
        )

        # PC0 cannot be taken by the técnico (not pending) -> queued student must use it.
        self.assertEqual(PC_INSCRIPCION, state.pcs[0].state)
        self.assertEqual(0, len(state.queue_student_ids))
        # Técnico keeps waiting for its pending PC1.
        self.assertEqual(ENCARGADO_ESPERANDO_PC, state.encargado.state)

    def test_freed_pending_pc_goes_to_technician_not_queue(self):
        # Regression guard: when the freed PC IS pending, técnico priority still wins.
        sim = Simulation(make_params(num_pcs=2))
        state = sim.state
        state.current_time = 100.0

        s0 = state.create_student()
        start_enrollment(state, 0, s0.id)
        s1 = state.create_student()
        start_enrollment(state, 1, s1.id)

        state.encargado.state = ENCARGADO_ESPERANDO_PC
        state.encargado.pcs_pendientes_mantenimiento = [1, 2]
        state.encargado.esperando_desde = 90.0

        q = state.create_student()
        enqueue_student(state, q)

        sim._handle_registration_complete(
            Event(time=100.0, type=EVENT_FIN_INSCRIPCION, pc_index=0)
        )

        self.assertEqual(PC_MANTENIMIENTO, state.pcs[0].state)
        self.assertEqual(1, len(state.queue_student_ids))


class FinalRejectionCountingTests(unittest.TestCase):
    """Bug #3: a permanent rejection is not a 'se va para regresar más tarde'."""

    def setUp(self):
        random.seed(7)

    def test_final_rejection_not_counted_as_return_later(self):
        sim = Simulation(make_params(num_pcs=1, student_wait_threshold=0))
        state = sim.state
        state.current_time = 0.0

        # Occupy the only PC so arrivals cannot start enrollment.
        busy = state.create_student()
        start_enrollment(state, 0, busy.id)

        # New student leaves to return later (queue "full" at threshold 0).
        student = state.create_student()
        admit_or_defer_student(state, student)
        self.assertEqual(1, state.stats.total_students_returned)
        self.assertEqual(1, student.times_returned_later)

        # Student returns, still full -> permanent rejection.
        state.current_time = 5.0
        admit_or_defer_student(state, student, schedule_return_when_full=False)

        self.assertEqual("RECHAZADO", student.final_state)
        self.assertNotIn(student.id, state.students_by_id)
        # The final rejection must NOT inflate the "return later" counters.
        self.assertEqual(1, state.stats.total_students_returned)
        self.assertEqual(1, student.times_returned_later)


class HorizonTechnicianIdleTests(unittest.TestCase):
    """Bug #4: idle of a visit still open at the horizon must reach the metric."""

    def setUp(self):
        random.seed(7)

    def test_partial_visit_idle_counted_at_horizon(self):
        sim = Simulation(
            make_params(
                num_pcs=2,
                mean_arrival_time=0.05,
                min_enrollment=100.0,
                max_enrollment=100.0,
                min_maintenance_time=1.0,
                max_maintenance_time=1.0,
            )
        )
        sim.run(2.0)

        # PC0 maintained at t=1; PC1 stays busy (100s enrollment) so técnico waits EPC
        # from t=1 to the t=2 horizon -> 1s of idle on a visit that never finishes.
        self.assertNotEqual(ENCARGADO_ESPERANDO_MANTENIMIENTO, sim.state.encargado.state)
        self.assertEqual(1, sim.state.stats.total_technician_visits)
        self.assertAlmostEqual(1.0, sim.state.stats.total_technician_idle_time, places=6)


if __name__ == "__main__":
    unittest.main()

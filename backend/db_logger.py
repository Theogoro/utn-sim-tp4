import json

from simulation.handlers.loggers import build_row


class DatabaseLoggerHandler:
    """Stream each row to the DB via the repository. No in-memory accumulation.

    The caller commits/rolls back at the end. Every `flush_every` events we flush
    to release accumulated ORM instances from the session.
    """

    def __init__(self, state, repo, simulation_id: int, flush_every: int = 500):
        self.state = state
        self.repo = repo
        self.simulation_id = simulation_id
        self.flush_every = flush_every
        self.line_counter = 0
        self.persisted_student_ids = set()

    def trigger(self, event=None) -> None:
        row = build_row(self.state)
        # The DB stores JSON snapshots so the vector does not depend on fixed columns.
        line_payload = {
            "clock": row["clock"],
            "clock_formatted": row["clock_formatted"],
            "event_name": row["event_name"],
            "queue_length": row["queue_length"],
            "pc_states": row["pc_states"],
            "pc_snapshot_json": json.dumps(row["pc_snapshot"]),
            "encargado_snapshot_json": json.dumps(row["encargado_snapshot"]),
            "active_students_snapshot_json": json.dumps(row["active_students_snapshot"]),
            "queue_student_ids_json": json.dumps(row["queue_student_ids"]),
            "student_rnd": row["student_rnd"],
            "student_arrival_time": row["student_arrival_time"],
            "student_next_arrival_time": row["student_next_arrival_time"],
            "registration_rnd": row["registration_rnd"],
            "registration_time": row["registration_time"],
            "maintenance_rnd": row["maintenance_rnd"],
            "maintenance_time": row["maintenance_time"],
            "technician_return_rnd": row["technician_return_rnd"],
            "technician_return_time": row["technician_return_time"],
            "next_maintenance_start_time": row["next_maintenance_start_time"],
            "next_maintenance_complete_time": row["next_maintenance_complete_time"],
            "registrations_completed": row["registrations_completed"],
            "total_students_returned": row["total_students_returned"],
        }
        self.repo.add_line(
            simulation_id=self.simulation_id,
            line_index=self.line_counter,
            **line_payload,
        )
        # Finalized students are persisted as soon as they leave active memory.
        self.flush_student_records()
        self.line_counter += 1
        if self.flush_every and self.line_counter % self.flush_every == 0:
            self.repo.flush()

    def flush_student_records(self, include_active: bool = False) -> None:
        """Persist destroyed students; optionally close out active ones at the end."""
        records = list(self.state.finalized_student_records)
        self.state.finalized_student_records.clear()
        if include_active:
            records.extend(student.record() for student in self.state.students_by_id.values())

        for record in records:
            student_id = record["student_id"]
            if student_id in self.persisted_student_ids:
                continue
            self.repo.add_student(
                simulation_id=self.simulation_id,
                **record,
            )
            self.persisted_student_ids.add(student_id)

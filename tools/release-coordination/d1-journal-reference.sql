-- Isolated test schema only. Not an active migration or production table.
CREATE TABLE release_journal_reference (
 project_id TEXT NOT NULL,
 sequence INTEGER NOT NULL CHECK(sequence > 0 AND sequence <= 500),
 previous_hash TEXT,
 event_hash TEXT NOT NULL,
 record_json TEXT NOT NULL,
 PRIMARY KEY(project_id, sequence),
 UNIQUE(project_id, event_hash)
);

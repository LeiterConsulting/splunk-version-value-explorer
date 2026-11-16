-- INACTIVE supplement to database-fence-reference.sql. No runtime migration.
-- Retains immutable decisions and transactional state history. Not authentication.
CREATE TABLE release_admission_decisions (
 operation_id TEXT PRIMARY KEY, channel TEXT NOT NULL, owner TEXT NOT NULL,
 epoch INTEGER NOT NULL, target_revision TEXT NOT NULL, target_digest TEXT NOT NULL,
 target_commit TEXT NOT NULL, expected_revision TEXT, expected_generation INTEGER NOT NULL,
 mode TEXT NOT NULL, UNIQUE(channel,epoch)
);
CREATE TABLE release_admission_states (
 sequence INTEGER PRIMARY KEY AUTOINCREMENT,
 operation_id TEXT NOT NULL REFERENCES release_admission_decisions(operation_id),
 state TEXT NOT NULL CHECK(state IN ('preparing','admitted','consumed')),
 stopped INTEGER NOT NULL CHECK(stopped IN (0,1))
);
-- Qualify/back up existing data before a real migration; this only snapshots it.
INSERT INTO release_admission_decisions SELECT operation_id,channel,owner,epoch,target_revision,target_digest,target_commit,expected_revision,expected_generation,mode FROM release_admission;
INSERT INTO release_admission_states(operation_id,state,stopped) SELECT operation_id,state,stopped FROM release_admission;
CREATE TRIGGER admission_decision_no_update BEFORE UPDATE ON release_admission_decisions BEGIN SELECT RAISE(ABORT,'immutable-admission-decision'); END;
CREATE TRIGGER admission_decision_no_delete BEFORE DELETE ON release_admission_decisions BEGIN SELECT RAISE(ABORT,'immutable-admission-decision'); END;
CREATE TRIGGER admission_decision_no_replace BEFORE INSERT ON release_admission_decisions WHEN EXISTS(SELECT 1 FROM release_admission_decisions WHERE operation_id=NEW.operation_id OR rowid=NEW.rowid OR (channel=NEW.channel AND epoch=NEW.epoch)) BEGIN SELECT RAISE(ABORT,'immutable-admission-decision'); END;
CREATE TRIGGER admission_state_no_update BEFORE UPDATE ON release_admission_states BEGIN SELECT RAISE(ABORT,'immutable-admission-state'); END;
CREATE TRIGGER admission_state_no_delete BEFORE DELETE ON release_admission_states BEGIN SELECT RAISE(ABORT,'immutable-admission-state'); END;
CREATE TRIGGER admission_state_no_replace BEFORE INSERT ON release_admission_states WHEN EXISTS(SELECT 1 FROM release_admission_states WHERE sequence=NEW.sequence) BEGIN SELECT RAISE(ABORT,'immutable-admission-state'); END;
CREATE TRIGGER admission_current_no_delete BEFORE DELETE ON release_admission BEGIN SELECT RAISE(ABORT,'admission-current-delete-forbidden'); END;
CREATE TRIGGER admission_current_no_replace BEFORE INSERT ON release_admission WHEN EXISTS(SELECT 1 FROM release_admission WHERE channel=NEW.channel OR operation_id=NEW.operation_id OR rowid=NEW.rowid) BEGIN SELECT RAISE(ABORT,'admission-current-replace-forbidden'); END;
CREATE TRIGGER admission_current_update_guard BEFORE UPDATE ON release_admission BEGIN
 SELECT CASE WHEN NEW.state='consumed' AND OLD.state!='consumed' AND NOT EXISTS(
 SELECT 1 FROM content_publication_events e JOIN content_publication p ON p.channel=e.channel
 WHERE e.operation_id=NEW.operation_id AND e.channel=NEW.channel AND e.to_revision=NEW.target_revision AND e.from_revision=COALESCE(NEW.expected_revision,NEW.target_revision)
 AND e.generation=NEW.expected_generation+1 AND e.provenance_commit=NEW.target_commit AND e.intent=CASE WHEN NEW.mode='bootstrap' THEN 'publish' ELSE NEW.mode END
 AND e.writer_operation=NEW.operation_id AND e.writer_owner=NEW.owner AND e.writer_epoch=NEW.epoch AND p.revision_id=NEW.target_revision
 AND (SELECT MAX(generation) FROM content_publication_events WHERE channel=NEW.channel)=e.generation
 ) THEN RAISE(ABORT,'consumption-event-required') END;
 SELECT CASE WHEN OLD.rowid!=NEW.rowid OR OLD.channel!=NEW.channel THEN RAISE(ABORT,'admission-pointer-identity') END;
 SELECT CASE WHEN OLD.operation_id=NEW.operation_id AND (
 OLD.owner!=NEW.owner OR OLD.epoch!=NEW.epoch OR OLD.target_revision!=NEW.target_revision OR OLD.target_digest!=NEW.target_digest OR OLD.target_commit!=NEW.target_commit OR OLD.expected_revision IS NOT NEW.expected_revision OR OLD.expected_generation!=NEW.expected_generation OR OLD.mode!=NEW.mode OR
 NEW.stopped<OLD.stopped OR (OLD.state='consumed' AND NEW.state!='consumed') OR (OLD.state='admitted' AND NEW.state='preparing') OR (OLD.state='preparing' AND NEW.state='consumed')
 ) THEN RAISE(ABORT,'immutable-admission-transition') END;
 SELECT CASE WHEN OLD.operation_id!=NEW.operation_id AND (
 (OLD.state!='consumed' OR OLD.stopped!=0) OR NEW.state!='preparing' OR NEW.stopped!=0 OR NEW.epoch<=OLD.epoch OR EXISTS(SELECT 1 FROM release_admission_decisions WHERE operation_id=NEW.operation_id OR (channel=NEW.channel AND epoch>=NEW.epoch))
 ) THEN RAISE(ABORT,'admission-successor-rejected') END;
END;
CREATE TRIGGER admission_initial_preparing BEFORE INSERT ON release_admission WHEN NEW.state!='preparing' OR NEW.stopped!=0 BEGIN SELECT RAISE(ABORT,'initial-preparing-required'); END;
CREATE TRIGGER admission_archive_insert AFTER INSERT ON release_admission BEGIN
 INSERT INTO release_admission_decisions VALUES(NEW.operation_id,NEW.channel,NEW.owner,NEW.epoch,NEW.target_revision,NEW.target_digest,NEW.target_commit,NEW.expected_revision,NEW.expected_generation,NEW.mode);
 INSERT INTO release_admission_states(operation_id,state,stopped) VALUES(NEW.operation_id,NEW.state,NEW.stopped);
END;
CREATE TRIGGER admission_archive_update AFTER UPDATE ON release_admission BEGIN
 INSERT INTO release_admission_decisions SELECT NEW.operation_id,NEW.channel,NEW.owner,NEW.epoch,NEW.target_revision,NEW.target_digest,NEW.target_commit,NEW.expected_revision,NEW.expected_generation,NEW.mode WHERE OLD.operation_id!=NEW.operation_id;
 INSERT INTO release_admission_states(operation_id,state,stopped) VALUES(NEW.operation_id,NEW.state,NEW.stopped);
END;

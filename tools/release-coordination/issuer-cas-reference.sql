-- INACTIVE supplement: install after fence, history, and seal references.
-- Privileged server storage primitive. Digests and rows are NOT authenticated authority.
CREATE TABLE release_issuer_stop_events (
 channel TEXT NOT NULL, revision INTEGER NOT NULL CHECK(typeof(revision)='integer' AND revision BETWEEN 0 AND 9007199254740991),
 stopped INTEGER NOT NULL CHECK(typeof(stopped)='integer' AND stopped IN (0,1)),
 reason_sha256 TEXT NOT NULL CHECK(typeof(reason_sha256)='text' AND length(reason_sha256)=64 AND reason_sha256 NOT GLOB '*[^0-9a-f]*' AND instr(reason_sha256,char(0))=0),
 PRIMARY KEY(channel,revision)
);
CREATE TABLE release_issuer_audit (
 audit_id TEXT PRIMARY KEY, operation_id TEXT NOT NULL, owner TEXT NOT NULL,
 channel TEXT NOT NULL, binding_id TEXT NOT NULL,
 outcome TEXT NOT NULL CHECK(outcome IN ('denied','uncertain','preparing-committed')),
 reason TEXT NOT NULL CHECK(reason IN ('missing-authority','source-drift','policy-denied','stopped','uncertain-write','preparing-committed')),
 evidence_sha256 TEXT CHECK(evidence_sha256 IS NULL OR (typeof(evidence_sha256)='text' AND length(evidence_sha256)=64 AND evidence_sha256 NOT GLOB '*[^0-9a-f]*' AND instr(evidence_sha256,char(0))=0)),
 CHECK((outcome='preparing-committed')=(reason='preparing-committed'))
);
CREATE TABLE release_issuer_requests (
 operation_id TEXT PRIMARY KEY, owner TEXT NOT NULL, channel TEXT NOT NULL, binding_id TEXT NOT NULL,
 target_revision TEXT NOT NULL, target_digest TEXT NOT NULL, target_commit TEXT NOT NULL,
 expected_revision TEXT, expected_generation INTEGER NOT NULL CHECK(typeof(expected_generation)='integer' AND expected_generation BETWEEN 0 AND 9007199254740990),
 mode TEXT NOT NULL CHECK(mode IN ('bootstrap','publish','rollback')),
 expected_current_operation TEXT, expected_current_owner TEXT, expected_current_epoch INTEGER NOT NULL CHECK(typeof(expected_current_epoch)='integer' AND expected_current_epoch BETWEEN 0 AND 9007199254740990),
 expected_max_epoch INTEGER NOT NULL CHECK(typeof(expected_max_epoch)='integer' AND expected_max_epoch BETWEEN 0 AND 9007199254740990),
 expected_stop_revision INTEGER NOT NULL CHECK(typeof(expected_stop_revision)='integer' AND expected_stop_revision BETWEEN 0 AND 9007199254740991),
 evidence_set_sha256 TEXT NOT NULL, policy_sha256 TEXT NOT NULL, runtime_snapshot_sha256 TEXT NOT NULL, rollback_snapshot_sha256 TEXT NOT NULL,
 commit_audit_id TEXT NOT NULL UNIQUE,
 CHECK((expected_current_operation IS NULL AND expected_current_owner IS NULL AND expected_current_epoch=0 AND expected_max_epoch=0) OR (expected_current_operation IS NOT NULL AND expected_current_owner IS NOT NULL AND expected_current_epoch>0 AND expected_current_epoch=expected_max_epoch)),
 CHECK((mode='bootstrap' AND expected_revision IS NULL AND expected_generation=0) OR (mode IN ('publish','rollback') AND expected_revision IS NOT NULL AND expected_generation>0))
);
CREATE TABLE release_issuer_commits (
 operation_id TEXT PRIMARY KEY REFERENCES release_issuer_requests(operation_id),
 channel TEXT NOT NULL, epoch INTEGER NOT NULL CHECK(typeof(epoch)='integer' AND epoch BETWEEN 1 AND 9007199254740991),
 UNIQUE(channel,epoch)
);
CREATE TRIGGER release_issuer_stop_events_canonical BEFORE INSERT ON release_issuer_stop_events BEGIN
 SELECT CASE WHEN typeof(NEW.channel)!='text' OR instr(NEW.channel,char(0))!=0 OR length(NEW.channel)!=34 OR substr(NEW.channel,1,14)!='engine:engine-' OR substr(NEW.channel,15) GLOB '*[^0-9a-f]*' THEN RAISE(ABORT,'issuer-canonical') END;
END;
CREATE TRIGGER release_issuer_stop_events_no_update BEFORE UPDATE ON release_issuer_stop_events BEGIN SELECT RAISE(ABORT,'issuer-immutable'); END;
CREATE TRIGGER release_issuer_stop_events_no_delete BEFORE DELETE ON release_issuer_stop_events BEGIN SELECT RAISE(ABORT,'issuer-immutable'); END;
CREATE TRIGGER release_issuer_stop_events_no_replace BEFORE INSERT ON release_issuer_stop_events WHEN EXISTS(SELECT 1 FROM release_issuer_stop_events WHERE (channel=NEW.channel AND revision=NEW.revision) OR rowid=NEW.rowid) BEGIN SELECT RAISE(ABORT,'issuer-immutable'); END;
CREATE TRIGGER release_issuer_audit_canonical BEFORE INSERT ON release_issuer_audit BEGIN
 SELECT CASE WHEN typeof(NEW.audit_id)!='text' OR instr(NEW.audit_id,char(0))!=0 OR length(NEW.audit_id)!=70 OR substr(NEW.audit_id,1,6)!='audit-' OR substr(NEW.audit_id,7) GLOB '*[^0-9a-f]*' THEN RAISE(ABORT,'issuer-canonical') END;
 SELECT CASE WHEN typeof(NEW.operation_id)!='text' OR instr(NEW.operation_id,char(0))!=0 OR length(NEW.operation_id)!=36 OR substr(NEW.operation_id,1,4)!='pub-' OR substr(NEW.operation_id,5) GLOB '*[^0-9a-f]*' THEN RAISE(ABORT,'issuer-canonical') END;
 SELECT CASE WHEN typeof(NEW.owner)!='text' OR instr(NEW.owner,char(0))!=0 OR length(NEW.owner)!=71 OR substr(NEW.owner,1,7)!='github-' OR substr(NEW.owner,8) GLOB '*[^0-9a-f]*' THEN RAISE(ABORT,'issuer-canonical') END;
 SELECT CASE WHEN typeof(NEW.channel)!='text' OR instr(NEW.channel,char(0))!=0 OR length(NEW.channel)!=34 OR substr(NEW.channel,1,14)!='engine:engine-' OR substr(NEW.channel,15) GLOB '*[^0-9a-f]*' THEN RAISE(ABORT,'issuer-canonical') END;
 SELECT CASE WHEN typeof(NEW.binding_id)!='text' OR instr(NEW.binding_id,char(0))!=0 OR length(NEW.binding_id)!=72 OR substr(NEW.binding_id,1,8)!='binding-' OR substr(NEW.binding_id,9) GLOB '*[^0-9a-f]*' THEN RAISE(ABORT,'issuer-canonical') END;
END;
CREATE TRIGGER release_issuer_audit_no_update BEFORE UPDATE ON release_issuer_audit BEGIN SELECT RAISE(ABORT,'issuer-immutable'); END;
CREATE TRIGGER release_issuer_audit_no_delete BEFORE DELETE ON release_issuer_audit BEGIN SELECT RAISE(ABORT,'issuer-immutable'); END;
CREATE TRIGGER release_issuer_audit_no_replace BEFORE INSERT ON release_issuer_audit WHEN EXISTS(SELECT 1 FROM release_issuer_audit WHERE (audit_id=NEW.audit_id) OR rowid=NEW.rowid) BEGIN SELECT RAISE(ABORT,'issuer-immutable'); END;
CREATE TRIGGER release_issuer_requests_canonical BEFORE INSERT ON release_issuer_requests BEGIN
 SELECT CASE WHEN typeof(NEW.operation_id)!='text' OR instr(NEW.operation_id,char(0))!=0 OR length(NEW.operation_id)!=36 OR substr(NEW.operation_id,1,4)!='pub-' OR substr(NEW.operation_id,5) GLOB '*[^0-9a-f]*' THEN RAISE(ABORT,'issuer-canonical') END;
 SELECT CASE WHEN typeof(NEW.owner)!='text' OR instr(NEW.owner,char(0))!=0 OR length(NEW.owner)!=71 OR substr(NEW.owner,1,7)!='github-' OR substr(NEW.owner,8) GLOB '*[^0-9a-f]*' THEN RAISE(ABORT,'issuer-canonical') END;
 SELECT CASE WHEN typeof(NEW.channel)!='text' OR instr(NEW.channel,char(0))!=0 OR length(NEW.channel)!=34 OR substr(NEW.channel,1,14)!='engine:engine-' OR substr(NEW.channel,15) GLOB '*[^0-9a-f]*' THEN RAISE(ABORT,'issuer-canonical') END;
 SELECT CASE WHEN typeof(NEW.binding_id)!='text' OR instr(NEW.binding_id,char(0))!=0 OR length(NEW.binding_id)!=72 OR substr(NEW.binding_id,1,8)!='binding-' OR substr(NEW.binding_id,9) GLOB '*[^0-9a-f]*' THEN RAISE(ABORT,'issuer-canonical') END;
 SELECT CASE WHEN typeof(NEW.target_revision)!='text' OR instr(NEW.target_revision,char(0))!=0 OR length(NEW.target_revision)!=32 OR substr(NEW.target_revision,1,8)!='content-' OR substr(NEW.target_revision,9) GLOB '*[^0-9a-f]*' THEN RAISE(ABORT,'issuer-canonical') END;
 SELECT CASE WHEN typeof(NEW.target_digest)!='text' OR instr(NEW.target_digest,char(0))!=0 OR length(NEW.target_digest)!=64 OR substr(NEW.target_digest,1,0)!='' OR substr(NEW.target_digest,1) GLOB '*[^0-9a-f]*' THEN RAISE(ABORT,'issuer-canonical') END;
 SELECT CASE WHEN typeof(NEW.target_commit)!='text' OR instr(NEW.target_commit,char(0))!=0 OR length(NEW.target_commit)!=40 OR substr(NEW.target_commit,1,0)!='' OR substr(NEW.target_commit,1) GLOB '*[^0-9a-f]*' THEN RAISE(ABORT,'issuer-canonical') END;
 SELECT CASE WHEN typeof(NEW.evidence_set_sha256)!='text' OR instr(NEW.evidence_set_sha256,char(0))!=0 OR length(NEW.evidence_set_sha256)!=64 OR substr(NEW.evidence_set_sha256,1,0)!='' OR substr(NEW.evidence_set_sha256,1) GLOB '*[^0-9a-f]*' THEN RAISE(ABORT,'issuer-canonical') END;
 SELECT CASE WHEN typeof(NEW.policy_sha256)!='text' OR instr(NEW.policy_sha256,char(0))!=0 OR length(NEW.policy_sha256)!=64 OR substr(NEW.policy_sha256,1,0)!='' OR substr(NEW.policy_sha256,1) GLOB '*[^0-9a-f]*' THEN RAISE(ABORT,'issuer-canonical') END;
 SELECT CASE WHEN typeof(NEW.runtime_snapshot_sha256)!='text' OR instr(NEW.runtime_snapshot_sha256,char(0))!=0 OR length(NEW.runtime_snapshot_sha256)!=64 OR substr(NEW.runtime_snapshot_sha256,1,0)!='' OR substr(NEW.runtime_snapshot_sha256,1) GLOB '*[^0-9a-f]*' THEN RAISE(ABORT,'issuer-canonical') END;
 SELECT CASE WHEN typeof(NEW.rollback_snapshot_sha256)!='text' OR instr(NEW.rollback_snapshot_sha256,char(0))!=0 OR length(NEW.rollback_snapshot_sha256)!=64 OR substr(NEW.rollback_snapshot_sha256,1,0)!='' OR substr(NEW.rollback_snapshot_sha256,1) GLOB '*[^0-9a-f]*' THEN RAISE(ABORT,'issuer-canonical') END;
 SELECT CASE WHEN typeof(NEW.commit_audit_id)!='text' OR instr(NEW.commit_audit_id,char(0))!=0 OR length(NEW.commit_audit_id)!=70 OR substr(NEW.commit_audit_id,1,6)!='audit-' OR substr(NEW.commit_audit_id,7) GLOB '*[^0-9a-f]*' THEN RAISE(ABORT,'issuer-canonical') END;
END;
CREATE TRIGGER release_issuer_requests_no_update BEFORE UPDATE ON release_issuer_requests BEGIN SELECT RAISE(ABORT,'issuer-immutable'); END;
CREATE TRIGGER release_issuer_requests_no_delete BEFORE DELETE ON release_issuer_requests BEGIN SELECT RAISE(ABORT,'issuer-immutable'); END;
CREATE TRIGGER release_issuer_requests_no_replace BEFORE INSERT ON release_issuer_requests WHEN EXISTS(SELECT 1 FROM release_issuer_requests WHERE (operation_id=NEW.operation_id OR commit_audit_id=NEW.commit_audit_id) OR rowid=NEW.rowid) BEGIN SELECT RAISE(ABORT,'issuer-immutable'); END;
CREATE TRIGGER release_issuer_commits_canonical BEFORE INSERT ON release_issuer_commits BEGIN
 SELECT CASE WHEN typeof(NEW.operation_id)!='text' OR instr(NEW.operation_id,char(0))!=0 OR length(NEW.operation_id)!=36 OR substr(NEW.operation_id,1,4)!='pub-' OR substr(NEW.operation_id,5) GLOB '*[^0-9a-f]*' THEN RAISE(ABORT,'issuer-canonical') END;
 SELECT CASE WHEN typeof(NEW.channel)!='text' OR instr(NEW.channel,char(0))!=0 OR length(NEW.channel)!=34 OR substr(NEW.channel,1,14)!='engine:engine-' OR substr(NEW.channel,15) GLOB '*[^0-9a-f]*' THEN RAISE(ABORT,'issuer-canonical') END;
END;
CREATE TRIGGER release_issuer_commits_no_update BEFORE UPDATE ON release_issuer_commits BEGIN SELECT RAISE(ABORT,'issuer-immutable'); END;
CREATE TRIGGER release_issuer_commits_no_delete BEFORE DELETE ON release_issuer_commits BEGIN SELECT RAISE(ABORT,'issuer-immutable'); END;
CREATE TRIGGER release_issuer_commits_no_replace BEFORE INSERT ON release_issuer_commits WHEN EXISTS(SELECT 1 FROM release_issuer_commits WHERE (operation_id=NEW.operation_id OR (channel=NEW.channel AND epoch=NEW.epoch)) OR rowid=NEW.rowid) BEGIN SELECT RAISE(ABORT,'issuer-immutable'); END;
CREATE TRIGGER issuer_stop_monotonic BEFORE INSERT ON release_issuer_stop_events BEGIN
 SELECT CASE WHEN NEW.revision!=COALESCE((SELECT MAX(revision)+1 FROM release_issuer_stop_events WHERE channel=NEW.channel),0)
 OR NEW.stopped<COALESCE((SELECT stopped FROM release_issuer_stop_events WHERE channel=NEW.channel ORDER BY revision DESC LIMIT 1),0)
 OR (NEW.revision=0 AND NEW.stopped!=0)
 THEN RAISE(ABORT,'issuer-stop-transition') END;
END;
CREATE TRIGGER issuer_stop_current AFTER INSERT ON release_issuer_stop_events WHEN NEW.stopped=1 BEGIN
 UPDATE release_admission SET stopped=1 WHERE channel=NEW.channel AND stopped=0;
END;
CREATE TRIGGER issuer_audit_commit_only BEFORE INSERT ON release_issuer_audit WHEN NEW.outcome='preparing-committed' BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM release_issuer_commits c JOIN release_issuer_requests r USING(operation_id)
 WHERE c.operation_id=NEW.operation_id AND r.commit_audit_id=NEW.audit_id AND r.owner=NEW.owner AND r.channel=NEW.channel AND r.binding_id=NEW.binding_id AND r.evidence_set_sha256 IS NEW.evidence_sha256)
 THEN RAISE(ABORT,'issuer-commit-audit') END;
END;
CREATE TRIGGER issuer_claim_guard BEFORE INSERT ON release_issuer_commits BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM release_issuer_requests r WHERE r.operation_id=NEW.operation_id AND r.channel=NEW.channel
 AND NEW.epoch=r.expected_max_epoch+1
 AND r.expected_max_epoch=COALESCE((SELECT MAX(d.epoch) FROM release_admission_decisions d WHERE d.channel=r.channel),0)
 AND EXISTS(SELECT 1 FROM release_issuer_stop_events s WHERE s.channel=r.channel AND s.revision=r.expected_stop_revision AND s.stopped=0 AND s.revision=(SELECT MAX(revision) FROM release_issuer_stop_events WHERE channel=r.channel))
 AND NOT EXISTS(SELECT 1 FROM release_issuer_audit au WHERE (au.operation_id=r.operation_id OR (au.channel=r.channel AND au.binding_id=r.binding_id)) AND au.outcome IN ('denied','uncertain'))
 AND NOT EXISTS(SELECT 1 FROM release_admission_decisions d WHERE d.operation_id=r.operation_id)
 AND ((r.expected_current_operation IS NULL AND r.mode='bootstrap' AND NOT EXISTS(SELECT 1 FROM release_admission a WHERE a.channel=r.channel)) OR (r.mode IN ('publish','rollback') AND EXISTS(SELECT 1 FROM release_admission a WHERE a.channel=r.channel AND a.operation_id=r.expected_current_operation AND a.owner=r.expected_current_owner AND a.epoch=r.expected_current_epoch AND a.state='consumed' AND a.stopped=0)))
 AND ((r.expected_revision IS NULL AND NOT EXISTS(SELECT 1 FROM content_publication p WHERE p.channel=r.channel)) OR EXISTS(SELECT 1 FROM content_publication p WHERE p.channel=r.channel AND p.revision_id=r.expected_revision))
 AND COALESCE((SELECT MAX(generation) FROM content_publication_events WHERE channel=r.channel),0)=r.expected_generation)
 THEN RAISE(ABORT,'issuer-cas-rejected') END;
END;
CREATE TRIGGER issuer_claim_apply AFTER INSERT ON release_issuer_commits BEGIN
 INSERT INTO release_admission(channel,operation_id,owner,epoch,target_revision,target_digest,target_commit,expected_revision,expected_generation,mode,state,stopped)
 SELECT r.channel,r.operation_id,r.owner,NEW.epoch,r.target_revision,r.target_digest,r.target_commit,r.expected_revision,r.expected_generation,r.mode,'preparing',0
 FROM release_issuer_requests r WHERE r.operation_id=NEW.operation_id AND r.expected_current_operation IS NULL;
 UPDATE release_admission SET
 operation_id=NEW.operation_id,
 owner=(SELECT owner FROM release_issuer_requests WHERE operation_id=NEW.operation_id),epoch=NEW.epoch,
 target_revision=(SELECT target_revision FROM release_issuer_requests WHERE operation_id=NEW.operation_id),
 target_digest=(SELECT target_digest FROM release_issuer_requests WHERE operation_id=NEW.operation_id),
 target_commit=(SELECT target_commit FROM release_issuer_requests WHERE operation_id=NEW.operation_id),
 expected_revision=(SELECT expected_revision FROM release_issuer_requests WHERE operation_id=NEW.operation_id),
 expected_generation=(SELECT expected_generation FROM release_issuer_requests WHERE operation_id=NEW.operation_id),
 mode=(SELECT mode FROM release_issuer_requests WHERE operation_id=NEW.operation_id),state='preparing',stopped=0
 WHERE channel=NEW.channel AND operation_id=(SELECT expected_current_operation FROM release_issuer_requests WHERE operation_id=NEW.operation_id);
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM release_admission WHERE channel=NEW.channel AND operation_id=NEW.operation_id AND epoch=NEW.epoch AND state='preparing' AND stopped=0) THEN RAISE(ABORT,'issuer-current-apply') END;
 INSERT INTO release_admission_bindings
 SELECT r.operation_id,r.channel,r.owner,NEW.epoch,r.target_revision,r.target_digest,r.target_commit,r.expected_revision,r.expected_generation,r.mode,r.evidence_set_sha256,r.policy_sha256,r.runtime_snapshot_sha256,r.rollback_snapshot_sha256 FROM release_issuer_requests r WHERE r.operation_id=NEW.operation_id;
 INSERT INTO release_issuer_audit(audit_id,operation_id,owner,channel,binding_id,outcome,reason,evidence_sha256)
 SELECT commit_audit_id,operation_id,owner,channel,binding_id,'preparing-committed','preparing-committed',evidence_set_sha256 FROM release_issuer_requests WHERE operation_id=NEW.operation_id;
END;
-- Ordinary supported writers cannot sidestep the claim after this supplement.
CREATE TRIGGER issuer_admission_insert_guard BEFORE INSERT ON release_admission BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM release_issuer_commits c JOIN release_issuer_requests r USING(operation_id)
 WHERE c.operation_id=NEW.operation_id AND c.channel=NEW.channel AND c.epoch=NEW.epoch AND r.owner=NEW.owner AND r.target_revision=NEW.target_revision AND r.target_digest=NEW.target_digest AND r.target_commit=NEW.target_commit AND r.expected_revision IS NEW.expected_revision AND r.expected_generation=NEW.expected_generation AND r.mode=NEW.mode AND NEW.state='preparing' AND NEW.stopped=0)
 THEN RAISE(ABORT,'issuer-claim-required') END;
END;
CREATE TRIGGER issuer_admission_successor_guard BEFORE UPDATE ON release_admission WHEN OLD.operation_id!=NEW.operation_id BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM release_issuer_commits c JOIN release_issuer_requests r USING(operation_id)
 WHERE c.operation_id=NEW.operation_id AND c.channel=NEW.channel AND c.epoch=NEW.epoch AND r.owner=NEW.owner AND r.expected_current_operation=OLD.operation_id AND r.expected_current_owner=OLD.owner AND r.expected_current_epoch=OLD.epoch AND r.target_revision=NEW.target_revision AND r.target_digest=NEW.target_digest AND r.target_commit=NEW.target_commit AND r.expected_revision IS NEW.expected_revision AND r.expected_generation=NEW.expected_generation AND r.mode=NEW.mode AND NEW.state='preparing' AND NEW.stopped=0)
 THEN RAISE(ABORT,'issuer-claim-required') END;
END;
CREATE TRIGGER issuer_claim_content_revisions_insert BEFORE INSERT ON content_revisions WHEN NOT EXISTS(SELECT 1 FROM release_issuer_commits WHERE operation_id=NEW.writer_operation) BEGIN SELECT RAISE(ABORT,'issuer-claim-required'); END;
CREATE TRIGGER issuer_claim_content_revisions_update BEFORE UPDATE ON content_revisions WHEN NOT EXISTS(SELECT 1 FROM release_issuer_commits WHERE operation_id=NEW.writer_operation) BEGIN SELECT RAISE(ABORT,'issuer-claim-required'); END;
CREATE TRIGGER issuer_claim_content_records_insert BEFORE INSERT ON content_records WHEN NOT EXISTS(SELECT 1 FROM release_issuer_commits WHERE operation_id=NEW.writer_operation) BEGIN SELECT RAISE(ABORT,'issuer-claim-required'); END;
CREATE TRIGGER issuer_claim_content_publication_provenance_insert BEFORE INSERT ON content_publication_provenance WHEN NOT EXISTS(SELECT 1 FROM release_issuer_commits WHERE operation_id=NEW.writer_operation) BEGIN SELECT RAISE(ABORT,'issuer-claim-required'); END;
CREATE TRIGGER issuer_claim_content_publication_events_insert BEFORE INSERT ON content_publication_events WHEN NOT EXISTS(SELECT 1 FROM release_issuer_commits WHERE operation_id=NEW.writer_operation) BEGIN SELECT RAISE(ABORT,'issuer-claim-required'); END;
CREATE TRIGGER issuer_claim_content_publication_insert BEFORE INSERT ON content_publication WHEN NOT EXISTS(SELECT 1 FROM release_issuer_commits WHERE operation_id=NEW.writer_operation) BEGIN SELECT RAISE(ABORT,'issuer-claim-required'); END;
CREATE TRIGGER issuer_claim_content_publication_update BEFORE UPDATE ON content_publication WHEN NOT EXISTS(SELECT 1 FROM release_issuer_commits WHERE operation_id=NEW.writer_operation) BEGIN SELECT RAISE(ABORT,'issuer-claim-required'); END;
CREATE TRIGGER issuer_claim_release_admission_bindings_insert BEFORE INSERT ON release_admission_bindings WHEN NOT EXISTS(SELECT 1 FROM release_issuer_commits WHERE operation_id=NEW.operation_id) BEGIN SELECT RAISE(ABORT,'issuer-claim-required'); END;
CREATE TRIGGER issuer_claim_release_admission_seals_insert BEFORE INSERT ON release_admission_seals WHEN NOT EXISTS(SELECT 1 FROM release_issuer_commits WHERE operation_id=NEW.operation_id) BEGIN SELECT RAISE(ABORT,'issuer-claim-required'); END;
CREATE TRIGGER issuer_claim_admission_state BEFORE UPDATE ON release_admission WHEN NEW.state IN ('admitted','consumed') AND NEW.state!=OLD.state AND NOT EXISTS(SELECT 1 FROM release_issuer_commits WHERE operation_id=NEW.operation_id) BEGIN SELECT RAISE(ABORT,'issuer-claim-required'); END;

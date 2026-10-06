import { sqliteTable, text, integer, primaryKey, index, uniqueIndex, check } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const revisions = sqliteTable('content_revisions', {
  id: text('id').primaryKey(),
  engine: text('engine').notNull(),
  schema: integer('schema_version').notNull(),
  digest: text('digest').notNull(),
  manifest: text('manifest_json').notNull(),
  bundle: text('bundle_json').notNull(),
  recordCount: integer('record_count').notNull(),
  completed: integer('completed').notNull().default(0),
});

export const records = sqliteTable('content_records', {
  revision: text('revision_id').notNull().references(() => revisions.id),
  id: text('record_id').notNull(),
  kind: text('kind').notNull(),
  dataset: text('dataset').notNull(),
  payload: text('payload_json').notNull(),
}, table => [
  primaryKey({ columns: [table.revision, table.id] }),
  index('idx_content_records_revision_kind_dataset').on(table.revision, table.kind, table.dataset),
]);

export const publication = sqliteTable('content_publication', {
  channel: text('channel').primaryKey(),
  revision: text('revision_id').notNull().references(() => revisions.id),
});

export const provenance = sqliteTable('content_publication_provenance', {
  revision: text('revision_id').primaryKey().references(() => revisions.id),
  repository: text('repository').notNull(),
  commit: text('commit_sha').notNull(),
  workflowRun: integer('workflow_run').notNull(),
  verifiedAt: text('verified_at').notNull(),
});

export const publicationEvents = sqliteTable('content_publication_events', {
  operationId: text('operation_id').primaryKey(),
  channel: text('channel').notNull(),
  generation: integer('generation').notNull(),
  fromRevision: text('from_revision').notNull().references(() => revisions.id),
  toRevision: text('to_revision').notNull().references(() => revisions.id),
  provenanceCommit: text('provenance_commit').notNull(),
  intent: text('intent').notNull(),
  createdAt: text('created_at').notNull(),
}, table => [
  uniqueIndex('idx_content_publication_channel_generation').on(table.channel, table.generation),
  check('publication_positive_generation', sql`${table.generation} > 0`),
  check('publication_valid_intent', sql`${table.intent} IN ('publish', 'rollback')`),
]);

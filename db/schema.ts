import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core';

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

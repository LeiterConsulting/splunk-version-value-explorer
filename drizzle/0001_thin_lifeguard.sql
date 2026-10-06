CREATE TABLE `content_publication_provenance` (
	`revision_id` text PRIMARY KEY NOT NULL,
	`repository` text NOT NULL,
	`commit_sha` text NOT NULL,
	`workflow_run` integer NOT NULL,
	`verified_at` text NOT NULL,
	FOREIGN KEY (`revision_id`) REFERENCES `content_revisions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `content_publication_events` (
	`operation_id` text PRIMARY KEY NOT NULL,
	`channel` text NOT NULL,
	`generation` integer NOT NULL,
	`from_revision` text NOT NULL,
	`to_revision` text NOT NULL,
	`provenance_commit` text NOT NULL,
	`intent` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`from_revision`) REFERENCES `content_revisions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_revision`) REFERENCES `content_revisions`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "publication_positive_generation" CHECK("content_publication_events"."generation" > 0),
	CONSTRAINT "publication_valid_intent" CHECK("content_publication_events"."intent" IN ('publish', 'rollback'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_content_publication_channel_generation` ON `content_publication_events` (`channel`,`generation`);
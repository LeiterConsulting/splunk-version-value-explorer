CREATE TABLE `content_publication` (
	`channel` text PRIMARY KEY NOT NULL,
	`revision_id` text NOT NULL,
	FOREIGN KEY (`revision_id`) REFERENCES `content_revisions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `content_records` (
	`revision_id` text NOT NULL,
	`record_id` text NOT NULL,
	`kind` text NOT NULL,
	`dataset` text NOT NULL,
	`payload_json` text NOT NULL,
	PRIMARY KEY(`revision_id`, `record_id`),
	FOREIGN KEY (`revision_id`) REFERENCES `content_revisions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_content_records_revision_kind_dataset` ON `content_records` (`revision_id`,`kind`,`dataset`);--> statement-breakpoint
CREATE TABLE `content_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`engine` text NOT NULL,
	`schema_version` integer NOT NULL,
	`digest` text NOT NULL,
	`manifest_json` text NOT NULL,
	`bundle_json` text NOT NULL,
	`record_count` integer NOT NULL,
	`completed` integer DEFAULT 0 NOT NULL
);

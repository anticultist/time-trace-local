ALTER TABLE `events` ADD `source` text NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `name` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `events_time_name_unique` ON `events` (`time`,`name`);--> statement-breakpoint
ALTER TABLE `events` DROP COLUMN `type`;
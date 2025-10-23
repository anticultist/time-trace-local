CREATE TABLE `db_properties` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` integer NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `db_properties_name_unique` ON `db_properties` (`name`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`time` integer NOT NULL,
	`type` text NOT NULL,
	`details` text NOT NULL
);

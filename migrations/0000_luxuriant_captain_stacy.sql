CREATE TABLE `chat_histories` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`messages` text NOT NULL,
	`timestamp` text DEFAULT (datetime('now','localtime')) NOT NULL,
	`group_id` text,
	FOREIGN KEY (`group_id`) REFERENCES `chat_history_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chat_history_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`timestamp` text DEFAULT (datetime('now','localtime')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`filename` text NOT NULL,
	`file_size` integer,
	`timestamp` text DEFAULT (datetime('now','localtime')) NOT NULL,
	`is_embedded` integer DEFAULT false NOT NULL,
	`embed_model` text DEFAULT '',
	`embed_provider_name` text DEFAULT '',
	`text_character_count` integer DEFAULT 0,
	`no_of_chunks` integer DEFAULT 0,
	`no_of_tokens` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);
CREATE TABLE `files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text NOT NULL,
	`file_size` integer,
	`timestamp` text DEFAULT (datetime('now','localtime')) NOT NULL,
	`is_embedded` integer DEFAULT false NOT NULL,
	`embed_model` text DEFAULT '',
	`embed_api_service_name` text DEFAULT '',
	`text_character_count` integer DEFAULT 0,
	`no_of_chunks` integer DEFAULT 0,
	`no_of_tokens` integer DEFAULT 0
);

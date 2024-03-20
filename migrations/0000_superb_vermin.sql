CREATE TABLE `files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text NOT NULL,
	`file_size` integer,
	`timestamp` text DEFAULT (datetime('now','localtime'))
);

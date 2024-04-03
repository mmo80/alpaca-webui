ALTER TABLE files ADD `embed_api_service_name` text DEFAULT '';--> statement-breakpoint
ALTER TABLE files ADD `text_character_count` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE files ADD `no_of_chunks` integer DEFAULT 0;
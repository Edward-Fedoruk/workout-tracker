CREATE TABLE `routine_workout_draft` (
	`draft_data` text NOT NULL,
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`routine_id` integer NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`routine_id`) REFERENCES `routine`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "singleton_check" CHECK("routine_workout_draft"."id" = 1)
);

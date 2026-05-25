CREATE TABLE IF NOT EXISTS `workout_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workout_date` text NOT NULL,
	`exercise_name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `workout_set` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workout_id` integer NOT NULL,
	`set_number` integer NOT NULL,
	`weight` real NOT NULL,
	`reps` integer NOT NULL,
	FOREIGN KEY (`workout_id`) REFERENCES `workout_log`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "set_number_check" CHECK("workout_set"."set_number" BETWEEN 1 AND 5),
	CONSTRAINT "weight_check" CHECK("workout_set"."weight" > 0),
	CONSTRAINT "reps_check" CHECK("workout_set"."reps" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `workout_set_workout_id_set_number_unique` ON `workout_set` (`workout_id`,`set_number`);

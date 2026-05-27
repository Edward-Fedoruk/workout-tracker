CREATE TABLE `routine` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "routine_name_length" CHECK(length("routine"."name") <= 100)
);
--> statement-breakpoint
CREATE TABLE `routine_exercise` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`routine_id` integer NOT NULL,
	`exercise_name` text NOT NULL,
	`suggested_sets` integer NOT NULL,
	`suggested_reps` integer NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`routine_id`) REFERENCES `routine`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "suggested_sets_check" CHECK("routine_exercise"."suggested_sets" BETWEEN 1 AND 5),
	CONSTRAINT "suggested_reps_check" CHECK("routine_exercise"."suggested_reps" BETWEEN 1 AND 99),
	CONSTRAINT "position_check" CHECK("routine_exercise"."position" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `routine_exercise_routine_id_position_unique` ON `routine_exercise` (`routine_id`,`position`);
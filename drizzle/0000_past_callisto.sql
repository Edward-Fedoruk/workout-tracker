CREATE TABLE `app_setting` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exercise` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`classification` text DEFAULT 'standard' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "exercise_classification_check" CHECK("exercise"."classification" IN ('standard', 'bodyweight', 'assisted'))
);
--> statement-breakpoint
CREATE TABLE `exercise_muscle_group` (
	`exercise_id` integer NOT NULL,
	`muscle_group_id` integer NOT NULL,
	PRIMARY KEY(`exercise_id`, `muscle_group_id`),
	FOREIGN KEY (`exercise_id`) REFERENCES `exercise`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`muscle_group_id`) REFERENCES `muscle_group`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `muscle_group` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#757575' NOT NULL
);
--> statement-breakpoint
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
	`exercise_name` text NOT NULL,
	`min_reps` integer NOT NULL,
	`max_reps` integer NOT NULL,
	`suggested_sets` integer NOT NULL,
	`position` integer NOT NULL,
	`routine_id` integer NOT NULL,
	FOREIGN KEY (`routine_id`) REFERENCES `routine`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "suggested_sets_check" CHECK("routine_exercise"."suggested_sets" BETWEEN 1 AND 5),
	CONSTRAINT "min_reps_check" CHECK("routine_exercise"."min_reps" BETWEEN 1 AND 99),
	CONSTRAINT "max_reps_check" CHECK("routine_exercise"."max_reps" BETWEEN 1 AND 99),
	CONSTRAINT "position_check" CHECK("routine_exercise"."position" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `routine_exercise_routine_id_position_unique` ON `routine_exercise` (`routine_id`,`position`);
--> statement-breakpoint
CREATE TABLE `workout_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`exercise_name` text NOT NULL,
	`workout_date` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `workout_set` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reps` integer NOT NULL,
	`weight` real,
	`erm` real,
	`set_number` integer NOT NULL,
	`workout_id` integer NOT NULL,
	FOREIGN KEY (`workout_id`) REFERENCES `workout_log`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "set_number_check" CHECK("workout_set"."set_number" BETWEEN 1 AND 5),
	CONSTRAINT "reps_check" CHECK("workout_set"."reps" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workout_set_workout_id_set_number_unique` ON `workout_set` (`workout_id`,`set_number`);

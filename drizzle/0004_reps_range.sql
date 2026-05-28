CREATE TABLE `__new_routine_exercise` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`routine_id` integer NOT NULL,
	`exercise_name` text NOT NULL,
	`suggested_sets` integer NOT NULL,
	`min_reps` integer NOT NULL,
	`max_reps` integer NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`routine_id`) REFERENCES `routine`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "suggested_sets_check" CHECK("__new_routine_exercise"."suggested_sets" BETWEEN 1 AND 5),
	CONSTRAINT "min_reps_check" CHECK("__new_routine_exercise"."min_reps" BETWEEN 1 AND 99),
	CONSTRAINT "max_reps_check" CHECK("__new_routine_exercise"."max_reps" BETWEEN 1 AND 99),
	CONSTRAINT "position_check" CHECK("__new_routine_exercise"."position" >= 1)
);
--> statement-breakpoint
INSERT INTO `__new_routine_exercise` (`id`, `routine_id`, `exercise_name`, `suggested_sets`, `min_reps`, `max_reps`, `position`)
SELECT `id`, `routine_id`, `exercise_name`, `suggested_sets`, `suggested_reps`, `suggested_reps`, `position` FROM `routine_exercise`;
--> statement-breakpoint
DROP TABLE `routine_exercise`;
--> statement-breakpoint
ALTER TABLE `__new_routine_exercise` RENAME TO `routine_exercise`;
--> statement-breakpoint
CREATE UNIQUE INDEX `routine_exercise_routine_id_position_unique` ON `routine_exercise` (`routine_id`,`position`);

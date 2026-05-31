CREATE TABLE `__new_workout_set` (
  `id`         integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `reps`       integer NOT NULL,
  `set_number` integer NOT NULL,
  `weight`     real,
  `erm`        real,
  `workout_id` integer NOT NULL,
  FOREIGN KEY (`workout_id`) REFERENCES `workout_log`(`id`) ON UPDATE no action ON DELETE cascade,
  CONSTRAINT "set_number_check" CHECK("__new_workout_set"."set_number" BETWEEN 1 AND 5),
  CONSTRAINT "reps_check"       CHECK("__new_workout_set"."reps" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_workout_set` (`id`, `reps`, `set_number`, `weight`, `erm`, `workout_id`)
SELECT `id`, `reps`, `set_number`, `weight`, NULL, `workout_id` FROM `workout_set`;
--> statement-breakpoint
DROP TABLE `workout_set`;
--> statement-breakpoint
ALTER TABLE `__new_workout_set` RENAME TO `workout_set`;
--> statement-breakpoint
CREATE UNIQUE INDEX `workout_set_workout_id_set_number_unique`
  ON `workout_set` (`workout_id`, `set_number`);

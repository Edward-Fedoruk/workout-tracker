CREATE TABLE `exercise` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `muscle_group` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
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
INSERT OR IGNORE INTO `muscle_group` (`name`) VALUES
	('Back'),
	('Biceps'),
	('Calves'),
	('Chest'),
	('Core'),
	('Forearms'),
	('Glutes'),
	('Hamstrings'),
	('Quads'),
	('Rear Delts'),
	('Shoulders'),
	('Triceps');
--> statement-breakpoint
INSERT OR IGNORE INTO `exercise` (`name`) VALUES
	('Abs (BW)'),
	('Assisted Chin-up'),
	('Barbell Squat'),
	('Bench Press'),
	('Cable Curl (rope)'),
	('Cable Lateral Raise'),
	('Cable Pushdown (rope)'),
	('Cable Row'),
	('Close Grip Bench Press'),
	('DB Lateral Raise'),
	('Dips (BW)'),
	('Dumbbell Overhead Press'),
	('Dumbbell RDL'),
	('Hack Squat Machine'),
	('Hammer Curl'),
	('Incline Press Machine'),
	('Lat Pull Down'),
	('Leg Curl Machine'),
	('Leg Extension Machine'),
	('Rear Delt Pec Deck'),
	('Reverse Curl'),
	('Seated Calf Machine'),
	('Seated Row'),
	('Wrist Curl');
--> statement-breakpoint
INSERT OR IGNORE INTO `exercise_muscle_group` (`exercise_id`, `muscle_group_id`)
SELECT e.id, m.id FROM `exercise` e, `muscle_group` m WHERE
	(e.name = 'Abs (BW)' AND m.name IN ('Core'))
	OR (e.name = 'Assisted Chin-up' AND m.name IN ('Back', 'Biceps'))
	OR (e.name = 'Barbell Squat' AND m.name IN ('Quads', 'Hamstrings', 'Glutes'))
	OR (e.name = 'Bench Press' AND m.name IN ('Chest', 'Triceps'))
	OR (e.name = 'Cable Curl (rope)' AND m.name IN ('Biceps'))
	OR (e.name = 'Cable Lateral Raise' AND m.name IN ('Shoulders'))
	OR (e.name = 'Cable Pushdown (rope)' AND m.name IN ('Triceps'))
	OR (e.name = 'Cable Row' AND m.name IN ('Back', 'Biceps'))
	OR (e.name = 'Close Grip Bench Press' AND m.name IN ('Triceps', 'Chest'))
	OR (e.name = 'DB Lateral Raise' AND m.name IN ('Shoulders'))
	OR (e.name = 'Dips (BW)' AND m.name IN ('Chest', 'Triceps'))
	OR (e.name = 'Dumbbell Overhead Press' AND m.name IN ('Shoulders', 'Triceps'))
	OR (e.name = 'Dumbbell RDL' AND m.name IN ('Hamstrings', 'Glutes'))
	OR (e.name = 'Hack Squat Machine' AND m.name IN ('Quads', 'Glutes'))
	OR (e.name = 'Hammer Curl' AND m.name IN ('Biceps', 'Forearms'))
	OR (e.name = 'Incline Press Machine' AND m.name IN ('Chest', 'Shoulders'))
	OR (e.name = 'Lat Pull Down' AND m.name IN ('Back', 'Biceps'))
	OR (e.name = 'Leg Curl Machine' AND m.name IN ('Hamstrings'))
	OR (e.name = 'Leg Extension Machine' AND m.name IN ('Quads'))
	OR (e.name = 'Rear Delt Pec Deck' AND m.name IN ('Rear Delts'))
	OR (e.name = 'Reverse Curl' AND m.name IN ('Forearms', 'Biceps'))
	OR (e.name = 'Seated Calf Machine' AND m.name IN ('Calves'))
	OR (e.name = 'Seated Row' AND m.name IN ('Back', 'Biceps'))
	OR (e.name = 'Wrist Curl' AND m.name IN ('Forearms'));

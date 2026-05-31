INSERT OR IGNORE INTO `exercise` (`name`, `classification`) VALUES
	('Abs', 'bodyweight'),
	('Chin-up', 'bodyweight'),
	('Barbell Squat', 'standard'),
	('Bench Press', 'standard'),
	('Cable Curl (rope)', 'standard'),
	('Cable Lateral Raise', 'standard'),
	('Cable Pushdown (rope)', 'standard'),
	('Cable Row', 'standard'),
	('Close Grip Bench Press', 'standard'),
	('Dumbbell Lateral Raise', 'standard'),
	('Dips', 'bodyweight'),
	('Dumbbell Overhead Press', 'standard'),
	('Dumbbell RDL', 'standard'),
	('Hack Squat Machine', 'standard'),
	('Hammer Curl', 'standard'),
	('Incline Press Machine', 'standard'),
	('Lat Pull Down', 'standard'),
	('Leg Curl Machine', 'standard'),
	('Leg Extension Machine', 'standard'),
	('Rear Delt Pec Deck', 'standard'),
	('Reverse Curl', 'standard'),
	('Seated Calf Machine', 'standard'),
	('Seated Row', 'standard'),
	('Wrist Curl', 'standard');
--> statement-breakpoint
INSERT OR IGNORE INTO `muscle_group` (`name`, `color`) VALUES
  ('Back', '#1E88E5'),
  ('Biceps', '#43A047'),
  ('Calves', '#00897B'),
  ('Chest', '#E53935'),
  ('Core', '#FB8C00'),
  ('Forearms', '#6D4C41'),
  ('Glutes', '#8E24AA'),
  ('Hamstrings', '#7CB342'),
  ('Quads', '#00ACC1'),
  ('Rear Delts', '#D81B60'),
  ('Shoulders', '#039BE5'),
  ('Triceps', '#3949AB');
--> statement-breakpoint
INSERT OR IGNORE INTO `exercise_muscle_group` (`exercise_id`, `muscle_group_id`)
SELECT e.id, m.id FROM `exercise` e, `muscle_group` m WHERE
	(e.name = 'Abs' AND m.name IN ('Core'))
	OR (e.name = 'Chin-up' AND m.name IN ('Back', 'Biceps'))
	OR (e.name = 'Barbell Squat' AND m.name IN ('Quads', 'Hamstrings', 'Glutes'))
	OR (e.name = 'Bench Press' AND m.name IN ('Chest', 'Triceps'))
	OR (e.name = 'Cable Curl (rope)' AND m.name IN ('Biceps'))
	OR (e.name = 'Cable Lateral Raise' AND m.name IN ('Shoulders'))
	OR (e.name = 'Cable Pushdown (rope)' AND m.name IN ('Triceps'))
	OR (e.name = 'Cable Row' AND m.name IN ('Back', 'Biceps'))
	OR (e.name = 'Close Grip Bench Press' AND m.name IN ('Triceps', 'Chest'))
	OR (e.name = 'Dumbbell Lateral Raise' AND m.name IN ('Shoulders'))
	OR (e.name = 'Dips' AND m.name IN ('Chest', 'Triceps'))
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

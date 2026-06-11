ALTER TABLE `exercise` ADD `image_filename` text;
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '0277-9Ap7miY.jpg' WHERE `name` = 'Abs';
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '1326-T2mxWqc.jpg' WHERE `name` = 'Chin-up';
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '0043-qXTaZnJ.jpg' WHERE `name` = 'Barbell Squat';
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '0025-EIeI8Vf.jpg' WHERE `name` = 'Bench Press';
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '0868-G08RZcQ.jpg' WHERE `name` = 'Cable Curl (rope)';
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '0192-wEulIzp.jpg' WHERE `name` = 'Cable Lateral Raise';
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '0200-dU605di.jpg' WHERE `name` = 'Cable Pushdown (rope)';
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '0861-fUBheHs.jpg' WHERE `name` = 'Cable Row';
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '0030-J6Dx1Mu.jpg' WHERE `name` = 'Close Grip Bench Press';
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '0334-DsgkuIt.jpg' WHERE `name` = 'Dumbbell Lateral Raise';
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '0251-9WTm7dq.jpg' WHERE `name` = 'Dips';
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '0426-A6wtbuL.jpg' WHERE `name` = 'Dumbbell Overhead Press';
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '1459-rR0LJzx.jpg' WHERE `name` = 'Dumbbell RDL';
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '0743-Qa55kX1.jpg' WHERE `name` = 'Hack Squat Machine';
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '0313-slDvUAU.jpg' WHERE `name` = 'Hammer Curl';
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '1299-jHAnWmT.jpg' WHERE `name` = 'Incline Press Machine';
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '2616-4c9BhzB.jpg' WHERE `name` = 'Lat Pull Down';
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '0599-Zg3XY7P.jpg' WHERE `name` = 'Leg Curl Machine';
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '0585-my33uHU.jpg' WHERE `name` = 'Leg Extension Machine';
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '0602-myfUsKf.jpg' WHERE `name` = 'Rear Delt Pec Deck';
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '0358-BwSNDGt.jpg' WHERE `name` = 'Reverse Curl';
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '0594-bOOdeyc.jpg' WHERE `name` = 'Seated Calf Machine';
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '0588-IGjKj1v.jpg' WHERE `name` = 'Seated Row';
--> statement-breakpoint
UPDATE `exercise` SET `image_filename` = '0364-q8aHNoF.jpg' WHERE `name` = 'Wrist Curl';
--> statement-breakpoint
UPDATE `exercise` SET `name` = 'Decline Crunches' WHERE `name` = 'Abs';
--> statement-breakpoint
UPDATE `workout_log` SET `exercise_name` = 'Decline Crunches' WHERE `exercise_name` = 'Abs';
--> statement-breakpoint
UPDATE `routine_exercise` SET `exercise_name` = 'Decline Crunches' WHERE `exercise_name` = 'Abs';
--> statement-breakpoint
INSERT INTO `exercise` (`name`, `classification`, `image_filename`)
SELECT 'Dragonfly', 'bodyweight', '0491-eVxAzgz.jpg'
WHERE NOT EXISTS (SELECT 1 FROM `exercise` WHERE `name` = 'Dragonfly');
--> statement-breakpoint
INSERT OR IGNORE INTO `exercise_muscle_group` (`exercise_id`, `muscle_group_id`)
SELECT e.id, m.id FROM `exercise` e, `muscle_group` m
WHERE e.name = 'Dragonfly' AND m.name IN ('Core');

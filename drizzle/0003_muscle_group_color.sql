ALTER TABLE muscle_group ADD COLUMN color TEXT NOT NULL DEFAULT '#757575';
--> statement-breakpoint
UPDATE muscle_group SET color = CASE name
  WHEN 'Back'       THEN '#1E88E5'
  WHEN 'Biceps'     THEN '#43A047'
  WHEN 'Calves'     THEN '#00897B'
  WHEN 'Chest'      THEN '#E53935'
  WHEN 'Core'       THEN '#FB8C00'
  WHEN 'Forearms'   THEN '#6D4C41'
  WHEN 'Glutes'     THEN '#8E24AA'
  WHEN 'Hamstrings' THEN '#7CB342'
  WHEN 'Quads'      THEN '#00ACC1'
  WHEN 'Rear Delts' THEN '#D81B60'
  WHEN 'Shoulders'  THEN '#039BE5'
  WHEN 'Triceps'    THEN '#3949AB'
  ELSE color
END;

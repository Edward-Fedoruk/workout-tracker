import { routine } from '@/db/entities/routine/schema';
import { sql } from 'drizzle-orm';
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const routineWorkoutDraft = sqliteTable(
  'routine_workout_draft',
  {
    draftData: text('draft_data').notNull(),
    id: integer('id').primaryKey().default(1),
    routineId: integer('routine_id')
      .notNull()
      .references(() => routine.id, { onDelete: 'cascade' }),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [check('singleton_check', sql`${table.id} = 1`)],
);

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const muscleGroup = sqliteTable('muscle_group', {
  color: text('color').notNull().default('#757575'),
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
});

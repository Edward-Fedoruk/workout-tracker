import { sql } from 'drizzle-orm';
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const routine = sqliteTable(
  'routine',
  {
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [check('routine_name_length', sql`length(${table.name}) <= 100`)],
);

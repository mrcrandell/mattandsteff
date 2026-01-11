import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const timestamps = {
  updatedAt: text('updatedAt')
  .notNull()
  .default(sql`(current_timestamp)`),
  createdAt: text('createdAt')
  .notNull()
  .default(sql`(current_timestamp)`),
}
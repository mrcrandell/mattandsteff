import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { timestamps } from './columns.helpers';
import { posts } from './posts';
import { assets } from './assets';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => uuid()),
  name: text('name').notNull(),
  phone: text('phone').notNull().unique(),
  ...timestamps
});

export const usersRelations = relations(users, ({ many }) => ({
	posts: many(posts),
  assets: many(assets)
}));
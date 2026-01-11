import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import * as t from "drizzle-orm/sqlite-core";
import { v4 as uuid } from 'uuid';
import { users } from './users';
import { timestamps } from './columns.helpers';
import { assetsPosts } from './assetsPosts';

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => uuid()),
  text: text(),
  userId: text("userId").references(() => users.id),
  ...timestamps
});

export const postsRelations = relations(posts, ({ one, many }) => ({
	user: one(users, {
		fields: [posts.userId],
		references: [users.id],
	}),
  assetsPosts: many(assetsPosts)
}));
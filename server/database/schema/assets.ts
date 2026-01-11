import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import * as t from "drizzle-orm/sqlite-core";
import { v4 as uuid } from 'uuid';
import { users } from './users';
import { timestamps } from './columns.helpers';
import { assetsPosts } from './assetsPosts';
import { posts } from './posts';

export const assets = sqliteTable('assets', {
  id: text('id').primaryKey().$defaultFn(() => uuid()),
  path: text(),
  userId: text("userId").references(() => users.id),
  ...timestamps
});

export const assetsRelations = relations(assets, ({ one, many }) => ({
  user: one(users, {
    fields: [assets.userId],
    references: [users.id],
  }),
  assetsPosts: many(assetsPosts)
}));
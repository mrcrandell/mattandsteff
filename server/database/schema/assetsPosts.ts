import { sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { assets } from './assets';
import { posts } from './posts';


export const assetsPosts = sqliteTable(
  'assetsPosts',
  {
    assetId: text('assetId')
      .notNull()
      .references(() => assets.id),
    postId: text('groupId')
      .notNull()
      .references(() => posts.id),
  },
  (t) => [
		primaryKey({ columns: [t.assetId, t.postId] })
	],
);
export const assetsPostsRelations = relations(assetsPosts, ({ one }) => ({
  post: one(posts, {
    fields: [assetsPosts.postId],
    references: [posts.id],
  }),
  asset: one(assets, {
    fields: [assetsPosts.assetId],
    references: [assets.id],
  }),
}));
import { drizzle } from 'drizzle-orm/d1'
export { sql, eq, and, or } from 'drizzle-orm'

// Import everything from the schema directory
import * as schema from '../database/schema/index'

export const tables = schema

export function useDrizzle() {
  return drizzle(hubDatabase(), { schema })
}

export type User = typeof schema.users.$inferSelect
export type Post = typeof schema.posts.$inferSelect
export type Asset = typeof schema.assets.$inferSelect
export type AssetsPost = typeof schema.assetsPosts.$inferSelect
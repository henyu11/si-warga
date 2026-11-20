import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

const databaseUrl = process.env.DATABASE_URL || 'file:./data/siwarga.db'
const databaseAuthToken = process.env.DATABASE_AUTH_TOKEN

const client = createClient({
  url: databaseUrl,
  authToken: databaseAuthToken,
})

export const db = drizzle(client, { schema })
export type DB = typeof db
export { client }

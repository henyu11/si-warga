import fs from 'fs'
import path from 'path'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

const databaseUrl = process.env.DATABASE_URL || 'file:./data/siwarga.db'
const databaseAuthToken = process.env.DATABASE_AUTH_TOKEN

// Ensure local directory exists when running with a local file URL
if (databaseUrl.startsWith('file:')) {
  try {
    const rawPath = databaseUrl.replace(/^file:/, '')
    const absPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath)
    const dir = path.dirname(absPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  } catch {
    // In restricted/read-only environments, suppress error
  }
}

const client = createClient({
  url: databaseUrl,
  authToken: databaseAuthToken,
})

export const db = drizzle(client, { schema })
export type DB = typeof db
export { client }

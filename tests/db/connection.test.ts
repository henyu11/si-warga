import { describe, it, expect } from 'vitest'
import { db } from '@/db'
import { users, cashBooks } from '@/db/schema'
import { eq } from 'drizzle-orm'

describe('Database connection & queries', () => {
  it('should connect and return db client', () => {
    expect(db).toBeDefined()
  })

  it('should query seeded admin user', async () => {
    const adminUser = await db.select().from(users).where(eq(users.username, 'admin')).get()
    expect(adminUser).toBeDefined()
    expect(adminUser?.role).toBe('ADMIN')
    expect(adminUser?.fullName).toBe('Administrator RT 04')
  })

  it('should query seeded dual cash books', async () => {
    const books = await db.select().from(cashBooks).all()
    expect(books.length).toBe(2)
    const bookTypes = books.map(b => b.bookType)
    expect(bookTypes).toContain('KAS_UMUM')
    expect(bookTypes).toContain('KAS_KEAMANAN')
  })
})

# siWarga RT/RW Management App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun aplikasi web mobile-responsive manajemen RT/RW (siWarga) dengan 10 fitur utama: autentikasi RBAC, manajemen warga, tarif dinamis, tagihan bulanan, pembayaran dual-kas, penagihan WhatsApp, dual buku kas, dashboard, audit trail, dan export PDF/CSV.

**Architecture:** Next.js 15 App Router (TypeScript) dengan modular monolith — REST API di `/api/v1/*`, domain service layer, dan Drizzle ORM atas SQLite/Turso. UI menggunakan Tailwind CSS + shadcn/ui dengan design system "SiWarga Civic Balance" (teal primary, emerald Kas Umum, blue Kas Keamanan). Deployment gratis di Vercel Hobby + Turso Starter + Cloudflare R2.

**Tech Stack:**
- **Frontend:** Next.js 15 (App Router, TypeScript), Tailwind CSS, shadcn/ui, Plus Jakarta Sans, Sonner (toast), Recharts (grafik), @tanstack/react-query
- **Backend:** Next.js Route Handlers (Node.js runtime), Zod (validasi), jose (JWT), bcryptjs (hash)
- **Database:** Drizzle ORM + @libsql/client (Turso/SQLite WAL), drizzle-kit (migrasi)
- **Storage:** Cloudflare R2 (foto nota, backup SQLite harian)
- **Testing:** Vitest (unit), Playwright (e2e)
- **CI/CD:** GitHub Actions (lint + test + backup cron)

**Spec:** `source-awal/` — meliputi BRD, PRD, Function List (F-001–F-010), Schema Database & ERD, Rancangan Arsitektur, API Contract, Design System & Screen Inventory, Struktur Proyek, Audit Teknis. UI reference: `stitch_siwarga/` (11 screen mockup HTML + design system DESIGN.md).

---

## Global Constraints

- Next.js 15.x, TypeScript strict mode, Node.js 20+ runtime
- Tailwind CSS 3.4+, shadcn/ui (Radix primitives), Plus Jakarta Sans via Google Fonts
- Drizzle ORM 0.30+, @libsql/client 0.6+, drizzle-kit 0.21+
- Password hash: bcryptjs cost 12 (Node.js runtime Vercel aman tanpa native build)
- JWT: HTTP-only Secure SameSite=Lax Cookie `rtrw_session`, max-age 86400
- RBAC role enum: `ADMIN | BENDAHARA | KETUA` — divalidasi backend setiap endpoint
- Semua nominal Rupiah: integer (sen tidak dipakai), format `Rp 50.000` di UI dengan `tabular-nums`
- Nomor WA: normalisasi otomatis ke format `628xxx` saat simpan
- Foto nota/bukti: max 2 MB, MIME JPG/PNG/WebP, rename ke UUID, upload via Presigned R2 URL
- SQLite PRAGMA: `foreign_keys = ON`, `journal_mode = WAL`, `synchronous = NORMAL`
- API prefix: `/api/v1/` semua endpoint; response envelope: `{ success, message, data, errors? }`
- Audit Trail append-only: tidak ada endpoint DELETE/UPDATE pada `audit_logs`
- Warna design system: Primary `#0F766E`, Kas Umum `#059669`, Kas Keamanan `#1D4ED8`, WA `#16A34A`
- Touch target minimum 44×44px di mobile, bottom nav 5-kolom (Beranda, Tagihan, Tagih WA, Kas, Menu)
- Semua copy Rupiah: `tabular-nums`, pemisah ribuan titik, prefix `Rp`

## Review Focus

1. **Generate tagihan duplikat:** `POST /bills/generate` dipanggil dua kali pada bulan yang sama → harus idempoten (`INSERT ... ON CONFLICT DO NOTHING`), `created_count=0`, `skipped_existing_count=N`
2. **Routing kas salah saat void pembayaran:** Void `payment` harus membalik saldo Kas Umum (dari Iuran Wajib) DAN Kas Keamanan (dari Iuran Keamanan+Denda) secara atomik dalam satu transaksi DB
3. **Tarif baru menimpa tagihan Lunas:** `POST /fee-rates` dengan `apply_to_unpaid_current_month=true` hanya boleh update `bill_items` berstatus `UNPAID`; item `PAID` tidak boleh berubah
4. **JWT expired/invalid masih lolos middleware:** Setiap request ke `(dashboard)` dan `/api/v1/*` (kecuali `/auth/login`) harus ditolak `401` jika cookie tidak ada atau token expired
5. **Soft delete warga masih tertagih:** Warga `deleted_at IS NOT NULL` tidak boleh muncul di generate tagihan; histori bayar lama tetap tersimpan dan bisa dilihat

---

## Task 1: Project Scaffolding & Design System Foundation

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`
- Create: `src/app/globals.css` — token warna SiWarga Civic Balance
- Create: `src/app/layout.tsx` — Plus Jakarta Sans, Sonner provider
- Create: `public/robots.txt`, `public/manifest.webmanifest`
- Create: `.env.example`, `.gitignore`, `.github/workflows/ci.yml`

**Interfaces:**
- Produces: Tailwind token `kas-umum-*`, `kas-keamanan-*`, `wa-green-*`, `primary-*` tersedia global; `<RootLayout>` dengan ToastProvider siap dipakai Task berikutnya

- [ ] **Step 1: Init Next.js 15 project dengan TypeScript**

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --no-git
```

Expected: `package.json` terbentuk dengan `next@^15`, `react@^19`

- [ ] **Step 2: Install dependencies core**

```bash
npm install @libsql/client drizzle-orm drizzle-kit bcryptjs jose zod sonner @tanstack/react-query recharts clsx tailwind-merge lucide-react
npm install -D @types/bcryptjs vitest @vitejs/plugin-react playwright @playwright/test
```

- [ ] **Step 3: Install shadcn/ui dan init komponen dasar**

```bash
npx shadcn@latest init
npx shadcn@latest add button input label badge card dialog sheet table tabs select textarea
```

Expected: `components.json` terbentuk, komponen ada di `src/components/ui/`

- [ ] **Step 4: Tulis `tailwind.config.ts` dengan token SiWarga**

Extend `colors` di `theme.extend`:
```ts
'primary': { DEFAULT: '#0F766E', hover: '#115E59', soft: '#F0FDFA' },
'kas-umum': { DEFAULT: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
'kas-keamanan': { DEFAULT: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
'wa-green': { DEFAULT: '#16A34A', hover: '#15803D' },
```
Font family: `'Plus Jakarta Sans'` sebagai `sans`.

- [ ] **Step 5: Tulis `src/app/globals.css`**

Import Plus Jakarta Sans dari Google Fonts, set `body { font-family: 'Plus Jakarta Sans', sans-serif; }`, custom CSS untuk `tabular-nums` class.

- [ ] **Step 6: Tulis `src/app/layout.tsx`**

Import font, wrap `<Toaster />` dari Sonner, set `lang="id"`, meta viewport mobile.

- [ ] **Step 7: Tulis `public/robots.txt`**

```
User-agent: *
Disallow: /
```

- [ ] **Step 8: Tulis `.env.example`**

```
DATABASE_URL=libsql://your-db.turso.io
DATABASE_AUTH_TOKEN=
JWT_SECRET=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

- [ ] **Step 9: Tulis `.github/workflows/ci.yml`**

Jobs: `lint` (eslint), `typecheck` (tsc --noEmit), `test` (vitest run). Trigger: `push` dan `pull_request` ke `main`.

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat: project scaffold, tailwind design system, shadcn/ui init"
```

---

## Task 2: Database Schema & Drizzle ORM Setup

**Files:**
- Create: `src/db/index.ts` — koneksi Turso/SQLite
- Create: `src/db/schema.ts` — semua tabel (12 tabel lengkap)
- Create: `drizzle.config.ts`
- Create: `drizzle/` — migrasi SQL hasil generate

**Interfaces:**
- Produces: exported typed schema dari `@/db/schema` — `users`, `households`, `feeRates`, `appSettings`, `bills`, `billItems`, `payments`, `paymentAllocations`, `cashBooks`, `cashCategories`, `cashTransactions`, `auditLogs` — siap di-import service layer Task 3+

- [ ] **Step 1: Tulis failing test untuk koneksi DB**

```ts
// tests/db/connection.test.ts
import { describe, it, expect } from 'vitest'
import { db } from '@/db'

describe('Database connection', () => {
  it('should connect and return db client', () => {
    expect(db).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test — pastikan FAIL**

```bash
npm run test -- tests/db/connection.test.ts
```
Expected: FAIL — `@/db` not found

- [ ] **Step 3: Tulis `src/db/index.ts`**

```ts
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

export const db = drizzle(client, { schema })
export type DB = typeof db
```

- [ ] **Step 4: Tulis `src/db/schema.ts`** — 12 tabel sesuai ERD:

Definisikan dengan Drizzle SQLite dialect:
- `users`: `id TEXT PK`, `full_name`, `username UNIQUE`, `email UNIQUE`, `password_hash`, `role CHECK IN ('ADMIN','BENDAHARA','KETUA')`, `is_active`, timestamps
- `households`: `id`, `block_number UNIQUE WHERE deleted_at IS NULL`, `head_name`, `phone_wa`, `occupancy_status CHECK IN ('TETAP','KONTRAK','KOSONG')`, `is_billing_active DEFAULT 1`, `custom_rate_override TEXT(JSON)`, `notes`, `deleted_at`, timestamps
- `fee_rates`: `id`, `fee_type CHECK IN ('IURAN_WAJIB','IURAN_KEAMANAN','DENDA_RONDA')`, `amount INTEGER`, `effective_from TEXT`, `is_active DEFAULT 1`, `change_reason`, `created_by REF users`, `created_at`
- `app_settings`: `key TEXT PK`, `value TEXT`, `updated_by REF users`, `updated_at`
- `bills`: `id`, `household_id REF households`, `period_year`, `period_month`, `status CHECK IN ('UNPAID','PARTIAL','PAID')`, `due_date`, `generated_by REF users`, timestamps. UNIQUE(`household_id`, `period_year`, `period_month`)
- `bill_items`: `id`, `bill_id REF bills`, `item_type CHECK IN ('IURAN_WAJIB','IURAN_KEAMANAN','DENDA_RONDA')`, `amount_due INTEGER`, `amount_paid DEFAULT 0`, `status CHECK IN ('UNPAID','PARTIAL','PAID')`, `override_reason`, `fine_date`, `fine_note`, timestamps
- `payments`: `id`, `bill_id REF bills`, `paid_amount INTEGER`, `payment_method CHECK IN ('TUNAI','TRANSFER')`, `receipt_file_key`, `notes`, `is_voided DEFAULT 0`, `void_reason`, `voided_by REF users`, `voided_at`, `created_by REF users`, timestamps
- `payment_allocations`: `id`, `payment_id REF payments`, `bill_item_id REF bill_items`, `allocated_amount INTEGER`, `cash_book_id REF cash_books`, `cash_transaction_id REF cash_transactions`
- `cash_books`: `id`, `book_type CHECK IN ('KAS_UMUM','KAS_KEAMANAN')`, `name`, `bank_name`, `account_number`, `is_active DEFAULT 1`, timestamps
- `cash_categories`: `id`, `cash_book_id REF cash_books`, `name`, `transaction_type CHECK IN ('INCOME','EXPENSE')`, `is_default DEFAULT 0`
- `cash_transactions`: `id`, `cash_book_id REF cash_books`, `category_id REF cash_categories`, `transaction_type CHECK IN ('INCOME','EXPENSE')`, `amount INTEGER`, `description`, `transaction_date TEXT`, `payment_id REF payments`, `receipt_file_key`, `is_locked DEFAULT 0`, `status CHECK IN ('POSTED','VOIDED')`, `void_reason`, `voided_by`, `voided_at`, `created_by REF users`, timestamps
- `audit_logs`: `id`, `actor_user_id REF users`, `actor_role`, `module`, `entity_type`, `entity_id`, `action CHECK IN ('CREATE','UPDATE','RATE_CHANGE','OVERRIDE','VOID','SOFT_DELETE')`, `old_values TEXT(JSON)`, `new_values TEXT(JSON)`, `reason`, `ip_address`, `created_at` — **TANPA** `updated_at`

- [ ] **Step 5: Tulis `drizzle.config.ts`**

```ts
export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
}
```

- [ ] **Step 6: Generate dan run migrasi**

```bash
npx drizzle-kit generate && npx drizzle-kit migrate
```

Expected: file SQL di `drizzle/` terbentuk; migrasi sukses ke DB lokal

- [ ] **Step 7: Seed data awal (cash_books, cash_categories default)**

Tulis `src/db/seed.ts`: insert 2 `cash_books` (KAS_UMUM, KAS_KEAMANAN), insert kategori default per buku, insert 1 user ADMIN default (`admin`, password `Admin123!`).

```bash
npx tsx src/db/seed.ts
```

- [ ] **Step 8: Run test — pastikan PASS**

```bash
npm run test -- tests/db/connection.test.ts
```
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: drizzle schema 12 tables, seed data, turso connection"
```

---

## Task 3: Auth Middleware & RBAC

**Files:**
- Create: `src/lib/auth.ts` — JWT sign/verify dengan jose
- Create: `src/lib/password.ts` — bcryptjs hash/compare
- Create: `src/middleware.ts` — Next.js middleware RBAC
- Create: `src/server/services/auth.service.ts`
- Create: `src/app/api/v1/auth/login/route.ts`
- Create: `src/app/api/v1/auth/logout/route.ts`
- Create: `src/app/api/v1/auth/me/route.ts`
- Test: `tests/api/auth.test.ts`

**Interfaces:**
- Consumes: `db.users` dari Task 2
- Produces:
  - `signJwt(payload: { userId: string; role: string }): Promise<string>`
  - `verifyJwt(token: string): Promise<{ userId: string; role: string } | null>`
  - `hashPassword(plain: string): Promise<string>`
  - `comparePassword(plain: string, hash: string): Promise<boolean>`
  - Middleware: request ke `(dashboard)` dan `/api/v1/*` (kecuali `/api/v1/auth/login`) di-redirect/reject jika tidak autentikasi
  - Helper `getSessionUser(req): Promise<{ userId, role } | null>` untuk dipakai semua route handler

- [ ] **Step 1: Tulis failing test**

```ts
// tests/api/auth.test.ts
import { describe, it, expect } from 'vitest'
import { hashPassword, comparePassword } from '@/lib/password'
import { signJwt, verifyJwt } from '@/lib/auth'

describe('Auth helpers', () => {
  it('hashPassword and comparePassword work correctly', async () => {
    const hash = await hashPassword('TestPass123!')
    expect(await comparePassword('TestPass123!', hash)).toBe(true)
    expect(await comparePassword('wrong', hash)).toBe(false)
  })

  it('signJwt and verifyJwt roundtrip', async () => {
    const token = await signJwt({ userId: 'u-001', role: 'ADMIN' })
    const payload = await verifyJwt(token)
    expect(payload?.userId).toBe('u-001')
    expect(payload?.role).toBe('ADMIN')
  })
})
```

- [ ] **Step 2: Run test — pastikan FAIL**

```bash
npm run test -- tests/api/auth.test.ts
```

- [ ] **Step 3: Implementasi `src/lib/password.ts`**

Signature: `hashPassword(plain: string): Promise<string>`, `comparePassword(plain, hash): Promise<boolean>` — gunakan bcryptjs cost 12.

- [ ] **Step 4: Implementasi `src/lib/auth.ts`**

Signature: `signJwt(payload): Promise<string>` (expire 24h dengan jose `SignJWT`), `verifyJwt(token): Promise<Payload | null>` (return null jika expired/invalid).

- [ ] **Step 5: Run test — pastikan PASS**

```bash
npm run test -- tests/api/auth.test.ts
```

- [ ] **Step 6: Implementasi `src/server/services/auth.service.ts`**

- `loginUser(identifier: string, password: string): Promise<{ user: UserPublic } | { error: string }>`  
  Query `users` by `username OR email` dimana `is_active=1`, compare password, return user fields tanpa `password_hash`.
- `getSessionUser(cookieStore: ReadonlyRequestCookies): Promise<SessionUser | null>`  
  Extract `rtrw_session` cookie → `verifyJwt` → query DB untuk validasi user masih aktif.

- [ ] **Step 7: Implementasi `POST /api/v1/auth/login/route.ts`**

Zod schema: `{ identifier: string.min(1), password: string.min(1) }`. Rate limit 5 gagal/15 menit via in-memory counter (cukup untuk single RT). Set cookie `rtrw_session` HttpOnly Secure SameSite=Lax. Return `200` + user data atau `401` generik.

- [ ] **Step 8: Implementasi `GET /api/v1/auth/me/route.ts`**

Return current user dari session atau `401`.

- [ ] **Step 9: Implementasi `POST /api/v1/auth/logout/route.ts`**

Clear cookie `rtrw_session`, return `200`.

- [ ] **Step 10: Implementasi `src/middleware.ts`**

```ts
// Matcher: ['/((?!_next|api/v1/auth/login|login|public).*)']
// Verify JWT cookie; redirect to /login jika invalid
// Attach user role ke request header X-User-Id dan X-User-Role
```

- [ ] **Step 11: Commit**

```bash
git add -A && git commit -m "feat: JWT auth, bcrypt, RBAC middleware, login/logout/me endpoints"
```

---

## Task 4: Halaman Login (SCR-001)

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/components/auth/LoginForm.tsx`

**Interfaces:**
- Consumes: `POST /api/v1/auth/login`
- Produces: Halaman `/login` fungsional; redirect ke `/` setelah berhasil

- [ ] **Step 1: Implementasi `LoginForm.tsx`**

Client component: form `identifier` + `password`, submit ke `/api/v1/auth/login` via fetch, handle loading state, tampilkan toast error (Sonner) jika `401`, redirect ke `/` jika berhasil. UI sesuai `stitch_siwarga/masuk_siwarga_rt_04_rw_02/code.html`: logo RT, card center, input dengan label, button primary teal.

- [ ] **Step 2: Implementasi `src/app/login/page.tsx`**

Server component; redirect ke `/` jika sudah ada session valid. Render `<LoginForm />`.

- [ ] **Step 3: Playwright test login flow**

```ts
// tests/e2e/auth.spec.ts
test('login with valid credentials redirects to dashboard', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name=identifier]', 'admin')
  await page.fill('[name=password]', 'Admin123!')
  await page.click('button[type=submit]')
  await expect(page).toHaveURL('/')
})

test('login with invalid credentials shows error', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name=identifier]', 'admin')
  await page.fill('[name=password]', 'salah')
  await page.click('button[type=submit]')
  await expect(page.locator('[data-sonner-toast]')).toBeVisible()
})
```

- [ ] **Step 4: Run e2e test**

```bash
npx playwright test tests/e2e/auth.spec.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: login page SCR-001 with form, toast, redirect"
```

---

## Task 5: Dashboard Layout (Sidebar + Bottom Nav)

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/MobileBottomNav.tsx`
- Create: `src/components/layout/RoleGuard.tsx`

**Interfaces:**
- Consumes: session user dari middleware header `X-User-Role`
- Produces: Shared layout yang membungkus semua halaman dashboard; navigasi 5 item (Beranda, Tagihan, Tagih WA, Kas, Menu) dengan highlight aktif; role-aware menu visibility

- [ ] **Step 1: Implementasi `src/app/(dashboard)/layout.tsx`**

Server component: baca session dari cookie server-side; redirect ke `/login` jika tidak ada. Render `<Sidebar>` (hidden mobile) + `<MobileBottomNav>` (visible mobile, `md:hidden`). Pass `role` via context ke children.

- [ ] **Step 2: Implementasi `Sidebar.tsx`**

Desktop only (`hidden md:flex`). Nav links: Beranda (`/`), Tagihan (`/tagihan`), Penagihan WA (`/penagihan-wa`), Buku Kas (`/kas`), Data Warga (`/warga`) — Ketua/Admin only, Pengaturan (`/pengaturan`) — Admin only, Audit Log (`/audit-log`), Pengguna (`/pengguna`) — Admin only. Active state: teal background + text.

- [ ] **Step 3: Implementasi `MobileBottomNav.tsx`**

Client component fixed bottom. 5 kolom: Beranda (home icon), Tagihan (receipt), Tagih WA (whatsapp — center dengan circle bg `#16A34A`), Kas (account_balance_wallet), Menu (more_horiz). Active: teal label + icon; inactive: slate-500.

- [ ] **Step 4: Implementasi `RoleGuard.tsx`**

Client component: `<RoleGuard roles={['ADMIN']}><children /></RoleGuard>` — render null jika role tidak match; dipakai untuk hide tombol aksi yang tidak sesuai role.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: dashboard layout, sidebar desktop, mobile bottom nav 5-col, RoleGuard"
```

---

## Task 6: User Management — API & Halaman Pengguna (F-001, SCR-011)

**Files:**
- Create: `src/server/services/user.service.ts`
- Create: `src/app/api/v1/users/route.ts` — GET list, POST create
- Create: `src/app/api/v1/users/[id]/route.ts` — GET, PATCH, DELETE (soft)
- Create: `src/app/(dashboard)/pengguna/page.tsx`
- Create: `src/components/users/UserTable.tsx`, `UserFormDialog.tsx`
- Test: `tests/api/users.test.ts`

**Interfaces:**
- Consumes: `db.users`, `auditService.log()` dari Task 2+3
- Produces:
  - `GET /api/v1/users` → `UserPublic[]` (ADMIN only)
  - `POST /api/v1/users` → `UserPublic` (ADMIN only)
  - `PATCH /api/v1/users/:id` → update nama/email/role/status (ADMIN only)
  - `DELETE /api/v1/users/:id` → soft deactivate `is_active=0` (ADMIN only)

- [ ] **Step 1: Tulis failing test**

```ts
// tests/api/users.test.ts
it('GET /api/v1/users returns 403 for BENDAHARA', async () => {
  // mock session role=BENDAHARA, expect 403
})
it('POST /api/v1/users creates user with hashed password', async () => {
  // mock admin session, post valid body, expect 201 + user without password_hash
})
```

- [ ] **Step 2: Run test — FAIL**

```bash
npm run test -- tests/api/users.test.ts
```

- [ ] **Step 3: Implementasi `user.service.ts`**

- `listUsers(): Promise<UserPublic[]>`
- `createUser(data: CreateUserDto): Promise<UserPublic>` — hash password, insert, audit log `CREATE`
- `updateUser(id, data: UpdateUserDto, actor): Promise<UserPublic>` — patch fields, audit log `UPDATE`
- `deactivateUser(id, actor): Promise<void>` — set `is_active=0`, audit log `UPDATE`

- [ ] **Step 4: Implementasi route handlers `/api/v1/users`**

Zod schema create: `{ full_name, username, email, password: min(8), role: enum }`. ADMIN-only guard via `getSessionUser`. Audit trail on create/update.

- [ ] **Step 5: Run test — PASS**

```bash
npm run test -- tests/api/users.test.ts
```

- [ ] **Step 6: Implementasi `UserTable.tsx` dan `UserFormDialog.tsx`**

Table: Nama, Username, Email, Role badge, Status badge, Aksi (Edit/Nonaktifkan). Dialog: form field, submit via fetch, invalidate query. UI sesuai `manajemen_akun_pengurus_siwarga_rt_04/code.html`.

- [ ] **Step 7: Implementasi `/pengguna/page.tsx`**

Server fetch initial data, render `<UserTable>`, FAB "+ Tambah Pengguna" untuk ADMIN.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: F-001 user management API + halaman pengguna SCR-011"
```

---

## Task 7: Manajemen Data Warga — API & Halaman (F-002, SCR-008)

**Files:**
- Create: `src/server/services/household.service.ts`
- Create: `src/app/api/v1/households/route.ts` — GET (list+search+filter), POST
- Create: `src/app/api/v1/households/[id]/route.ts` — GET, PATCH, DELETE (soft)
- Create: `src/app/(dashboard)/warga/page.tsx`
- Create: `src/components/households/HouseholdTable.tsx`, `HouseholdFormSheet.tsx`
- Test: `tests/api/households.test.ts`

**Interfaces:**
- Consumes: `db.households`, `auditService.log()`
- Produces:
  - `GET /api/v1/households?search=&status=&is_active=` → `Household[]` paginated
  - `POST /api/v1/households` → `Household` (ADMIN, BENDAHARA)
  - `PATCH /api/v1/households/:id` → update (ADMIN, BENDAHARA)
  - `DELETE /api/v1/households/:id` → soft delete `deleted_at = now()` (ADMIN only)

- [ ] **Step 1: Tulis failing test**

```ts
it('phone_wa normalized to 628xxx format on save', async () => {
  // POST { phone_wa: '08123456789' } → stored as '628123456789'
})
it('soft deleted household not included in active listing', async () => {
  // delete household, GET list → not appear; GET /id → 404
})
```

- [ ] **Step 2: Run test — FAIL**

- [ ] **Step 3: Implementasi `household.service.ts`**

- `normalizePhoneWa(phone: string): string` — strip `0`/`+62`/`62` prefix, prepend `62`
- `listHouseholds(filters): Promise<HouseholdWithStatus[]>`
- `createHousehold(data, actor): Promise<Household>` — normalize WA, insert, audit `CREATE`
- `updateHousehold(id, data, actor): Promise<Household>` — patch, audit `UPDATE`
- `softDeleteHousehold(id, actor): Promise<void>` — set `deleted_at`, audit `SOFT_DELETE`

- [ ] **Step 4: Implementasi route handlers**

Zod schema: `block_number required`, `head_name required`, `phone_wa required`, `occupancy_status enum`, `is_billing_active boolean`. RBAC: GET = semua role; POST/PATCH = ADMIN/BENDAHARA; DELETE = ADMIN only.

- [ ] **Step 5: Run test — PASS**

- [ ] **Step 6: Implementasi `HouseholdTable.tsx` dan `HouseholdFormSheet.tsx`**

Table: Blok/Nomor, Kepala Keluarga, No WA, Status Hunian badge, Aktif Tagihan toggle, Aksi. Sheet: form lengkap + tombol Nonaktifkan (confirm dialog). UI sesuai `data_warga_rumah_siwarga_rt_04/code.html`.

- [ ] **Step 7: Implementasi `/warga/page.tsx`**

Search bar, filter status hunian, tabel, FAB "+ Tambah Warga".

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: F-002 household CRUD + normalisasi WA + soft delete, halaman warga SCR-008"
```

---

## Task 8: Pengaturan Tarif, Rekening & Template WA — API & Halaman (F-003, SCR-009)

**Files:**
- Create: `src/server/services/settings.service.ts`
- Create: `src/app/api/v1/fee-rates/route.ts` — GET active, POST new rate
- Create: `src/app/api/v1/fee-rates/impact-preview/route.ts`
- Create: `src/app/api/v1/settings/route.ts` — GET, PATCH app_settings
- Create: `src/app/(dashboard)/pengaturan/page.tsx`
- Create: `src/components/settings/FeeRateCard.tsx`, `FeeRateChangeDialog.tsx`
- Test: `tests/api/fee-rates.test.ts`

**Interfaces:**
- Consumes: `db.feeRates`, `db.appSettings`, `db.billItems`, `auditService.log()`
- Produces:
  - `GET /api/v1/fee-rates` → `{ active_rates: FeeRate[], history: FeeRate[] }`
  - `POST /api/v1/fee-rates` → creates new active rate, deactivates old, optionally updates unpaid bill_items → audit `RATE_CHANGE`
  - `GET /api/v1/fee-rates/impact-preview?fee_type=&month=&year=` → `{ affected_count: number }`
  - `GET /api/v1/settings` → key-value map (rekening, template WA)
  - `PATCH /api/v1/settings` → update settings

- [ ] **Step 1: Tulis failing test**

```ts
it('POST fee-rates with apply_to_unpaid=true only updates UNPAID bill_items', async () => {
  // create a PAID bill_item and UNPAID bill_item
  // POST new rate with apply_to_unpaid_current_month=true
  // PAID item amount unchanged; UNPAID item updated
})
it('POST fee-rates creates audit log with old and new amount', async () => {
  // POST new rate → audit_logs has old_values.amount, new_values.amount
})
```

- [ ] **Step 2: Run test — FAIL**

- [ ] **Step 3: Implementasi `settings.service.ts`**

- `getActiveFeeRates(): Promise<ActiveRates>` — query `fee_rates WHERE is_active=1`
- `createFeeRate(data: CreateFeeRateDto, actor): Promise<FeeRate>` — dalam 1 transaksi DB: set `is_active=0` pada rate lama, insert rate baru, jika `apply_to_unpaid=true` update `bill_items` bulan berjalan yang `status=UNPAID` dan `item_type` matching, log audit `RATE_CHANGE`
- `getSettings(): Promise<Record<string, string>>`
- `updateSettings(data, actor): Promise<void>` — upsert `app_settings`, audit `UPDATE`

- [ ] **Step 4: Implementasi route handlers**

Zod schema fee-rate: `{ fee_type: enum, amount: int.positive, effective_from: string(date), change_reason: string.min(10), apply_to_unpaid_current_month: boolean }`. RBAC: GET = semua; POST = ADMIN/BENDAHARA.

- [ ] **Step 5: Run test — PASS**

- [ ] **Step 6: Implementasi UI halaman pengaturan**

Tiga card tarif (Iuran Wajib, Iuran Keamanan, Denda Ronda) dengan nominal aktif, tombol "Ubah Tarif" → `FeeRateChangeDialog` (form + impact preview counter + confirm warning "akan tercatat di Audit Trail"). Section rekening bank + template WA. UI sesuai `pengaturan_tarif_aplikasi_siwarga_rt_04/code.html`.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: F-003 tarif dinamis + audit trail + settings + halaman pengaturan SCR-009"
```

---

## Task 9: Generate Tagihan & Denda Ronda — API (F-004)

**Files:**
- Create: `src/server/services/billing.service.ts`
- Create: `src/app/api/v1/bills/route.ts` — GET list
- Create: `src/app/api/v1/bills/generate/route.ts` — POST idempoten
- Create: `src/app/api/v1/bills/[id]/route.ts` — GET detail
- Create: `src/app/api/v1/bills/[id]/fines/route.ts` — POST Denda Ronda
- Create: `src/app/api/v1/bill-items/[itemId]/route.ts` — PATCH override nominal
- Test: `tests/api/billing.test.ts`

**Interfaces:**
- Consumes: `db.bills`, `db.billItems`, `db.households` (active where `is_billing_active=1 AND deleted_at IS NULL`), `db.feeRates` (active), `auditService.log()`
- Produces:
  - `POST /api/v1/bills/generate` → idempoten per `(household_id, year, month)`; return `{ created_count, skipped_existing_count, applied_rates }`
  - `GET /api/v1/bills?year=&month=&status=&search=` → paginated list dengan household info
  - `GET /api/v1/bills/:id` → detail + bill_items + payment history
  - `POST /api/v1/bills/:id/fines` → tambah `DENDA_RONDA` item; re-open bill dari PAID ke PARTIAL jika perlu
  - `PATCH /api/v1/bill-items/:itemId` → override `amount_due`, audit `OVERRIDE` dengan reason wajib

- [ ] **Step 1: Tulis failing test — idempotency**

```ts
it('generate twice same period returns skipped_existing_count on second call', async () => {
  await POST('/api/v1/bills/generate', { period_year: 2026, period_month: 11, due_date: '2026-11-10' })
  const res2 = await POST('/api/v1/bills/generate', { period_year: 2026, period_month: 11, due_date: '2026-11-10' })
  expect(res2.data.created_count).toBe(0)
  expect(res2.data.skipped_existing_count).toBeGreaterThan(0)
})
```

- [ ] **Step 2: Run test — FAIL**

- [ ] **Step 3: Implementasi `billing.service.ts`**

- `generateMonthlyBills(year, month, due_date, actor): Promise<GenerateResult>` — dalam 1 transaksi: query KK aktif, fetch rate aktif, `INSERT INTO bills ... ON CONFLICT DO NOTHING` per KK, insert 2 bill_items (IURAN_WAJIB + IURAN_KEAMANAN) per bill baru, return counts
- `listBills(filters): Promise<BillWithHousehold[]>`
- `getBillDetail(id): Promise<BillDetail>` — include items + payment history
- `addFine(bill_id, { fine_date, fine_note, actor }): Promise<BillItem>` — insert DENDA_RONDA item, update bill status ke PARTIAL jika sebelumnya PAID
- `overrideBillItem(itemId, { amount_due, reason }, actor): Promise<BillItem>` — update amount, audit `OVERRIDE`

- [ ] **Step 4: Implementasi route handlers**

RBAC: generate/fines/override = ADMIN/BENDAHARA; GET = semua. Zod validasi ketat.

- [ ] **Step 5: Run test — PASS**

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: F-004 generate tagihan idempoten, denda ronda, override nominal"
```

---

## Task 10: Pencatatan Pembayaran & Routing Dual Kas — API (F-005)

**Files:**
- Create: `src/server/services/payment.service.ts`
- Create: `src/server/services/audit.service.ts` — centralized audit logger
- Create: `src/app/api/v1/payments/route.ts` — POST catat bayar
- Create: `src/app/api/v1/payments/[id]/void/route.ts` — POST void
- Create: `src/app/api/v1/uploads/presign/route.ts` — POST get presigned R2 URL
- Create: `src/app/api/v1/uploads/view/route.ts` — GET signed view URL
- Create: `src/lib/r2.ts` — Cloudflare R2 S3 client
- Test: `tests/api/payments.test.ts`

**Interfaces:**
- Consumes: `db.payments`, `db.paymentAllocations`, `db.billItems`, `db.bills`, `db.cashBooks`, `db.cashTransactions`, `auditService.log()`
- Produces:
  - `POST /api/v1/payments` → catat bayar, update `bill_items` status, update `bills` status, insert `cash_transactions` (Iuran Wajib → KAS_UMUM; Iuran Keamanan+Denda → KAS_KEAMANAN) — semua dalam 1 DB transaction atomik
  - `POST /api/v1/payments/:id/void` → balik semua efek (bill_items, bills, cash_transactions) dalam 1 DB transaction
  - `POST /api/v1/uploads/presign` → return `{ upload_url, file_key }` Presigned PUT R2
  - `GET /api/v1/uploads/view?key=` → return signed GET URL (5 menit)

- [ ] **Step 1: Tulis failing test — dual kas routing**

```ts
it('payment for Iuran Wajib creates cash_transaction in KAS_UMUM', async () => {
  // POST payment with allocation to IURAN_WAJIB bill_item
  // expect cash_transactions row with cash_book_type='KAS_UMUM'
})
it('void payment reverses cash_transactions atomically', async () => {
  // POST payment, then POST void
  // expect cash_transactions status='VOIDED', bill_item back to UNPAID
})
```

- [ ] **Step 2: Run test — FAIL**

- [ ] **Step 3: Implementasi `audit.service.ts`**

```ts
logAudit(db, params: {
  actorUserId: string; actorRole: string; module: string;
  entityType: string; entityId: string; action: AuditAction;
  oldValues?: object; newValues?: object; reason?: string; ipAddress?: string;
}): Promise<void>
```

- [ ] **Step 4: Implementasi `payment.service.ts`**

- `recordPayment(data: RecordPaymentDto, actor): Promise<Payment>` — dalam 1 transaksi DB:
  1. Insert `payments` row
  2. Per alokasi komponen: update `bill_items.amount_paid` + status
  3. Update `bills.status` (UNPAID/PARTIAL/PAID) berdasarkan semua items
  4. Insert `cash_transactions` per kas sesuai routing: IURAN_WAJIB → KAS_UMUM; IURAN_KEAMANAN+DENDA_RONDA → KAS_KEAMANAN
  5. Insert `payment_allocations` rows
  6. Audit log `CREATE`
- `voidPayment(paymentId, { reason }, actor): Promise<void>` — dalam 1 transaksi DB: set `payments.is_voided=1`, balik `bill_items` dan `bills` status, void `cash_transactions`, audit `VOID`

- [ ] **Step 5: Implementasi `src/lib/r2.ts`**

Gunakan `@aws-sdk/client-s3` atau `@aws-sdk/s3-request-presigner` dengan Cloudflare R2 endpoint. Ekspor `generatePresignedPut(key, contentType, maxBytes): Promise<string>` dan `generatePresignedGet(key, expiresIn): Promise<string>`.

- [ ] **Step 6: Implementasi route handlers payments dan uploads**

Zod schema payment: `{ bill_id, allocations: [{ bill_item_id, amount }][], payment_method, receipt_file_key?, notes? }`. RBAC: POST payment/void = BENDAHARA; GET uploads/view = semua autentikasi.

- [ ] **Step 7: Run test — PASS**

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: F-005 payment recording, dual-kas routing atomik, void, R2 upload presign"
```

---

## Task 11: Halaman Tagihan — UI (F-004, F-005, SCR-003 & SCR-004)

**Files:**
- Create: `src/app/(dashboard)/tagihan/page.tsx`
- Create: `src/components/billing/BillsListView.tsx`
- Create: `src/components/billing/GenerateBillButton.tsx`
- Create: `src/components/billing/PaymentSheet.tsx`
- Create: `src/components/billing/FineModal.tsx`
- Create: `src/components/billing/PaymentHistoryTab.tsx`

**Interfaces:**
- Consumes: `GET /api/v1/bills`, `POST /api/v1/bills/generate`, `POST /api/v1/payments`, `POST /api/v1/bills/:id/fines`, `POST /api/v1/uploads/presign`
- Produces: Halaman `/tagihan` fungsional — daftar tagihan, tombol generate, sheet bayar per warga dengan upload bukti, tambah denda

- [ ] **Step 1: Implementasi `BillsListView.tsx`**

Filter bar: pilih tahun/bulan + status (Semua/Belum/Sebagian/Lunas) + search nama. List card per warga: nama, blok, komponen tagihan, status badge, tombol "Catat Bayar" + "Tambah Denda". Responsive: card mobile, table desktop. UI sesuai `tagihan_iuran_warga_siwarga_rt_04/code.html` dan `catat_pembayaran_iuran_siwarga_rt_04/code.html`.

- [ ] **Step 2: Implementasi `GenerateBillButton.tsx`**

Tombol ADMIN/BENDAHARA only: pilih bulan, klik generate, tampilkan konfirmasi jika sudah ada tagihan bulan tersebut, toast sukses dengan `created_count`.

- [ ] **Step 3: Implementasi `PaymentSheet.tsx`**

Bottom sheet (mobile) / side sheet (desktop): tampilkan item tagihan dengan checkbox/amount input per komponen (Iuran Wajib, Iuran Keamanan, Denda jika ada), metode bayar (Tunai/Transfer), upload bukti foto (direct ke R2 via presigned URL), submit payment. BENDAHARA only.

- [ ] **Step 4: Implementasi `FineModal.tsx`**

Dialog tambah Denda Ronda: input tanggal tidak hadir ronda + keterangan. Auto-fill nominal dari tarif DENDA_RONDA aktif. ADMIN/BENDAHARA.

- [ ] **Step 5: Implementasi `/tagihan/page.tsx`**

Compose semua komponen, React Query untuk data fetching dan cache invalidation.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: F-004/F-005 halaman tagihan SCR-003/004 — list, generate, bayar, denda"
```

---

## Task 12: Penagihan WhatsApp — API & Halaman (F-006, SCR-005)

**Files:**
- Create: `src/server/services/arrears.service.ts`
- Create: `src/app/api/v1/arrears/route.ts`
- Create: `src/app/(dashboard)/penagihan-wa/page.tsx`
- Create: `src/components/whatsapp/ArrearsListView.tsx`
- Create: `src/components/whatsapp/CopyWAButton.tsx`
- Test: `tests/api/arrears.test.ts`

**Interfaces:**
- Consumes: `db.bills` (status UNPAID/PARTIAL), `db.billItems`, `db.households`, `db.appSettings` (rekening, template WA)
- Produces:
  - `GET /api/v1/arrears?month=&year=&mode=period|accumulated` → array `{ household, total_due, breakdown, wa_message_text, wa_link }`
  - Halaman `/penagihan-wa`: daftar tunggakan, tombol Copy WA per warga, tombol Copy Rekap Semua, tombol Kirim via wa.me

- [ ] **Step 1: Tulis failing test**

```ts
it('arrears only returns UNPAID and PARTIAL bills', async () => {
  // create PAID bill and UNPAID bill for same period
  // GET /arrears → only UNPAID appears
})
it('wa_message_text contains household name, amounts, and rekening', async () => {
  // check wa_message_text format contains all required fields
})
```

- [ ] **Step 2: Run test — FAIL**

- [ ] **Step 3: Implementasi `arrears.service.ts`**

- `listArrears(filters): Promise<ArrearItem[]>` — query bills WHERE status IN ('UNPAID','PARTIAL') JOIN households, aggregate bill_items, format `wa_message_text` dari template `app_settings['wa_billing_template']`
- `generateWaMessage(household, items, settings): string` — replace placeholder: `{nama}`, `{blok}`, `{iuran_wajib}`, `{iuran_keamanan}`, `{denda}`, `{total}`, `{rekening}`, `{bulan_tahun}`

- [ ] **Step 4: Implementasi `GET /api/v1/arrears/route.ts`**

RBAC: semua role. Query param `mode=period` (1 bulan) atau `accumulated` (semua tunggakan).

- [ ] **Step 5: Run test — PASS**

- [ ] **Step 6: Implementasi `ArrearsListView.tsx`**

Filter mode (Per Bulan / Akumulasi), search nama. Per warga: nama, blok, rincian tunggakan, total Rupiah, 2 tombol: Copy WA (clipboard + toast) dan Kirim WA (buka `wa.me/{phone}?text={encoded}`). Tombol "Copy Rekap Daftar Tunggak" di atas. UI sesuai `penagihan_whatsapp_siwarga_rt_04/code.html`.

- [ ] **Step 7: Implementasi `CopyWAButton.tsx`**

Client component: `navigator.clipboard.writeText(text)` dengan fallback textarea manual. Toast Sonner "Pesan WA berhasil disalin!" setelah copy.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: F-006 penagihan WA, arrears API, copy clipboard, wa.me link, SCR-005"
```

---

## Task 13: Dual Buku Kas — API & Halaman (F-007, SCR-006 & SCR-007)

**Files:**
- Create: `src/server/services/cash.service.ts`
- Create: `src/app/api/v1/cash-books/route.ts`
- Create: `src/app/api/v1/cash-transactions/route.ts` — GET, POST
- Create: `src/app/api/v1/cash-transactions/[id]/route.ts` — PATCH
- Create: `src/app/api/v1/cash-transactions/[id]/void/route.ts` — POST
- Create: `src/app/(dashboard)/kas/page.tsx`
- Create: `src/components/cash/DualCashSwitcher.tsx`
- Create: `src/components/cash/CashTxModal.tsx`
- Create: `src/components/cash/ReceiptViewerModal.tsx`
- Test: `tests/api/cash.test.ts`

**Interfaces:**
- Consumes: `db.cashBooks`, `db.cashCategories`, `db.cashTransactions`, `auditService.log()`
- Produces:
  - `GET /api/v1/cash-books` → `{ kas_umum: { balance, categories }, kas_keamanan: { balance, categories } }`
  - `GET /api/v1/cash-transactions?book_type=&month=&year=` → list transaksi + saldo awal/akhir periode
  - `POST /api/v1/cash-transactions` → catat pemasukan/pengeluaran manual + audit
  - `PATCH /api/v1/cash-transactions/:id` → update manual (is_locked=0 only) + audit
  - `POST /api/v1/cash-transactions/:id/void` → void manual (is_locked=0 only) + audit

- [ ] **Step 1: Tulis failing test**

```ts
it('cannot edit or void a locked cash_transaction (is_locked=1)', async () => {
  // attempt PATCH on locked tx → expect 403 or 400
})
it('manual expense reduces cash_book balance correctly', async () => {
  // POST income tx, POST expense tx, GET cash-books → balance = income - expense
})
```

- [ ] **Step 2: Run test — FAIL**

- [ ] **Step 3: Implementasi `cash.service.ts`**

- `getCashBooksSummary(): Promise<CashBooksSummary>` — balance = sum(INCOME POSTED) - sum(EXPENSE POSTED) per buku
- `listTransactions(bookType, month, year): Promise<{ opening_balance, transactions, closing_balance }>`
- `createManualTransaction(data, actor): Promise<CashTransaction>` — insert, audit `CREATE`
- `updateManualTransaction(id, data, actor): Promise<CashTransaction>` — guard `is_locked=0`, update, audit `UPDATE`
- `voidManualTransaction(id, { reason }, actor): Promise<void>` — guard `is_locked=0`, set VOIDED, audit `VOID`

- [ ] **Step 4: Implementasi route handlers**

RBAC: GET = semua; POST/PATCH/void = BENDAHARA. Zod schema create: `{ cash_book_id, category_id, transaction_type enum, amount: int.positive, description: string.min(3), transaction_date: string, receipt_file_key? }`.

- [ ] **Step 5: Run test — PASS**

- [ ] **Step 6: Implementasi `DualCashSwitcher.tsx`**

Tab/segmented control Kas Umum (teal/emerald) | Kas Keamanan (blue). Masing-masing tampilkan: saldo berjalan (currency-display), ringkasan pemasukan/pengeluaran bulan ini, daftar transaksi dengan pagination. UI sesuai `buku_kas_rt_rw_siwarga_rt_04/code.html` dan `modal_catat_transaksi_kas_siwarga_rt_04/code.html`.

- [ ] **Step 7: Implementasi `CashTxModal.tsx`**

Dialog/sheet: pilih kategori (dari cashCategories per buku), type Pemasukan/Pengeluaran, nominal Rupiah, deskripsi, tanggal, upload foto nota. Submit → POST, invalidate query.

- [ ] **Step 8: Implementasi `/kas/page.tsx`**

Render `<DualCashSwitcher>`, FAB "+ Catat Transaksi" (BENDAHARA only).

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: F-007 dual buku kas API + halaman kas SCR-006/007, locked tx guard"
```

---

## Task 14: Dashboard Dual-Kas & Copy Laporan WA (F-008, SCR-002)

**Files:**
- Create: `src/server/services/dashboard.service.ts`
- Create: `src/app/api/v1/dashboard/route.ts`
- Create: `src/app/(dashboard)/page.tsx`
- Create: `src/components/dashboard/DualCashStatCards.tsx`
- Create: `src/components/dashboard/PaymentRatioCard.tsx`
- Create: `src/components/dashboard/MonthlyChart.tsx`
- Create: `src/components/dashboard/CopyReportButton.tsx`

**Interfaces:**
- Consumes: `db.cashBooks`, `db.cashTransactions`, `db.bills`, `db.appSettings`
- Produces:
  - `GET /api/v1/dashboard` → `{ kas_umum: { balance, income_this_month, expense_this_month }, kas_keamanan: {...}, total_balance, payment_ratio: { paid, total, pct }, total_arrears_amount, monthly_chart_data: [{ month, kas_umum_income, kas_keamanan_income }×6], wa_report_text }`
  - Halaman `/` (beranda): dashboard dengan stat cards, chart, tombol Copy Laporan WA, Export PDF/CSV button

- [ ] **Step 1: Tulis failing test**

```ts
it('dashboard payment_ratio reflects current month bills', async () => {
  // create 3 bills: 2 PAID, 1 UNPAID
  // GET /dashboard → payment_ratio.paid=2, total=3, pct≈67
})
it('wa_report_text contains both kas sections with correct format', async () => {
  // GET /dashboard → wa_report_text includes 'KAS UMUM' and 'KAS KEAMANAN'
})
```

- [ ] **Step 2: Run test — FAIL**

- [ ] **Step 3: Implementasi `dashboard.service.ts`**

- `getDashboardData(currentMonth, currentYear): Promise<DashboardData>` — paralel query: saldo tiap kas, pemasukan/pengeluaran bulan ini, rasio bayar warga bulan ini, chart data 6 bulan terakhir, format `wa_report_text` dari template default PRD (section KAS UMUM + KAS KEAMANAN)

- [ ] **Step 4: Implementasi `GET /api/v1/dashboard/route.ts`**

RBAC: semua role. Cache revalidate 60s (Next.js `revalidate`).

- [ ] **Step 5: Run test — PASS**

- [ ] **Step 6: Implementasi komponen UI**

`DualCashStatCards`: dua artikel card (Kas Umum teal accent bar, Kas Keamanan blue accent bar) + combined strip. `PaymentRatioCard`: progress bar, persentase, jumlah lunas/total. `MonthlyChart`: Recharts `BarChart` pemasukan vs pengeluaran per kas 6 bulan. `CopyReportButton`: copy `wa_report_text` ke clipboard + toast. UI sesuai `beranda_dashboard_siwarga_rt_04/code.html`.

- [ ] **Step 7: Implementasi `/page.tsx`**

Server fetch, compose semua komponen. Tombol Export (mengarah ke Task 16). Tombol Copy Laporan WA.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: F-008 dashboard dual-kas, chart 6 bulan, rasio bayar, copy laporan WA, SCR-002"
```

---

## Task 15: Audit Trail — API & Halaman (F-009, SCR-010)

**Files:**
- Create: `src/app/api/v1/audit-logs/route.ts`
- Create: `src/app/(dashboard)/audit-log/page.tsx`
- Create: `src/components/audit/AuditLogTable.tsx`
- Test: `tests/api/audit-logs.test.ts`

**Interfaces:**
- Consumes: `db.auditLogs`, `db.users`
- Produces:
  - `GET /api/v1/audit-logs?from=&to=&module=&actor_id=&page=&per_page=` → paginated immutable log list
  - Halaman `/audit-log`: tabel dengan filter tanggal, modul, user; baris tidak bisa diedit/dihapus

- [ ] **Step 1: Tulis failing test**

```ts
it('audit-logs endpoint has no DELETE or PATCH method', async () => {
  expect(await DELETE('/api/v1/audit-logs/some-id')).toBe(405)
  expect(await PATCH('/api/v1/audit-logs/some-id', {})).toBe(405)
})
it('audit-logs returns filtered results by module', async () => {
  // GET /audit-logs?module=TARIFF → only TARIFF entries
})
```

- [ ] **Step 2: Run test — FAIL**

- [ ] **Step 3: Implementasi `GET /api/v1/audit-logs/route.ts`**

Query dengan filter: `created_at BETWEEN from AND to`, `module=`, `actor_user_id=`. Pagination `page`+`per_page`. JOIN users untuk `actor_full_name`. RBAC: semua role. Hanya ekspor GET (tidak ada POST/PATCH/DELETE handler).

- [ ] **Step 4: Run test — PASS**

- [ ] **Step 5: Implementasi `AuditLogTable.tsx`**

Table: Waktu, Pengguna (nama + role badge), Modul, Aksi badge, Entitas, Nilai Lama (JSON collapse), Nilai Baru (JSON collapse), Alasan. Filter bar: date range picker, select Modul, select User. UI sesuai `log_aktivitas_audit_trail_siwarga_rt_04/code.html`.

- [ ] **Step 6: Implementasi `/audit-log/page.tsx`**

Server-side initial fetch, client-side filter dengan React Query.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: F-009 audit trail API + halaman SCR-010, append-only, filter"
```

---

## Task 16: Export Laporan PDF & CSV (F-010)

**Files:**
- Create: `src/server/services/report.service.ts`
- Create: `src/app/api/v1/reports/export/route.ts`
- Create: `src/lib/pdf.ts` — PDF generator (jsPDF atau @react-pdf/renderer server-side)
- Test: `tests/api/reports.test.ts`

**Interfaces:**
- Consumes: `db.bills`, `db.billItems`, `db.households`, `db.cashBooks`, `db.cashCategories`, `db.cashTransactions`
- Produces:
  - `GET /api/v1/reports/export?type=bills|kas_umum|kas_keamanan|all&month=&year=&format=pdf|csv` → file download stream

- [ ] **Step 1: Tulis failing test**

```ts
it('export bills CSV contains header row and household data', async () => {
  const res = await GET('/api/v1/reports/export?type=bills&month=11&year=2026&format=csv')
  expect(res.headers['content-type']).toContain('text/csv')
  const text = await res.text()
  expect(text).toContain('Nama KK,Blok,Status')
})
```

- [ ] **Step 2: Run test — FAIL**

- [ ] **Step 3: Implementasi `report.service.ts`**

- `generateBillsCSV(month, year): Promise<string>` — query bills+items+households, format CSV dengan header
- `generateCashCSV(bookType, month, year): Promise<string>` — query cash_transactions per buku, format CSV
- `generateBillsPDF(month, year): Promise<Buffer>` — format A4 siap cetak
- `generateCashPDF(bookType, month, year): Promise<Buffer>`

- [ ] **Step 4: Implementasi `GET /api/v1/reports/export/route.ts`**

Set `Content-Disposition: attachment; filename=...` dan `Content-Type` sesuai format. RBAC: ADMIN/BENDAHARA/KETUA.

- [ ] **Step 5: Run test — PASS**

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: F-010 export laporan PDF dan CSV per periode dan tipe"
```

---

## Task 17: GitHub Actions — CI & Backup SQLite ke R2

**Files:**
- Create: `.github/workflows/ci.yml` — final version dengan semua test
- Create: `.github/workflows/backup-sqlite-r2.yml` — cron 02:00 WIB

**Interfaces:**
- Produces: CI pipeline yang run lint + typecheck + unit test + e2e test pada setiap push/PR; backup otomatis harian Turso dump → gzip → R2 retensi 30 hari

- [ ] **Step 1: Finalisasi `.github/workflows/ci.yml`**

```yaml
on: [push, pull_request]
jobs:
  lint: run eslint
  typecheck: run tsc --noEmit
  unit-test: run vitest run
  e2e-test: run playwright test (dengan DATABASE_URL=file:./test.db)
```

- [ ] **Step 2: Tulis `.github/workflows/backup-sqlite-r2.yml`**

```yaml
on:
  schedule:
    - cron: '0 19 * * *'  # 02:00 WIB = 19:00 UTC
jobs:
  backup:
    - turso db shell $DB_NAME .dump > dump.sql
    - gzip dump.sql
    - Upload dump.sql.gz ke R2 folder backup/YYYY-MM-DD/
    - Hapus backup R2 lebih dari 30 hari
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "ci: GitHub Actions CI pipeline + nightly SQLite backup to R2"
```

---

## Task 18: Vercel Deployment & Environment Setup

**Files:**
- Create: `vercel.json` — konfigurasi region, maxDuration
- Modify: `next.config.ts` — tambahkan `serverExternalPackages: ['@libsql/client']`

**Interfaces:**
- Produces: Aplikasi live di `*.vercel.app` dengan Turso production DB; environment variables terkonfigurasi

- [ ] **Step 1: Tambahkan `serverExternalPackages` di `next.config.ts`**

```ts
const nextConfig: NextConfig = {
  serverExternalPackages: ['@libsql/client'],
}
```

- [ ] **Step 2: Buat `vercel.json`**

```json
{
  "regions": ["sin1"],
  "functions": {
    "src/app/api/**/*.ts": { "maxDuration": 30 }
  }
}
```

- [ ] **Step 3: Setup Turso production database**

```bash
turso db create siwarga-prod --location sin
turso db tokens create siwarga-prod
```

Set environment variables di Vercel dashboard: `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `JWT_SECRET`, `R2_*`.

- [ ] **Step 4: Deploy ke Vercel**

```bash
vercel --prod
```

Expected: build sukses, halaman login dapat diakses di URL produksi.

- [ ] **Step 5: Run migrasi ke production DB**

```bash
DATABASE_URL=libsql://siwarga-prod.turso.io DATABASE_AUTH_TOKEN=... npx drizzle-kit migrate
npx tsx src/db/seed.ts
```

- [ ] **Step 6: Smoke test production**

Akses URL produksi → login dengan admin seed → cek dashboard muncul → verifikasi API `/api/v1/auth/me` return 200.

- [ ] **Step 7: Commit**

```bash
git add vercel.json next.config.ts && git commit -m "deploy: vercel config, turso prod, region sin1"
```

---

## Task 19: Polish, Accessibility & Performance

**Files:**
- Modify: semua page components — tambahkan `aria-label`, `aria-live`, loading skeleton
- Create: `src/components/ui/LoadingSkeleton.tsx`
- Create: `src/components/ui/EmptyState.tsx`
- Create: `src/components/ui/ConfirmDialog.tsx` — reusable confirm dengan Audit Trail warning

**Interfaces:**
- Produces: Semua aksi sensitif punya confirm dialog; loading state di semua data fetch; empty state di semua list; touch target ≥ 44px dipastikan; WCAG AA contrast verified

- [ ] **Step 1: Implementasi `ConfirmDialog.tsx`**

Reusable: `title`, `description`, `warningText` (mis: "Aksi ini akan tercatat di Audit Trail"), `onConfirm`, `onCancel`. Dipakai untuk: void payment, ubah tarif, nonaktifkan warga, hapus user.

- [ ] **Step 2: Audit touch targets mobile**

Review semua tombol dan interactive element: pastikan `min-h-[44px] min-w-[44px]`. Fix yang belum sesuai.

- [ ] **Step 3: Tambahkan loading skeleton di semua halaman**

Gunakan shadcn/ui `Skeleton` component saat data sedang di-fetch.

- [ ] **Step 4: Tambahkan empty state di semua list**

`EmptyState.tsx` dengan ikon dan teks kontekstual (mis: "Belum ada warga terdaftar" / "Belum ada tagihan bulan ini").

- [ ] **Step 5: Verifikasi format Rupiah konsisten**

Semua angka gunakan `Intl.NumberFormat('id-ID', { style: 'decimal' })` + prefix `Rp ` manual. Tidak ada angka tanpa pemisah ribuan.

- [ ] **Step 6: Run Lighthouse audit**

```bash
npx lighthouse http://localhost:3000 --only-categories=accessibility,performance --output=json
```
Expected: Accessibility ≥ 90, Performance ≥ 80 pada mobile.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "polish: a11y, loading skeletons, empty states, confirm dialogs, touch targets"
```

---

## Task 20: Final E2E Test Suite & Documentation

**Files:**
- Create: `tests/e2e/billing-flow.spec.ts` — full billing cycle
- Create: `tests/e2e/dual-kas.spec.ts` — payment routing
- Create: `tests/e2e/wa-copy.spec.ts` — copy WA flow
- Create: `README.md` — setup, development, deployment guide

**Interfaces:**
- Produces: E2E test coverage untuk happy path semua fitur utama; README lengkap untuk onboarding developer baru

- [ ] **Step 1: Tulis e2e test billing flow**

```ts
test('full billing cycle: generate → record payment → verify kas balance', async ({ page }) => {
  // login as bendahara
  // navigate to /tagihan, generate bulan ini
  // find warga, click bayar, isi nominal, submit
  // navigate to /kas, verify kas umum balance increased
})
```

- [ ] **Step 2: Tulis e2e test WA copy**

```ts
test('copy WA button copies formatted message to clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  // navigate /penagihan-wa, click copy on first warga
  // read clipboard → verify contains household name
})
```

- [ ] **Step 3: Run semua e2e test**

```bash
npx playwright test
```
Expected: semua PASS

- [ ] **Step 4: Tulis `README.md`**

Sections: Overview, Tech Stack, Prerequisites, Local Development Setup (env, DB, seed, dev server), Running Tests, Deployment ke Vercel+Turso+R2, Struktur Folder.

- [ ] **Step 5: Final commit**

```bash
git add -A && git commit -m "test: full e2e suite + README documentation"
git tag v1.0.0
```

---

## Appendix: File Structure Summary

```
siwarga/
├── .github/workflows/
│   ├── ci.yml
│   └── backup-sqlite-r2.yml
├── drizzle/                        # migrasi SQL
├── public/
│   ├── robots.txt
│   └── manifest.webmanifest
├── src/
│   ├── app/
│   │   ├── layout.tsx              # root layout + font + toaster
│   │   ├── globals.css             # tailwind tokens
│   │   ├── login/page.tsx          # SCR-001
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          # protected + nav layout
│   │   │   ├── page.tsx            # SCR-002 dashboard
│   │   │   ├── tagihan/page.tsx    # SCR-003/004
│   │   │   ├── penagihan-wa/page.tsx # SCR-005
│   │   │   ├── kas/page.tsx        # SCR-006/007
│   │   │   ├── warga/page.tsx      # SCR-008
│   │   │   ├── pengaturan/page.tsx # SCR-009
│   │   │   ├── audit-log/page.tsx  # SCR-010
│   │   │   └── pengguna/page.tsx   # SCR-011
│   │   └── api/v1/
│   │       ├── auth/{login,logout,me}/route.ts
│   │       ├── users/route.ts + [id]/route.ts
│   │       ├── households/route.ts + [id]/route.ts
│   │       ├── fee-rates/route.ts + impact-preview/route.ts
│   │       ├── settings/route.ts
│   │       ├── bills/route.ts + generate/route.ts + [id]/route.ts + [id]/fines/route.ts
│   │       ├── bill-items/[itemId]/route.ts
│   │       ├── payments/route.ts + [id]/void/route.ts
│   │       ├── arrears/route.ts
│   │       ├── cash-books/route.ts
│   │       ├── cash-transactions/route.ts + [id]/route.ts + [id]/void/route.ts
│   │       ├── uploads/{presign,view}/route.ts
│   │       ├── dashboard/route.ts
│   │       ├── audit-logs/route.ts
│   │       └── reports/export/route.ts
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── auth/LoginForm.tsx
│   │   ├── layout/{Sidebar,MobileBottomNav,RoleGuard}.tsx
│   │   ├── billing/{BillsListView,GenerateBillButton,PaymentSheet,FineModal,PaymentHistoryTab}.tsx
│   │   ├── cash/{DualCashSwitcher,CashTxModal,ReceiptViewerModal}.tsx
│   │   ├── whatsapp/{ArrearsListView,CopyWAButton}.tsx
│   │   ├── dashboard/{DualCashStatCards,PaymentRatioCard,MonthlyChart,CopyReportButton}.tsx
│   │   ├── audit/AuditLogTable.tsx
│   │   ├── households/{HouseholdTable,HouseholdFormSheet}.tsx
│   │   ├── settings/{FeeRateCard,FeeRateChangeDialog}.tsx
│   │   └── users/{UserTable,UserFormDialog}.tsx
│   ├── server/services/
│   │   ├── auth.service.ts
│   │   ├── audit.service.ts        # centralized audit logger
│   │   ├── user.service.ts
│   │   ├── household.service.ts
│   │   ├── settings.service.ts
│   │   ├── billing.service.ts
│   │   ├── payment.service.ts
│   │   ├── arrears.service.ts
│   │   ├── cash.service.ts
│   │   ├── dashboard.service.ts
│   │   └── report.service.ts
│   ├── db/
│   │   ├── index.ts                # Turso/SQLite connection
│   │   ├── schema.ts               # 12 tabel Drizzle
│   │   └── seed.ts                 # data awal
│   ├── lib/
│   │   ├── auth.ts                 # JWT sign/verify
│   │   ├── password.ts             # bcryptjs
│   │   └── r2.ts                   # Cloudflare R2 client
│   └── middleware.ts               # RBAC middleware
├── tests/
│   ├── api/                        # Vitest unit/integration
│   └── e2e/                        # Playwright
├── docs/superpowers/
│   ├── specs/                      # design docs
│   └── plans/                      # this file
├── vercel.json
├── drizzle.config.ts
├── tailwind.config.ts
├── .env.example
└── README.md
```

---

## Screen Inventory Mapping

| SCR | Halaman | Task | F-ID |
|-----|---------|------|------|
| SCR-001 | Login | Task 4 | F-001 |
| SCR-002 | Dashboard / Beranda | Task 14 | F-008 |
| SCR-003 | Tagihan Bulanan | Task 11 | F-004 |
| SCR-004 | Catat Pembayaran (Sheet) | Task 11 | F-005 |
| SCR-005 | Penagihan WhatsApp | Task 12 | F-006 |
| SCR-006 | Buku Kas (Switcher) | Task 13 | F-007 |
| SCR-007 | Modal Catat Transaksi Kas | Task 13 | F-007 |
| SCR-008 | Data Warga / Rumah | Task 7 | F-002 |
| SCR-009 | Pengaturan Tarif & Template | Task 8 | F-003 |
| SCR-010 | Audit Trail / Log Aktivitas | Task 15 | F-009 |
| SCR-011 | Manajemen Akun Pengurus | Task 6 | F-001 |

# Struktur Proyek dan Dev-Readiness Checklist — Aplikasi Manajemen RT/RW

| Informasi Dokumen | Detail |
| :--- | :--- |
| **Proyek** | Aplikasi Manajemen RT/RW (Web Mobile-Responsive, Single RT/Komplek) |
| **Stack Target** | Next.js 15+ (App Router, TypeScript) + Tailwind CSS + shadcn/ui + Drizzle ORM + SQLite/Turso (`@libsql/client`) + Cloudflare R2 |
| **Deployment** | Vercel Hobby Plan (Gratis) + Turso Starter Free + Cloudflare R2 Free |
| **Fase** | Fase 4 — Senior Fullstack Developer |

---

## 1. Struktur Folder Proyek (Modular Fullstack Next.js)

Struktur berikut memisahkan antarmuka (`app/(dashboard)`), REST API (`app/api/v1`), logika domain (`server/services`), skema SQLite (`db`), dan validasi bersama (`lib/validators`) agar mudah dikerjakan bersama maupun dipelihara jangka panjang.

```text
aplikasi-rtrw/
├── .github/
│   └── workflows/
│       ├── ci.yml                         # Lint, typecheck, unit & integration test
│       └── backup-sqlite-r2.yml           # Cron harian 02:00 WIB: dump Turso -> gzip -> upload R2 (retensi 30 hari)
├── drizzle/                               # File migrasi SQL otomatis dari drizzle-kit
├── public/
│   ├── robots.txt                         # Disallow: / (proteksi privasi data warga)
│   └── manifest.webmanifest               # Ikon & nama app saat "Add to Home Screen" di HP pengurus
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # Font Plus Jakarta Sans, Toast provider (Sonner)
│   │   ├── globals.css                    # Token warna Tailwind (#0F766E, #059669 Kas Umum, #1D4ED8 Kas Keamanan)
│   │   ├── login/
│   │   │   └── page.tsx                   # SCR-001: Halaman Login Pengurus
│   │   ├── (dashboard)/                   # Protected Route Group (Layout Sidebar Desktop + Bottom Bar Mobile)
│   │   │   ├── layout.tsx                 # Cek sesi server-side + pass role context
│   │   │   ├── page.tsx                   # SCR-002: Dashboard Dual-Kas & Copy Laporan WA
│   │   │   ├── tagihan/
│   │   │   │   └── page.tsx               # SCR-003 & SCR-004: Tagihan Bulanan, Denda Ronda & Sheet Bayar
│   │   │   ├── penagihan-wa/
│   │   │   │   └── page.tsx               # SCR-005: Daftar Tunggakan & Copy/Kirim WA
│   │   │   ├── kas/
│   │   │   │   └── page.tsx               # SCR-006 & SCR-007: Dual Buku Kas (Umum & Keamanan) + Modal Catat
│   │   │   ├── warga/
│   │   │   │   └── page.tsx               # SCR-008: Manajemen Data Warga (KK / Rumah)
│   │   │   ├── pengaturan/
│   │   │   │   └── page.tsx               # SCR-009: Tarif Dinamis, Info Rekening & Template WA
│   │   │   ├── audit-log/
│   │   │   │   └── page.tsx               # SCR-010: Log Aktivitas / Audit Trail Permanen
│   │   │   └── pengguna/
│   │   │       └── page.tsx               # SCR-011: Manajemen Akun Pengurus & Profil
│   │   └── api/
│   │       └── v1/                        # REST API Route Handlers (Node.js Runtime)
│   │           ├── auth/{login,logout,me}/route.ts
│   │           ├── users/route.ts         # + [id]/route.ts
│   │           ├── households/route.ts    # + [id]/route.ts
│   │           ├── settings/route.ts
│   │           ├── fee-rates/{route.ts,impact-preview/route.ts}
│   │           ├── bills/{route.ts,generate/route.ts,[id]/route.ts,[id]/fines/route.ts}
│   │           ├── bill-items/[itemId]/route.ts
│   │           ├── payments/{route.ts,[id]/void/route.ts}
│   │           ├── arrears/route.ts
│   │           ├── cash-books/route.ts
│   │           ├── cash-transactions/{route.ts,[id]/route.ts,[id]/void/route.ts}
│   │           ├── uploads/{presign,view}/route.ts
│   │           ├── dashboard/route.ts
│   │           ├── audit-logs/route.ts
│   │           └── reports/export/route.ts
│   ├── components/
│   │   ├── ui/                            # Komponen dasar shadcn/ui (Button, Dialog, Sheet, Badge, Table)
│   │   ├── layout/                        # Sidebar.tsx, MobileBottomNav.tsx, RoleGuard.tsx
│   │   ├── billing/                       # PaymentSheet.tsx, FineModal.tsx, PaymentHistoryTab.tsx
│   │   ├── cash/                          # DualCashSwitcher.tsx, CashTxModal.tsx, ReceiptViewerModal.tsx
│   │   └── whatsapp/                      # CopyWaButton.tsx (Safari-safe), WaPreviewModal.tsx
│   ├── db/
│   │   ├── index.ts                       # Inisialisasi @libsql/client (lokal file:.db vs Turso) + PRAGMA FK
│   │   ├── schema.ts                      # 13 tabel SQLite Drizzle (12 tabel Fase 2 + auth_rate_limits & delta audit)
│   │   ├── transaction.ts                 # Helper runImmediateTx() dengan BEGIN IMMEDIATE + retry SQLITE_BUSY
│   │   └── seed.ts                        # Seed awal: 2 cash_books, kategori bawaan, 3 fee_rates, app_settings, 1 Admin
│   ├── server/
│   │   ├── auth/                          # jwt.ts (jose), password.ts (bcryptjs), guard.ts (requireRole)
│   │   ├── storage/                       # r2.ts (Presigned PUT/GET URL & validasi object_key)
│   │   ├── services/                      # Domain services (billing, payment, dual-cash, tariff, wa-formatter, audit, report)
│   │   └── pdf/                           # Template @react-pdf/renderer untuk Rekap Iuran & Dual Kas
│   └── lib/
│       ├── validators/                    # Skema Zod dipakai bersama Frontend & API
│       ├── formatters.ts                  # Format Rupiah (Rp 50.000), normalisasi WA (628xxx), nama bulan ID
│       └── image-compress.ts              # Kompresi foto nota di browser (< 1 MB, maks 1280px)
├── drizzle.config.ts
├── next.config.ts
├── .env.example
└── package.json
```

---

## 2. Konfigurasi Environment Variables (`.env.example`)

```bash
# --- Database SQLite / Turso (libSQL) ---
# Development Lokal: gunakan file:./local.db (kosongkan TURSO_AUTH_TOKEN)
# Production Vercel: gunakan libsql://<nama-db>-<org>.turso.io
DATABASE_URL="file:./local.db"
TURSO_AUTH_TOKEN=""

# --- Autentikasi JWT ---
# Minimal 32 karakter acak kuat (openssl rand -base64 32)
JWT_SECRET="ganti-dengan-secret-minimal-32-karakter"
SESSION_MAX_AGE_SECONDS="86400"

# --- Cloudflare R2 Object Storage (Foto Nota & Bukti Transfer) ---
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="rtrw-media"

# --- Seed Akun Admin Awal (hanya dipakai saat npm run db:seed) ---
SEED_ADMIN_EMAIL="admin@rt04.local"
SEED_ADMIN_USERNAME="admin.rt04"
SEED_ADMIN_PASSWORD="UbahPasswordIniSegera123!"
```

---

## 3. Data Seed Wajib Sebelum Aplikasi Pertama Kali Dibuka (`src/db/seed.ts`)

Skrip *seed* wajib bersifat **idempoten** (aman dijalankan ulang) dan mengisi 5 data pondasi berikut:
1. **`cash_books`:** Tepat 2 baris permanen: `KAS_UMUM` (*Kas Umum RT/RW*) dan `KAS_KEAMANAN` (*Kas Keamanan*), masing-masing dengan `current_balance = 0`.
2. **`cash_categories` (`is_system = 1`):**
   * *Kas Umum:* `Iuran Wajib` (INCOME), `Sumbangan & Donasi` (INCOME), `Kas Kegiatan` (INCOME), `Pemasukan Lain-lain` (INCOME), `Kebersihan Lingkungan` (EXPENSE), `Rapat & Administrasi` (EXPENSE), `Sosial & Santunan` (EXPENSE), `Perbaikan Fasilitas Umum` (EXPENSE), `Operasional Lainnya` (EXPENSE).
   * *Kas Keamanan:* `Iuran Keamanan` (INCOME), `Denda Ronda` (INCOME), `Sumbangan Keamanan` (INCOME), `Gaji Satpam / Petugas Keamanan` (EXPENSE), `Operasional Pos Ronda` (EXPENSE), `Perawatan Portal & CCTV` (EXPENSE), `Perlengkapan Jaga` (EXPENSE).
3. **`fee_rates` (Tarif Awal Aktif):** `IURAN_WAJIB` (misal Rp 50.000), `IURAN_KEAMANAN` (misal Rp 40.000), `DENDA_RONDA` (misal Rp 25.000) — dapat langsung diubah kapan saja dari menu Pengaturan (`F-003`).
4. **`app_settings`:** 1 baris `'default'` berisi nama RT/RW placeholder dan 3 template pesan WhatsApp baku dari `02-prd-aplikasi-rtrw.md`.
5. **`users`:** 1 akun `ADMIN` awal agar pengurus bisa langsung login dan membuat akun `BENDAHARA` serta `KETUA`.

---

## 4. Rekomendasi Urutan Sprint Pengembangan (MVP 4 Minggu `[ASUMSI]`)

| Sprint | Fokus Modul & ID Fitur | Target Deliverable Siap Uji |
| :--- | :--- | :--- |
| **Sprint 1** (Fondasi & Master) | Setup Next.js + Drizzle SQLite/Turso + Auth RBAC (`F-001`), Data Warga (`F-002`), Tarif Dinamis + Audit Trail (`F-003`, `F-009`) | Login 3 Role jalan, CRUD KK normalisasi `628xxx`, ubah tarif tercatat di Audit Log |
| **Sprint 2** (Inti Keuangan Dual Kas) | Generate Tagihan & Denda Ronda (`F-004`), Pembayaran Parsial + Auto-Routing Dual Kas + Void (`F-005`), Dual Buku Kas + Upload Nota R2 (`F-007`) | Pembayaran Iuran Wajib -> Kas Umum, Keamanan & Denda -> Kas Keamanan (ACID Rp 0 selisih) |
| **Sprint 3** (Penagihan WA & Dashboard) | Penagihan WA Copy/Direct Share (`F-006`), Dashboard Dual-Kas + Copy Laporan Kas WA (`F-008`), Halaman Audit Trail (`F-009`) | Bendahara bisa tagih WA satu tangan di HP (Android & iOS Safari), Ketua pantau real-time |
| **Sprint 4** (Export, QA & Go-Live) | Export PDF & CSV (`F-010`), Uji UAT 3 Role, Setup Vercel + Turso + R2 + Cron Backup GitHub Actions | Aplikasi live di `*.vercel.app` (Rp 0/bulan), backup harian aktif, siap dipakai RT |

---

## 5. Dev-Readiness Checklist (Sebelum Sprint 1 Dimulai)

### A. Kesiapan Akun Infrastruktur Gratis
- [ ] Repositori Git (GitHub) telah dibuat beserta proteksi branch `main`.
- [ ] Akun **Turso** dibuat dengan database region terdekat (**Singapore / Tokyo**), `DATABASE_URL` dan `TURSO_AUTH_TOKEN` siap untuk Production & Staging.
- [ ] Akun **Cloudflare R2** dibuat dengan bucket privat `rtrw-media` + aturan CORS khusus domain Vercel (`PUT` untuk presigned upload) + Lifecycle Rule folder `tmp/`.
- [ ] Proyek **Vercel** terhubung ke repositori GitHub dan seluruh Environment Variables sudah didaftarkan.

### B. Kesiapan Kualitas & Keamanan Kode
- [ ] `PRAGMA foreign_keys = ON` terverifikasi aktif di koneksi lokal `.db` dan Turso.
- [ ] Helper `runImmediateTx()` (`BEGIN IMMEDIATE` + retry `SQLITE_BUSY`) lulus uji *concurrent write test*.
- [ ] Middleware `requireRole()` diterapkan di seluruh `/api/v1/*` dan diuji negatif (Role `KETUA` ditolak `403` pada seluruh endpoint mutasi; `ADMIN` tidak bisa menonaktifkan Admin terakhir).
- [ ] Validasi `Idempotency-Key` lulus uji *double-submit* pada `POST /payments` dan `POST /cash-transactions`.
- [ ] Fungsi `recalculateBillHeader()` memiliki *unit test* lengkap untuk skenario: *Lunas penuh*, *Bayar sebagian*, *Tambah Denda Ronda setelah Lunas (re-open)*, *Void pembayaran*, dan *Override nominal ke Rp 0*.
- [ ] Tombol **Copy Pesan WA** dan **Kirim via WA** lulus uji fisik di browser **Chrome Android** dan **Safari iOS**.
- [ ] GitHub Actions `backup-sqlite-r2.yml` diuji manual sekali dan file dump `.sql.gz` berhasil dipulihkan (*test restore*) ke database lokal.
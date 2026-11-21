# SiWarga — Sistem Manajemen Iuran & Kas RT/RW

> **Aplikasi Tata Kelola Kas & Warga Lingkungan RT/RW Modern**  
> Didesain khusus untuk RT 04 Komplek Melati dengan arsitektur **Dual-Ledger Cash Books (Buku Kas Ganda)**, penagihan WhatsApp cerdas, dan audit trail transparan.

---

## 🚀 Fitur Utama (F-001 s/d F-010)

1. **F-001: User Management & RBAC Tiga Tingkat**
   - **Admin / Sekretaris**: Pengelolaan akun pengurus, master data warga, pengaturan sistem.
   - **Bendahara**: Pencatatan pembayaran warga, input transaksi buku kas, void transaksi, unduh laporan.
   - **Ketua RT**: Mode pantau (*read-only*), inspeksi saldo real-time, audit log, persetujuan perubahan tarif.
2. **F-002: Manajemen Data Warga & Rumah**
   - CRUD data warga per unit/blok rumah.
   - Auto-normalisasi nomor WhatsApp format `628xxx`.
   - Filter status hunian (Tetap, Kontrak, Kosong).
   - *Soft delete* dengan preservasi integritas riwayat tagihan.
3. **F-003: Pengaturan Tarif Dinamis & Template WA**
   - Tarif iuran dinamis (Iuran Wajib & Iuran Keamanan).
   - Dialog konfirmasi dampak (*impact preview*) jika tarif diubah di tengah periode berjalan.
   - Konfigurasi nomor rekening kas RT dan kustomisasi template penagihan WhatsApp.
4. **F-004: Generate Tagihan Bulanan & Denda Ronda**
   - Pembuatan tagihan bulanan otomatis yang idempoten (mencegah tagihan ganda per periode).
   - Fitur denda absen ronda malam yang otomatis masuk ke komponen tagihan warga terkait.
5. **F-005: Pencatatan Pembayaran & Dual-Kas Atomic Routing**
   - Mendukung metode pembayaran Tunai maupun Transfer Bank.
   - Unggah bukti transfer nota/struk ke Cloudflare R2 via presigned URL.
   - **Atomic Routing**: 1 pembayaran tagihan otomatis terbagi ke dua buku kas berbeda dalam 1 database transaction (Iuran Wajib masuk Kas Umum, Iuran Keamanan & Denda Ronda masuk Kas Keamanan).
   - Fitur pembatalan (*void*) pembayaran yang membalikkan status tagihan dan saldo kas secara instan disertai pencatatan alasan di audit trail.
6. **F-006: Penagihan WhatsApp & Broadcast Rekap Grup**
   - Filter warga penunggak (*mode per bulan* atau *akumulasi seluruh tunggakan*).
   - Tombol **Salin Teks WA** dengan fallback clipboard multi-browser.
   - Tautan langsung `wa.me` personal untuk mengirim tagihan ke nomor HP warga dengan 1 klik.
   - Tombol **Copy Rekap Pesan Grup WA** dengan opsi saklar privasi (*sembunyikan nominal per KK*).
7. **F-007: Dual Buku Kas (Kas Umum & Kas Keamanan)**
   - **Kas Umum (Ledger 01 - Emerald `#059669`)**: Menampung Iuran Wajib dan operasional umum RT.
   - **Kas Keamanan (Ledger 02 - Blue `#1D4ED8`)**: Menampung Iuran Keamanan, Denda Ronda, dan honor petugas pos satpam.
   - Kartu saldo real-time, rekonsiliasi saldo awal, mutasi masuk/keluar, dan saldo akhir berjalan.
   - Proteksi transaksi otomatis (*locked transaction guard*): transaksi hasil routing pembayaran tagihan terkunci dari edit/hapus manual.
8. **F-008: Dashboard Eksekutif & Laporan Kas WA**
   - Kartu statistik dual-kas dengan aksen warna struktural.
   - Indikator kepatuhan pembayaran (*payment ratio*) dengan target 95%.
   - Grafik arus kas historis 6 bulan terakhir.
   - Tombol instan **Copy Laporan Kas WA** untuk pengumuman transparan ke grup chat warga.
9. **F-009: Audit Trail Permanen (Immutable Ledger)**
   - Semua aksi krusial (perubahan tarif, pembayaran, pembatalan, mutasi kas) tercatat permanen.
   - Endpoint append-only (`DELETE` & `PATCH` ditolak dengan `405 Method Not Allowed`).
   - Pencatat data riwayat nilai lama (*old values*) dan nilai baru (*new values*) berformat JSON terstruktur.
10. **F-010: Ekspor Laporan PDF & CSV**
    - Ekspor data tagihan warga dan mutasi buku kas per periode ke format CSV spreadsheet.
    - Generator PDF dokumen A4 siap cetak untuk arsip pengurus dan rapat warga.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions, Route Handlers)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Database & ORM**: SQLite local (WAL mode) / [Turso LibSQL](https://turso.tech/) via [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) dengan design system *"SiWarga Civic Balance"*
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives, Lucide icons, Sonner toast)
- **File Storage**: [Cloudflare R2](https://www.cloudflare.com/products/r2/) via AWS S3 SDK v3 presigned URLs
- **Testing**: [Vitest](https://vitest.dev/) untuk unit, API integration, dan E2E testing

---

## 📋 Prasyarat

- Node.js versi 20.x atau lebih baru
- npm versi 10.x atau lebih baru

---

## ⚡ Panduan Menjalankan Secara Lokal

### 1. Kloning dan Instalasi Dependensi

```bash
git clone https://github.com/your-repo/siwarga.git
cd siwarga
npm install
```

### 2. Konfigurasi Environment Variables

Salin file contoh konfigurasi `.env.example`:

```bash
cp .env.example .env
```

Contoh variabel minimal pada `.env`:

```env
DATABASE_URL=file:./data/siwarga.db
DATABASE_AUTH_TOKEN=
JWT_SECRET=rahasia-siwarga-super-secure-token-2026
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cloudflare R2 (Opsional untuk storage nota)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=siwarga-receipts
R2_PUBLIC_URL=
```

### 3. Migrasi Database & Seeding Data Awal

Jalankan perintah migrasi skema dan seed data master:

```bash
mkdir -p data
npx drizzle-kit migrate
npx tsx src/db/seed.ts
```

### 4. Menjalankan Server Pengembangan

```bash
npm run dev
```

Buka peramban di [http://localhost:3000](http://localhost:3000).

---

## 👤 Akun Bawaan (Seed Demo)

| Role | Username | Password | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `Admin123!` | Akses penuh sistem & pengaturan |
| **Bendahara** | `bendahara.rt04` | `Bendahara123!` | Manajemen tagihan, kas, pembayaran, & ekspor |
| **Ketua RT** | `ketua.rt04` | `Ketua123!` | Dashboard pantau real-time, laporan, & audit trail |

---

## 🧪 Menjalankan Pengujian (Test Suite)

Jalankan seluruh rangkaian test unit, API integration, dan E2E:

```bash
npm run test
```

Untuk menjalankan typecheck kode:

```bash
npx tsc --noEmit
```

Untuk memverifikasi build produksi:

```bash
npm run build
```

---

## 🌐 Panduan Deployment

### Vercel + Turso + Cloudflare R2

1. **Database Turso**:
   ```bash
   turso db create siwarga-prod --location sin
   turso db tokens create siwarga-prod
   ```
2. **Push Migrasi ke Turso**:
   ```bash
   DATABASE_URL=libsql://siwarga-prod.turso.io DATABASE_AUTH_TOKEN=<token> npx drizzle-kit migrate
   DATABASE_URL=libsql://siwarga-prod.turso.io DATABASE_AUTH_TOKEN=<token> npx tsx src/db/seed.ts
   ```
3. **Deploy ke Vercel**:
   - Hubungkan repository GitHub ke project baru di Vercel.
   - Atur Environment Variables di dashboard Vercel (`DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `JWT_SECRET`, dsb).
   - Region serverless sudah terkonfigurasi ke Singapore (`sin1`) melalui `vercel.json`.

---

## 📂 Struktur Direktori Proyek

```
siWarga/
├── .github/workflows/          # CI pipeline & cron backup ke R2
├── drizzle/                    # File SQL migrasi database Drizzle
├── public/                     # Aset publik & manifest web
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── (dashboard)/        # Layout pengurus terlindungi (sidebar + bottom nav)
│   │   │   ├── page.tsx        # SCR-002 Dashboard Dual-Kas
│   │   │   ├── tagihan/        # SCR-003/004 Manajemen Tagihan & Denda
│   │   │   ├── penagihan-wa/   # SCR-005 Penagihan WhatsApp
│   │   │   ├── kas/            # SCR-006/007 Dual Buku Kas & Modal Tx
│   │   │   ├── warga/          # SCR-008 Data Warga & Unit Rumah
│   │   │   ├── pengaturan/     # SCR-009 Tarif Dinamis & Rekening Kas
│   │   │   ├── audit-log/      # SCR-010 Audit Trail Permanen
│   │   │   └── pengguna/       # SCR-011 Manajemen Akun Pengguna
│   │   ├── api/v1/             # RESTful API route handlers
│   │   └── login/              # SCR-001 Halaman Autentikasi Pengurus
│   ├── components/             # Reusable UI components & dialogs
│   │   ├── ui/                 # Primitives shadcn/ui
│   │   ├── layout/             # Sidebar, MobileBottomNav, RoleGuard
│   │   ├── billing/            # Komponen tagihan & pembayaran
│   │   ├── cash/               # Komponen buku kas & bukti nota
│   │   ├── whatsapp/           # Komponen penagihan WA & copy button
│   │   └── dashboard/          # Komponen statistik & chart arus kas
│   ├── db/                     # Skema 12 tabel Drizzle ORM & seed script
│   ├── lib/                    # Helper JWT auth, password bcrypt, R2 presign, PDF
│   └── server/services/        # Business logic & domain services
├── tests/                      # Rangkaian test API, database, & flow E2E
├── vercel.json                 # Konfigurasi deployment Vercel sin1
└── tailwind.config.ts          # Tokens warna & tipografi SiWarga Civic Balance
```

---

## 📄 Lisensi

Hak Cipta © 2026 Pengurus RT 04 Komplek Melati. Dilisensikan di bawah lisensi MIT.

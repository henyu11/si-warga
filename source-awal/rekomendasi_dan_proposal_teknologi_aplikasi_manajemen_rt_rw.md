# Rekomendasi dan Proposal Teknologi — Aplikasi Manajemen RT/RW

| Informasi Dokumen | Detail |
| :--- | :--- |
| **Proyek** | Aplikasi Manajemen RT/RW (Web Mobile-Responsive) |
| **Lingkup** | Single RT / 1 Komplek (50–300 KK; kapasitas target hingga 1.500 KK `[ASUMSI]`) |
| **Fase** | Fase 2 — Senior Technology Architect (Revisi Database SQLite) |
| **Referensi Masukan** | `01-brd-aplikasi-rtrw.md`, `02-prd-aplikasi-rtrw.md`, `03-function-list-aplikasi-rtrw.md` |

---

## 1. Ringkasan Kebutuhan Teknis dari Fase 1 & Preferensi Deployment

Pemilihan teknologi pada proyek ini didorong oleh lima faktor arsitektural dari Fase 1 serta kebutuhan deployment skala kecil yang gratis dan praktis:

1. **Integritas Keuangan Dual-Kas (ACID):** Pencatatan pembayaran warga per komponen (`F-005`) wajib memperbarui tagihan, melakukan *routing* ke **Kas Umum** dan/atau **Kas Keamanan** (`F-007`), serta merekam **Audit Trail** (`F-009`) secara atomik agar saldo tidak pernah berselisih (target KPI `BIZ-04`: Rp 0 selisih).
2. **Database Ringan & Deployment Gratis (Vercel-Ready):** Menggunakan ekosistem **SQLite** yang sangat cocok untuk skala Single RT (ratusan KK, beban baca/tulis rendah) dengan biaya operasional **Rp 0/bulan** di tier gratis.
3. **Kecepatan Akses Mobile-First (4G):** Bendahara dan Ketua dominan menggunakan browser ponsel. Halaman harus ringan (muat awal < 2,5 detik, API P95 < 500 ms) dengan dukungan *Clipboard API* + *deep link* `wa.me` (`F-006`, `F-008`).
4. **Keamanan Data Warga & RBAC Ketat:** Nomor WhatsApp warga, bukti transfer, dan buku kas hanya boleh diakses sesuai Role (`Admin`, `Bendahara`, `Ketua`) dengan validasi di sisi server (`F-001`).
5. **Kesiapan Export Dokumen & Media:** Mendukung unggah foto bukti transfer/nota pengeluaran (maks. 2 MB) dan pembuatan laporan PDF/CSV (`F-010`).

---

## 2. Catatan Arsitektur Kritis: SQLite di Vercel

> **Peringatan Deployment Serverless:** File SQLite lokal biasa (`file:./data.db`) **tidak dapat menyimpan data secara permanen di Vercel** karena *filesystem* Vercel Serverless bersifat *ephemeral* (sementara) dan akan terhapus setiap kali server tidur (*cold start*) atau saat deployment baru.

Untuk tetap memakai **SQLite** sekaligus bisa deploy **100% gratis di Vercel**, solusi standar industri adalah menggunakan **Turso (libSQL — Managed SQLite)**:
* **Saat Development (Lokal):** Tetap memakai file SQLite lokal biasa (`file:./local.db`) tanpa perlu install server database apa pun.
* **Saat Production (Vercel):** Cukup ganti environment variable `DATABASE_URL` ke URL **Turso (libSQL)** lewat protokol HTTP/WebSocket. Semua query SQLite, Drizzle ORM, dan transaksi ACID tetap berjalan identik 100% tanpa ubah kode.

---

## 3. Matriks Perbandingan Opsi Tech Stack (Berbasis SQLite)

| Layer | Rekomendasi Utama: Next.js + Turso (SQLite) di Vercel | Alternatif 1: Cloudflare Fullstack + D1 (SQLite) | Alternatif 2: Laravel + Local SQLite (WAL) di VPS |
| :--- | :--- | :--- | :--- |
| **Frontend Web** | **Next.js (App Router) + React + TypeScript + Tailwind CSS + shadcn/ui** | Next.js / SvelteKit / Remix + Tailwind CSS | Inertia.js + React/Vue + Tailwind CSS |
| **Backend / API** | **Next.js Route Handlers (`/api/v1/*`) + Zod Validation** | Cloudflare Workers / Pages Functions | Laravel 12 (PHP 8.3+) |
| **Database** | **SQLite via Turso (libSQL)** *(lokal `.db`, prod Turso)* | **Cloudflare D1** *(Managed SQLite)* | **Local SQLite 3 (WAL Mode)** pada disk VPS |
| **ORM / Query** | **Drizzle ORM (`@libsql/client`)** | Drizzle ORM (D1 Driver) | Eloquent ORM |
| **Autentikasi** | **Custom JWT (HTTP-only Cookie) + Argon2id / bcryptjs** | JWT (Web Crypto API / PBKDF2) | Laravel Sanctum / Breeze |
| **Object Storage** | **Cloudflare R2** (atau Vercel Blob) | Cloudflare R2 | Local Disk VPS / Cloudflare R2 |
| **Export PDF/CSV** | `@react-pdf/renderer` + `csv-stringify` | Client-side PDF (`jspdf` / `window.print`) | DomPDF + Maatwebsite Excel |
| **Biaya Hosting** | **Rp 0/bulan** (Vercel Hobby + Turso Free + R2 Free) | **Rp 0/bulan** (Cloudflare Free Tier) | Rp 80.000 – Rp 150.000/bulan (sewa VPS) |
| **Kompleksitas Dev** | Sangat Rendah (1 klik deploy GitHub → Vercel) | Rendah–Menengah (batasan runtime Edge/Workers) | Rendah (perlu kelola server VPS sendiri) |
| **Kecocokan MVP RT/RW** | **Sangat Cocok (Terpilih)** | Cocok (pilihan gratis kedua terbaik) | Cocok jika punya VPS sendiri |

---

## 4. Rekomendasi Tech Stack Utama & Justifikasi

Rekomendasi utama yang ditetapkan adalah **Modular Fullstack TypeScript Monolith (Next.js + SQLite/Turso + Drizzle ORM + Tailwind CSS + Cloudflare R2)**:

1. **Next.js (App Router) + TypeScript di Vercel:**
   * Deployment otomatis dari GitHub ke **Vercel** secara gratis (*zero-config*), sekaligus menyatukan UI Web Mobile-Responsive dan REST API (`/api/v1/*`) dalam satu proyek.
   * Validasi **Zod** dipakai bersama antara Frontend dan Backend untuk mencegah salah format nominal Rupiah atau nomor WA.
2. **SQLite via Turso (libSQL) + Drizzle ORM:**
   * **SQLite** adalah database ideal untuk aplikasi RT/RW berskala kecil (hingga ribuan KK dan puluhan ribu transaksi tetap sangat cepat dengan ukuran file hanya beberapa MB).
   * **Turso Free Tier** menyediakan kapasitas sangat lega untuk 1 RT (hingga 5 GB penyimpanan, jutaan pembacaan/penulisan per bulan) dan mendukung penuh transaksi ACID **SQLite (`BEGIN IMMEDIATE`)** sehingga saldo Dual Kas tetap aman dari *race condition*.
   * **Drizzle ORM** memiliki dukungan kelas satu untuk SQLite & `@libsql/client`, ukuran bundle sangat kecil untuk lingkungan serverless Vercel, serta migrasi SQL yang bersih.
3. **Tailwind CSS + shadcn/ui:**
   * Komponen aksesibel (*touch-friendly* minimal 44x44px di mobile) dan sangat presisi saat mengimplementasikan desain Google Stitch pada Fase 3.
4. **Cloudflare R2 (Free Tier 10 GB) / Vercel Blob:**
   * Menyimpan foto bukti transfer (`F-005`) dan foto nota pengeluaran (`F-007`) secara terpisah dari database SQLite (menjaga ukuran database tetap kecil dan cepat).
   * Cloudflare R2 dipilih sebagai penyimpanan utama karena bebas biaya *egress* dan memiliki *free tier* 10 GB/bulan.
5. **Autentikasi Sesi Aman (HTTP-only Secure Cookie JWT):**
   * Password di-hash menggunakan **bcryptjs** atau **Argon2id** (Catatan: untuk runtime serverless Vercel standar, `bcryptjs` atau `@node-rs/argon2` pada Node.js Runtime berjalan mulus tanpa isu kompilasi native).
   * Token sesi disimpan di **HTTP-only, Secure, SameSite=Lax Cookie** agar kebal terhadap pencurian token via XSS.

---

## 5. Proposal Teknologi: Infrastruktur, Keamanan, dan Operasional

### 5.1 Strategi Deployment Gratis & Estimasi Biaya

* **Opsi Deployment Utama — 100% Gratis di Vercel + Turso + R2:**
  * **Aplikasi & API:** Vercel Hobby Plan (**Rp 0/bulan**, termasuk SSL/HTTPS otomatis dan domain `*.vercel.app`).
  * **Database SQLite:** Turso Starter Free Plan (**Rp 0/bulan**, region terdekat Singapura/Tokyo untuk latensi rendah dari Indonesia).
  * **Storage Foto Nota:** Cloudflare R2 Free Tier (**Rp 0/bulan**, 10 GB penyimpanan).
  * **Biaya Opsional:** Domain kustom `.my.id` atau `.id` (~Rp 25.000 – Rp 250.000/tahun) `[ASUMSI]`.
* **Opsi Alternatif — Single VPS (Local SQLite WAL):**
  * Jika di masa depan pengurus ingin memindahkan ke VPS pribadi tanpa pihak ketiga, seluruh kode tetap berjalan langsung hanya dengan mengganti `DATABASE_URL` menjadi `file:./data/rtrw.db` dalam mode **WAL (`PRAGMA journal_mode = WAL`)**.

### 5.2 Strategi Keamanan & Kepatuhan Data

| Aspek Keamanan | Implementasi Wajib |
| :--- | :--- |
| **Transport & Enkripsi** | Wajib HTTPS (TLS 1.3 otomatis dari Vercel dan koneksi terenkripsi `libsql://` ke Turso). |
| **Autentikasi & Sesi** | Password hash kuat (`bcryptjs` cost 12 / `argon2id`); HTTP-only Cookie JWT durasi 24 jam; *rate limiting* endpoint login (maks. 5 percobaan gagal per 15 menit). |
| **Otorisasi (RBAC)** | Middleware pemeriksaan Role (`ADMIN`, `BENDAHARA`, `KETUA`) di setiap API endpoint backend. |
| **Integritas SQLite** | Wajib mengaktifkan `PRAGMA foreign_keys = ON` agar relasi antar tabel selalu dijaga ketat; tabel `audit_logs` bersifat *append-only* tanpa endpoint edit/hapus. |
| **Validasi Unggah File** | Validasi tipe MIME (JPG/PNG/WebP), batas keras ukuran 2 MB, penamaan ulang file menjadi UUID acak, dan akses gambar lewat *Signed URL* singkat. |
| **Privasi Data Warga** | Data nomor WA dan alamat warga hanya bisa diakses pengguna terautentikasi; blokir crawler mesin pencari (`robots.txt: Disallow: /`). |

### 5.3 Strategi Backup, Pemulihan, dan Skalabilitas

* **Backup Otomatis Harian:** Karena database berupa SQLite, backup sangat sederhana dan ringan. Gunakan *scheduled job* (misalnya **GitHub Actions Cron** gratis setiap pukul 02:00 WIB) untuk menjalankan `turso db shell <db> .dump` terkompresi dan mengunggah arsip `.sql.gz` ke Cloudflare R2 dengan retensi minimal **30 hari** (memenuhi NFR Ketersediaan).
* **Target Pemulihan (`[ASUMSI]`):** RPO ≤ 24 jam; RTO ≤ 30 menit (cukup restore 1 file dump SQLite).
* **Skalabilitas:** SQLite + Turso sanggup menangani puluhan hingga ratusan ribu baris transaksi kas dengan performa sub-10ms pada query terindeks—jauh melampaui kebutuhan 1 RT/Komplek selama 10+ tahun operasional.

### 5.4 Risiko Teknis (Khusus SQLite + Serverless) dan Mitigasi

| Risiko Teknis | Dampak | Mitigasi Arsitektural |
| :--- | :--- | :--- |
| **Salah deploy pakai file SQLite lokal di Vercel** | Data warga dan kas hilang saat cold start / redeploy | Wajib menggunakan **Turso (libSQL)** di environment production Vercel; file lokal `.db` hanya untuk development |
| **Konflik tulis bersamaan (*database is locked*)** | Transaksi kas gagal saat 2 request datang di milidetik sama | Gunakan transaksi `BEGIN IMMEDIATE` + retry otomatis singkat pada sisi aplikasi; beban Single RT (< 20 user) sangat aman untuk *serialized write* SQLite |
| **Tipe data longgar bawaan SQLite (*dynamic typing*)** | Nilai tidak valid (misal nominal negatif / role salah) masuk ke DB | Gunakan `CHECK` constraint ketat di level skema SQLite, `STRICT` (jika didukung) serta validasi **Zod** wajib di API layer |
| **Foto nota kamera HP terlalu besar (> 5 MB)** | Gagal unggah di jaringan 4G / melebihi batas payload Vercel (4,5 MB) | Kompresi foto otomatis di browser (*client-side resize* maks. 1280px, < 1 MB) atau gunakan *Presigned Upload URL* langsung dari browser ke Cloudflare R2 |
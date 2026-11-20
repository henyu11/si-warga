# Laporan Audit dan Validasi Teknis — Aplikasi Manajemen RT/RW

| Informasi Dokumen | Detail |
| :--- | :--- |
| **Proyek** | Aplikasi Manajemen RT/RW (Web Mobile-Responsive, Single RT/Komplek) |
| **Peran Auditor** | Senior Fullstack Developer |
| **Stack yang Diaudit** | Next.js (App Router, TypeScript) + Tailwind CSS + shadcn/ui + SQLite/Turso (libSQL) + Drizzle ORM + Cloudflare R2 di Vercel |
| **Artefak yang Diaudit** | Fase 1 (`00`–`03`), Fase 2 (`04`–`06`), Fase 3 (`07`–`08`) |
| **Fase** | Fase 4 — Senior Fullstack Developer |

---

## 1. Ringkasan Eksekutif Audit

Secara keseluruhan, blueprint **Fase 1 hingga Fase 3** sudah sangat solid, konsisten antar dokumen (`F-001`–`F-010` terpetakan penuh ke 12 tabel SQLite dan 11 layar `SCR-001`–`SCR-011`), serta realistis untuk di-deploy gratis pada Vercel Hobby + Turso Free + Cloudflare R2 Free.

Namun, dari sudut pandang implementasi **Fullstack Production**, ditemukan **10 temuan teknis dan *edge case*** (3 *Critical*, 4 *High*, 3 *Medium*) yang **wajib ditangani sebelum atau saat Sprint 1** agar aplikasi tidak mengalami transaksi ganda di jaringan 4G, *lock error* di SQLite/Turso, saldo laporan bulanan meleset, atau kegagalan *Copy WA* di Safari iOS.

---

## 2. Daftar Temuan Audit & Solusi Implementasi

### 2.1 Temuan Tingkat CRITICAL (Wajib Diperbaiki Sebelum Coding Inti)

#### [AUD-01] Risiko Transaksi Ganda (*Double Submit*) pada Pembayaran & Kas Manual di Jaringan 4G
* **Area Terdampak:** Schema DB (`payments`, `cash_transactions`), `F-005`, `F-007`, `SCR-004`, `SCR-007`.
* **Masalah:** Pada Fase 2, *idempotency* baru diterapkan pada `bills` (`UNIQUE(household_id, period_year, period_month)`). Tabel `payments` dan `cash_transactions` belum memiliki mekanisme anti-duplikat. Saat Bendahara mengetuk tombol *"Simpan Pembayaran"* dua kali karena koneksi 4G lambat atau timeout di Vercel, pembayaran dan pemasukan Dual Kas berisiko tercatat dua kali.
* **Solusi Wajib (Patch Schema & API):**
  1. Tambahkan kolom `idempotency_key TEXT UNIQUE` (opsional/wajib dari client) pada tabel `payments` dan `cash_transactions`.
  2. Frontend membangkitkan `crypto.randomUUID()` saat form dibuka dan mengirimkannya melalui header HTTP `Idempotency-Key`.
  3. Jika request ulang dengan `Idempotency-Key` yang sama masuk, backend mengembalikan respons transaksi yang sudah ada (`200 OK`) tanpa menulis ulang saldo kas.

#### [AUD-02] Perilaku Transaksi Default Drizzle + Turso (libSQL) & Risiko `SQLITE_BUSY`
* **Area Terdampak:** Backend Service Layer (`SvcBilling`, `SvcCash`, `SvcSetting`), `05-rancangan-arsitektur-aplikasi-rtrw.md`.
* **Masalah:** Di Drizzle ORM dengan driver `@libsql/client`, `db.transaction(...)` secara default memakai mode `DEFERRED`. Jika dua request menulis saldo kas bersamaan, transaksi `DEFERRED` yang awalnya membaca lalu mencoba *upgrade* ke *write lock* akan langsung gagal dengan `SQLITE_BUSY` tanpa menunggu `busy_timeout`.
* **Solusi Wajib:**
  1. Wajib selalu memanggil `db.transaction(async (tx) => { ... }, { behavior: 'immediate' })` pada seluruh mutasi keuangan (`F-003`, `F-004`, `F-005`, `F-007`).
  2. Bungkus eksekusi transaksi dengan *helper* `withSqliteRetry(fn, maxRetries = 3)` yang melakukan jeda *jitter backoff* (`50ms`, `150ms`, `300ms`) bila menerima error `SQLITE_BUSY` / `SQLITE_LOCKED`.

#### [AUD-03] Edge Case Re-Open Status Tagihan saat Penambahan Denda Ronda pada KK yang Sudah Lunas
* **Area Terdampak:** `F-004`, `F-005`, `F-006`, `bills`, `bill_items`.
* **Masalah:** Misalkan Bpk. Agus melunasi Iuran Wajib & Keamanan pada tanggal 5 November (`bills.status = 'PAID'`). Pada tanggal 18 November, Bpk. Agus absen ronda dan Bendahara menginput `DENDA_RONDA` Rp 25.000 pada periode November. Jika sistem hanya memblokir edit pada tagihan `PAID`, Bendahara tidak bisa mencatat denda; sebaliknya jika `bill_items` ditambah tanpa menghitung ulang header, status `bills` tetap `PAID` sehingga tidak muncul di Penagihan WA (`SCR-005`).
* **Solusi Wajib:**
  1. Izinkan penambahan item baru bertipe `DENDA_RONDA` pada tagihan periode berjalan meskipun status header saat ini `PAID`.
  2. Buat fungsi tunggal `recalculateBillHeader(tx, billId)` yang selalu menghitung ulang `total_amount = SUM(bill_items.amount)`, `total_paid = SUM(bill_items.paid_amount)`, dan status (`PAID` jika `total_paid >= total_amount`, `PARTIAL` jika `0 < total_paid < total_amount`, `UNPAID` jika `total_paid == 0`). Dengan demikian, tagihan otomatis turun dari `PAID` menjadi `PARTIAL` dan langsung muncul di `SCR-005` hanya untuk sisa Denda Ronda.
  3. Jika tagihan bulan berjalan untuk KK tersebut belum pernah di-generate saat input denda, tampilkan error terarah (`BILL_NOT_GENERATED_YET`) atau sediakan opsi *auto-create* header tagihan secara eksplisit.

---

### 2.2 Temuan Tingkat HIGH (Penting untuk Keamanan & Akurasi Laporan)

#### [AUD-04] Akurasi Saldo Awal Bulan Historis vs `cash_books.current_balance`
* **Area Terdampak:** `F-007`, `F-008`, `F-010`, `SCR-002`, `SCR-006`.
* **Masalah:** Kolom `cash_books.current_balance` menyimpan saldo terkini keseluruhan waktu (*all-time*). Jika Ketua membuka laporan bulan lalu (misal Oktober 2026 saat sekarang sudah Desember 2026) atau Bendahara menginput transaksi *backdated* (tanggal 30 Oktober diinput pada 2 November), angka `current_balance` tidak dapat dipakai sebagai Saldo Akhir Oktober.
* **Solusi Wajib:**
  1. Untuk tampilan laporan periode `(year, month)`, hitung secara dinamis dari indeks `idx_cash_tx_book_date_status`:
     * **Saldo Awal Bulan:** `SUM(CASE WHEN transaction_type = 'INCOME' THEN amount ELSE -amount END)` untuk semua baris `status = 'POSTED'` dengan `transaction_date < 'YYYY-MM-01'`.
     * **Masuk / Keluar Bulan Ini:** Agregasi baris `status = 'POSTED'` pada rentang `['YYYY-MM-01', 'YYYY-MM-akhir']`.
     * **Saldo Akhir Bulan:** `Saldo Awal Bulan + Masuk Bulan Ini - Keluar Bulan Ini`.
  2. Gunakan `cash_books.current_balance` khusus untuk kartu **"Saldo Kas Saat Ini (Real-Time)"** di Dashboard, disertai *health check* rekonsiliasi periodik agar selisih selalu Rp 0 (`BIZ-04`).

#### [AUD-05] Rate Limiting Login & Revokasi Sesi Instan di Vercel Serverless
* **Area Terdampak:** `F-001`, `users`, `SCR-001`, `SCR-011`.
* **Masalah:**
  1. Rate limiting berbasis memori (`Map`) di Node.js tidak efektif di Vercel Serverless karena setiap fungsi dapat berjalan di container berbeda.
  2. JWT stateless berdurasi 24 jam tetap berlaku meskipun Admin baru saja menonaktifkan akun pengurus (`is_active = 0`) atau melakukan reset password.
* **Solusi Wajib:**
  1. Tambahkan tabel ringan **`auth_rate_limits`** (`key TEXT PRIMARY KEY, attempts INTEGER, locked_until TEXT, updated_at TEXT`) di SQLite/Turso untuk menerapkan batas 5 percobaan gagal per 15 menit tanpa perlu layanan Redis berbayar tambahan.
  2. Tambahkan kolom **`token_version INTEGER NOT NULL DEFAULT 1`** pada tabel `users`. Simpan `token_version` di dalam payload JWT. Saat Admin menonaktifkan user, mengubah Role, atau mereset password, naikkan `token_version = token_version + 1`. Middleware/guard API memeriksa `is_active = 1` dan kecocokan `token_version` (query by PK SQLite < 2ms).
  3. Tambahkan proteksi **`LAST_ADMIN_LOCKOUT`**: API menolak menonaktifkan, menghapus, atau menurunkan Role akun `ADMIN` jika merupakan satu-satunya Admin aktif tersisa.

#### [AUD-06] Validasi Ketat *Object Key* Cloudflare R2 & Pembersihan *Orphan Files*
* **Area Terdampak:** `F-005`, `F-007`, `SCR-004`, `SCR-007`.
* **Masalah:** Dengan pola *Direct Upload Presigned URL*, pengguna mengunggah gambar ke R2 sebelum menekan "Simpan". Ada dua celah: (a) penyerang bisa mengirimkan `proof_file_key` sembarang untuk membaca file milik transaksi lain, dan (b) file tetap menumpuk di R2 jika user membatalkan form.
* **Solusi Wajib:**
  1. Backend wajib memvalidasi pola `object_key` secara ketat (`^(proofs|receipts)/\d{4}/\d{2}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$`) dan memverifikasi keberadaan + ukuran file (`HeadObjectCommand`, maks. 2 MB) sebelum menyimpan referensi ke SQLite.
  2. Konfigurasi **R2 Lifecycle Rule** untuk folder sementara `tmp/` (auto-delete setelah 24 jam) atau jalankan *cleanup job* mingguan bersama GitHub Actions Backup untuk menghapus objek R2 yang tidak terdaftar di `payments` maupun `cash_transactions`.
  3. Saat menampilkan foto nota/bukti transfer ke browser, backend mengeluarkan *Presigned GET URL* berumur singkat (**5 menit**), jangan pernah membuka bucket R2 ke publik.

#### [AUD-07] Penerapan Tarif Baru pada Tagihan Berstatus `PARTIAL` dan Override ke Rp 0
* **Area Terdampak:** `F-003`, `F-004`, `SCR-009`.
* **Masalah:**
  1. Pada Fase 2 (`05-rancangan-arsitektur`), update massal tarif bulan berjalan menargetkan `bill_items.status = 'UNPAID' AND is_overridden = 0`. Hal ini sudah benar di level item, namun pada saat preview jumlah KK terdampak di `SCR-009` ("8 KK terdampak"), query harus menghitung `COUNT(DISTINCT bill_id)` berdasarkan `bill_items.status = 'UNPAID'` (termasuk KK yang `bills.status = 'PARTIAL'` karena baru melunasi Iuran Wajib tetapi Iuran Keamanannya masih `UNPAID`).
  2. Jika Admin/Bendahara melakukan override nominal komponen menjadi `Rp 0` (misal keringanan penuh 1 bulan), `paid_amount = 0` sama dengan `amount = 0` sehingga item harus langsung ditandai `PAID` agar tidak terjebak sebagai tunggakan Rp 0 di `SCR-005`.
* **Solusi Wajib:** Terapkan aturan `amount === paid_amount => status = 'PAID'` secara konsisten di `recalculateBillHeader()` serta pastikan `SCR-005` memfilter `bills.total_amount - bills.total_paid > 0`.

---

### 2.3 Temuan Tingkat MEDIUM (Optimasi UX Mobile & Stabilitas Runtime)

#### [AUD-08] Kegagalan `navigator.clipboard.writeText()` di Safari iOS pada Fitur Copy WA
* **Area Terdampak:** `F-006`, `F-008`, `SCR-002`, `SCR-005`.
* **Masalah:** Safari iOS (WebKit) memblokir pemanggilan `navigator.clipboard.writeText()` jika didahului `await fetch('/api/v1/...')` karena konteks *user gesture* dianggap sudah hilang. Akibatnya tombol **Copy Pesan WA** bisa diam-diam gagal di iPhone Bendahara/Ketua.
* **Solusi Wajib:**
  1. Sertakan teks pesan WA yang sudah diformat (atau data lengkap + fungsi formatter deterministik yang sama dengan backend) langsung dalam payload `GET /api/v1/arrears` dan `GET /api/v1/dashboard` sehingga klik tombol **Copy Pesan WA** mengeksekusi `navigator.clipboard.writeText(text)` secara **sinkron langsung** tanpa `await fetch` tambahan.
  2. Sediakan *fallback* otomatis (modal textarea dengan teks terseleksi otomatis + tombol Salin) jika izin clipboard browser ditolak.

#### [AUD-09] Celah UI: Riwayat Pembayaran Parsial & Alur *Void* pada `SCR-003`/`SCR-004`
* **Area Terdampak:** `F-005`, `SCR-003`, `SCR-004`.
* **Masalah:** Warga dapat membayar 2–3 kali dalam satu bulan (pembayaran parsial). Pada `SCR-004`, fokus utama adalah form input bayar baru, namun belum tampak panel daftar riwayat pembayaran untuk tagihan tersebut agar Bendahara tahu transaksi mana yang hendak di-`Void` atau dilihat bukti transfernya.
* **Solusi Wajib:** Tambahkan tab kedua **"Riwayat Bayar (N)"** di dalam Modal/Drawer Detail Tagihan (`SCR-004`) yang menampilkan daftar seluruh `payments` (tanggal, metode, rincian alokasi ke Kas Umum/Keamanan, tombol Lihat Bukti Transfer, dan tombol **Batalkan / Void** khusus Role `BENDAHARA` dengan input alasan wajib).

#### [AUD-10] Batas Durasi eksekusi Vercel Hobby (10 Detik) pada Export PDF (`F-010`)
* **Area Terdampak:** `F-010`, `SCR-002`, `SCR-006`.
* **Masalah:** Render PDF di server dengan `@react-pdf/renderer` untuk ratusan baris dapat mendekati batas timeout Vercel Hobby (10 detik pada serverless function standar) dan tidak didukung di Edge Runtime.
* **Solusi Wajib:**
  1. Wajib deklarasikan `export const runtime = 'nodejs';` dan `export const maxDuration = 10;` pada route export.
  2. Batasi export PDF per 1 periode bulan (atau maksimal 12 bulan untuk ringkasan kas) dan optimalkan query agar selesai < 1,5 detik; untuk data mentah besar, arahkan ke **Export CSV** yang di-stream dalam < 300 ms.

---

## 3. Ringkasan Tambahan Skema SQLite dari Hasil Audit (Delta Fase 2 -> Fase 4)

Berikut perubahan kecil yang wajib dimasukkan pada file migrasi Drizzle SQLite di Sprint 1 agar 10 temuan di atas tertutup 100%:

| Tabel | Penambahan Kolom / Tabel | Alasan Audit |
| :--- | :--- | :--- |
| `users` | `token_version INTEGER NOT NULL DEFAULT 1` | Revokasi JWT instan saat nonaktif/reset password (`AUD-05`) |
| `payments` | `idempotency_key TEXT UNIQUE` | Proteksi *double submit* jaringan 4G (`AUD-01`) |
| `cash_transactions` | `idempotency_key TEXT UNIQUE` | Proteksi *double submit* transaksi kas manual (`AUD-01`) |
| `auth_rate_limits` *(tabel baru)* | `key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, locked_until TEXT, updated_at TEXT NOT NULL` | Rate limiting login persisten di Vercel Serverless (`AUD-05`) |

---

## 4. Kesimpulan Kelayakan Implementasi

Dengan menerapkan 4 delta skema ringan dan 10 standar implementasi di atas, arsitektur **Next.js + SQLite/Turso + Cloudflare R2 di Vercel** dinyatakan **LAYAK PENUH (Production-Ready untuk skala Single RT/Komplek)** dan siap langsung diturunkan ke kontrak API pada `10-api-contract-aplikasi-rtrw.md`.
# Rancangan Arsitektur Sistem — Aplikasi Manajemen RT/RW

| Informasi Dokumen | Detail |
| :--- | :--- |
| **Proyek** | Aplikasi Manajemen RT/RW (Web Mobile-Responsive) |
| **Gaya Arsitektur** | Modular Fullstack Monolith (Serverless Vercel + SQLite/Turso) |
| **Fase** | Fase 2 — Senior Technology Architect (Revisi Database SQLite) |
| **Referensi Fitur** | `F-001` s/d `F-010` (`03-function-list-aplikasi-rtrw.md`) |

---

## 1. Diagram Arsitektur Sistem (Container & Integrasi)

Diagram berikut menggambarkan komponen utama sistem yang dirancang ringan dan dapat di-deploy 100% gratis di Vercel + Turso (SQLite) + Cloudflare R2.

```mermaid
flowchart TB
    subgraph ClientLayer["Perangkat Pengguna (Browser Mobile 360px+ & Desktop)"]
        UI["Web App UI (Next.js React + Tailwind)<br/>Admin | Bendahara | Ketua"]
        LocalUtils["Client Utilities<br/>• Kompresi Foto Nota (< 1–2 MB)<br/>• Clipboard API (Copy WA)<br/>• Deep Link wa.me"]
        WAApp["Aplikasi WhatsApp<br/>(HP / WA Web Pengguna)"]
    end

    subgraph EdgeLayer["Vercel Edge Network"]
        Proxy["Vercel Edge CDN & HTTPS TLS 1.3<br/>Rate Limiting & Routing"]
    end

    subgraph AppServer["Next.js App Server (Vercel Serverless Node.js Runtime)"]
        AuthMW["Auth & RBAC Middleware<br/>(Verify JWT Cookie & Role Check)"]
        APIRouter["REST API Layer (/api/v1/*)<br/>Validasi Payload via Zod"]

        subgraph DomainServices["Domain Service Layer"]
            SvcAuth["Auth & User Service<br/>(F-001)"]
            SvcResident["Resident Service<br/>(F-002)"]
            SvcSetting["Tariff & Settings Service<br/>(F-003)"]
            SvcBilling["Billing & Payment Service<br/>(F-004, F-005)"]
            SvcWA["WA Formatter & Arrears Service<br/>(F-006, F-008)"]
            SvcCash["Dual Cash Book Service<br/>(F-007)"]
            SvcAudit["Audit Trail Service<br/>(F-009)"]
            SvcReport["Dashboard & Export Service<br/>(F-008, F-010)"]
        end
    end

    subgraph DataLayer["Data & Storage Layer (Free-Tier Friendly)"]
        SQLite[("SQLite / Turso (libSQL)<br/>• Dev: Local file .db (WAL)<br/>• Prod: Turso Managed SQLite<br/>• ACID Tx (BEGIN IMMEDIATE)<br/>• Dual Cash Ledger & Audit Logs")]
        R2[("Cloudflare R2 Object Storage<br/>• Bukti Transfer Warga<br/>• Foto Nota Pengeluaran<br/>• Backup Dump SQLite Harian")]
    end

    UI <--> LocalUtils
    LocalUtils -. "Buka wa.me / Paste Pesan" .-> WAApp
    UI <--> |"HTTPS JSON"| Proxy
    UI -. "Direct Upload (Presigned URL)" .-> R2
    Proxy <--> AuthMW
    AuthMW --> APIRouter

    APIRouter --> SvcAuth
    APIRouter --> SvcResident
    APIRouter --> SvcSetting
    APIRouter --> SvcBilling
    APIRouter --> SvcWA
    APIRouter --> SvcCash
    APIRouter --> SvcAudit
    APIRouter --> SvcReport

    SvcBilling --> |"Routing Otomatis Dual Kas"| SvcCash
    SvcBilling --> SvcAudit
    SvcSetting --> SvcAudit
    SvcCash --> SvcAudit

    DomainServices <--> |"Drizzle ORM (@libsql/client)"| SQLite
    SvcBilling --> |"Generate Signed URL"| R2
    SvcCash --> |"Generate Signed URL"| R2
```

---

## 2. Penjelasan Lapisan Arsitektur dan Tanggung Jawab

### 2.1 Client Layer (Web Mobile-Responsive)
* **Antarmuka Adaptif:** Menggunakan navigasi *bottom bar* di perangkat mobile (`< 768px`) agar mudah dioperasikan satu tangan oleh Bendahara dan Ketua, serta *sidebar* di desktop (`>= 768px`) untuk Admin.
* **Client-Side Image Compression & Direct Upload:** Foto bukti transfer (`F-005`) atau nota pengeluaran (`F-007`) diperkecil otomatis di browser (< 1–2 MB), lalu diunggah langsung ke **Cloudflare R2** menggunakan *Presigned URL* dari backend. Pendekatan ini menghindari batas ukuran body request (4,5 MB) pada Vercel Serverless sekaligus menghemat bandwidth server.
* **Integrasi WhatsApp Gratis (`F-006`, `F-008`):** Pesan penagihan dan laporan kas diformat secara konsisten oleh backend berdasarkan template di SQLite, lalu diserahkan ke frontend untuk disalin via `Clipboard API` (dengan *fallback* manual) atau dibuka via `https://wa.me/628xxx?text=...`.

### 2.2 Vercel Edge & Security Middleware
* **HTTPS Otomatis & Proteksi Akses:** Seluruh lalu lintas terenkripsi TLS 1.3 bawaan Vercel.
* **RBAC Middleware (`F-001`):** Setiap request ke `/api/v1/*` (kecuali `/auth/login`) memverifikasi HTTP-only JWT Cookie, mengekstrak `user_id` dan `role`, lalu mencocokkannya dengan izin endpoint. Akses tidak sah langsung ditolak dengan `403 Forbidden`.

### 2.3 Domain Service Layer (Modular Monolith)
* **Billing & Payment Service (`F-004`, `F-005`):** Mengelola generate tagihan bulanan idempoten (`INSERT ... ON CONFLICT DO NOTHING`), input Denda Ronda, override nominal, serta alokasi pembayaran parsial/lunas.
* **Dual Cash Book Service (`F-007`):** Menjaga pemisahan mutlak antara `KAS_UMUM` dan `KAS_KEAMANAN`. Karena menggunakan **SQLite**, penguncian tulis atomik dilakukan menggunakan transaksi **`BEGIN IMMEDIATE`** (bukan `SELECT ... FOR UPDATE`), yang secara alami menyerialisasi penulisan saldo kas sehingga bebas dari *race condition*.
* **Audit Trail Service (`F-009`):** Dipanggil di dalam transaksi `BEGIN IMMEDIATE` yang sama setiap kali ada perubahan tarif (`F-003`), override tagihan (`F-004`), pembayaran/pembatalan (`F-005`), atau mutasi kas manual (`F-007`). Jika pencatatan log gagal, seluruh transaksi di-*rollback*.

---

## 3. Alur Data Kritis (Sequence Diagrams)

### 3.1 Alur Pembayaran per Komponen & Routing Otomatis Dual Kas (`F-005`, `F-007`, `F-009`)

Alur ini memastikan pembayaran warga (lunas maupun cicilan per komponen) masuk secara akurat ke `KAS_UMUM` dan/atau `KAS_KEAMANAN` dalam satu transaksi atomik SQLite (`BEGIN IMMEDIATE`).

```mermaid
sequenceDiagram
    actor B as Bendahara (Browser Mobile)
    participant API as REST API (/api/v1/payments)
    participant R2 as Cloudflare R2
    participant Svc as Billing & Dual Cash Service
    participant DB as SQLite / Turso (libSQL)

    opt Ada File Bukti Transfer
        B->>API: POST /uploads/presign (file_type, size <= 2MB)
        API-->>B: presigned_url + object_key
        B->>R2: PUT file terkompresi langsung ke R2
        R2-->>B: 200 OK
    end

    B->>API: POST /payments (bill_id, allocations[], method, proof_file_key)
    API->>API: Cek JWT & Role == BENDAHARA + Validasi Zod
    API->>Svc: recordPayment(payload, actor)

    Svc->>DB: BEGIN IMMEDIATE TRANSACTION
    Svc->>DB: Baca bills & bill_items (terkunci dari writer lain)
    Svc->>Svc: Validasi alokasi <= sisa tagihan per komponen
    Svc->>DB: INSERT payments & payment_allocations (UUID dari app)
    Svc->>DB: UPDATE bill_items (paid_amount, status) & bills (total_paid, status)

    loop Untuk setiap grup target kas (KAS_UMUM / KAS_KEAMANAN)
        Svc->>DB: INSERT cash_transactions (type=INCOME, source=BILL_PAYMENT, is_locked=1)
        Svc->>DB: UPDATE cash_books SET current_balance = current_balance + subtotal
    end

    Svc->>DB: INSERT audit_logs (action=CREATE, module=PAYMENT, new_values JSON)
    Svc->>DB: COMMIT TRANSACTION
    DB-->>Svc: Sukses
    Svc-->>API: Data pembayaran & saldo kas terbaru
    API-->>B: 201 Created + Notifikasi Sukses
```

### 3.2 Alur Perubahan Tarif Dinamis + Audit Trail (`F-003`, `F-004`, `F-009`)

Alur ini menjamin tarif Iuran Wajib, Iuran Keamanan, dan Denda Ronda dapat diubah kapan saja oleh **Admin** atau **Bendahara** tanpa merusak tagihan historis yang sudah lunas.

```mermaid
sequenceDiagram
    actor U as Admin / Bendahara
    participant API as REST API (/api/v1/fee-rates)
    participant Svc as Tariff & Billing Service
    participant DB as SQLite / Turso (libSQL)

    U->>API: POST /fee-rates (fee_type, new_amount, reason, apply_to_unpaid_current_month)
    API->>API: Cek JWT & Role IN (ADMIN, BENDAHARA) + Validasi Zod
    API->>Svc: updateFeeRate(payload, actor)

    Svc->>DB: BEGIN IMMEDIATE TRANSACTION
    Svc->>DB: Ambil tarif aktif sebelumnya (old_rate)
    Svc->>DB: UPDATE fee_rates SET is_active = 0 WHERE fee_type = X AND is_active = 1
    Svc->>DB: INSERT fee_rates (new_amount, is_active = 1, change_reason, created_by)

    opt apply_to_unpaid_current_month == true
        Svc->>DB: UPDATE bill_items SET amount = new_amount<br/>WHERE item_type = X AND status = 'UNPAID'<br/>AND is_overridden = 0 AND periode = bulan_berjalan
        Svc->>DB: Hitung ulang bills.total_amount untuk tagihan terdampak
    end

    Svc->>DB: INSERT audit_logs (action=RATE_CHANGE, old_values, new_values, reason)
    Svc->>DB: COMMIT TRANSACTION
    DB-->>Svc: Sukses
    Svc-->>API: Tarif baru & jumlah tagihan berjalan yang ikut diperbarui
    API-->>U: 200 OK + Konfirmasi Perubahan Tarif
```

---

## 4. Strategi Penanganan Pembatalan (Void) & Integritas Saldo

* **Pembatalan Pembayaran (`F-005`):** Tidak ada penghapusan permanen (*hard delete*) untuk transaksi keuangan. Aksi pembatalan dijalankan dalam transaksi `BEGIN IMMEDIATE` untuk mengubah `payments.status = 'VOIDED'` (wajib `void_reason`), menandai `cash_transactions` terkait menjadi `'VOIDED'`, mengembalikan `cash_books.current_balance`, menghitung ulang `bill_items` & `bills`, serta mencatat jejaknya di `audit_logs`.
* **Rekonsiliasi Saldo:** Saldo cepat dibaca dari `cash_books.current_balance`, dilengkapi fungsi verifikasi konsistensi (`SUM(INCOME) - SUM(EXPENSE)` pada baris berstatus `'POSTED'`) untuk memastikan selisih selalu Rp 0 (`BIZ-04`).
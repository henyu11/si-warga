# Spesifikasi API Contract — Aplikasi Manajemen RT/RW

| Informasi Dokumen | Detail |
| :--- | :--- |
| **Proyek** | Aplikasi Manajemen RT/RW (Web Mobile-Responsive, Single RT/Komplek) |
| **Base URL** | `/api/v1` (Next.js App Router Route Handlers) |
| **Format Data** | JSON (`Content-Type: application/json`), penamaan field `snake_case` (selaras dengan skema SQLite) |
| **Autentikasi** | HTTP-only Secure Cookie (`rtrw_session`) berisi JWT (HS256) + cek `is_active` & `token_version` |
| **Mata Uang & Tanggal** | Nominal dalam integer Rupiah penuh (`50000`), tanggal `YYYY-MM-DD`, timestamp ISO-8601 UTC |
| **Fase** | Fase 4 — Senior Fullstack Developer |

---

## 1. Standar Envelope Response, Pagination, dan Error Handling

### 1.1 Format Response Sukses
```json
{
  "success": true,
  "message": "Pembayaran berhasil dicatat.",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 60,
    "total_pages": 3
  }
}
```
*(Objek `meta` hanya disertakan pada endpoint daftar/pagination).*

### 1.2 Format Response Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Nominal pembayaran melebihi sisa tagihan komponen.",
    "details": [
      {
        "field": "allocations.0.allocated_amount",
        "message": "Maksimal nominal yang dapat dibayar adalah Rp 40.000"
      }
    ]
  }
}
```

### 1.3 Kamus Error Code Terstandar

| HTTP Status | `error.code` | Kondisi Pemicu |
| :--- | :--- | :--- |
| `400` | `VALIDATION_ERROR` | Payload Zod tidak valid, format nomor WA salah, atau nominal negatif |
| `401` | `UNAUTHORIZED` | Cookie sesi kosong, JWT kedaluwarsa, atau `token_version` tidak cocok |
| `401` | `INVALID_CREDENTIALS` | Username/email atau password salah saat login |
| `403` | `FORBIDDEN` | Role pengguna tidak berwenang mengakses API endpoint (misal `KETUA` mencoba POST kas) |
| `404` | `NOT_FOUND` | ID entitas (KK, tagihan, transaksi, user) tidak ditemukan |
| `409` | `CONFLICT` | Nomor blok aktif duplikat, username/email sudah terdaftar, atau pembayaran sudah di-void |
| `409` | `CASH_TX_LOCKED` | Mencoba edit/void transaksi kas dengan `is_locked = 1` (harus lewat void pembayaran) |
| `409` | `OVERPAYMENT_NOT_ALLOWED` | Alokasi nominal melebihi sisa tagihan pada salah satu `bill_items` |
| `409` | `LAST_ADMIN_LOCKOUT` | Mencoba menonaktifkan atau mengubah Role akun `ADMIN` aktif terakhir |
| `429` | `TOO_MANY_REQUESTS` | Melebihi batas 5 percobaan login gagal dalam 15 menit |
| `503` | `DB_BUSY_RETRY_EXHAUSTED` | SQLite/Turso masih sibuk setelah 3x retry otomatis |

---

## 2. Daftar Lengkap API Endpoint & Matriks RBAC

| Modul | Method & API Endpoint | ID Fitur | Role Diizinkan | Keterangan Singkat |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST /api/v1/auth/login` | `F-001` | Publik | Login + set HTTP-only Cookie |
| **Auth** | `POST /api/v1/auth/logout` | `F-001` | Semua Login | Hapus cookie sesi |
| **Auth** | `GET /api/v1/auth/me` | `F-001` | Semua Login | Profil user aktif & hak akses |
| **Auth** | `PATCH /api/v1/auth/me/password` | `F-001` | Semua Login | Ganti password pribadi (+ bump `token_version`) |
| **Users** | `GET /api/v1/users` | `F-001` | `ADMIN` | Daftar akun pengurus |
| **Users** | `POST /api/v1/users` | `F-001` | `ADMIN` | Tambah akun pengurus baru |
| **Users** | `PATCH /api/v1/users/:id` | `F-001` | `ADMIN` | Ubah nama, role, status aktif, atau reset sandi |
| **Warga** | `GET /api/v1/households` | `F-002` | `ADMIN`, `BENDAHARA`, `KETUA` | Daftar warga (search, filter hunian, pagination) |
| **Warga** | `POST /api/v1/households` | `F-002` | `ADMIN`, `BENDAHARA` | Tambah KK baru (auto-normalisasi WA `628xxx`) |
| **Warga** | `PATCH /api/v1/households/:id` | `F-002` | `ADMIN`, `BENDAHARA` | Ubah data warga & tarif khusus KK |
| **Warga** | `DELETE /api/v1/households/:id` | `F-002` | `ADMIN` | Nonaktifkan warga (*soft delete*) + Audit Trail |
| **Settings** | `GET /api/v1/settings` | `F-003` | `ADMIN`, `BENDAHARA`, `KETUA` | Ambil profil RT, info rekening & template WA |
| **Settings** | `PATCH /api/v1/settings` | `F-003` | `ADMIN`, `BENDAHARA` | Perbarui info RT, rekening & template WA + Audit |
| **Tarif** | `GET /api/v1/fee-rates` | `F-003` | `ADMIN`, `BENDAHARA`, `KETUA` | Tarif aktif saat ini + riwayat perubahan tarif |
| **Tarif** | `GET /api/v1/fee-rates/impact-preview` | `F-003` | `ADMIN`, `BENDAHARA` | Cek jumlah KK `UNPAID` bulan berjalan terdampak |
| **Tarif** | `POST /api/v1/fee-rates` | `F-003`, `F-009` | `ADMIN`, `BENDAHARA` | Tetapkan tarif baru kapan saja + Audit Trail |
| **Tagihan** | `GET /api/v1/bills` | `F-004` | `ADMIN`, `BENDAHARA`, `KETUA` | Daftar tagihan per periode (filter status & search) |
| **Tagihan** | `GET /api/v1/bills/:id` | `F-004`, `F-005` | `ADMIN`, `BENDAHARA`, `KETUA` | Detail tagihan, `bill_items`, dan riwayat pembayaran |
| **Tagihan** | `POST /api/v1/bills/generate` | `F-004` | `ADMIN`, `BENDAHARA` | Generate tagihan bulanan idempoten untuk KK aktif |
| **Tagihan** | `POST /api/v1/bills/:id/fines` | `F-004` | `ADMIN`, `BENDAHARA` | Tambah item `DENDA_RONDA` (re-open jika `PAID`) |
| **Tagihan** | `PATCH /api/v1/bill-items/:itemId` | `F-004`, `F-009` | `ADMIN`, `BENDAHARA` | Override nominal komponen belum lunas + Audit |
| **Bayar** | `POST /api/v1/payments` | `F-005`, `F-007` | `BENDAHARA` | Catat bayar (lunas/parsial) + auto-routing Dual Kas |
| **Bayar** | `POST /api/v1/payments/:id/void` | `F-005`, `F-009` | `BENDAHARA` | Batalkan pembayaran + balik saldo Dual Kas + Audit |
| **Tagih WA** | `GET /api/v1/arrears` | `F-006` | `ADMIN`, `BENDAHARA`, `KETUA` | Daftar tunggakan + teks WA personal & rekap siap Copy |
| **Dual Kas** | `GET /api/v1/cash-books` | `F-007`, `F-008` | `ADMIN`, `BENDAHARA`, `KETUA` | Saldo real-time Kas Umum & Kas Keamanan + kategori |
| **Dual Kas** | `GET /api/v1/cash-transactions` | `F-007` | `ADMIN`, `BENDAHARA`, `KETUA` | Buku besar mutasi per kas + saldo awal/akhir periode |
| **Dual Kas** | `POST /api/v1/cash-transactions` | `F-007`, `F-009` | `BENDAHARA` | Catat pemasukan/pengeluaran manual + Audit |
| **Dual Kas** | `PATCH /api/v1/cash-transactions/:id` | `F-007`, `F-009` | `BENDAHARA` | Ubah transaksi manual (`is_locked=0`) + Audit |
| **Dual Kas** | `POST /api/v1/cash-transactions/:id/void` | `F-007`, `F-009` | `BENDAHARA` | Batalkan transaksi manual (`is_locked=0`) + Audit |
| **Media R2** | `POST /api/v1/uploads/presign` | `F-005`, `F-007` | `BENDAHARA` | Minta Presigned PUT URL R2 (validasi MIME & <=2MB) |
| **Media R2** | `GET /api/v1/uploads/view` | `F-005`, `F-007` | `ADMIN`, `BENDAHARA`, `KETUA` | Minta Presigned GET URL (5 menit) lihat foto nota |
| **Dashboard** | `GET /api/v1/dashboard` | `F-008` | `ADMIN`, `BENDAHARA`, `KETUA` | Metrik Dual Kas, rasio bayar, grafik 6 bulan & teks WA |
| **Audit** | `GET /api/v1/audit-logs` | `F-009` | `ADMIN`, `BENDAHARA`, `KETUA` | Daftar Audit Trail permanen (filter tanggal/modul/user) |
| **Export** | `GET /api/v1/reports/export` | `F-010` | `ADMIN`, `BENDAHARA`, `KETUA` | Unduh PDF/CSV (`type=bills|kas_umum|kas_keamanan|all`) |

---

## 3. Spesifikasi Detail Payload API Endpoint Kritis

### 3.1 Login Pengurus (`F-001`)
* **Endpoint:** `POST /api/v1/auth/login`
* **Request Body:**
```json
{
  "identifier": "bendahara.rt04",
  "password": "PasswordKuat123!"
}
```
* **Response (`200 OK` + `Set-Cookie: rtrw_session=...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`):**
```json
{
  "success": true,
  "message": "Login berhasil.",
  "data": {
    "user": {
      "id": "u-0192a3b4-1111-4000-8000-000000000002",
      "full_name": "Budi Santoso",
      "username": "bendahara.rt04",
      "role": "BENDAHARA"
    }
  }
}
```

---

### 3.2 Ubah Tarif Dinamis + Audit Trail (`F-003`, `F-009`)
* **Endpoint:** `POST /api/v1/fee-rates`
* **Role:** `ADMIN`, `BENDAHARA`
* **Request Body:**
```json
{
  "fee_type": "IURAN_KEAMANAN",
  "amount": 50000,
  "effective_from": "2026-11-21",
  "change_reason": "Penyesuaian kenaikan gaji satpam hasil rapat warga 15 Nov 2026",
  "apply_to_unpaid_current_month": true
}
```
* **Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Tarif Iuran Keamanan berhasil diperbarui dan dicatat di Audit Trail.",
  "data": {
    "fee_rate": {
      "id": "fr-9012a...",
      "fee_type": "IURAN_KEAMANAN",
      "previous_amount": 40000,
      "amount": 50000,
      "effective_from": "2026-11-21",
      "is_active": true,
      "change_reason": "Penyesuaian kenaikan gaji satpam hasil rapat warga 15 Nov 2026"
    },
    "affected_current_month_bills": 8
  }
}
```

---

### 3.3 Generate Tagihan Bulanan Idempoten (`F-004`)
* **Endpoint:** `POST /api/v1/bills/generate`
* **Role:** `ADMIN`, `BENDAHARA`
* **Request Body:**
```json
{
  "period_year": 2026,
  "period_month": 11,
  "due_date": "2026-11-10"
}
```
* **Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Generate tagihan November 2026 selesai.",
  "data": {
    "period_year": 2026,
    "period_month": 11,
    "created_count": 60,
    "skipped_existing_count": 0,
    "applied_rates": {
      "IURAN_WAJIB": 50000,
      "IURAN_KEAMANAN": 40000
    }
  }
}
```

---

### 3.4 Tambah Denda Ronda pada Tagihan (`F-004`)
* **Endpoint:** `POST /api/v1/bills/:id/fines`
* **Role:** `ADMIN`, `BENDAHARA`
* **Request Body:**
```json
{
  "incident_date": "2026-11-12",
  "amount": 25000,
  "description": "Denda absen piket ronda malam Kamis 12 Nov 2026"
}
```
* **Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Denda ronda berhasil ditambahkan ke tagihan warga.",
  "data": {
    "bill_id": "bill-101...",
    "bill_status_after": "PARTIAL",
    "bill_total_amount": 115000,
    "item": {
      "id": "item-303...",
      "item_type": "DENDA_RONDA",
      "target_cash_book_code": "KAS_KEAMANAN",
      "incident_date": "2026-11-12",
      "amount": 25000,
      "paid_amount": 0,
      "status": "UNPAID"
    }
  }
}
```

---

### 3.5 Catat Pembayaran per Komponen & Auto-Routing Dual Kas (`F-005`, `F-007`)
* **Endpoint:** `POST /api/v1/payments`
* **Role:** `BENDAHARA`
* **Header Wajib:** `Idempotency-Key: <uuid-v4>`
* **Request Body (Contoh Pembayaran Sebagian — Iuran Wajib + Keamanan dibayar, Denda Ronda menyusul):**
```json
{
  "bill_id": "bill-101...",
  "payment_date": "2026-11-21",
  "payment_method": "TRANSFER",
  "proof_file_key": "proofs/2026/11/8c3e1b40-9f12-4a2b-8123-abc123456789.jpg",
  "notes": "Transfer BCA a.n. Hendra Wijaya",
  "allocations": [
    {
      "bill_item_id": "item-101-wajib",
      "allocated_amount": 50000
    },
    {
      "bill_item_id": "item-102-keamanan",
      "allocated_amount": 40000
    }
  ]
}
```
* **Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Pembayaran berhasil dicatat dan dialokasikan otomatis ke Dual Kas.",
  "data": {
    "payment": {
      "id": "pay-555...",
      "bill_id": "bill-101...",
      "total_amount": 90000,
      "payment_method": "TRANSFER",
      "status": "CONFIRMED"
    },
    "bill_summary": {
      "status": "PARTIAL",
      "total_amount": 115000,
      "total_paid": 90000,
      "remaining_amount": 25000
    },
    "routed_cash_entries": [
      {
        "cash_book_code": "KAS_UMUM",
        "cash_transaction_id": "ctx-701...",
        "amount": 50000,
        "new_book_balance": 18500000
      },
      {
        "cash_book_code": "KAS_KEAMANAN",
        "cash_transaction_id": "ctx-702...",
        "amount": 40000,
        "new_book_balance": 12840000
      }
    ]
  }
}
```

---

### 3.6 Batalkan (*Void*) Pembayaran (`F-005`, `F-009`)
* **Endpoint:** `POST /api/v1/payments/:id/void`
* **Role:** `BENDAHARA`
* **Request Body:**
```json
{
  "void_reason": "Salah pilih nama KK saat input transfer"
}
```
* **Response (`200 OK`):** Mengembalikan status `payment.status = "VOIDED"`, status `bill` terbaru, serta saldo `KAS_UMUM` dan `KAS_KEAMANAN` yang sudah dikembalikan secara atomik.

---

### 3.7 Daftar Tunggakan & Payload Penagihan WhatsApp (`F-006`)
* **Endpoint:** `GET /api/v1/arrears?scope=month&year=2026&month=11&hide_recap_amount=false`
* **Role:** `ADMIN`, `BENDAHARA`, `KETUA`
* **Response (`200 OK`) — Menyertakan teks WA siap salin sinkron untuk kompatibilitas Safari iOS (`AUD-08`):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "unpaid_household_count": 12,
      "total_arrears_amount": 1450000
    },
    "group_recap_wa_text": "*REKAP TAGIHAN BELUM LUNAS — NOVEMBER 2026*\n1. Blok B-12 (Bpk. Hendra Wijaya) — Rp 115.000\n2. Blok A-04 (Ibu Ratna Sari) — Rp 40.000\n...",
    "items": [
      {
        "bill_id": "bill-101...",
        "household_id": "hh-12...",
        "block_number": "B-12",
        "head_of_family_name": "Bpk. Hendra Wijaya",
        "whatsapp_number": "6281234567890",
        "status": "UNPAID",
        "remaining_breakdown": {
          "iuran_wajib": 50000,
          "iuran_keamanan": 40000,
          "denda_ronda": 25000,
          "denda_count": 1
        },
        "total_remaining": 115000,
        "wa_message_text": "Assalamualaikum / Selamat pagi Bapak/Ibu Bpk. Hendra Wijaya (Blok B-12),\n\nMenginformasikan tagihan iuran RT/RW untuk periode *November 2026*:\n- Iuran Wajib: Rp 50.000\n- Iuran Keamanan: Rp 40.000\n- Denda Ronda (1x): Rp 25.000\n------------------------\n*Total Tagihan: Rp 115.000*\n...",
        "wa_direct_url": "https://wa.me/6281234567890?text=Assalamualaikum%20..."
      }
    ]
  }
}
```

---

### 3.8 Catat Transaksi Dual Buku Kas Manual (`F-007`)
* **Endpoint:** `POST /api/v1/cash-transactions`
* **Role:** `BENDAHARA`
* **Header Wajib:** `Idempotency-Key: <uuid-v4>`
* **Request Body (Contoh Pengeluaran Gaji Satpam di Kas Keamanan):**
```json
{
  "cash_book_code": "KAS_KEAMANAN",
  "category_id": "cat-gaji-satpam",
  "transaction_type": "EXPENSE",
  "transaction_date": "2026-11-20",
  "amount": 2500000,
  "description": "Gaji 2 petugas satpam shift siang & malam periode November 2026",
  "receipt_file_key": "receipts/2026/11/f12a44c1-1122-4a88-9001-998877665544.jpg"
}
```
* **Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Pengeluaran Kas Keamanan berhasil dicatat.",
  "data": {
    "transaction": {
      "id": "ctx-901...",
      "cash_book_code": "KAS_KEAMANAN",
      "transaction_type": "EXPENSE",
      "source_type": "MANUAL",
      "is_locked": false,
      "amount": 2500000,
      "status": "POSTED"
    },
    "new_book_balance": 10340000
  }
}
```

---

### 3.9 Dashboard Dual-Kas & Laporan WA Terpisah (`F-008`)
* **Endpoint:** `GET /api/v1/dashboard?year=2026&month=11`
* **Role:** `ADMIN`, `BENDAHARA`, `KETUA`
* **Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "period": { "year": 2026, "month": 11 },
    "cash_summary": {
      "kas_umum": {
        "opening_balance": 15600000,
        "monthly_income": 4200000,
        "monthly_expense": 1350000,
        "closing_balance": 18450000,
        "realtime_balance": 18450000
      },
      "kas_keamanan": {
        "opening_balance": 11950000,
        "monthly_income": 3650000,
        "monthly_expense": 2800000,
        "closing_balance": 12800000,
        "realtime_balance": 12800000
      },
      "combined_realtime_balance": 31250000
    },
    "collection_rate": {
      "total_active_households": 60,
      "paid_count": 48,
      "partial_count": 4,
      "unpaid_count": 8,
      "percentage": 80.0,
      "total_arrears_amount": 1450000
    },
    "chart_6_months": [
      {
        "label": "Nov 2026",
        "kas_umum_income": 4200000,
        "kas_umum_expense": 1350000,
        "kas_keamanan_income": 3650000,
        "kas_keamanan_expense": 2800000
      }
    ],
    "wa_cash_report_text": "*LAPORAN KAS RT/RW — PERIODE NOVEMBER 2026*\n\n*1. KAS UMUM (Iuran Wajib & Operasional)*\n- Saldo Awal: Rp 15.600.000\n..."
  }
}
```
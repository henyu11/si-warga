# Function List — Aplikasi Manajemen RT/RW

Dokumen ini berisi daftar fitur terstandar untuk **Aplikasi Manajemen RT/RW (Web Mobile-Responsive, Single RT/Komplek)**. Setiap kode ID fitur (`F-001` hingga `F-010`) menjadi acuan *traceability* wajib pada Fase 2 (Schema Database/ERD), Fase 3 (Screen Inventory & Prompt Google Stitch), dan Fase 4 (API Contract).

---

## 1. Tabel Function List Terstandar

| ID Fitur | Modul | Nama Fitur | Deskripsi Singkat | Role | Platform | Prioritas (MoSCoW) | Acceptance Criteria Inti |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F-001** | Auth & User | Login, Logout, dan Manajemen Akun | Autentikasi pengurus dan manajemen user beserta pembatasan hak akses berbasis Role (RBAC) | Admin (kelola user), Semua (login) | Web (Mobile Responsive) | Must Have | Password terenkripsi; sesi/token valid; setiap halaman dan API endpoint tervalidasi sesuai Role |
| **F-002** | Data Warga | CRUD Data Warga (KK / Rumah) | Pencatatan, pembaruan, pencarian, filter status hunian, tarif khusus KK (opsional), dan nonaktif warga | Admin, Bendahara (lihat/ubah), Ketua (lihat) | Web (Mobile Responsive) | Must Have | Nomor WA otomatis dinormalisasi ke `628xxx`; warga pindah menggunakan *soft delete* sehingga histori bayar tetap utuh |
| **F-003** | Pengaturan | Manajemen Tarif Dinamis, Rekening, dan Template WA | Pengaturan dan penyesuaian besaran **Iuran Wajib**, **Iuran Keamanan**, dan **Denda Ronda** kapan saja beserta info rekening dan template WA | Admin, Bendahara (dengan Audit Trail); Ketua (lihat) | Web (Mobile Responsive) | Must Have | Tarif dapat diubah kapan saja dan otomatis tercatat di Audit Trail; tagihan Lunas tidak berubah; tersedia opsi terapkan ke tagihan `Belum Bayar` bulan berjalan |
| **F-004** | Iuran & Denda | Generate Tagihan Bulanan, Override Nominal, dan Input Denda Ronda | Pembuatan tagihan bulanan untuk seluruh KK aktif berdasarkan tarif aktif/khusus, penyesuaian nominal tagihan belum lunas, dan penambahan Denda Ronda | Bendahara, Admin (lihat/generate/override); Ketua (lihat) | Web (Mobile Responsive) | Must Have | Generate bulanan bersifat idempoten (anti-duplikat per KK/bulan); rincian tersimpan terpisah (`Iuran Wajib`, `Iuran Keamanan`, `Denda Ronda`); denda mencatat tanggal dan keterangan absen |
| **F-005** | Iuran & Denda | Pencatatan Pembayaran per Komponen & Routing Dual Kas | Pencatatan pembayaran Lunas atau Sebagian per komponen (Tunai/Transfer + bukti transfer opsional) dengan routing otomatis ke Buku Kas terkait | Bendahara (kelola); Admin & Ketua (lihat) | Web (Mobile Responsive) | Must Have | Pembayaran **Iuran Wajib** otomatis menambah saldo **Kas Umum**; pembayaran **Iuran Keamanan** dan **Denda Ronda** otomatis menambah saldo **Kas Keamanan**; pembatalan otomatis membalikkan kas terkait |
| **F-006** | Penagihan WA | Daftar Tunggakan & Penagihan WhatsApp (Copy & Direct Share) | Filter warga belum lunas (per bulan atau akumulasi), tombol Copy pesan WA personal, direct link `wa.me`, dan Copy rekap daftar belum bayar | Bendahara, Ketua, Admin | Web (Mobile Responsive) | Must Have | Hanya menampilkan status `Belum Bayar` / `Sebagian`; klik Copy langsung menyalin rincian lengkap (Wajib, Keamanan, Denda, Total, Rekening) ke clipboard dengan toast konfirmasi |
| **F-007** | Buku Kas | Dual Buku Kas: Kas Umum & Kas Keamanan | Pengelolaan dua Buku Kas terpisah (**Kas Umum** untuk Iuran Wajib/sumbangan/operasional & **Kas Keamanan** untuk Iuran Keamanan/denda/gaji satpam) lengkap dengan unggah foto nota | Bendahara (kelola); Ketua & Admin (lihat) | Web (Mobile Responsive) | Must Have | Saldo **Kas Umum** dan **Kas Keamanan** terhitung independen; pemasukan otomatis dari tagihan terkunci dari edit nominal langsung di kas; foto nota maks. 2 MB |
| **F-008** | Dashboard & Laporan | Dashboard Dual-Kas & Copy Laporan Kas WA Terpisah | Ringkasan saldo Kas Umum, saldo Kas Keamanan, total gabungan kas, rasio warga bayar bulan berjalan, grafik bulanan, dan tombol Copy laporan WA terpisah | Semua (Admin, Bendahara, Ketua) | Web (Mobile Responsive) | Must Have | Angka dashboard cocok 100% dengan Dual Buku Kas dan Tagihan; teks Copy WA menampilkan mutasi Kas Umum dan Kas Keamanan secara terpisah dan siap tempel |
| **F-009** | Audit & Keamanan | Audit Trail Perubahan Tarif & Transaksi Keuangan | Pencatatan permanen (*append-only*) atas setiap perubahan tarif iuran, override tagihan, perubahan/pembatalan pembayaran, dan mutasi kas manual | Admin, Ketua, Bendahara (lihat saja) | Web (Mobile Responsive) | Must Have | Setiap aksi mencatat user, role, timestamp, modul, nilai lama, nilai baru, dan alasan; data log tidak dapat diubah atau dihapus oleh Role mana pun |
| **F-010** | Dashboard & Laporan | Export Laporan PDF dan Excel/CSV | Unduh laporan rekap iuran warga bulanan serta laporan Buku Kas Umum dan Buku Kas Keamanan ke format PDF (siap cetak) atau CSV/Excel | Bendahara, Ketua, Admin | Web (Mobile Responsive) | Should Have | File terunduh sesuai filter periode bulan/tahun dan jenis kas yang dipilih dengan format tabel rapi |

---

## 2. Ringkasan Distribusi Prioritas (MoSCoW)

| Prioritas | Jumlah Fitur | Daftar ID Fitur |
| :--- | :--- | :--- |
| **Must Have (Wajib MVP)** | 9 Fitur | `F-001`, `F-002`, `F-003`, `F-004`, `F-005`, `F-006`, `F-007`, `F-008`, `F-009` |
| **Should Have (Tahap Lanjutan Cepat)** | 1 Fitur | `F-010` |
| **Could Have / Won't Have (MVP)** | — | Portal Warga, Payment Gateway Otomatis, WA Blast API, Multi-RT/Kelurahan |

---

## 3. Catatan Keterkaitan Lintas Fase (Traceability)

* **Ke Fase 2 (Schema Database & Arsitektur):** Setiap tabel inti (`users`, `households`, `fee_rates`, `bills`, `bill_items`, `payments`, `cash_books`, `cash_transactions`, `audit_logs`) wajib dipetakan secara eksplisit ke kode `F-001` hingga `F-010`.
* **Ke Fase 3 (UI/UX & Prompt Google Stitch):** Seluruh fitur `Must Have` wajib terwakili dalam daftar `Screen Inventory` (`SCR-001` dst.) agar tidak ada fitur yang hilang di desain antarmuka.
* **Ke Fase 4 (API Contract):** Setiap API endpoint wajib mencantumkan referensi `F-xxx` dan aturan otorisasi Role yang selaras dengan tabel di atas.
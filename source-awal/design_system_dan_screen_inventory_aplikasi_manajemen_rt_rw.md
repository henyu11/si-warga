# Design System dan Screen Inventory — Aplikasi Manajemen RT/RW

| Informasi Dokumen | Detail |
| :--- | :--- |
| **Proyek** | Aplikasi Manajemen RT/RW (Web Mobile-Responsive, Single RT/Komplek) |
| **Target UI Stack** | Tailwind CSS + shadcn/ui (Next.js App Router) |
| **Fase** | Fase 3 — Senior UI/UX Designer |
| **Referensi Masukan** | `02-prd-aplikasi-rtrw.md`, `03-function-list-aplikasi-rtrw.md`, `06-schema-database-erd-aplikasi-rtrw.md` |

---

## 1. Filosofi Desain (Design Principles)

Karena aplikasi ini dioperasikan harian oleh pengurus RT/RW lintas rentang usia (30–65 tahun) dominan melalui browser HP saat berada di lapangan maupun rapat warga, seluruh desain antarmuka wajib mematuhi empat prinsip inti:

1. **Pemisahan Visual Dual-Kas yang Tak Tertukar:** **Kas Umum** (Iuran Wajib & Operasional) dan **Kas Keamanan** (Iuran Keamanan, Denda Ronda & Gaji Satpam) wajib memiliki identitas warna, ikon, dan label badge berbeda di seluruh layar agar Bendahara tidak pernah salah masuk pos.
2. **Mobile-First & Satu Tangan (Thumb-Friendly):** Seluruh aksi harian kritis (*Catat Pembayaran*, *Copy Pesan WA*, *Tambah Pengeluaran*) dapat dijangkau ibu jari pada layar 360px–430px dengan area sentuh minimal `44x44px`.
3. **Keterbacaan Angka Keuangan (Financial Clarity):** Seluruh nominal Rupiah wajib memakai `tabular-nums`, pemisah ribuan titik (`Rp 150.000`), kontras tinggi (WCAG AA minimal 4.5:1), dan hierarki visual tegas antara *Lunas*, *Sebagian*, dan *Belum Bayar*.
4. **Aksi Transparan & Anti-Salah Klik:** Aksi sensitif (*Ubah Tarif*, *Void Pembayaran*, *Nonaktifkan Warga*) selalu memunculkan dialog konfirmasi eksplisit beserta pengingat bahwa aksi akan tercatat di **Audit Trail**.

---

## 2. Design System Foundation

### 2.1 Palet Warna (Color Tokens)

| Kategori Token | Nama Token | Kode Hex | Penggunaan Utama |
| :--- | :--- | :--- | :--- |
| **Brand Primary** | `primary-700` | `#0F766E` | Tombol utama (*Primary CTA*), item navigasi aktif, aksen brand RT/RW |
| **Brand Hover** | `primary-800` | `#115E59` | State hover/pressed tombol utama |
| **Brand Soft** | `primary-50` | `#F0FDFA` | Latar highlight kartu terpilih / banner informasi |
| **Identitas Kas Umum** | `kas-umum-600` | `#059669` | Border aksen, ikon, dan header kartu **Kas Umum (Iuran Wajib)** |
| **Latar Kas Umum** | `kas-umum-50` | `#ECFDF5` | Latar badge & kartu ringkasan Kas Umum (border `#A7F3D0`) |
| **Identitas Kas Keamanan** | `kas-keamanan-700` | `#1D4ED8` | Border aksen, ikon perisai, dan header kartu **Kas Keamanan (Ronda/Satpam)** |
| **Latar Kas Keamanan** | `kas-keamanan-50` | `#EFF6FF` | Latar badge & kartu ringkasan Kas Keamanan (border `#BFDBFE`) |
| **Aksi WhatsApp** | `wa-green-600` | `#16A34A` | Tombol *Kirim ke WA* dan ikon WhatsApp (hover `#15803D`) |
| **Status: Lunas / Masuk** | `success-700` / `success-100` | `#15803D` / `#DCFCE7` | Badge status `Lunas` dan angka pemasukan kas |
| **Status: Sebagian / Denda** | `warning-700` / `warning-100` | `#B45309` / `#FEF3C7` | Badge status `Sebagian`, label `Denda Ronda`, banner konfirmasi tarif |
| **Status: Belum Bayar / Keluar** | `danger-700` / `danger-100` | `#BE123C` / `#FFE4E6` | Badge `Belum Bayar`, angka pengeluaran kas, aksi `Void`/Pembatalan |
| **Netral: Latar Aplikasi** | `slate-50` | `#F8FAFC` | Latar kanvas utama halaman |
| **Netral: Permukaan Kartu** | `white` | `#FFFFFF` | Latar card, tabel, modal, dan bottom sheet |
| **Netral: Garis & Border** | `slate-200` | `#E2E8F0` | Garis pemisah tabel, border input, border card |
| **Netral: Teks Utama** | `slate-900` | `#0F172A` | Judul, angka saldo utama, nama warga |
| **Netral: Teks Sekunder** | `slate-600` | `#475569` | Label form, deskripsi, tanggal transaksi |
| **Netral: Teks Muted** | `slate-500` | `#64748B` | Placeholder input, metadata sekunder |

### 2.2 Tipografi (Typography Scale)

* **Font Utama:** `Plus Jakarta Sans` (Google Fonts — sangat jelas untuk huruf Indonesia dan angka finansial).
* **Aturan Angka:** Wajib menerapkan class CSS `tabular-nums` (`font-variant-numeric: tabular-nums`) pada seluruh angka Rupiah, tanggal, dan persentase agar kolom tabel sejajar rapi.

| Gaya Teks | Ukuran (Mobile / Desktop) | Weight | Line Height | Penggunaan |
| :--- | :--- | :--- | :--- | :--- |
| **Display Saldo** | `24px` / `28px` | `700` (Bold) | `1.2` | Nominal saldo Kas Umum, Kas Keamanan, Total Kas di Dashboard |
| **Page Title (H1)** | `20px` / `24px` | `700` (Bold) | `1.3` | Judul halaman utama (misal: *Tagihan Iuran*, *Buku Kas*) |
| **Section Heading (H2)** | `16px` / `18px` | `600` (SemiBold) | `1.35` | Judul kartu, judul modal, header tab |
| **Body Regular** | `14px` / `14px` | `400` (Regular) | `1.5` | Isi tabel, deskripsi transaksi, nama kepala keluarga |
| **Body Medium / Label** | `14px` / `14px` | `500` (Medium) | `1.4` | Label form, teks tombol, nama kategori |
| **Caption / Badge** | `12px` / `12px` | `500`–`600` | `1.3` | Status badge (`Lunas`, `Belum Bayar`), timestamp audit, subtitle |

### 2.3 Grid, Spacing, Radius & Komponen Kunci

* **Sistem Spacing:** Kelipatan `4px` (`4, 8, 12, 16, 20, 24, 32px`). Padding kartu `16px` di mobile, `20px–24px` di desktop.
* **Border Radius:** Kartu & Modal `12px` (`rounded-xl`), Input & Tombol `8px` (`rounded-lg`), Badge/Pill `9999px` (`rounded-full`).
* **Shadow:** Ringan dan bersih (`0 1px 3px rgba(15,23,42,0.06)` dipadu border `1px solid #E2E8F0`).
* **Ikonografi:** `Lucide React` (`stroke-width: 1.75`, ukuran `18px`–`20px`) agar seragam dengan `shadcn/ui`.

### 2.4 Pola Navigasi Responsif (Mobile vs Desktop)

| Breakpoint | Pola Layout & Navigasi | Penyajian Data Tabel | Form & Modal |
| :--- | :--- | :--- | :--- |
| **Mobile (`360px – 767px`)** | Top Bar (`56px`: Judul + Role Badge) + **Fixed Bottom Navigation Bar (`64px`)** berisi 5 menu inti: `Beranda`, `Tagihan`, `Tagih WA`, `Kas`, `Menu` (membuka drawer untuk Warga, Pengaturan Tarif, Audit Trail, User). | **Stacked Card List** (setiap KK/transaksi tampil sebagai kartu ringkas dengan tombol aksi cepat langsung di kartu, bukan tabel horizontal yang sulit di-scroll). | **Bottom Sheet / Full-Screen Drawer** agar nyaman saat keyboard HP muncul. |
| **Tablet & Desktop (`768px – 1440px`)** | **Fixed Left Sidebar (`260px`)** menampilkan seluruh menu terstruktur + Top Header (`64px`: Nama RT/RW, Filter Periode Global, Info Akun & Logout) + Area Konten `max-width: 1280px` (12 kolom, gutter `24px`). | **Data Table Penuh** dengan kolom terurut, pencarian instan, dan aksi baris rapi. | **Centered Dialog Modal** (`max-width: 560px`) atau **Right Slide-Over Drawer** untuk detail pembayaran/nota. |

---

## 3. Screen Inventory & Traceability Matrix (`SCR-001` – `SCR-011`)

Seluruh 10 fitur pada `03-function-list-aplikasi-rtrw.md` dipetakan ke 11 layar terstandar berikut:

| ID Layar | Nama Layar | ID Fitur | Role Akses & Aturan UI | Perangkat Prioritas | Komponen Kunci |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SCR-001** | Halaman Login Pengurus | `F-001` | Publik (Belum Login) | Mobile & Desktop | Form Username/Email + Password, toggle lihat password, banner error kredensial, branding RT/RW |
| **SCR-002** | Dashboard Dual-Kas & Ringkasan Bulanan | `F-008`, `F-010` | Semua Role (`Admin`, `Bendahara`, `Ketua`) | Mobile-First & Desktop | Filter bulan, 2 kartu saldo berbeda warna (**Kas Umum** `#059669` vs **Kas Keamanan** `#1D4ED8`), kartu total gabungan, progress bar rasio warga lunas, grafik pemasukan vs pengeluaran, tombol **Copy Laporan Kas WA** & **Export PDF/CSV** |
| **SCR-003** | Daftar Tagihan Bulanan & Denda Ronda | `F-004`, `F-005` | `Bendahara` (aksi penuh); `Admin` (generate/override); `Ketua` (*read-only*, tombol aksi disembunyikan) | Mobile-First & Desktop | Pemilih periode bulan, tombol **Generate Tagihan Bulan Ini**, tab filter status (`Semua`, `Belum Bayar`, `Sebagian`, `Lunas`), daftar KK dengan rincian 3 komponen (`Wajib`, `Keamanan`, `Denda`), tombol **Catat Bayar** & **+ Denda Ronda** |
| **SCR-004** | Modal/Drawer Pembayaran per Komponen & Denda Ronda | `F-004`, `F-005` | `Bendahara` (bayar/void/denda); `Admin` (override/denda) | Mobile Bottom Sheet & Desktop Modal | Checklist komponen bayar (bisa penuh atau ubah nominal cicilan), preview otomatis alokasi tujuan kas (`-> Kas Umum` / `-> Kas Keamanan`), pilih metode (`Tunai`/`Transfer`), unggah foto bukti transfer, opsi **Batalkan (Void)** dengan alasan wajib |
| **SCR-005** | Penagihan WhatsApp (Daftar Tunggakan) | `F-006` | `Bendahara` (utama), `Ketua`, `Admin` | Mobile-First | Filter bulan atau *Semua Tunggakan*, tombol atas **Copy Rekap Daftar Belum Bayar** (dengan toggle tampil/sembunyi nominal), kartu warga belum lunas berisi rincian tunggakan + tombol **Copy Pesan WA** + tombol hijau **Kirim via WA**, preview modal teks WA |
| **SCR-006** | Dual Buku Kas (Kas Umum & Kas Keamanan) | `F-007`, `F-010` | `Bendahara` (tambah/ubah/void manual); `Ketua` & `Admin` (*read-only*) | Mobile-First & Desktop | **Segmented Tab Besar**: `Kas Umum` (hijau emerald) & `Kas Keamanan` (biru), 4 kartu KPI periode (Saldo Awal, Masuk, Keluar, Saldo Akhir), daftar mutasi dengan badge gembok `Otomatis Iuran` (terkunci edit), tombol lihat foto nota, tombol **+ Catat Kas**, tombol **Export** |
| **SCR-007** | Modal Catat Transaksi Kas Manual & Preview Nota | `F-007` | `Bendahara` (form input); Semua Role (preview foto nota) | Mobile Sheet & Desktop Modal | Switcher jenis (`Pemasukan` / `Pengeluaran`), pilihan Buku Kas terkunci sesuai tab aktif (bisa diubah sadar), dropdown kategori dinamis sesuai kas (misal `Gaji Satpam` di Kas Keamanan, `Sumbangan` di Kas Umum), input nominal Rupiah, unggah/kompres foto nota (maks. 2 MB) |
| **SCR-008** | Manajemen Data Warga (KK / Rumah) | `F-002` | `Admin` (penuh termasuk nonaktif); `Bendahara` (tambah/ubah); `Ketua` (*read-only*) | Desktop & Mobile | Pencarian nama/blok, filter status hunian (`Tetap`, `Kontrak`, `Kosong`), badge indikator `Tarif Khusus` jika ada override KK, drawer/modal form tambah/edit warga (normalisasi nomor WA `628xxx`, input opsional tarif khusus KK, tombol nonaktifkan/*soft delete*) |
| **SCR-009** | Pengaturan Tarif Dinamis, Rekening & Template WA | `F-003` | `Admin` & `Bendahara` (edit dengan Audit Trail); `Ketua` (*read-only*) | Desktop & Mobile | 3 tab: **Tarif Iuran & Denda**, **Info RT & Rekening**, **Template Pesan WA** (dengan chip variabel `{{nama_kk}}`, `{{rincian}}` siap klik). Pada tab Tarif: kartu 3 tarif aktif, form ubah tarif + kolom **Alasan Perubahan (Wajib)** + checkbox *Terapkan juga ke tagihan Belum Bayar bulan ini*, plus tabel riwayat tarif |
| **SCR-010** | Log Aktivitas (Audit Trail) | `F-009` | `Admin`, `Ketua`, `Bendahara` (semua *read-only*, permanen) | Desktop & Mobile | Filter rentang tanggal, Role/User, dan Modul (`Tarif`, `Tagihan`, `Pembayaran`, `Buku Kas`). Tampilan timeline/tabel dengan diff jelas `Nilai Lama -> Nilai Baru`, alasan perubahan, dan banner info *Log bersifat permanen & tidak dapat dihapus* |
| **SCR-011** | Manajemen Akun Pengurus & Profil | `F-001` | `Admin` (kelola semua akun); Semua Role (ubah password sendiri) | Desktop & Mobile | Daftar pengurus (`Admin`, `Bendahara`, `Ketua`) dengan status Aktif/Nonaktif, modal tambah/edit akun & reset password, serta kartu profil & ganti password pribadi |

---

## 4. Alur Interaksi Utama (UI User Flows)

### 4.1 Alur Operasional Harian Bendahara (Pembayaran Dual Kas & Penagihan WA)

~~~mermaid
flowchart LR
    A["SCR-002 Dashboard<br/>Lihat Rasio Bayar & Saldo Dual Kas"] --> B{"Tujuan Bendahara?"}
    B -- "Terima Uang Warga" --> C["SCR-003 Daftar Tagihan<br/>Cari Nama / Blok Rumah"]
    C --> D["SCR-004 Sheet Catat Bayar<br/>Pilih Komponen (Wajib/Keamanan/Denda)"]
    D --> E["Preview Routing Otomatis<br/>Wajib -> Kas Umum<br/>Keamanan & Denda -> Kas Keamanan"]
    E --> F["Konfirmasi Simpan<br/>Toast Sukses + Saldo Dual Kas Update"]

    B -- "Tagih Penunggak" --> G["SCR-005 Penagihan WA<br/>Auto-Filter Belum Bayar/Sebagian"]
    G --> H{"Aksi WA"}
    H -- "Personal" --> I["Klik Copy Pesan WA (Toast)<br/>atau Kirim via wa.me"]
    H -- "Grup RT" --> J["Klik Copy Rekap Tunggakan<br/>(Toggle Tampil/Sembunyi Nominal)"]
~~~

### 4.2 Alur Penyesuaian Tarif Dinamis dengan Proteksi Audit Trail

~~~mermaid
flowchart LR
    T1["SCR-009 Tab Tarif Dinamis<br/>Lihat Nominal Aktif Saat Ini"] --> T2["Klik Ubah Tarif<br/>(Iuran Wajib / Keamanan / Denda)"]
    T2 --> T3["Input Nominal Baru +<br/>Alasan Perubahan (Wajib)"]
    T3 --> T4["Pilih Cakupan:<br/>[ ] Terapkan juga ke tagihan<br/>Belum Bayar bulan berjalan"]
    T4 --> T5["Dialog Konfirmasi Akhir<br/>Info: Tagihan Lunas Tetap Aman<br/>& Tercatat di Audit Trail"]
    T5 --> T6["Simpan Sukses -> Tarif Aktif Update<br/>& Entri Baru Masuk SCR-010 Audit Trail"]
~~~

---

## 5. Standar UI States & Aksesibilitas Wajib

Setiap layar pada Fase 3 dan Fase 4 wajib menyediakan empat state berikut agar tidak membingungkan pengguna non-teknis:

1. **Loading State:** Menggunakan *skeleton loader* berbentuk kartu/baris (bukan layar putih kosong), serta spinner di dalam tombol saat proses simpan (`Menyimpan...`) untuk mencegah klik ganda (*double submit*).
2. **Empty State:** Menampilkan ilustrasi ikon minimalis + teks ramah dan tombol CTA relevan:
   * *Tagihan bulan ini belum dibuat:* `"Tagihan November 2026 belum digenerate."` + tombol **[Generate Tagihan Sekarang]**.
   * *Penagihan WA kosong (semua lunas):* `"Alhamdulillah! Seluruh warga pada periode ini sudah melunasi iuran."` (ikon centang hijau).
   * *Buku Kas kosong:* `"Belum ada transaksi pada Kas Keamanan di bulan ini."` + tombol **[+ Catat Transaksi]**.
3. **Error & Validation State:** Pesan error validasi tampil tepat di bawah kolom input berwarna `#BE123C` dengan bahasa Indonesia yang jelas (contoh: *"Nominal bayar tidak boleh melebihi sisa tagihan Rp 35.000"*).
4. **Role Read-Only Indicator (Khusus Ketua):** Menampilkan pill badge halus `Mode Pantau (Ketua)` di header halaman keuangan, sekaligus menyembunyikan tombol tambah/edit/hapus (bukan sekadar *disabled* yang membingungkan), sambil tetap menampilkan tombol **Copy Laporan WA**, **Lihat Bukti Nota**, dan **Export PDF/CSV**.
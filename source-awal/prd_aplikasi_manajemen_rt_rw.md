# Product Requirements Document (PRD) — Aplikasi Manajemen RT/RW

| Informasi Dokumen | Detail |
| :--- | :--- |
| **Proyek** | Aplikasi Manajemen RT/RW (Web Mobile-Responsive) |
| **Lingkup** | Single RT / 1 Komplek Perumahan |
| **Fase** | Fase 1 — Senior Project Manager |
| **Referensi Fitur** | `03-function-list-aplikasi-rtrw.md` (`F-001` s/d `F-010`) |

---

## 1. User Personas

### 1.1 Admin (Sekretaris / Pengelola Sistem)
* **Tujuan Utama:** Menjaga akurasi data seluruh KK/rumah, mengelola akun pengurus, serta memperbarui tarif iuran, rekening kas, dan template pesan WhatsApp sesuai keputusan rapat RT.
* **Pain Points:** Data warga sering tidak seragam antar pengurus saat ada warga baru masuk atau pindah; perubahan tarif iuran perlu diumumkan ulang tanpa merusak rekap lama.
* **Perangkat Dominan:** Web Desktop (laptop) dan sesekali Browser Mobile.

### 1.2 Bendahara
* **Tujuan Utama:** Mencatat pembayaran iuran (tunai maupun transfer) dengan cepat dari HP, menambahkan denda ronda bila ada ketidakhadiran, menyalin pesan penagihan WhatsApp yang rapi dan sopan, serta mencatat pemasukan/pengeluaran pada **Kas Umum** dan **Kas Keamanan** (termasuk gaji satpam).
* **Pain Points:** Harus mengetik ulang rincian tunggakan warga satu per satu di WhatsApp setiap bulan dan sering terjadi selisih karena lupa memisahkan pencatatan kas umum dengan kas keamanan.
* **Perangkat Dominan:** Browser Mobile (Android/iOS) untuk operasional harian, sesekali Laptop untuk tutup buku bulanan.

### 1.3 Ketua RT/RW
* **Tujuan Utama:** Memantau posisi saldo **Kas Umum** dan **Kas Keamanan** kapan saja secara real-time, melihat persentase warga yang sudah melunasi iuran, memeriksa bukti pengeluaran, meninjau Audit Trail perubahan tarif/kas, serta membagikan laporan bulanan ke grup WA warga.
* **Pain Points:** Harus menunggu rekap manual dari Bendahara setiap kali ingin mengetahui kecukupan dana kas keamanan atau daftar warga menunggak.
* **Perangkat Dominan:** Browser Mobile (Android/iOS).

---

## 2. User Flows Utama (High-Level)

### 2.1 Alur Penyesuaian Tarif Dinamis (`F-003`, `F-009`)
Login Admin/Bendahara → Buka Menu Pengaturan Tarif → Ubah nominal Iuran Wajib, Iuran Keamanan, atau Denda Ronda → Isi catatan/alasan perubahan → Pilih cakupan penerapan (hanya periode baru atau termasuk tagihan `Belum Bayar` bulan berjalan) → Simpan → Sistem merekam perubahan secara otomatis di **Audit Trail**.

### 2.2 Alur Siklus Tagihan Bulanan, Denda Ronda & Pembayaran (`F-004`, `F-005`, `F-007`)
Login Bendahara → Klik **Generate Tagihan Bulan Berjalan** (membuat tagihan Iuran Wajib dan Iuran Keamanan sesuai tarif aktif/khusus untuk seluruh KK aktif) → Tambah item **Denda Ronda** pada KK yang absen ronda → Warga membayar (tunai/transfer) → Bendahara menandai komponen yang dibayar (Lunas atau Sebagian) → Sistem otomatis menambah pemasukan **Kas Umum** (dari Iuran Wajib) dan/atau **Kas Keamanan** (dari Iuran Keamanan & Denda Ronda).

### 2.3 Alur Penagihan WhatsApp (`F-006`)
Login Bendahara → Buka Menu Penagihan WA → Pilih Periode Bulan atau Akumulasi Tunggakan → Sistem hanya menampilkan KK berstatus `Belum Bayar` atau `Sebagian` → Klik **Copy Pesan WA** (atau **Kirim via WA**) per warga, atau klik **Copy Rekap Tunggakan** untuk grup pengurus/warga.

### 2.4 Alur Pembukuan Dual Kas & Pelaporan (`F-007`, `F-008`, `F-010`)
Bendahara memilih tab **Kas Umum** atau **Kas Keamanan** → Input pemasukan manual (misal: sumbangan di Kas Umum) atau pengeluaran (misal: Gaji Satpam di Kas Keamanan) beserta unggah foto nota → Saldo masing-masing kas terhitung otomatis → Ketua login dari HP → Memantau Dashboard Dual-Kas → Klik **Copy Laporan Kas WA** atau **Export PDF/CSV**.

---

## 3. Kebutuhan Fungsional (Functional Requirements)

### Modul 1: Autentikasi dan Manajemen Akun (`F-001`)
* **User Story:** Sebagai **Admin**, saya ingin mengelola akun pengurus (**Admin**, **Bendahara**, **Ketua**) dengan kontrol akses berbasis Role agar data keuangan hanya dapat diubah oleh pihak yang berwenang.
* **Acceptance Criteria:**
  * Login menggunakan email/username dan password yang di-hash secara aman.
  * Sistem membatasi tampilan menu dan menolak permintaan API endpoint yang tidak sesuai Role (RBAC di sisi backend).
  * Menampilkan pesan error generik yang aman saat kredensial salah.

### Modul 2: Manajemen Data Warga (`F-002`)
* **User Story:** Sebagai **Admin** atau **Bendahara**, saya ingin mengelola data KK/rumah beserta nomor WhatsApp aktifnya agar tagihan bulanan hanya terbentuk untuk rumah aktif dan siap ditagih.
* **Acceptance Criteria:**
  * Field minimal: Nama Kepala Keluarga, Blok/Nomor Rumah, Nomor WhatsApp (normalisasi otomatis ke `628xxx`), Status Hunian (`Tetap`, `Kontrak`, `Kosong`), Status Tagihan (`Aktif`, `Nonaktif`), serta catatan tarif khusus per KK (opsional).
  * Mendukung pencarian cepat berdasarkan nama/blok dan filter berdasarkan status hunian.
  * Penonaktifan warga menggunakan *soft delete* agar histori tagihan dan pembayaran sebelumnya tetap utuh.

### Modul 3: Pengaturan Tarif Dinamis, Rekening & Template WA (`F-003`)
* **User Story:** Sebagai **Admin** atau **Bendahara**, saya ingin mengubah besaran Iuran Wajib, Iuran Keamanan, dan Denda Ronda kapan saja serta mengatur nomor rekening dan template WA agar aturan penagihan selalu mutakhir.
* **Acceptance Criteria:**
  * Mendukung perubahan nominal default untuk **Iuran Wajib**, **Iuran Keamanan**, dan **Denda Ronda** kapan saja beserta kolom alasan perubahan.
  * Setiap perubahan otomatis tersimpan ke riwayat tarif dan **Audit Trail** (`F-009`).
  * Tagihan yang sudah berstatus **Lunas** tidak berubah; tersedia opsi konfirmasi apakah nominal baru diterapkan ke tagihan `Belum Bayar` bulan berjalan.
  * Mendukung pengaturan informasi rekening/e-wallet RT (bisa dipisah untuk rekening Kas Umum dan Kas Keamanan jika berbeda `[ASUMSI]`) serta pengeditan template teks WhatsApp dengan variabel dinamis.

### Modul 4: Tagihan Bulanan, Override Nominal & Denda Ronda (`F-004`)
* **User Story:** Sebagai **Bendahara**, saya ingin men-generate tagihan bulanan secara otomatis, menyesuaikan nominal khusus bila diperlukan, dan mencatat Denda Ronda agar seluruh kewajiban warga terdata rapi.
* **Acceptance Criteria:**
  * Aksi **Generate Tagihan Bulanan** bersifat idempoten (tidak membuat tagihan ganda untuk KK dan bulan yang sama).
  * Setiap tagihan menyimpan rincian nominal terpisah untuk tiga pos: `Iuran Wajib`, `Iuran Keamanan`, dan `Denda Ronda`.
  * Bendahara dapat menambahkan item **Denda Ronda** (tanggal absen, nominal, keterangan) ke tagihan bulan berjalan atau sebagai tagihan denda terpisah.
  * Bendahara/Admin dapat mengubah nominal komponen tagihan individu selama statusnya belum lunas (tercatat di Audit Trail).

### Modul 5: Pembayaran per Komponen & Routing Dual Kas (`F-005`)
* **User Story:** Sebagai **Bendahara**, saya ingin mencatat pembayaran warga (Lunas maupun Sebagian per komponen) agar saldo **Kas Umum** dan **Kas Keamanan** langsung terbarui tanpa input ganda.
* **Acceptance Criteria:**
  * Bendahara dapat menandai pembayaran secara penuh (**Lunas Semua**) atau memilih nominal/komponen tertentu (**Bayar Sebagian**, misal baru bayar Iuran Wajib dulu).
  * Mencatat tanggal bayar, metode pembayaran (`Tunai` / `Transfer`), catatan, dan unggah foto bukti transfer (opsional, maks. 2 MB).
  * **Routing Otomatis:**
    * Nominal pembayaran **Iuran Wajib** otomatis membuat entri Pemasukan di **Kas Umum**.
    * Nominal pembayaran **Iuran Keamanan** dan **Denda Ronda** otomatis membuat entri Pemasukan di **Kas Keamanan**.
  * Pembatalan (*void*) pembayaran otomatis membatalkan/membalikkan entri kas terkait dan dicatat di **Audit Trail**.

### Modul 6: Penagihan WhatsApp — Copy & Direct Share (`F-006`)
* **User Story:** Sebagai **Bendahara**, saya ingin menyalin atau langsung mengirim pesan tagihan WhatsApp yang sudah terformat rapi untuk warga yang belum membayar agar penagihan berlangsung cepat tanpa salah hitung.
* **Acceptance Criteria:**
  * Menampilkan hanya warga dengan status tagihan `Belum Bayar` atau `Sebagian` (filter per bulan atau total tunggakan lintas bulan).
  * Tombol **Copy Pesan WA** menyalin teks siap tempel ke clipboard dan menampilkan notifikasi sukses (*toast*).
  * Tombol **Kirim ke WA** membuka tautan `https://wa.me/628xxx?text=...` dengan teks pesan yang sudah di-URL-encode.
  * Tombol **Copy Rekap Tunggakan** menyalin daftar ringkas warga belum bayar untuk grup pengurus/warga (dengan opsi tampilkan atau sembunyikan nominal).

**Contoh Format Default Pesan Penagihan WA Personal:**

~~~text
Assalamualaikum / Selamat pagi Bapak/Ibu [Nama KK] (Blok [No Rumah]),

Menginformasikan tagihan iuran RT/RW untuk periode *[Bulan Tahun]*:
- Iuran Wajib: Rp [Nominal Wajib]
- Iuran Keamanan: Rp [Nominal Keamanan]
- Denda Ronda ([Jumlah]x): Rp [Nominal Denda] *(hanya tampil jika ada denda)*
------------------------
*Total Tagihan: Rp [Total Sisa Tagihan]*

Pembayaran dapat dilakukan secara tunai kepada Bendahara atau transfer ke:
[Nama Bank] - [Nomor Rekening] a.n. [Nama Pemilik Rekening]

Mohon kirimkan bukti transfer setelah melakukan pembayaran.
Terima kasih atas kerja samanya.
— Pengurus RT/RW
~~~

### Modul 7: Dual Buku Kas — Kas Umum & Kas Keamanan (`F-007`)
* **User Story:** Sebagai **Bendahara**, saya ingin mengelola **Kas Umum** dan **Kas Keamanan** secara terpisah lengkap dengan bukti nota pengeluaran agar alokasi dana operasional dan gaji satpam selalu transparan.
* **Acceptance Criteria:**
  * Antarmuka menyediakan pemisahan jelas (tab/switcher) antara **Buku Kas Umum** dan **Buku Kas Keamanan**.
  * Masing-masing buku kas menampilkan: Saldo Awal Periode, Total Pemasukan, Total Pengeluaran, dan Saldo Akhir Berjalan.
  * Pemasukan otomatis dari pembayaran tagihan diberi penanda khusus dan terkunci dari edit nominal langsung di buku kas.
  * Mendukung pencatatan transaksi manual:
    * **Kas Umum:** Pemasukan (Sumbangan, Kas Kegiatan, Lain-lain) & Pengeluaran (Kebersihan, Rapat, Sosial/Santunan, Perbaikan Fasum, Lain-lain).
    * **Kas Keamanan:** Pemasukan (Sumbangan Keamanan, Lain-lain) & Pengeluaran (**Gaji Satpam/Petugas Keamanan**, Operasional Pos Ronda, Perawatan Portal/CCTV, Perlengkapan Jaga, Lain-lain).
  * Mendukung unggah foto bukti/nota transaksi (JPG/PNG/WebP, maks. 2 MB).

### Modul 8: Dashboard Dual-Kas & Copy Laporan Kas WA (`F-008`)
* **User Story:** Sebagai **Ketua** dan **Bendahara**, saya ingin melihat ringkasan saldo kedua kas dan rasio pembayaran bulan berjalan serta menyalin laporan bulanan ke WhatsApp dengan satu klik.
* **Acceptance Criteria:**
  * Menampilkan kartu metrik terpisah: **Saldo Kas Umum**, **Saldo Kas Keamanan**, **Total Saldo Gabungan**, serta **Rasio Warga Bayar Bulan Ini** (misal: 45/60 KK Lunas — 75%) dan total nilai tunggakan.
  * Tersedia grafik perbandingan pemasukan vs pengeluaran bulanan untuk masing-masing kas.
  * Tersedia tombol **Copy Laporan Kas WA** yang menyalin ringkasan bulanan terpisah untuk Kas Umum dan Kas Keamanan.

**Contoh Format Default Copy Laporan Kas WA Bulanan:**

~~~text
*LAPORAN KAS RT/RW — PERIODE [BULAN TAHUN]*

*1. KAS UMUM (Iuran Wajib & Operasional)*
- Saldo Awal: Rp [Saldo Awal Umum]
- Pemasukan (Iuran Wajib & Lainnya): Rp [Masuk Umum]
- Pengeluaran Operasional: Rp [Keluar Umum]
- *Saldo Akhir Kas Umum: Rp [Saldo Akhir Umum]*

*2. KAS KEAMANAN (Iuran Keamanan, Denda & Satpam)*
- Saldo Awal: Rp [Saldo Awal Keamanan]
- Pemasukan (Iuran Keamanan & Denda): Rp [Masuk Keamanan]
- Pengeluaran (Gaji Satpam & Pos): Rp [Keluar Keamanan]
- *Saldo Akhir Kas Keamanan: Rp [Saldo Akhir Keamanan]*

*Ringkasan Gabungan:*
- Total Kas RT/RW: *Rp [Total Gabungan]*
- Kepatuhan Bayar Bulan Ini: [Jumlah Lunas]/[Total KK Aktif] KK ([Persentase]%)

Terima kasih atas partisipasi seluruh warga.
— Pengurus RT/RW
~~~

### Modul 9: Audit Trail Keuangan & Perubahan Tarif (`F-009`)
* **User Story:** Sebagai **Ketua** dan **Admin**, saya ingin meninjau riwayat perubahan tarif iuran dan transaksi keuangan agar setiap penyesuaian dapat dipertanggungjawabkan.
* **Acceptance Criteria:**
  * Otomatis merekam setiap aksi: ubah tarif iuran/denda, override nominal tagihan, catat/ubah/batalkan pembayaran, serta tambah/ubah/hapus transaksi Buku Kas.
  * Data log bersifat *immutable* (tidak dapat diedit atau dihapus dari aplikasi oleh Role mana pun) dan mencatat: waktu (timestamp), nama & role user, modul/entitas, aksi, nilai lama, nilai baru, serta catatan/alasan.
  * Tersedia filter berdasarkan tanggal, user, dan jenis aktivitas.

### Modul 10: Export Laporan PDF dan Excel/CSV (`F-010`)
* **User Story:** Sebagai **Ketua** dan **Bendahara**, saya ingin mengunduh rekap iuran warga dan laporan Dual Buku Kas dalam format PDF atau CSV untuk keperluan arsip rapat dan papan pengumuman.
* **Acceptance Criteria:**
  * Dapat memilih periode bulan/tahun serta jenis laporan (Rekap Iuran Warga, Buku Kas Umum, Buku Kas Keamanan, atau Gabungan).
  * Format PDF tertata rapi siap cetak (A4), sedangkan format CSV/Excel siap diolah lebih lanjut.

---

## 4. Kebutuhan Non-Fungsional (NFR)

| Kategori | Kebutuhan Spesifik | Target / Standar |
| :--- | :--- | :--- |
| **Performa** | Waktu respon API dan kecepatan muat halaman di jaringan seluler (4G) | API P95 kurang dari 500 ms; muat halaman awal kurang dari 2,5 detik |
| **Skalabilitas** | Kapasitas data warga dan transaksi jangka panjang (Single RT/Komplek) | Hingga 1.500 KK, 50.000 baris transaksi kas/iuran, 20 pengguna aktif bersamaan `[ASUMSI]` |
| **Keamanan** | Autentikasi, otorisasi (RBAC), perlindungan nomor WA warga, dan integritas log | HTTPS wajib, password di-hash (Argon2/bcrypt), JWT dengan expiry, validasi Role di sisi backend untuk setiap API endpoint, Audit Trail *append-only* |
| **Ketersediaan** | Uptime dan pencadangan data keuangan | 99% uptime; backup database otomatis harian dengan retensi minimal 30 hari |
| **Kompatibilitas** | Akses Web Mobile-Responsive lintas perangkat | Responsif mulus di layar 360px hingga 1440px; mendukung Chrome Android, Safari iOS, Chrome/Edge Desktop versi terbaru |
| **Usabilitas** | Kemudahan operasional harian bagi pengurus berbagai usia | Area sentuh tombol mobile minimal 44x44px, format mata uang Rupiah otomatis (`Rp 50.000`), notifikasi toast instan saat Copy WA berhasil |
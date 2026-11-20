# Business Requirements Document (BRD) — Aplikasi Manajemen RT/RW

| Informasi Dokumen | Detail |
| :--- | :--- |
| **Proyek** | Aplikasi Manajemen RT/RW (Web Mobile-Responsive) |
| **Lingkup** | Single RT / 1 Komplek Perumahan |
| **Fase** | Fase 1 — Senior Project Manager |
| **Status** | Final Draft Fase 1 |

---

## 1. Ringkasan Eksekutif dan Latar Belakang

Pengelolaan administrasi warga dan keuangan pada tingkat RT/RW umumnya masih dilakukan secara manual melalui buku kas fisik, file spreadsheet terpisah, dan rekap pesan di grup WhatsApp. Pola kerja ini memunculkan empat kendala operasional utama:

1. **Ketidaksinkronan data warga:** Perubahan status hunian (warga pindah, rumah kontrak, rumah kosong) sering tidak tercatat seragam sehingga memicu kesalahan penagihan.
2. **Kerumitan pencatatan iuran dan kas terpisah:** Pengurus harus mengelola tiga komponen kewajiban warga (**Iuran Wajib**, **Iuran Keamanan**, dan **Denda Ronda**) sekaligus menjaga pemisahan alokasi antara **Kas Umum** dan **Kas Keamanan** (termasuk dana gaji satpam) agar tidak tercampur.
3. **Proses penagihan lambat dan rawan salah ketik:** Bendahara perlu mengecek daftar penunggak lalu menyusun pesan penagihan WhatsApp satu per satu secara manual setiap bulan.
4. **Perubahan tarif sulit dilacak:** Penyesuaian nominal iuran hasil rapat warga sering membuat catatan historis dan tagihan berjalan menjadi rancu tanpa jejak audit.

Aplikasi Manajemen RT/RW berbasis Web Mobile-Responsive dibangun untuk memusatkan data warga, mengotomatisasi pencatatan tagihan iuran dan denda ronda dengan tarif dinamis, memisahkan pembukuan **Kas Umum** dan **Kas Keamanan** secara real-time, serta menyediakan fitur penagihan WhatsApp siap salin (*copy-paste* dan *direct share*).

---

## 2. Tujuan Bisnis dan Metrik Keberhasilan (KPI)

| ID Tujuan | Tujuan Bisnis | Metrik / KPI | Target |
| :--- | :--- | :--- | :--- |
| BIZ-01 | Digitalisasi dan pemusatan data warga RT/RW | Persentase Kepala Keluarga (KK) tercatat lengkap (nama, alamat/blok, nomor WA) | 100% KK aktif dalam 1 bulan pertama `[ASUMSI]` |
| BIZ-02 | Mempercepat proses penagihan iuran bulanan | Waktu rata-rata Bendahara menyiapkan pesan tagihan penunggak per siklus | Turun minimal 75% (di bawah 10 menit per bulan) `[ASUMSI]` |
| BIZ-03 | Meningkatkan kedisiplinan pembayaran iuran dan denda | Persentase ketepatan bayar (*collection rate*) sebelum jatuh tempo bulanan | Meningkat hingga minimal 85% per bulan `[PERLU KONFIRMASI]` |
| BIZ-04 | Akurasi dan transparansi pemisahan Dual Buku Kas | Selisih antara saldo Kas Umum dan Kas Keamanan di aplikasi dibanding saldo riil (tunai + rekening) | Rp 0 selisih pada tutup buku bulanan |
| BIZ-05 | Akuntabilitas perubahan tarif dan transaksi keuangan | Persentase perubahan tarif dan transaksi keuangan yang tercatat lengkap di Audit Trail | 100% perubahan memiliki jejak pengguna, waktu, dan nilai lama/baru |

---

## 3. Pemangku Kepentingan (Stakeholders) dan Role Pengguna

### 3.1 Stakeholder Bisnis
* **Pengurus Inti RT/RW:** Ketua RT/RW, Sekretaris, dan Bendahara sebagai penanggung jawab tata kelola lingkungan dan transparansi keuangan.
* **Warga Komplek / RT:** Penerima manfaat transparansi laporan kas umum, kas keamanan, dan kemudahan informasi tagihan bulanan.

### 3.2 Role Pengguna Aplikasi
* **Admin:** Pengelola teknis/Sekretaris RT yang bertanggung jawab atas manajemen akun pengurus, data master warga, serta pengaturan tarif iuran, nomor rekening, dan template WhatsApp (dengan catatan Audit Trail).
* **Bendahara:** Pengelola operasional harian keuangan yang men-generate tagihan bulanan, menyesuaikan tarif bila diperlukan (dengan catatan Audit Trail), mencatat denda ronda, mengonfirmasi pembayaran warga, melakukan penagihan via WhatsApp, serta membukukan mutasi **Kas Umum** dan **Kas Keamanan**.
* **Ketua:** Pimpinan RT/RW yang memantau dashboard saldo kedua kas, tingkat ketertiban pembayaran warga, memeriksa bukti nota pengeluaran, meninjau Audit Trail, dan menyalin/mengunduh laporan keuangan bulanan (*read-only* terhadap transaksi keuangan demi prinsip pemisahan tugas).

---

## 4. Aturan Bisnis Inti: Pemisahan Dual Buku Kas dan Tarif Dinamis

### 4.1 Pemisahan Dual Buku Kas (Dual-Fund Accounting)
Aplikasi wajib memisahkan pencatatan dan saldo untuk dua buku kas yang berdiri sendiri:

1. **Kas Umum (Kas RT/RW):**
   * **Sumber Pemasukan:** Pembayaran komponen **Iuran Wajib** (otomatis dari tagihan), sumbangan warga/donatur, kas kegiatan, dan pemasukan lain-lain (manual).
   * **Peruntukan Pengeluaran:** Biaya operasional umum RT/RW (kebersihan, rapat warga, kegiatan sosial/santunan, perbaikan fasilitas umum, ATK).
2. **Kas Keamanan:**
   * **Sumber Pemasukan:** Pembayaran komponen **Iuran Keamanan** dan **Denda Ronda** (otomatis dari tagihan), serta sumbangan khusus keamanan (opsional/manual).
   * **Peruntukan Pengeluaran:** **Gaji Satpam / Petugas Keamanan**, operasional pos ronda, perawatan portal/CCTV, dan perlengkapan jaga.

### 4.2 Tarif Iuran Dinamis dengan Audit Trail
* Besaran **Iuran Wajib**, **Iuran Keamanan**, dan **Denda Ronda** dapat diubah kapan saja oleh **Admin** dan **Bendahara**.
* Setiap perubahan wajib terekam dalam **Audit Trail** (pelaku, tanggal/jam, tarif lama, tarif baru, alasan).
* Perubahan tarif tidak boleh mengubah nominal tagihan historis yang sudah berstatus **Lunas**.
* Sistem menyediakan opsi konfirmasi saat perubahan tarif disimpan: apakah nominal baru hanya berlaku mulai periode berikutnya, atau ikut diterapkan ke tagihan bulan berjalan yang masih berstatus **Belum Bayar**.

---

## 5. Batasan Ruang Lingkup (Scope)

### 5.1 In-Scope (MVP / Fase 1)
* Sistem autentikasi (Login/Logout) dan kontrol akses berbasis Role (**Admin**, **Bendahara**, **Ketua**).
* Manajemen data warga berbasis KK / unit rumah (CRUD, pencarian, filter status hunian, nonaktif/*soft delete*).
* Pengaturan tarif dinamis (Iuran Wajib, Iuran Keamanan, Denda Ronda), info rekening kas, dan template pesan WhatsApp beserta **Audit Trail**.
* Generate tagihan bulanan, penyesuaian (*override*) nominal per KK/tagihan belum lunas, penambahan Denda Ronda, dan pencatatan pembayaran (Lunas/Sebagian per komponen).
* Routing otomatis pembayaran komponen tagihan ke **Kas Umum** dan **Kas Keamanan**.
* Fitur Penagihan WhatsApp: daftar tunggakan, tombol *Copy* pesan WA personal, tautan langsung `wa.me`, dan *Copy* rekap daftar belum bayar.
* Pengelolaan **Dual Buku Kas** (Kas Umum dan Kas Keamanan) lengkap dengan kategori mutasi, unggah foto nota pengeluaran, dan saldo berjalan masing-masing.
* Dashboard ringkasan Dual-Kas, rasio pembayaran warga, tombol *Copy Laporan Kas WA*, Audit Trail, dan export laporan PDF/CSV.

### 5.2 Out-of-Scope (Di Luar MVP / Fase 1)
* Arsitektur *multi-tenant* untuk banyak RT dalam satu RW/Kelurahan (lingkup MVP terkunci untuk **Single RT / 1 Komplek**).
* Portal login khusus bagi warga biasa `[PERLU KONFIRMASI]`.
* Integrasi *Payment Gateway* otomatis (QRIS dinamis / Virtual Account) — verifikasi pembayaran tetap dikonfirmasi manual oleh Bendahara.
* Pengiriman pesan otomatis melalui WhatsApp Business API (berbayar) — MVP memanfaatkan *Copy Template* dan *deep link* `wa.me` gratis.
* Modul administrasi surat pengantar RT/RW, penjadwalan piket ronda otomatis, dan inventaris barang RT.

---

## 6. Risiko Bisnis, Asumsi, dan Mitigasi

### 6.1 Asumsi Bisnis
* `[ASUMSI]` Unit penagihan adalah per Kepala Keluarga (KK) atau unit rumah aktif.
* `[ASUMSI]` Pembayaran sebagian (cicilan per komponen, misal bayar Iuran Wajib lebih dahulu lalu Iuran Keamanan menyusul) diperbolehkan untuk menyesuaikan kondisi lapangan.
* `[ASUMSI]` Pengurus mengakses aplikasi dominan melalui browser ponsel pintar (Android/iOS), sehingga kemudahan akses mobile menjadi prioritas utama.

### 6.2 Matriks Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
| :--- | :--- | :--- |
| **Dana Kas Umum dan Kas Keamanan tercampur** | Gaji satpam terganggu karena terpakai operasional umum | Pemisahan buku kas pada level database dengan routing otomatis per komponen pembayaran |
| **Perubahan tarif merusak laporan bulan lalu** | Saldo historis bergeser dan memicu ketidakpercayaan warga | Penguncian nominal pada tagihan berstatus Lunas dan pencatatan penuh di Audit Trail |
| **Kesalahan input / penghapusan transaksi keuangan** | Selisih kas dan hilangnya jejak transaksi | Mekanisme *soft delete*, konfirmasi ganda sebelum pembatalan, dan Audit Trail tidak dapat dihapus |
| **Salah kirim penagihan ke warga yang sudah lunas** | Menimbulkan ketidaknyamanan warga | Halaman Penagihan otomatis menyaring hanya status *Belum Bayar* / *Sebagian* serta mencantumkan rincian periode bulan di teks WA |
| **Hambatan adopsi pengurus non-teknis** | Pengurus kembali ke pencatatan manual | Antarmuka *mobile-first* sederhana dengan alur catat pembayaran maksimal 3 langkah |
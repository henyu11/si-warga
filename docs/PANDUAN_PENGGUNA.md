# Buku Panduan Pengguna — siWarga Palmut
**Kavling Palanji & Mutiara Indah**  
*Versi 1.2 — Edisi Dual-Kas Cloud & Mobile Responsive*  
*Akses Aplikasi Online:* [https://si-warga-peach.vercel.app](https://si-warga-peach.vercel.app)

---

## Daftar Isi
1. [Pendahuluan & Gambaran Umum Sistem](#1-pendahuluan--gambaran-umum)
2. [Hak Akses Pengguna & Cara Login](#2-hak-akses-pengguna--cara-login)
3. [Dashboard Utama & Monitoring Real-Time](#3-dashboard-utama--monitoring-real-time)
4. [Manajemen Data Warga (KK & Rumah)](#4-manajemen-data-warga)
5. [Pengelolaan Tagihan Iuran & Input Pembayaran](#5-pengelolaan-tagihan-iuran--input-pembayaran)
6. [Pembukuan Kas Dual-Ledger & Ekspor Laporan](#6-pembukuan-kas-dual-ledger--ekspor-laporan)
7. [Penagihan WhatsApp & Pengumuman Rekap Tunggakan](#7-penagihan-whatsapp--pengumuman-rekap-tunggakan)
8. [Pengaturan Identitas Wilayah & Master Tarif](#8-pengaturan-identitas-wilayah--master-tarif)
9. [Audit Trail & Keamanan Sistem](#9-audit-trail--keamanan-sistem)
10. [Panduan Penggunaan Smartphone (Mobile View)](#10-panduan-penggunaan-smartphone-mobile-view)

---

## 1. Pendahuluan & Gambaran Umum
**siWarga Palmut** adalah sistem informasi manajemen warga dan pembukuan keuangan dual-kas yang dirancang khusus untuk Kavling Palanji & Mutiara Indah.

### Fitur Kunci:
- **Dual-Ledger Cash:** Pemisahan ketat antara **Kas Umum** dan **Kas Keamanan**.
- **Otomasi Tagihan & Pembayaran:** Perhitungan iuran bulanan otomatis (Wajib, Keamanan, Denda Ronda).
- **Integrasi WhatsApp 1-Klik:** Pengiriman tagihan personal ke warga serta teks rekap otomatis untuk grup WA warga.
- **Ekspor Dokumen Resmi:** Pengunduhan laporan mutasi buku kas bulanan ke dalam format **Excel (.xlsx)** dan **PDF (.pdf)**.
- **Identitas Dinamis:** Nama aplikasi dan kavling dapat disesuaikan tanpa menyentuh kode.
- **Akses Cloud 24/7:** Berjalan cepat di Vercel dan didukung oleh database cloud Turso yang permanen.

---

## 2. Hak Akses Pengguna & Cara Login
Buka URL: [https://si-warga-peach.vercel.app/login](https://si-warga-peach.vercel.app/login)

| Role | Username | Password | Deskripsi Tugas |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `Admin123!` | Kelola seluruh sistem, pengaturan nama kavling, master tarif, dan manajemen akun |
| **Bendahara** | `bendahara` | `Bendahara123!` | Catat pembayaran warga, mutasi buku kas, ekspor laporan, dan kirim tagihan WhatsApp |
| **Ketua RT/Kavling** | `ketua` | `Ketua123!` | Monitor dashboard eksekutif, rekapitulasi kepatuhan warga, dan inspeksi audit trail |

---

## 3. Dashboard Utama
Halaman awal setelah login menyajikan ringkasan instan:
- **Saldo Real-Time:** Saldo Kas Umum, Kas Keamanan, dan Kas Gabungan.
- **Persentase Kepatuhan:** Jumlah KK yang sudah lunas vs menunggak.
- **Grafik Tren 6 Bulan:** Evaluasi pemasukan vs pengeluaran.
- **Shortcut Broadcast WA:** Salin rekap keuangan bulanan untuk dibagikan ke warga.

---

## 4. Manajemen Data Warga
Menu: `/warga`
- **Tambah Warga Baru:** Masukkan Blok/Nomor Rumah, Nama Kepala Keluarga, No WA (628...), Jumlah Jiwa, dan Status Hunian (Tetap, Kontrak, Kosong).
- **Rumah Kosong:** Secara cerdas dapat dibebaskan dari iuran sampah/operasional tertentu.
- **Pencarian Cepat:** Temukan warga secara instan dengan mengetik nama atau nomor blok.

---

## 5. Tagihan Iuran & Pembayaran
Menu: `/tagihan`
- **Pencatatan Pembayaran:**
  1. Cari nama warga pada periode bulan berjalan.
  2. Klik tombol **Bayar**.
  3. Pilih metode pembayaran (Transfer / Kas Tunai).
  4. Klik **Simpan Pembayaran**. Sistem otomatis mendistribusikan uang ke Kas Umum & Kas Keamanan serta menandai tagihan menjadi **Lunas**.

---

## 6. Pembukuan Kas & Ekspor Laporan
Menu: `/kas`
- **Tab Pemisah Kas:** Pilihan antara Buku Kas Umum dan Buku Kas Keamanan.
- **Catat Transaksi:** Input pemasukan lain-lain atau pengeluaran operasional kavling.
- **Ekspor Periode:**
  1. Klik tombol **Export Laporan**.
  2. Pilih periode bulan & tahun.
  3. Pilih format **Excel (.xlsx)** atau **PDF (.pdf)**.
  4. Dokumen langsung terunduh rapi dengan kop resmi Kavling Palanji & Mutiara Indah.

---

## 7. Penagihan WhatsApp
Menu: `/penagihan-wa`
- **Kirim Tagihan Pribadi (Japri):** Klik tombol WA pada warga yang menunggak untuk membuka chat WhatsApp dengan teks tagihan yang telah terisi otomatis lengkap dengan rincian dan rekening bank.
- **Rekap Broadcast Grup:** Klik *Salin Teks Broadcast* untuk membagikan pengumuman iuran ke grup WhatsApp kavling (tersedia opsi menyembunyikan nominal untuk etika bertetangga).

---

## 8. Pengaturan Wilayah & Tarif
Menu: `/pengaturan` *(Khusus Administrator)*
- **Identitas Kavling:** Ubah nama aplikasi atau nama lingkungan dengan Live Preview seketika.
- **Master Tarif:** Ubah besaran tarif Iuran Wajib, Iuran Keamanan, dan Denda Ronda.
- **Nomor Rekening Kas:** Atur rekening Bank Kas Umum dan Kas Keamanan yang muncul pada tagihan warga.

---

## 9. Audit Trail
Menu: `/audit-log`
- Seluruh riwayat transaksi uang, pembayaran, pembatalan (*void*), perubahan warga, dan pengubahan tarif tersimpan secara **permanen (immutable)** demi akuntabilitas pengurus.

---

## 10. Penggunaan di Smartphone
- Akses website melalui browser HP (Chrome / Safari).
- Dilengkapi **Bottom Navigation Bar** di bawah layar untuk kenyamanan navigasi satu tangan.
- Tabel otomatis bertransformasi menjadi tampilan kartu yang ringkas dan nyaman dibaca di layar HP.

# Dokumen Informasi Lengkap Fase 1 — Aplikasi Manajemen RT/RW

Dokumen ini menjadi ringkasan induk (*master brief*) seluruh konteks proyek, keputusan bisnis yang telah disepakati pada Fase 0 dan Fase 1, aturan lintas dokumen, serta indeks artefak Markdown Fase 1 sebelum masuk ke tahap arsitektur dan database (Fase 2).

---

## 1. Profil dan Ruang Lingkup Proyek

| Atribut | Ketentuan Terkunci |
| :--- | :--- |
| **Nama Aplikasi** | Aplikasi Manajemen RT/RW |
| **Lingkup Operasional** | Single RT / 1 Komplek Perumahan (skala kecil, 50–300 KK; target kapasitas sistem hingga 1.500 KK `[ASUMSI]`) |
| **Target Platform** | Web (Mobile-Responsive, optimal untuk layar 360px hingga 1440px) |
| **Daftar Role** | **Admin**, **Bendahara**, dan **Ketua** |
| **Status Fase** | Fase 1 (Senior Project Manager) — Selesai & Terkunci; siap menuju Fase 2 setelah persetujuan |

---

## 2. Daftar Artefak Fase 1 (Terpisah)

| No | File Markdown | Isi Utama |
| :--- | :--- | :--- |
| 1 | `00-dokumen-informasi-lengkap-fase1-rtrw.md` | Dokumen induk ringkasan konteks, keputusan bisnis, matriks hak akses, dan daftar asumsi |
| 2 | `01-brd-aplikasi-rtrw.md` | Business Requirements Document (latar belakang, KPI, stakeholder, scope, pemisahan Dual Kas, risiko) |
| 3 | `02-prd-aplikasi-rtrw.md` | Product Requirements Document (persona, user flow, kebutuhan fungsional per modul, contoh template WA, NFR) |
| 4 | `03-function-list-aplikasi-rtrw.md` | Daftar fitur terstandar (`F-001` s/d `F-010`) lengkap dengan Role, Prioritas MoSCoW, dan Acceptance Criteria |

---

## 3. Keputusan Bisnis Inti yang Sudah Dikunci

### 3.1 Pemisahan Dual Buku Kas (Dual-Fund Accounting)

Pencatatan kas RT/RW dipisahkan secara tegas menjadi **dua Buku Kas mandiri** dengan saldo independen serta ringkasan gabungan di Dashboard:

| Buku Kas | Pemasukan Otomatis (dari Pembayaran Tagihan) | Pemasukan Manual | Pengeluaran Utama |
| :--- | :--- | :--- | :--- |
| **1. Kas Umum (Kas RT/RW)** | Pembayaran komponen **Iuran Wajib** | Sumbangan warga/donatur, kas kegiatan, pemasukan lain-lain | Operasional umum RT/RW (kebersihan, rapat warga, sosial/santunan, perbaikan fasilitas umum) |
| **2. Kas Keamanan** | Pembayaran komponen **Iuran Keamanan** dan **Denda Ronda** | Sumbangan khusus keamanan (opsional) | **Gaji Satpam / Petugas Keamanan**, operasional pos ronda, perawatan portal/CCTV, perlengkapan jaga |

* **Aturan Routing Otomatis:** Pembayaran warga dicatat per komponen tagihan. Saat Bendahara mengonfirmasi pembayaran (baik Lunas maupun Sebagian), nominal **Iuran Wajib** otomatis tercatat masuk ke **Kas Umum**, sedangkan nominal **Iuran Keamanan** dan **Denda Ronda** otomatis tercatat masuk ke **Kas Keamanan**.
* **Integritas Data:** Pemasukan kas yang berasal dari pembayaran iuran/denda terkunci dari pengeditan nominal langsung di Buku Kas (koreksi wajib dilakukan melalui transaksi pembayaran iuran agar kedua modul selalu sinkron).

### 3.2 Fleksibilitas Tarif Dinamis & Audit Trail Wajib

* **Pengubahan Kapan Saja:** Besaran **Iuran Wajib**, **Iuran Keamanan**, dan **Denda Ronda** dapat diatur dan disesuaikan kapan saja oleh **Admin** dan **Bendahara**.
* **Audit Trail Wajib:** Setiap perubahan tarif (dan perubahan transaksi keuangan) wajib dicatat di log audit meliputi: *siapa yang mengubah*, *waktu perubahan*, *nilai lama*, *nilai baru*, dan *catatan/alasan perubahan*.
* **Perlindungan Data Historis:** Tagihan yang sudah berstatus **Lunas** tidak ikut berubah saat tarif diperbarui agar saldo kas historis tetap akurat. Saat mengubah tarif global, sistem menawarkan konfirmasi apakah tarif baru juga diterapkan pada tagihan bulan berjalan yang masih berstatus **Belum Bayar**.
* **Penyesuaian Khusus (`[ASUMSI]`):** Mendukung *override* nominal khusus per KK (misalnya rumah kosong yang hanya membayar Iuran Keamanan atau warga dengan keringanan) serta edit nominal tagihan selama belum lunas.

### 3.3 Fitur Penagihan WhatsApp (Tanpa Biaya API Berbayar)

* Menyediakan daftar filter warga berstatus **Belum Bayar** atau **Sebagian** (per bulan atau akumulasi tunggakan).
* Menyediakan tombol **Copy Pesan WA** per warga, tombol **Kirim ke WA** (*deep link* `wa.me`), serta **Copy Rekap Daftar Belum Bayar** untuk dibagikan ke grup WA.
* Menyediakan tombol **Copy Laporan Kas WA** yang memisahkan rincian mutasi **Kas Umum** dan **Kas Keamanan**.

---

## 4. Matriks Hak Akses Role (RBAC)

| Modul / Fitur | ID Fitur | Admin | Bendahara | Ketua |
| :--- | :--- | :--- | :--- | :--- |
| Login & Profil Akun | `F-001` | Penuh (Kelola semua akun) | Login & ubah password sendiri | Login & ubah password sendiri |
| Data Warga (KK / Rumah) | `F-002` | Buat, Lihat, Ubah, Nonaktifkan | Buat, Lihat, Ubah | Lihat saja |
| Pengaturan Tarif, Rekening & Template WA | `F-003` | Lihat & Ubah (tercatat Audit) | Lihat & Ubah (tercatat Audit) | Lihat saja |
| Generate Tagihan & Input Denda Ronda | `F-004` | Lihat, Generate, Override | Lihat, Generate, Input Denda, Override | Lihat saja |
| Pencatatan Pembayaran Iuran & Denda | `F-005` | Lihat saja `[ASUMSI]` | Catat, Ubah, Batalkan (tercatat Audit) | Lihat saja |
| Daftar Tunggakan & Penagihan WA | `F-006` | Lihat & Copy | Lihat, Copy & Kirim WA | Lihat & Copy |
| Dual Buku Kas (Umum & Keamanan) | `F-007` | Lihat saja | Buat, Lihat, Ubah, Hapus + Foto Nota | Lihat saja (termasuk bukti nota) |
| Dashboard & Copy Laporan Kas WA | `F-008` | Lihat & Copy | Lihat & Copy | Lihat & Copy |
| Log Aktivitas (Audit Trail) | `F-009` | Lihat saja (tidak bisa dihapus) | Lihat saja `[ASUMSI]` | Lihat saja (tidak bisa dihapus) |
| Export Laporan PDF & CSV | `F-010` | Unduh | Unduh | Unduh |

---

## 5. Daftar Asumsi dan Catatan Konfirmasi

| Kode | Status | Keterangan |
| :--- | :--- | :--- |
| ASM-01 | `[ASUMSI]` | Satuan penagihan adalah per Kepala Keluarga (KK) / unit rumah, bukan per individu anggota keluarga. |
| ASM-02 | `[ASUMSI]` | Pembayaran mendukung skema **Lunas** maupun **Sebagian (Cicil)** per komponen tagihan agar Bendahara fleksibel saat warga membayar bertahap. |
| ASM-03 | `[ASUMSI]` | Mendukung *override* nominal iuran khusus untuk KK tertentu (contoh: rumah kosong atau keringanan iuran). |
| ASM-04 | `[ASUMSI]` | Kapasitas MVP dirancang hingga 1.500 KK dan 50.000 baris transaksi kas untuk kebutuhan jangka panjang 1 RT/komplek. |
| KON-01 | `[PERLU KONFIRMASI]` | Target persentase *collection rate* bulanan (sementara ditetapkan minimal 85% per bulan pada BRD). |
| KON-02 | `[PERLU KONFIRMASI]` | Apakah di masa depan (Fase 2+ produk) dibutuhkan portal login mandiri bagi warga biasa untuk cek histori bayar. |

---

## 6. Kesiapan Lanjut ke Fase 2

Seluruh keputusan kunci yang berdampak pada rancangan database dan arsitektur sudah lengkap:
1. Lingkup **Single RT / 1 Komplek** (tidak memerlukan struktur *multi-tenant* Kelurahan).
2. Dua Buku Kas terpisah (**Kas Umum** dan **Kas Keamanan**) dengan routing otomatis per komponen pembayaran.
3. Tarif dinamis dengan **Audit Trail wajib** untuk **Admin** dan **Bendahara**.
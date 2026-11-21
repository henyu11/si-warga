const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.resolve(__dirname, '../docs/screenshots');
const OUTPUT_PDF = path.resolve(__dirname, '../docs/Panduan_Pengguna_siWarga.pdf');

function getBase64Image(fileName) {
  const filePath = path.join(SCREENSHOT_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return '';
  }
  const fileData = fs.readFileSync(filePath);
  return `data:image/png;base64,${fileData.toString('base64')}`;
}

async function generatePDF() {
  console.log('--- Menghasilkan Dokumen Panduan Pengguna (PDF) ---');

  const imgLogin = getBase64Image('01_login.png');
  const imgDashboard = getBase64Image('02_dashboard.png');
  const imgWarga = getBase64Image('03_warga.png');
  const imgTagihan = getBase64Image('04_tagihan.png');
  const imgKas = getBase64Image('05_kas.png');
  const imgEkspor = getBase64Image('06_ekspor_modal.png');
  const imgWa = getBase64Image('07_penagihan_wa.png');
  const imgPengaturan = getBase64Image('08_pengaturan.png');
  const imgAudit = getBase64Image('09_audit_log.png');
  const imgMobDashboard = getBase64Image('10_mobile_dashboard.png');
  const imgMobKas = getBase64Image('11_mobile_kas.png');

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Panduan Pengguna siWarga Palmut</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

    @page {
      size: A4;
      margin: 18mm 15mm 20mm 15mm;
      @bottom-right {
        content: counter(page);
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      font-size: 10pt;
      background: #ffffff;
    }

    /* Print Break Utilities */
    .page-break {
      page-break-before: always;
    }
    .avoid-break {
      page-break-inside: avoid;
    }

    /* Cover Page */
    .cover-page {
      height: 250mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 30mm 10mm 20mm 10mm;
      text-align: center;
      background: radial-gradient(circle at 50% 10%, #ecfdf5 0%, #ffffff 70%);
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      margin-bottom: 20mm;
    }
    .cover-badge {
      display: inline-block;
      padding: 6px 16px;
      background: #0f766e;
      color: white;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      border-radius: 20px;
      margin-bottom: 20px;
    }
    .cover-title {
      font-size: 32pt;
      font-weight: 800;
      color: #0f766e;
      line-height: 1.15;
      margin-bottom: 8px;
    }
    .cover-subtitle {
      font-size: 16pt;
      font-weight: 600;
      color: #334155;
      margin-bottom: 25px;
    }
    .cover-desc {
      font-size: 11pt;
      color: #64748b;
      max-width: 550px;
      margin: 0 auto 30px auto;
      line-height: 1.6;
    }
    .cover-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      display: flex;
      justify-content: space-around;
      font-size: 9pt;
      color: #64748b;
    }
    .cover-footer strong {
      color: #0f766e;
      display: block;
      font-size: 10pt;
      margin-bottom: 4px;
    }

    /* Table of Contents */
    .toc-container {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px 25px;
      margin: 20px 0 30px 0;
    }
    .toc-title {
      font-size: 14pt;
      font-weight: 700;
      color: #0f766e;
      border-bottom: 2px solid #0f766e;
      padding-bottom: 8px;
      margin-bottom: 15px;
    }
    .toc-list {
      list-style: none;
    }
    .toc-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px dashed #cbd5e1;
      font-size: 9.5pt;
    }
    .toc-item span.num {
      font-weight: 700;
      color: #0f766e;
      margin-right: 10px;
    }

    /* Typography & Headers */
    h1 {
      font-size: 18pt;
      font-weight: 800;
      color: #0f766e;
      border-bottom: 2px solid #14b8a6;
      padding-bottom: 6px;
      margin-top: 20px;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    h2 {
      font-size: 13pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 18px;
      margin-bottom: 10px;
    }
    h3 {
      font-size: 11pt;
      font-weight: 600;
      color: #334155;
      margin-top: 14px;
      margin-bottom: 6px;
    }
    p {
      margin-bottom: 10px;
      text-align: justify;
    }

    /* Lists */
    ul, ol {
      margin-left: 20px;
      margin-bottom: 12px;
    }
    li {
      margin-bottom: 4px;
    }

    /* Screenshots & Images */
    .screenshot-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      margin: 14px 0 16px 0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      background: #f8fafc;
    }
    .browser-bar {
      background: #f1f5f9;
      padding: 6px 12px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      display: inline-block;
    }
    .dot-red { background: #ef4444; }
    .dot-yellow { background: #f59e0b; }
    .dot-green { background: #10b981; }
    .browser-url {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      font-size: 7.5pt;
      font-family: 'JetBrains Mono', monospace;
      color: #64748b;
      padding: 2px 10px;
      margin-left: 10px;
      flex: 1;
    }
    .screenshot-img {
      width: 100%;
      height: auto;
      display: block;
    }
    .screenshot-caption {
      padding: 6px 12px;
      font-size: 8pt;
      color: #64748b;
      background: #f8fafc;
      text-align: center;
      font-style: italic;
      border-top: 1px solid #e2e8f0;
    }

    /* Dual Mobile Grid */
    .mobile-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 15px 0;
    }

    /* Callout Boxes */
    .callout {
      padding: 12px 16px;
      border-radius: 6px;
      margin: 14px 0;
      font-size: 9pt;
      border-left: 4px solid;
    }
    .callout-info {
      background: #f0fdf4;
      border-color: #0f766e;
      color: #065f46;
    }
    .callout-tip {
      background: #eff6ff;
      border-color: #3b82f6;
      color: #1e40af;
    }
    .callout-warning {
      background: #fffbeb;
      border-color: #f59e0b;
      color: #92400e;
    }
    .callout strong {
      display: block;
      margin-bottom: 2px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 16px 0;
      font-size: 9pt;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      color: #0f766e;
      font-weight: 700;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }

    /* Key/Badge */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-info { background: #e0f2fe; color: #0369a1; }
    .badge-warning { background: #fef3c7; color: #b45309; }

    /* Step numbers */
    .step-box {
      display: flex;
      gap: 12px;
      margin-bottom: 10px;
      align-items: flex-start;
    }
    .step-number {
      background: #0f766e;
      color: white;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8.5pt;
      font-weight: 700;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .step-content {
      flex: 1;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div>
      <div class="cover-badge">Buku Panduan Resmi</div>
      <h1 class="cover-title">siWarga Palmut</h1>
      <div class="cover-subtitle">Kavling Palanji & Mutiara Indah</div>
      <p class="cover-desc">
        Panduan Lengkap Pengelolaan Administrasi Warga, Pengelolaan Tagihan Iuran Bulanan, Pembukuan Dual-Ledger Kas Keuangan, Notifikasi WhatsApp Otomatis, dan Laporan Ekspor.
      </p>
    </div>

    <div>
      <div class="callout callout-info" style="max-width: 500px; margin: 0 auto 30px auto; text-align: left;">
        <strong>🚀 Akses Aplikasi Online:</strong>
        Link: <a href="https://si-warga-peach.vercel.app" style="color: #0f766e; font-weight: 700;">https://si-warga-peach.vercel.app</a><br/>
        Didukung Cloud Database 24/7 dan Responsive Mobile View.
      </div>
    </div>

    <div class="cover-footer">
      <div>
        <strong>Diterbitkan Untuk:</strong>
        Pengurus & Warga Lingkungan
      </div>
      <div>
        <strong>Versi Aplikasi:</strong>
        v1.2 (Dual-Kas Cloud Edition)
      </div>
      <div>
        <strong>Tanggal Terbit:</strong>
        November 2026
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- DAFTAR ISI -->
  <div class="toc-container avoid-break">
    <div class="toc-title">Daftar Isi Panduan Pengguna</div>
    <ul class="toc-list">
      <li class="toc-item"><span><span class="num">1.</span> Pendahuluan & Gambaran Umum Sistem</span> <span>Hal 2</span></li>
      <li class="toc-item"><span><span class="num">2.</span> Hak Akses Pengguna & Cara Login</span> <span>Hal 2</span></li>
      <li class="toc-item"><span><span class="num">3.</span> Dashboard Utama & Monitoring Real-Time</span> <span>Hal 3</span></li>
      <li class="toc-item"><span><span class="num">4.</span> Manajemen Data Warga (KK & Rumah)</span> <span>Hal 4</span></li>
      <li class="toc-item"><span><span class="num">5.</span> Pengelolaan Tagihan Iuran & Input Pembayaran</span> <span>Hal 5</span></li>
      <li class="toc-item"><span><span class="num">6.</span> Pembukuan Kas Dual-Ledger & Ekspor Laporan (Excel/PDF)</span> <span>Hal 6</span></li>
      <li class="toc-item"><span><span class="num">7.</span> Penagihan WhatsApp & Pengumuman Rekap Tunggakan</span> <span>Hal 7</span></li>
      <li class="toc-item"><span><span class="num">8.</span> Pengaturan Identitas Aplikasi, Wilayah & Tarif Iuran</span> <span>Hal 8</span></li>
      <li class="toc-item"><span><span class="num">9.</span> Audit Trail & Keamanan Transaksi</span> <span>Hal 9</span></li>
      <li class="toc-item"><span><span class="num">10.</span> Panduan Penggunaan di Smartphone / Mobile View</span> <span>Hal 10</span></li>
    </ul>
  </div>

  <!-- BAB 1 & 2 -->
  <h1>1. Pendahuluan & Gambaran Umum</h1>
  <p>
    <strong>siWarga Palmut</strong> adalah aplikasi sistem informasi tata kelola warga dan keuangan lingkungan yang dirancang khusus untuk memenuhi kebutuhan lingkungan perumahan, kavling, maupun rukun warga (RT/RW). 
  </p>
  <p>
    Keunggulan utama sistem ini terletak pada <strong>Pemisahan Pembukuan Kas (Dual-Ledger)</strong> secara ketat antara <strong>Kas Umum</strong> (operasional fasilitas umum, sosial) dan <strong>Kas Keamanan</strong> (satpam, ronda, fasilitas gerbang). Dengan pendekatan ini, transparansi dana warga terjamin 100% dan terhindar dari tumpang tindih pembukuan.
  </p>

  <h2>2. Hak Akses Pengguna (Role Based Access Control)</h2>
  <p>Sistem memiliki 3 tingkat hak akses yang disesuaikan dengan tanggung jawab masing-masing pengurus:</p>

  <table>
    <thead>
      <tr>
        <th>Peran (Role)</th>
        <th>Hak Akses & Tanggung Jawab</th>
        <th>Akun Bawaan</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>ADMINISTRATOR</strong></td>
        <td>Akses penuh ke seluruh modul, pengaturan identitas kavling, penetapan tarif iuran, manajemen akun pengguna, dan audit log.</td>
        <td><code>admin</code> / <code>Admin123!</code></td>
      </tr>
      <tr>
        <td><strong>BENDAHARA</strong></td>
        <td>Mencatat pembayaran warga, input pemasukan & pengeluaran kas, void transaksi dengan alasan, kirim penagihan WA, dan ekspor laporan keuangan.</td>
        <td><code>bendahara</code> / <code>Bendahara123!</code></td>
      </tr>
      <tr>
        <td><strong>KETUA RT / KAVLING</strong></td>
        <td>Memantau dashboard ringkasan eksekutif, rekap kepatuhan iuran, melihat buku kas, dan menginspeksi log transparansi (Audit Trail).</td>
        <td><code>ketua</code> / <code>Ketua123!</code></td>
      </tr>
    </tbody>
  </table>

  <div class="screenshot-card avoid-break">
    <div class="browser-bar">
      <span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span>
      <span class="browser-url">https://si-warga-peach.vercel.app/login</span>
    </div>
    <img src="${imgLogin}" class="screenshot-img" alt="Halaman Login" />
    <div class="screenshot-caption">Gambar 1: Halaman Login siWarga Palmut dengan Identitas Kavling Dinamis</div>
  </div>

  <div class="page-break"></div>

  <!-- BAB 3: DASHBOARD -->
  <h1>3. Dashboard Utama & Monitoring Real-Time</h1>
  <p>
    Halaman Dashboard merupakan pusat kendali informasi yang menyajikan kondisi keuangan dan kepatuhan warga secara seketika (*real-time*).
  </p>

  <div class="screenshot-card avoid-break">
    <div class="browser-bar">
      <span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span>
      <span class="browser-url">https://si-warga-peach.vercel.app/</span>
    </div>
    <img src="${imgDashboard}" class="screenshot-img" alt="Dashboard Utama" />
    <div class="screenshot-caption">Gambar 2: Tampilan Dashboard Eksekutif siWarga Palmut</div>
  </div>

  <h2>Komponen Utama Dashboard:</h2>
  <ul>
    <li><strong>Ringkasan Saldo Dual-Kas:</strong> Menampilkan saldo aktif Kas Umum dan Kas Keamanan, total kas gabungan, serta rincian arus kas masuk & keluar bulan berjalan.</li>
    <li><strong>Kepatuhan Pembayaran Warga:</strong> Menampilkan persentase warga yang sudah lunas vs yang masih menunggak beserta indikator visual.</li>
    <li><strong>Grafik Tren Keuangan Bulanan:</strong> Menampilkan perbandingan pemasukan vs pengeluaran selama 6 bulan terakhir untuk analisis tren anggaran.</li>
    <li><strong>Tombol Cepat Salin Rekap WA:</strong> Menyediakan salinan teks laporan keuangan bulanan terformat untuk langsung dibagikan ke grup WhatsApp warga.</li>
  </ul>

  <div class="page-break"></div>

  <!-- BAB 4: DATA WARGA -->
  <h1>4. Manajemen Data Warga (KK & Rumah)</h1>
  <p>
    Modul <strong>Data Warga</strong> digunakan untuk mencatat seluruh Kepala Keluarga (KK) yang berdomisili di kavling/lingkungan beserta status kepemilikan dan kontak aktif.
  </p>

  <div class="screenshot-card avoid-break">
    <div class="browser-bar">
      <span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span>
      <span class="browser-url">https://si-warga-peach.vercel.app/warga</span>
    </div>
    <img src="${imgWarga}" class="screenshot-img" alt="Data Warga" />
    <div class="screenshot-caption">Gambar 3: Tabel Manajemen Data Warga dengan Filter & Pencarian</div>
  </div>

  <h2>Fitur-Fitur Pengelolaan Warga:</h2>
  <div class="step-box">
    <div class="step-number">1</div>
    <div class="step-content">
      <strong>Tambah Data Warga Baru:</strong> Klik tombol hijau <em>+ Tambah Warga</em>. Masukkan Nomor Blok/Rumah, Nama Kepala Keluarga, Nomor WhatsApp aktif (format internasional 628...), Jumlah Anggota Keluarga, dan Status Hunian (Tetap, Kontrak, atau Kosong).
    </div>
  </div>
  <div class="step-box">
    <div class="step-number">2</div>
    <div class="step-content">
      <strong>Status Hunian Otomatis:</strong> Rumah dengan status <em>Kosong</em> secara cerdas dapat dibebaskan dari iuran sampah/operasional sesuai kebijakan kavling.
    </div>
  </div>
  <div class="step-box">
    <div class="step-number">3</div>
    <div class="step-content">
      <strong>Pencarian Cepat & Filter:</strong> Pengurus dapat mencari warga berdasarkan nama atau nomor blok dengan hasil instan tanpa reload halaman.
    </div>
  </div>

  <div class="page-break"></div>

  <!-- BAB 5: TAGIHAN IURAN -->
  <h1>5. Pengelolaan Tagihan Iuran & Pembayaran</h1>
  <p>
    Setiap bulan, sistem secara otomatis menerbitkan tagihan iuran bulanan untuk setiap KK berdasarkan tarif master yang berlaku (Iuran Wajib, Iuran Keamanan, dan Denda Ronda jika ada).
  </p>

  <div class="screenshot-card avoid-break">
    <div class="browser-bar">
      <span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span>
      <span class="browser-url">https://si-warga-peach.vercel.app/tagihan</span>
    </div>
    <img src="${imgTagihan}" class="screenshot-img" alt="Tagihan Iuran Warga" />
    <div class="screenshot-caption">Gambar 4: Halaman Tagihan Iuran dengan Status Lunas, Terlambat, dan Aksi Cepat</div>
  </div>

  <h2>Langkah Mencatat Pembayaran Warga:</h2>
  <div class="step-box">
    <div class="step-number">1</div>
    <div class="step-content">
      Cari warga yang bersangkutan di daftar tagihan atau gunakan filter periode bulan/tahun.
    </div>
  </div>
  <div class="step-box">
    <div class="step-number">2</div>
    <div class="step-content">
      Klik tombol <strong>"Bayar"</strong> pada baris nama warga.
    </div>
  </div>
  <div class="step-box">
    <div class="step-number">3</div>
    <div class="step-content">
      Pilih metode pembayaran (Transfer Bank / Kas Tunai). Nominal pembayaran otomatis dialokasikan ke Kas Umum dan Kas Keamanan sesuai pos masing-masing.
    </div>
  </div>
  <div class="step-box">
    <div class="step-number">4</div>
    <div class="step-content">
      Klik <strong>Simpan Pembayaran</strong>. Saldo kedua kas di sistem seketika bertambah, status tagihan berubah menjadi <span class="badge badge-success">Lunas</span>, dan kuitansi pembayaran tercatat.
    </div>
  </div>

  <div class="page-break"></div>

  <!-- BAB 6: BUKU KAS & EKSPOR -->
  <h1>6. Pembukuan Kas Dual-Ledger & Ekspor Laporan</h1>
  <p>
    Modul <strong>Buku Kas</strong> mencatat arus uang masuk (*income*) dan uang keluar (*expense*) secara transparan. Terdapat tab pemisah antara <strong>Kas Umum</strong> dan <strong>Kas Keamanan</strong>.
  </p>

  <div class="screenshot-card avoid-break">
    <div class="browser-bar">
      <span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span>
      <span class="browser-url">https://si-warga-peach.vercel.app/kas</span>
    </div>
    <img src="${imgKas}" class="screenshot-img" alt="Buku Kas" />
    <div class="screenshot-caption">Gambar 5: Buku Kas Dual-Ledger dengan Rincian Mutasi & Saldo Akumulatif</div>
  </div>

  <h2>Fitur Ekspor Laporan Periode (Excel & PDF):</h2>
  <p>
    Untuk keperluan rapat warga bulanan atau pertanggungjawaban pengurus, Bendahara dapat mengekspor mutasi kas dalam format **Microsoft Excel (.xlsx)** maupun **Adobe PDF (.pdf)** per periode bulan/tahun.
  </p>

  <div class="screenshot-card avoid-break">
    <div class="browser-bar">
      <span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span>
      <span class="browser-url">Dialog Ekspor Laporan Kas</span>
    </div>
    <img src="${imgEkspor}" class="screenshot-img" alt="Dialog Ekspor Kas" />
    <div class="screenshot-caption">Gambar 6: Modal Pemilihan Format Ekspor (Excel / PDF) dan Pemilihan Periode</div>
  </div>

  <div class="callout callout-tip">
    <strong>💡 Tip Ekspor Laporan:</strong>
    Dokumen Excel yang dihasilkan sudah dilengkapi dengan warna header hijau tosca resmi, judul kavling dinamis, rincian tanggal, kategori, keterangan, debit/kredit, serta formula penjumlahan saldo akhir otomatis.
  </div>

  <div class="page-break"></div>

  <!-- BAB 7: PENAGIHAN WA -->
  <h1>7. Penagihan WhatsApp & Rekap Tunggakan</h1>
  <p>
    Modul <strong>Penagihan WA</strong> dirancang untuk memudahkan Bendahara menagih iuran tanpa perlu mengetik ulang pesan satu per satu.
  </p>

  <div class="screenshot-card avoid-break">
    <div class="browser-bar">
      <span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span>
      <span class="browser-url">https://si-warga-peach.vercel.app/penagihan-wa</span>
    </div>
    <img src="${imgWa}" class="screenshot-img" alt="Penagihan WhatsApp" />
    <div class="screenshot-caption">Gambar 7: Halaman Penagihan WhatsApp dengan Daftar Tunggakan & Tombol WA 1-Klik</div>
  </div>

  <h2>Dua Metode Penagihan:</h2>
  <div class="step-box">
    <div class="step-number">A</div>
    <div class="step-content">
      <strong>Kirim Pesan Personal (Japri):</strong> Klik tombol hijau <em>"Kirim WA"</em> pada warga yang bersangkutan. Browser/HP otomatis membuka aplikasi WhatsApp dengan pesan tagihan yang sudah lengkap terisi nama warga, rincian tagihan, nomor rekening, dan total tagihan.
    </div>
  </div>
  <div class="step-box">
    <div class="step-number">B</div>
    <div class="step-content">
      <strong>Pengumuman Rekap di Grup Warga:</strong> Klik tombol <em>"Salin Teks Broadcast"</em> di bagian atas. Anda bisa memilih mode <em>Tampilkan Nominal</em> atau <em>Sembunyikan Nominal (Etis)</em>. Teks rekap langsung tersalin ke clipboard dan siap di-paste ke grup WhatsApp warga.
    </div>
  </div>

  <div class="page-break"></div>

  <!-- BAB 8: PENGATURAN -->
  <h1>8. Pengaturan Identitas Aplikasi & Tarif Iuran</h1>
  <p>
    Halaman <strong>Pengaturan</strong> memungkinkan Administrator menyesuaikan aplikasi dengan identitas perumahan/kavling yang bersangkutan tanpa perlu menyentuh kode program.
  </p>

  <div class="screenshot-card avoid-break">
    <div class="browser-bar">
      <span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span>
      <span class="browser-url">https://si-warga-peach.vercel.app/pengaturan</span>
    </div>
    <img src="${imgPengaturan}" class="screenshot-img" alt="Pengaturan Aplikasi" />
    <div class="screenshot-caption">Gambar 8: Menu Pengaturan Identitas Kavling, Tarif Iuran, dan Rekening Bank</div>
  </div>

  <h2>Formulir yang Tersedia:</h2>
  <ul>
    <li><strong>Identitas Aplikasi & Wilayah Kavling:</strong> Mengubah Nama Aplikasi (misal: <em>siWarga Palmut</em>) dan Nama Wilayah (misal: <em>Kavling Palanji & Mutiara Indah</em>). Dilengkapi <em>Live Preview</em> seketika.</li>
    <li><strong>Master Tarif Iuran:</strong> Menetapkan nominal Iuran Wajib, Iuran Keamanan, dan Denda Keterlambatan/Ronda. Setiap perubahan tarif wajib disertai catatan alasan yang terekam dalam audit log.</li>
    <li><strong>Informasi Rekening Bank:</strong> Menentukan nomor rekening Bank Kas Umum dan Kas Keamanan yang akan otomatis terlampir di pesan tagihan WhatsApp warga.</li>
  </ul>

  <div class="page-break"></div>

  <!-- BAB 9: AUDIT TRAIL -->
  <h1>9. Audit Trail & Keamanan Sistem</h1>
  <p>
    Untuk menjaga integritas dan akuntabilitas kepengurusan, siWarga menerapkan prinsip <strong>Immutable Ledger (Catatan yang Tidak Dapat Dimanipulasi)</strong>.
  </p>

  <div class="screenshot-card avoid-break">
    <div class="browser-bar">
      <span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span>
      <span class="browser-url">https://si-warga-peach.vercel.app/audit-log</span>
    </div>
    <img src="${imgAudit}" class="screenshot-img" alt="Audit Trail" />
    <div class="screenshot-caption">Gambar 9: Log Audit Trail Keuangan & Sistem yang Mencatat Setiap Aksi Pengurus</div>
  </div>

  <h2>Prinsip Keamanan Audit Trail:</h2>
  <ul>
    <li><strong>Pencatatan Otomatis:</strong> Setiap ada pembayaran masuk, pengeluaran kas, pembatalan (*void*), perubahan data warga, atau pengubahan tarif iuran, sistem mencatat identitas pengguna, waktu detail (jam, menit, detik), dan nilai sebelum vs sesudah perubahan.</li>
    <li><strong>Tidak Ada Tombol Hapus:</strong> Data audit trail tidak memiliki tombol edit atau delete sehingga transparansi kepengurusan terlindungi dari potensi kecurangan.</li>
  </ul>

  <div class="page-break"></div>

  <!-- BAB 10: TAMPILAN MOBILE -->
  <h1>10. Panduan Penggunaan di Smartphone (Mobile)</h1>
  <p>
    Aplikasi <strong>siWarga Palmut</strong> telah dioptimalkan secara responsif (*Mobile-First*) sehingga pengurus dapat memantau dan mencatat transaksi langsung dari smartphone saat bertugas di lapangan atau sedang ronda.
  </p>

  <div class="mobile-grid avoid-break">
    <div class="screenshot-card">
      <div class="browser-bar">
        <span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span>
        <span class="browser-url">Mobile: Dashboard</span>
      </div>
      <img src="${imgMobDashboard}" class="screenshot-img" alt="Mobile Dashboard" />
      <div class="screenshot-caption">Gambar 10: Dashboard Responsive di Smartphone</div>
    </div>
    <div class="screenshot-card">
      <div class="browser-bar">
        <span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span>
        <span class="browser-url">Mobile: Buku Kas</span>
      </div>
      <img src="${imgMobKas}" class="screenshot-img" alt="Mobile Kas" />
      <div class="screenshot-caption">Gambar 11: Buku Kas & Saldo Realtime di Smartphone</div>
    </div>
  </div>

  <h2>Kemudahan Fitur Mobile:</h2>
  <ul>
    <li><strong>Bottom Navigation Bar:</strong> Menu navigasi berada di bagian bawah layar smartphone (Dashboard, Warga, Tagihan, Kas, Menu Lainnya) untuk kemudahan jangkauan satu tangan.</li>
    <li><strong>Direct WhatsApp Action:</strong> Menekan tombol WhatsApp langsung mengaktifkan aplikasi WhatsApp di HP tanpa perlu membuka browser terpisah.</li>
    <li><strong>Quick Search:</strong> Seluruh tabel otomatis berubah menjadi kartu vertikal yang mudah di-scroll di layar sempit.</li>
  </ul>

  <div class="callout callout-info" style="margin-top: 25px;">
    <strong>🎉 Siap Menggunakan Aplikasi:</strong><br/>
    Aplikasi dapat diakses kapan saja dan di mana saja melalui browser ponsel maupun laptop di alamat: 
    <strong><a href="https://si-warga-peach.vercel.app" style="color: #0f766e;">https://si-warga-peach.vercel.app</a></strong>
  </div>

</body>
</html>
  `;

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle' });

  console.log('Mencetak dokumen ke PDF...');
  await page.pdf({
    path: OUTPUT_PDF,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '15mm',
      bottom: '15mm',
      left: '12mm',
      right: '12mm',
    },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size: 7.5pt; font-family: -apple-system, sans-serif; color: #94a3b8; width: 100%; padding: 0 15mm; display: flex; justify-content: space-between;">
        <span>siWarga Palmut — Panduan Pengguna</span>
        <span>Kavling Palanji & Mutiara Indah</span>
      </div>
    `,
    footerTemplate: `
      <div style="font-size: 7.5pt; font-family: -apple-system, sans-serif; color: #94a3b8; width: 100%; padding: 0 15mm; display: flex; justify-content: space-between;">
        <span>Dokumentasi Resmi v1.2</span>
        <span>Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></span>
      </div>
    `,
  });

  await browser.close();
  console.log(`✅ PDF User Guide berhasil dibuat: ${OUTPUT_PDF}`);
}

generatePDF().catch(console.error);

# Kumpulan Prompt UI/UX Google Stitch — Aplikasi Manajemen RT/RW

| Informasi Dokumen | Detail |
| :--- | :--- |
| **Target Tool** | **Google Stitch** (Web & Mobile UI Generation) |
| **Basis Desain** | `07-design-system-dan-screen-inventory-aplikasi-rtrw.md` |
| **Gaya Prompt** | Instruksi struktur dalam Bahasa Inggris (optimal untuk engine Google Stitch) dengan **label UI, data contoh, dan istilah domain 100% Bahasa Indonesia** agar hasil mockup langsung realistis |
| **Fase** | Fase 3 — Senior UI/UX Designer |

---

## Panduan Penggunaan di Google Stitch

1. **Konsistensi Antar Layar:** Salin blok **Global Design System Context** di bawah ini sebagai pembuka (atau masukkan di bagian *System/Theme instructions* proyek Google Stitch) sebelum menjalankan prompt masing-masing layar `SCR-001` hingga `SCR-011`.
2. **Urutan Pembuatan Disarankan:** Mulai dari **SCR-002 (Dashboard Mobile & Desktop)** untuk mengunci bahasa visual Dual-Kas (Emerald untuk Kas Umum, Blue untuk Kas Keamanan), lalu lanjutkan ke **SCR-003**, **SCR-004**, **SCR-005**, dan **SCR-006** yang merupakan layar operasional utama Bendahara.
3. **Iterasi State:** Setiap prompt menyertakan detail *Interactive States* di bagian akhir—kamu bisa meminta Stitch menghasilkan variasi *Empty State* atau *Modal State* langsung dari layar induknya.

---

## Global Design System Context (Tempel di Proyek Stitch)

~~~text
Global Design System for "Aplikasi Manajemen RT/RW" (Indonesian Neighborhood Finance & Resident Management Web App, Mobile-Responsive):
- Visual Style: Clean modern SaaS utility, high contrast, trustworthy civic-finance feel (inspired by Tailwind CSS & shadcn/ui), friendly for users aged 30–60.
- Typography: Plus Jakarta Sans, crisp hierarchy, tabular-nums for all Indonesian Rupiah ("Rp") numbers.
- Color Palette:
  - Canvas background: #F8FAFC; Card surface: #FFFFFF with 1px solid #E2E8F0 border, 12px border radius, subtle shadow.
  - Primary brand accent: Teal #0F766E (hover #115E59).
  - Dual Cash Identity (CRITICAL):
    * "Kas Umum" (Mandatory Fee & General Ops): Emerald #059669, soft surface #ECFDF5, border #A7F3D0.
    * "Kas Keamanan" (Security Fee, Patrol Fines & Guard Salary): Royal Blue #1D4ED8, soft surface #EFF6FF, border #BFDBFE.
  - WhatsApp action button: Green #16A34A.
  - Status badges: Lunas (#15803D on #DCFCE7), Sebagian/Denda (#B45309 on #FEF3C7), Belum Bayar/Pengeluaran (#BE123C on #FFE4E6).
  - Text primary: #0F172A; Text secondary: #475569.
- Navigation Pattern:
  - Mobile (390px): Sticky top header (56px) + fixed bottom navigation bar (64px) with 5 icons: "Beranda", "Tagihan", "Tagih WA", "Kas", "Menu". Minimum 44px touch targets.
  - Desktop (1440px): Fixed left sidebar (260px) + top bar (64px) + 1280px max-width content area.
~~~

---

## SCR-001: Halaman Login Pengurus (`F-001`)

**Target Viewport:** Mobile (`390x844`) & Desktop (`1440x900`) — Centered Card Layout.

~~~text
Design a clean, trustworthy mobile-responsive Web Login screen for "Aplikasi Manajemen RT/RW" (Single Neighborhood Admin Portal). Use #F8FAFC background with a subtle geometric top accent in #0F766E.

Layout:
- Centered white card (#FFFFFF, 12px radius, max-width 420px, 1px solid #E2E8F0 border, generous 32px padding).
- Top of card: Minimalist shield-home logo icon in a #F0FDFA rounded square with #0F766E stroke, title "SiWarga RT 04 / RW 02" (22px Bold #0F172A), subtitle "Sistem Administrasi & Keuangan Komplek Melati" (14px #475569).
- Form fields (vertical stack, 16px gap, 44px input height):
  1. Label "Username atau Email" with placeholder "contoh: bendahara.rt04".
  2. Label "Kata Sandi" with password dots and eye-toggle icon on the right.
- Full-width primary button (#0F766E, 48px height, white semibold text): "Masuk ke Aplikasi".
- Below button: Subtle helper note in #64748B (12px): "Akses khusus Pengurus RT (Admin, Bendahara, Ketua). Hubungi Admin RT jika lupa kata sandi."
- Include a compact inline error alert example variant (hidden/annotated): soft rose box (#FFE4E6, text #BE123C) reading "Username atau kata sandi tidak sesuai. Silakan coba lagi."
~~~

---

## SCR-002: Dashboard Dual-Kas & Ringkasan Bulanan (`F-008`, `F-010`)

**Target Viewport:** Mobile (`390x844`) — *Primary View*, plus Desktop (`1440x900`) with left sidebar.

~~~text
Design a Mobile-First Web Dashboard (390px viewport, also adaptable to 1440px desktop with 260px left sidebar) for "Aplikasi Manajemen RT/RW" highlighting separated Dual Cash Books ("Kas Umum" vs "Kas Keamanan") and WhatsApp report sharing.

Top App Bar (56px, #FFFFFF, bottom border #E2E8F0):
- Left: "RT 04 Komplek Melati" (Bold #0F172A) with small teal pill badge "Ketua RT • Mode Pantau" or "Bendahara".
- Right: Compact month selector dropdown pill "November 2026 ▾".

Main Content (#F8FAFC, 16px padding, 16px vertical spacing):
1. Quick Action Row (2 buttons side-by-side, 44px height):
   - Primary WhatsApp button (#16A34A, white text, copy/WA icon): "Copy Laporan Kas WA".
   - Outlined button (#FFFFFF, border #E2E8F0, download icon): "Export PDF/CSV".
2. Dual Cash Summary Section (CRITICAL visual separation):
   - Card 1 — Kas Umum (left accent bar 4px #059669, soft header tint #ECFDF5):
     * Header: Wallet icon + "KAS UMUM (Iuran Wajib & Ops)" badge in #059669.
     * Big tabular number: "Rp 18.450.000" (24px Bold #0F172A).
     * Bottom 2-column mini stats: "Masuk: +Rp 4.200.000" (#15803D) | "Keluar: -Rp 1.350.000" (#BE123C).
   - Card 2 — Kas Keamanan (left accent bar 4px #1D4ED8, soft header tint #EFF6FF):
     * Header: Shield icon + "KAS KEAMANAN (Ronda & Satpam)" badge in #1D4ED8.
     * Big tabular number: "Rp 12.800.000" (24px Bold #0F172A).
     * Bottom 2-column mini stats: "Masuk: +Rp 3.650.000" (#15803D) | "Keluar: -Rp 2.800.000" (#BE123C) with sub-caption "Termasuk Gaji Satpam".
   - Compact Combined Total Strip (#0F766E dark teal card, white text): "Total Saldo Gabungan RT" -> "Rp 31.250.000".
3. Collection Rate Card (#FFFFFF):
   - Title: "Kepatuhan Bayar — November 2026".
   - Large stat: "48 / 60 KK Lunas (80%)" with smooth horizontal progress bar (#0F766E fill on #E2E8F0 track).
   - Sub-row: "12 KK Belum Lunas • Total Tunggakan Rp 1.450.000" with text link "Lihat Penagihan WA →" (#0F766E).
4. Monthly Cashflow Chart Card (#FFFFFF):
   - Title: "Arus Kas 6 Bulan Terakhir" with toggle tabs "Kas Umum" | "Kas Keamanan".
   - Clean grouped vertical bar chart comparing Pemasukan (#059669 / #1D4ED8) vs Pengeluaran (#FB7185).

Fixed Bottom Navigation Bar (64px, #FFFFFF, top border #E2E8F0):
- 5 items: "Beranda" (active #0F766E), "Tagihan", "Tagih WA", "Kas", "Menu".
~~~

---

## SCR-003: Daftar Tagihan Bulanan & Denda Ronda (`F-004`, `F-005`)

**Target Viewport:** Mobile (`390x844`) & Desktop (`1440x900`).

~~~text
Design the Monthly Billing & Patrol Fines Management screen ("Tagihan Iuran & Denda") for "Aplikasi Manajemen RT/RW" in Mobile-First Web layout (390px) using #F8FAFC background and #FFFFFF cards.

Header & Action Bar:
- Page title "Tagihan Iuran" + month selector pill "November 2026 ▾".
- Full-width (or right-aligned on desktop) primary teal button (#0F766E): "+ Generate Tagihan Bulan Ini" alongside secondary button "+ Denda Ronda" (amber outline #B45309).
- Search input ("Cari nama kepala keluarga atau blok...") + horizontal scrollable status filter chips: "Semua (60)", "Belum Bayar (8)" (rose tint), "Sebagian (4)" (amber tint), "Lunas (48)" (green tint).

Resident Billing Card List (vertical stack, 12px gap):
- Card 1 (Status: Belum Bayar):
  * Top row: "Bpk. Hendra Wijaya" (15px Bold #0F172A), subtitle "Blok B-12 • Tetap" (#475569), right badge "Belum Bayar" (#BE123C on #FFE4E6).
  * Component breakdown pills/lines (compact 3-line list with tabular numbers):
    - "Iuran Wajib" -> "Rp 50.000" (small emerald dot #059669)
    - "Iuran Keamanan" -> "Rp 40.000" (small blue dot #1D4ED8)
    - "Denda Ronda (12 Nov)" -> "Rp 25.000" (amber badge #B45309 on #FEF3C7)
  * Divider + Footer row: "Sisa Tagihan: Rp 115.000" (Bold) + right button "Catat Bayar" (#0F766E, 36px–40px height) and overflow icon (Edit Nominal / Tambah Denda).
- Card 2 (Status: Sebagian):
  * "Ibu Ratna Sari • Blok A-04", badge "Sebagian" (#B45309 on #FEF3C7).
  * Shows "Iuran Wajib: Lunas ✓" (#15803D), "Iuran Keamanan: Sisa Rp 40.000" (#BE123C).
  * Footer: "Sisa: Rp 40.000" + button "Lanjutkan Bayar".
- Card 3 (Status: Lunas):
  * "Bpk. Agus Santoso • Blok C-08", badge "Lunas" (#15803D on #DCFCE7), subtle muted caption "Dibayar 05 Nov • Transfer" + secondary link "Detail / Bukti".

Bottom Navigation Bar with "Tagihan" active (#0F766E).
Also include visual annotation for Empty State (before generation): centered card with calendar icon, "Tagihan bulan ini belum dibuat", and CTA "Generate Tagihan November 2026".
~~~

---

## SCR-004: Modal / Bottom Sheet Catat Pembayaran per Komponen (`F-005`)

**Target Viewport:** Mobile Bottom Sheet (`390px`) / Desktop Modal (`560px`).

~~~text
Design a focused Bottom Sheet / Modal overlay titled "Catat Pembayaran Iuran" over a dimmed backdrop for "Aplikasi Manajemen RT/RW".

Header:
- Title: "Catat Pembayaran" + subtitle "Bpk. Hendra Wijaya (Blok B-12) • November 2026" + close (X) icon.

Section 1 — Pilih Komponen & Nominal Bayar (Supports Partial Payment):
- Quick toggle link on right: "Pilih Lunas Semua" (#0F766E).
- 3 selectable component rows inside light bordered boxes (#F8FAFC):
  1. Checked checkbox + "Iuran Wajib" + small green tag "→ Kas Umum" (#059669 on #ECFDF5). Right: editable Rupiah input pre-filled "50.000" (helper: "Sisa Rp 50.000").
  2. Checked checkbox + "Iuran Keamanan" + small blue tag "→ Kas Keamanan" (#1D4ED8 on #EFF6FF). Right: editable Rupiah input pre-filled "40.000".
  3. Unchecked checkbox + "Denda Ronda (Absen 12 Nov)" + small blue tag "→ Kas Keamanan" (#1D4ED8 on #EFF6FF). Right: input "25.000" (muted since unchecked, showing partial payment example).

Section 2 — Preview Routing Otomatis Dual Kas (Summary Box):
- Soft info card (#F0FDFA, border #99F6E4):
  * "Otomatis masuk ke Kas Umum: Rp 50.000" (#059669 Bold)
  * "Otomatis masuk ke Kas Keamanan: Rp 40.000" (#1D4ED8 Bold)
  * Bold total line: "Total Diterima Sekarang: Rp 90.000" (Status akan menjadi: Sebagian).

Section 3 — Detail Pembayaran:
- 2-column row: "Tanggal Bayar" ("21 Nov 2026") & "Metode Bayar" segmented toggle ("Tunai" | "Transfer" active).
- Upload dropzone (dashed border #CBD5E1, compact height): camera/upload icon + "Unggah Bukti Transfer (Opsional, maks. 2 MB)".
- Optional text input: "Catatan (misal: titip lewat Pak RT)".

Sticky Footer:
- Secondary "Batal" button + Primary full-width button (#0F766E, 48px height): "Simpan Pembayaran Rp 90.000".
~~~

---

## SCR-005: Penagihan WhatsApp — Daftar Tunggakan & Copy/Share (`F-006`)

**Target Viewport:** Mobile (`390x844`) — *Primary View*.

~~~text
Design the WhatsApp Billing & Arrears Collection screen ("Penagihan WhatsApp") for "Aplikasi Manajemen RT/RW" (390px mobile viewport), optimized for one-hand copy-paste and direct WhatsApp sharing by the Treasurer.

Top Header:
- Title: "Penagihan WA" + subtitle "Hanya menampilkan warga belum lunas".
- Filter controls: Segmented switch ("Bulan November 2026" active | "Semua Tunggakan") + compact summary banner (#FFF1F2 border #FECDD3): "12 KK Belum Lunas • Total Rp 1.450.000".

Group Broadcast Action Card (#FFFFFF, 1px border #E2E8F0):
- Title: "Rekap Daftar Belum Bayar (Untuk Grup WA)".
- Inline toggle switch: "Sembunyikan nominal per warga" (OFF).
- Full-width outlined green button (#16A34A text & border, copy icon): "Copy Rekap Daftar Belum Bayar".

Unpaid Resident Action Cards (vertical list, 12px gap):
- Card 1:
  * Top row: "Bpk. Hendra Wijaya (Blok B-12)" + phone icon "0812-3456-7890" + badge "Belum Bayar" (#BE123C on #FFE4E6).
  * Clean breakdown strip (#F8FAFC, 8px radius):
    "Wajib Rp 50.000 • Keamanan Rp 40.000 • Denda Rp 25.000"
    "Total Tagihan: Rp 115.000" (Bold #0F172A).
  * Action Row (2 large 44px buttons side-by-side + preview icon):
    - Left button (Outlined Teal #0F766E, copy icon): "Copy Pesan WA".
    - Right button (Solid WhatsApp Green #16A34A, white text, WA send icon): "Kirim ke WA".
    - Small icon button (Eye icon) to preview formatted WhatsApp message bubble before sending.
- Card 2:
  * "Ibu Ratna Sari (Blok A-04)" + badge "Sebagian" (#B45309 on #FEF3C7).
  * Breakdown strip: "Sisa Iuran Keamanan Rp 40.000 (Wajib sudah lunas)".
  * Same 2 action buttons: "Copy Pesan WA" & "Kirim ke WA".

Floating Toast Feedback (bottom above nav bar, #0F172A dark slate pill with green check):
- "✓ Pesan tagihan Bpk. Hendra berhasil disalin ke clipboard!"

Fixed Bottom Navigation Bar with "Tagih WA" active (#0F766E).
~~~

---

## SCR-006: Dual Buku Kas — Kas Umum & Kas Keamanan (`F-007`, `F-010`)

**Target Viewport:** Mobile (`390x844`) & Desktop (`1440x900`).

~~~text
Design the Dual Cash Book screen ("Buku Kas RT/RW") for "Aplikasi Manajemen RT/RW" (1440px Desktop with left sidebar AND adaptable to 390px Mobile), clearly separating "Kas Umum" and "Kas Keamanan".

Top Header:
- Title: "Buku Kas RT/RW" + Month filter "November 2026 ▾".
- Right actions: Outlined button "Export PDF/CSV" + Primary button "+ Catat Transaksi Kas" (#0F766E on Kas Umum tab, or #1D4ED8 when on Kas Keamanan tab).

CRITICAL Dual-Cash Segmented Switcher (large, unmistakable tabs):
- Tab 1: Emerald Wallet icon + "Kas Umum" (sublabel "Iuran Wajib, Sumbangan, Ops") — emerald #059669 active styling.
- Tab 2 (Active in this mockup): Blue Shield icon + "Kas Keamanan" (sublabel "Iuran Keamanan, Denda, Gaji Satpam") — royal blue #1D4ED8 active background #EFF6FF with 2px solid #1D4ED8 border.

4 KPI Summary Cards Row (Blue-tinted border #BFDBFE for active Kas Keamanan):
1. "Saldo Awal Nov": "Rp 11.950.000"
2. "Total Pemasukan": "+Rp 3.650.000" (#15803D)
3. "Total Pengeluaran": "-Rp 2.800.000" (#BE123C)
4. "Saldo Akhir Kas Keamanan": "Rp 12.800.000" (Bold #1D4ED8, highlighted card #EFF6FF).

Transaction Ledger Table / Card List (with filter chips: Semua | Pemasukan | Pengeluaran):
- Row 1 (Manual Expense with Receipt):
  * Date: "20 Nov 2026" | Category pill: "Gaji Satpam" (#1D4ED8 on #EFF6FF) | Description: "Gaji 2 Petugas Keamanan Bulan November" | Source: "Manual" | Amount: "-Rp 2.500.000" (#BE123C Bold) | Actions: Thumbnail/icon "Lihat Nota" + Edit/Void menu.
- Row 2 (Auto Income from Billing — LOCKED):
  * Date: "18 Nov 2026" | Category pill: "Iuran Keamanan" | Description: "Pembayaran Iuran Keamanan - Bpk. Agus (Blok C-08)" | Source badge: Lock icon "Otomatis Iuran" (#475569 on #F1F5F9, tooltip: "Edit via menu Tagihan") | Amount: "+Rp 40.000" (#15803D Bold) | Actions: Link "Lihat Tagihan".
- Row 3 (Auto Income from Patrol Fine — LOCKED):
  * Date: "15 Nov 2026" | Category pill: "Denda Ronda" (#B45309 on #FEF3C7) | Description: "Denda Absen Ronda 12 Nov - Bpk. Dimas (Blok D-02)" | Source badge: Lock icon "Otomatis Iuran" | Amount: "+Rp 25.000" (#15803D Bold).
- Row 4 (Manual Expense):
  * Date: "10 Nov 2026" | Category pill: "Operasional Pos Ronda" | Description: "Pembelian kopi, lampu sorot pos & baterai senter" | Amount: "-Rp 300.000" (#BE123C Bold) | "Lihat Nota".
~~~

---

## SCR-007: Modal Input Transaksi Kas Manual & Preview Nota (`F-007`)

**Target Viewport:** Desktop Modal (`540px`) / Mobile Bottom Sheet (`390px`).

~~~text
Design a clean Modal Dialog titled "Catat Transaksi Kas Manual" for "Aplikasi Manajemen RT/RW".

Form Structure (vertical stack, 16px spacing):
1. Buku Kas Selector (2 visual cards side-by-side):
   - Card A: "Kas Umum" (emerald border when selected, subtext "Sumbangan / Operasional RT").
   - Card B (Selected): "Kas Keamanan" (2px blue border #1D4ED8, #EFF6FF fill, subtext "Gaji Satpam / Pos Ronda").
2. Jenis Transaksi (Segmented Toggle):
   - "Pemasukan" | "Pengeluaran" (active rose tint #FFE4E6, text #BE123C).
3. Kategori Dropdown:
   - Label "Kategori Kas Keamanan", selected value "Gaji Satpam / Petugas Keamanan" (dropdown options: Gaji Satpam, Operasional Pos Ronda, Perawatan Portal/CCTV, Perlengkapan Jaga, Lain-lain).
4. Tanggal & Nominal (2-column row):
   - "Tanggal Transaksi": "20 Nov 2026" (date picker).
   - "Nominal (Rp)": prefix "Rp" + large tabular input "2.500.000".
5. Uraian Transaksi:
   - Textarea: "Pembayaran gaji 2 petugas satpam shift siang & malam periode November 2026".
6. Bukti / Foto Nota:
   - Upload box showing a small uploaded thumbnail preview "nota_gaji_nov.jpg (420 KB — Terkompresi)" with "Ganti" and "Hapus" icon buttons, helper text "Format JPG/PNG/WebP, maks. 2 MB".
7. Footer:
   - Subtle audit note: "Transaksi akan tercatat di Audit Trail."
   - Buttons: "Batal" (secondary) & "Simpan Pengeluaran" (#1D4ED8 primary).
~~~

---

## SCR-008: Manajemen Data Warga (KK / Rumah) (`F-002`)

**Target Viewport:** Desktop (`1440x900`) with Slide-Over Edit Drawer & Mobile (`390px`) Card List.

~~~text
Design the Resident & Household Directory screen ("Data Warga / KK") for "Aplikasi Manajemen RT/RW" (1440px Desktop layout with left sidebar and a right Slide-Over Form Drawer open).

Main Area:
- Header: "Data Warga (KK / Rumah)" + count pill "60 KK Aktif" + primary button "+ Tambah Warga" (#0F766E).
- Toolbar: Search input ("Cari nama KK, blok, atau nomor WA...") + Filter dropdowns ("Status Hunian: Semua ▾", "Status Tagihan: Aktif ▾").
- Clean Data Table (#FFFFFF card):
  * Columns: Blok/Rumah | Nama Kepala Keluarga | Nomor WhatsApp | Status Hunian | Status Tagihan & Tarif | Aksi.
  * Row 1: "B-12" | "Bpk. Hendra Wijaya" | "6281234567890" | Pill "Tetap" (#0F766E on #F0FDFA) | "Aktif • Tarif Standar" | Edit / Nonaktifkan icons.
  * Row 2: "A-09" | "Ibu Siti Aminah" | "6281398765432" | Pill "Tetap" | "Aktif" + amber badge "Tarif Khusus (Wajib Rp 25.000)" | Edit / Nonaktifkan.
  * Row 3: "C-15" | "Rumah Bpk. Rudi (Kosong)" | "6285611223344" | Pill "Kosong" (#475569 on #F1F5F9) | "Aktif" + blue badge "Hanya Keamanan" | Edit / Nonaktifkan.

Right Slide-Over Drawer ("Edit Data Warga — Blok A-09", 440px width):
- Inputs: Nama Kepala Keluarga, Blok/No Rumah, Nomor WhatsApp (helper: "Otomatis diformat ke 628xxx"), Status Hunian radio pills ("Tetap" | "Kontrak" | "Kosong"), Switch "Aktifkan Tagihan Bulanan".
- Collapsible section "Penyesuaian Tarif Khusus KK (Opsional)":
  * Input "Override Iuran Wajib (Rp)" -> "25.000" (helper: "Kosongkan untuk mengikuti tarif global").
  * Input "Override Iuran Keamanan (Rp)" -> placeholder "Mengikuti tarif global (Rp 40.000)".
  * Textarea "Catatan": "Keringanan warga lansia sesuai rapat RT".
- Footer: Danger ghost link "Nonaktifkan Warga (Pindah)" on left; "Batal" & "Simpan Perubahan" (#0F766E) on right.
~~~

---

## SCR-009: Pengaturan Tarif Dinamis, Rekening & Template WA (`F-003`)

**Target Viewport:** Desktop (`1440x900`) & Mobile (`390px`).

~~~text
Design the Dynamic Tariff & Settings screen ("Pengaturan Tarif & Aplikasi") for "Aplikasi Manajemen RT/RW" (1440px Desktop with left sidebar).

Header & Navigation Tabs:
- Title: "Pengaturan" + subtitle "Perubahan tarif dapat dilakukan kapan saja oleh Admin & Bendahara dan otomatis tercatat di Audit Trail."
- Horizontal Tabs: "Tarif Iuran & Denda" (active #0F766E underline) | "Info RT & Rekening" | "Template Pesan WA".

Tab Content — Tarif Iuran & Denda:
1. Top 3 Active Tariff Cards (3-column grid):
   - Card 1 (Emerald top border #059669): "Iuran Wajib" + tag "→ Kas Umum", large amount "Rp 50.000 / bulan", caption "Berlaku sejak 01 Jan 2026", button "Ubah Tarif".
   - Card 2 (Blue top border #1D4ED8): "Iuran Keamanan" + tag "→ Kas Keamanan", large amount "Rp 40.000 / bulan", caption "Berlaku sejak 01 Jan 2026", button "Ubah Tarif".
   - Card 3 (Amber top border #B45309): "Denda Ronda" + tag "→ Kas Keamanan", large amount "Rp 25.000 / absen", caption "Berlaku sejak 01 Jun 2026", button "Ubah Tarif".
2. Inline / Modal "Form Penyesuaian Tarif" Preview Card (shown cleanly below or as open dialog):
   - Title: "Ubah Nominal Iuran Keamanan".
   - Old vs New comparison: "Nominal Lama: Rp 40.000" -> Input "Nominal Baru: Rp 50.000".
   - Mandatory Textarea: "Alasan Perubahan (Wajib untuk Audit Trail)" filled with "Penyesuaian kenaikan UMR gaji satpam hasil rapat warga 15 Nov 2026".
   - Highlighted Amber Checkbox Box (#FEF3C7, border #FCD34D):
     * Checkbox (checked): "Terapkan juga ke tagihan bulan November 2026 yang masih berstatus Belum Bayar (8 KK terdampak)."
     * Helper note: "Tagihan yang sudah Lunas atau memiliki Tarif Khusus KK tidak akan berubah."
   - Primary button (#0F766E): "Simpan Tarif Baru".
3. Bottom Section — "Riwayat Perubahan Tarif" Table:
   - Columns: Tanggal Berlaku | Jenis Tarif | Nominal | Alasan Perubahan | Diubah Oleh (Role).
~~~

---

## SCR-010: Log Aktivitas / Audit Trail (`F-009`)

**Target Viewport:** Desktop (`1440x900`) & Mobile (`390px`).

~~~text
Design the Immutable Audit Trail screen ("Log Aktivitas & Audit Trail") for "Aplikasi Manajemen RT/RW" (1440px Desktop with left sidebar).

Header & Security Banner:
- Title: "Audit Trail Keuangan & Tarif".
- Subtle info banner (#F0FDFA, border #99F6E4, shield-check icon): "Seluruh perubahan tarif iuran, pembayaran, pembatalan, dan transaksi kas terekam permanen dan tidak dapat diubah atau dihapus oleh siapa pun."

Filter Toolbar (#FFFFFF card):
- Date range picker ("01 Nov 2026 – 21 Nov 2026"), Dropdown "Modul: Semua ▾" (Tarif, Tagihan, Pembayaran, Buku Kas, Warga), Dropdown "Pengguna: Semua ▾", Search input.

Audit Timeline / Table (#FFFFFF card):
- Columns: Waktu | Pengurus (Role) | Modul & Aksi | Ringkasan Perubahan (Lama → Baru) | Alasan.
- Row 1 (Tariff Change):
  * "21 Nov 2026, 09:15" | "Budi Santoso" + pill "Bendahara" | Badge "RATE_CHANGE • Tarif" (#B45309 on #FEF3C7) | "Iuran Keamanan: Rp 40.000 → Rp 50.000 (8 tagihan belum bayar ikut disesuaikan)" | "Kenaikan gaji satpam hasil rapat warga".
- Row 2 (Void Payment):
  * "19 Nov 2026, 14:22" | "Budi Santoso" + pill "Bendahara" | Badge "VOID • Pembayaran" (#BE123C on #FFE4E6) | "Pembayaran Blok D-05 Rp 90.000 dibatalkan (Saldo Kas Umum -50rb, Kas Keamanan -40rb)" | "Salah pilih nama KK saat input".
- Row 3 (Manual Cash Expense):
  * "18 Nov 2026, 10:05" | "Budi Santoso" + pill "Bendahara" | Badge "CREATE • Kas Keamanan" (#1D4ED8 on #EFF6FF) | "Pengeluaran Gaji Satpam Rp 2.500.000" | "Bukti nota terlampir".
- Each row has an expand chevron to view raw JSON diff cleanly formatted.
~~~

---

## SCR-011: Manajemen Akun Pengurus & Profil (`F-001`)

**Target Viewport:** Desktop (`1440x900`) & Mobile (`390px`).

~~~text
Design the Admin User Management & Role Access screen ("Manajemen Akun Pengurus") for "Aplikasi Manajemen RT/RW" (1440px Desktop with left sidebar).

Header:
- Title: "Akun Pengurus RT/RW" + primary button "+ Tambah Pengurus" (#0F766E).

Top Summary Cards (3 small role cards showing RBAC permissions at a glance):
1. "Admin (1 Akun)": "Kelola user, data warga, pengaturan tarif & template WA."
2. "Bendahara (2 Akun)": "Kelola tagihan, pembayaran, penagihan WA, Dual Kas & tarif."
3. "Ketua RT (1 Akun)": "Akses pantau dashboard, Dual Kas, bukti nota, laporan & audit trail."

User List Table (#FFFFFF card):
- Columns: Nama Pengurus | Username & Email | Role | Status | Login Terakhir | Aksi.
- Row 1: "Ahmad Fauzi" | "admin.rt04 • ahmad@rt04.id" | Teal pill "ADMIN" | Green dot "Aktif" | "21 Nov 2026, 08:10" | "Edit" / "Reset Sandi".
- Row 2: "Budi Santoso" | "bendahara.rt04 • budi@rt04.id" | Blue pill "BENDAHARA" | Green dot "Aktif" | "21 Nov 2026, 09:00" | "Edit" / "Reset Sandi".
- Row 3: "H. Slamet Raharjo" | "ketua.rt04 • slamet@rt04.id" | Purple/Slate pill "KETUA" | Green dot "Aktif" | "20 Nov 2026, 19:45" | "Edit" / "Reset Sandi".

Include a clean secondary tab or side card "Profil & Ubah Kata Sandi Saya" for any logged-in user to change their own password.
~~~
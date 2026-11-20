import { db } from './index'
import {
  users,
  cashBooks,
  cashCategories,
  feeRates,
  appSettings,
} from './schema'
import bcrypt from 'bcryptjs'

async function seed() {
  console.log('Seeding database...')

  // 1. Users
  const passwordHashAdmin = await bcrypt.hash('Admin123!', 10)
  const passwordHashBendahara = await bcrypt.hash('Bendahara123!', 10)
  const passwordHashKetua = await bcrypt.hash('Ketua123!', 10)

  const adminId = 'u-admin-01'
  const bendaharaId = 'u-bendahara-01'
  const ketuaId = 'u-ketua-01'

  await db
    .insert(users)
    .values([
      {
        id: adminId,
        fullName: 'Administrator RT 04',
        username: 'admin',
        email: 'admin@rt04.local',
        passwordHash: passwordHashAdmin,
        role: 'ADMIN',
        isActive: 1,
      },
      {
        id: bendaharaId,
        fullName: 'Budi Santoso (Bendahara)',
        username: 'bendahara.rt04',
        email: 'bendahara@rt04.local',
        passwordHash: passwordHashBendahara,
        role: 'BENDAHARA',
        isActive: 1,
      },
      {
        id: ketuaId,
        fullName: 'H. Rachmat (Ketua RT)',
        username: 'ketua.rt04',
        email: 'ketua@rt04.local',
        passwordHash: passwordHashKetua,
        role: 'KETUA',
        isActive: 1,
      },
    ])
    .onConflictDoNothing()

  // 2. Cash Books
  const kasUmumId = 'cb-umum-01'
  const kasKeamananId = 'cb-keamanan-01'

  await db
    .insert(cashBooks)
    .values([
      {
        id: kasUmumId,
        bookType: 'KAS_UMUM',
        name: 'Buku Kas Umum RT 04',
        bankName: 'BCA',
        accountNumber: '1234567890',
        isActive: 1,
      },
      {
        id: kasKeamananId,
        bookType: 'KAS_KEAMANAN',
        name: 'Buku Kas Keamanan RT 04',
        bankName: 'Mandiri',
        accountNumber: '0987654321',
        isActive: 1,
      },
    ])
    .onConflictDoNothing()

  // 3. Cash Categories
  await db
    .insert(cashCategories)
    .values([
      // Kas Umum
      {
        id: 'cat-u-inc-01',
        cashBookId: kasUmumId,
        name: 'Iuran Wajib Warga',
        transactionType: 'INCOME',
        isDefault: 1,
      },
      {
        id: 'cat-u-inc-02',
        cashBookId: kasUmumId,
        name: 'Sumbangan & Donasi Sukarela',
        transactionType: 'INCOME',
        isDefault: 0,
      },
      {
        id: 'cat-u-inc-03',
        cashBookId: kasUmumId,
        name: 'Pemasukan Lain-lain',
        transactionType: 'INCOME',
        isDefault: 0,
      },
      {
        id: 'cat-u-exp-01',
        cashBookId: kasUmumId,
        name: 'Kebersihan & Pengangkutan Sampah',
        transactionType: 'EXPENSE',
        isDefault: 0,
      },
      {
        id: 'cat-u-exp-02',
        cashBookId: kasUmumId,
        name: 'Rapat Warga & Konsumsi',
        transactionType: 'EXPENSE',
        isDefault: 0,
      },
      {
        id: 'cat-u-exp-03',
        cashBookId: kasUmumId,
        name: 'Santunan Warga & Sosial',
        transactionType: 'EXPENSE',
        isDefault: 0,
      },
      {
        id: 'cat-u-exp-04',
        cashBookId: kasUmumId,
        name: 'Perbaikan Fasilitas Umum / ATK',
        transactionType: 'EXPENSE',
        isDefault: 0,
      },

      // Kas Keamanan
      {
        id: 'cat-k-inc-01',
        cashBookId: kasKeamananId,
        name: 'Iuran Keamanan Warga',
        transactionType: 'INCOME',
        isDefault: 1,
      },
      {
        id: 'cat-k-inc-02',
        cashBookId: kasKeamananId,
        name: 'Denda Ronda Warga',
        transactionType: 'INCOME',
        isDefault: 1,
      },
      {
        id: 'cat-k-inc-03',
        cashBookId: kasKeamananId,
        name: 'Sumbangan Keamanan',
        transactionType: 'INCOME',
        isDefault: 0,
      },
      {
        id: 'cat-k-exp-01',
        cashBookId: kasKeamananId,
        name: 'Gaji Satpam / Petugas Keamanan',
        transactionType: 'EXPENSE',
        isDefault: 0,
      },
      {
        id: 'cat-k-exp-02',
        cashBookId: kasKeamananId,
        name: 'Operasional Pos Ronda',
        transactionType: 'EXPENSE',
        isDefault: 0,
      },
      {
        id: 'cat-k-exp-03',
        cashBookId: kasKeamananId,
        name: 'Perawatan Portal & CCTV',
        transactionType: 'EXPENSE',
        isDefault: 0,
      },
      {
        id: 'cat-k-exp-04',
        cashBookId: kasKeamananId,
        name: 'Perlengkapan Pos Keamanan',
        transactionType: 'EXPENSE',
        isDefault: 0,
      },
    ])
    .onConflictDoNothing()

  // 4. Default Fee Rates
  await db
    .insert(feeRates)
    .values([
      {
        id: 'fr-wajib-01',
        feeType: 'IURAN_WAJIB',
        amount: 50000,
        effectiveFrom: '2026-01-01',
        isActive: 1,
        changeReason: 'Tarif Awal Musyawarah RT 04',
        createdBy: adminId,
      },
      {
        id: 'fr-keamanan-01',
        feeType: 'IURAN_KEAMANAN',
        amount: 40000,
        effectiveFrom: '2026-01-01',
        isActive: 1,
        changeReason: 'Tarif Awal Musyawarah RT 04',
        createdBy: adminId,
      },
      {
        id: 'fr-denda-01',
        feeType: 'DENDA_RONDA',
        amount: 25000,
        effectiveFrom: '2026-01-01',
        isActive: 1,
        changeReason: 'Tarif Denda Ronda Absen',
        createdBy: adminId,
      },
    ])
    .onConflictDoNothing()

  // 5. Default App Settings
  await db
    .insert(appSettings)
    .values([
      {
        key: 'rekening_kas_umum',
        value: 'BCA 1234567890 a.n. Kas RT 04',
        updatedBy: adminId,
      },
      {
        key: 'rekening_kas_keamanan',
        value: 'Mandiri 0987654321 a.n. Kas Keamanan RT 04',
        updatedBy: adminId,
      },
      {
        key: 'wa_billing_template',
        value:
          'Yth. Bpk/Ibu *{nama}* (Blok {blok}),\nBerikut rincian tagihan iuran RT periode *{bulan_tahun}*:\n- Iuran Wajib: {iuran_wajib}\n- Iuran Keamanan: {iuran_keamanan}\n- Denda Ronda: {denda}\n*Total Tagihan: {total}*\n\nPembayaran dapat ditransfer ke {rekening} atau tunai ke Bendahara.\nTerima kasih atas partisipasinya.',
        updatedBy: adminId,
      },
    ])
    .onConflictDoNothing()

  console.log('Seeding completed successfully!')
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})

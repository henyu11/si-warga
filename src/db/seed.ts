import { db } from './index'
import {
  users,
  cashBooks,
  cashCategories,
  feeRates,
  appSettings,
  households,
  bills,
  billItems,
  payments,
  paymentAllocations,
  cashTransactions,
  auditLogs,
} from './schema'
import bcrypt from 'bcryptjs'

import { sql } from 'drizzle-orm'

async function seed() {
  console.log('Clearing existing data and re-seeding database...')

  await db.run(sql`PRAGMA foreign_keys = OFF`)

  // Clean existing tables
  await db.delete(auditLogs).run()
  await db.delete(cashTransactions).run()
  await db.delete(paymentAllocations).run()
  await db.delete(payments).run()
  await db.delete(billItems).run()
  await db.delete(bills).run()
  await db.delete(households).run()
  await db.delete(cashCategories).run()
  await db.delete(cashBooks).run()
  await db.delete(feeRates).run()
  await db.delete(appSettings).run()
  await db.delete(users).run()

  await db.run(sql`PRAGMA foreign_keys = ON`)

  // 1. Users
  const passwordHashAdmin = await bcrypt.hash('Admin123!', 10)
  const passwordHashBendahara = await bcrypt.hash('Bendahara123!', 10)
  const passwordHashKetua = await bcrypt.hash('Ketua123!', 10)

  const adminId = 'u-admin-01'
  const bendaharaId = 'u-bendahara-01'
  const ketuaId = 'u-ketua-01'

  await db.insert(users).values([
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

  // 2. Cash Books
  const kasUmumId = 'cb-umum-01'
  const kasKeamananId = 'cb-keamanan-01'

  await db.insert(cashBooks).values([
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

  // 3. Cash Categories
  await db.insert(cashCategories).values([
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

  // 4. Default Fee Rates sesuai permintaan user:
  // - Iuran wajib: 5000
  // - Iuran keamanan: 20000
  // - Denda ronda: 20000
  const rateWajib = 5000
  const rateKeamanan = 20000
  const rateDenda = 20000

  await db.insert(feeRates).values([
    {
      id: 'fr-wajib-01',
      feeType: 'IURAN_WAJIB',
      amount: rateWajib,
      effectiveFrom: '2026-01-01',
      isActive: 1,
      changeReason: 'Tarif Awal Musyawarah RT 04 (Rp 5.000)',
      createdBy: adminId,
    },
    {
      id: 'fr-keamanan-01',
      feeType: 'IURAN_KEAMANAN',
      amount: rateKeamanan,
      effectiveFrom: '2026-01-01',
      isActive: 1,
      changeReason: 'Tarif Awal Musyawarah RT 04 (Rp 20.000)',
      createdBy: adminId,
    },
    {
      id: 'fr-denda-01',
      feeType: 'DENDA_RONDA',
      amount: rateDenda,
      effectiveFrom: '2026-01-01',
      isActive: 1,
      changeReason: 'Tarif Denda Ronda Absen (Rp 20.000)',
      createdBy: adminId,
    },
  ])

  // 5. App Settings
  await db.insert(appSettings).values([
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

  // 6. Data 10 Warga (Households)
  const householdData = [
    { id: 'hh-01', blockNumber: 'A-01', headName: 'Hendra Wijaya', phoneWa: '6281234567891', occupancyStatus: 'TETAP' as const },
    { id: 'hh-02', blockNumber: 'A-02', headName: 'Suryono Pratama', phoneWa: '6281234567892', occupancyStatus: 'TETAP' as const },
    { id: 'hh-03', blockNumber: 'A-03', headName: 'Bambang Sudarsono', phoneWa: '6281234567893', occupancyStatus: 'TETAP' as const },
    { id: 'hh-04', blockNumber: 'A-04', headName: 'Ratna Sari', phoneWa: '6281234567894', occupancyStatus: 'TETAP' as const },
    { id: 'hh-05', blockNumber: 'A-05', headName: 'Agus Setiawan', phoneWa: '6281234567895', occupancyStatus: 'TETAP' as const },
    { id: 'hh-06', blockNumber: 'A-06', headName: 'Dewi Lestari', phoneWa: '6281234567896', occupancyStatus: 'KONTRAK' as const },
    { id: 'hh-07', blockNumber: 'A-07', headName: 'Eko Prasetyo', phoneWa: '6281234567897', occupancyStatus: 'TETAP' as const },
    { id: 'hh-08', blockNumber: 'A-08', headName: 'Siti Nurhaliza', phoneWa: '6281234567898', occupancyStatus: 'KONTRAK' as const },
    { id: 'hh-09', blockNumber: 'A-09', headName: 'Joko Widodo', phoneWa: '6281234567899', occupancyStatus: 'TETAP' as const },
    { id: 'hh-10', blockNumber: 'A-10', headName: 'Budi Hermawan', phoneWa: '6281234567810', occupancyStatus: 'TETAP' as const },
  ]

  for (const h of householdData) {
    await db.insert(households).values({
      id: h.id,
      blockNumber: h.blockNumber,
      headName: h.headName,
      phoneWa: h.phoneWa,
      occupancyStatus: h.occupancyStatus,
      isBillingActive: 1,
    })
  }

  // 7. Generate Tagihan untuk 2 Bulan Terakhir:
  // - Bulan 10 (Oktober 2026)
  // - Bulan 11 (November 2026)

  // ==========================================
  // BULAN OKTOBER 2026 (Month 10)
  // ==========================================
  for (let i = 0; i < householdData.length; i++) {
    const hh = householdData[i]
    const billId = `bill-2026-10-${hh.id}`
    const isPaid = i < 8 // 8 KK lunas, 2 KK belum bayar di Oktober

    await db.insert(bills).values({
      id: billId,
      householdId: hh.id,
      periodYear: 2026,
      periodMonth: 10,
      dueDate: '2026-10-10',
      status: isPaid ? 'PAID' : 'UNPAID',
      generatedBy: adminId,
    })

    const itemWajibId = `item-wajib-2026-10-${hh.id}`
    const itemKeamananId = `item-keamanan-2026-10-${hh.id}`

    await db.insert(billItems).values([
      {
        id: itemWajibId,
        billId,
        itemType: 'IURAN_WAJIB',
        amountDue: rateWajib,
        amountPaid: isPaid ? rateWajib : 0,
        status: isPaid ? 'PAID' : 'UNPAID',
      },
      {
        id: itemKeamananId,
        billId,
        itemType: 'IURAN_KEAMANAN',
        amountDue: rateKeamanan,
        amountPaid: isPaid ? rateKeamanan : 0,
        status: isPaid ? 'PAID' : 'UNPAID',
      },
    ])

    // Jika lunas, catat payment, allocation, dan dual-kas transaction
    if (isPaid) {
      const paymentId = `pay-2026-10-${hh.id}`
      const totalAmount = rateWajib + rateKeamanan

      await db.insert(payments).values({
        id: paymentId,
        billId,
        paidAmount: totalAmount,
        paymentMethod: i % 2 === 0 ? 'TRANSFER' : 'TUNAI',
        receiptFileKey: i % 2 === 0 ? `receipts/2026-10-${hh.id}.jpg` : null,
        notes: `Pembayaran iuran Okt 2026 ${hh.headName}`,
        createdBy: bendaharaId,
        createdAt: '2026-10-08T09:00:00.000Z',
      })

      // Insert Cash Transactions first
      const ctxUmumId = `ctx-u-2026-10-${hh.id}`
      const ctxKeamananId = `ctx-k-2026-10-${hh.id}`

      // Kas Umum (+5.000)
      await db.insert(cashTransactions).values({
        id: ctxUmumId,
        cashBookId: kasUmumId,
        categoryId: 'cat-u-inc-01',
        transactionType: 'INCOME',
        amount: rateWajib,
        description: `Iuran Wajib Okt 2026 - ${hh.headName} (${hh.blockNumber})`,
        transactionDate: '2026-10-08',
        paymentId,
        isLocked: 1,
        status: 'POSTED',
        createdBy: bendaharaId,
        createdAt: '2026-10-08T09:00:00.000Z',
      })

      // Kas Keamanan (+20.000)
      await db.insert(cashTransactions).values({
        id: ctxKeamananId,
        cashBookId: kasKeamananId,
        categoryId: 'cat-k-inc-01',
        transactionType: 'INCOME',
        amount: rateKeamanan,
        description: `Iuran Keamanan Okt 2026 - ${hh.headName} (${hh.blockNumber})`,
        transactionDate: '2026-10-08',
        paymentId,
        isLocked: 1,
        status: 'POSTED',
        createdBy: bendaharaId,
        createdAt: '2026-10-08T09:00:00.000Z',
      })

      // Insert Payment Allocations
      await db.insert(paymentAllocations).values([
        {
          id: `alloc-wajib-2026-10-${hh.id}`,
          paymentId,
          billItemId: itemWajibId,
          allocatedAmount: rateWajib,
          cashBookId: kasUmumId,
          cashTransactionId: ctxUmumId,
        },
        {
          id: `alloc-keamanan-2026-10-${hh.id}`,
          paymentId,
          billItemId: itemKeamananId,
          allocatedAmount: rateKeamanan,
          cashBookId: kasKeamananId,
          cashTransactionId: ctxKeamananId,
        },
      ])
    }
  }

  // Pengeluaran Kas Operasional Oktober 2026
  await db.insert(cashTransactions).values([
    {
      id: 'ctx-exp-u-2026-10',
      cashBookId: kasUmumId,
      categoryId: 'cat-u-exp-01',
      transactionType: 'EXPENSE',
      amount: 40000,
      description: 'Pengangkutan Sampah & Kerja Bakti Oktober',
      transactionDate: '2026-10-15',
      isLocked: 0,
      status: 'POSTED',
      createdBy: bendaharaId,
      createdAt: '2026-10-15T10:00:00.000Z',
    },
    {
      id: 'ctx-exp-k-2026-10',
      cashBookId: kasKeamananId,
      categoryId: 'cat-k-exp-01',
      transactionType: 'EXPENSE',
      amount: 120000,
      description: 'Honor Satpam & Konsumsi Pos Ronda Oktober',
      transactionDate: '2026-10-25',
      isLocked: 0,
      status: 'POSTED',
      createdBy: bendaharaId,
      createdAt: '2026-10-25T14:00:00.000Z',
    },
  ])

  // ==========================================
  // BULAN NOVEMBER 2026 (Month 11)
  // ==========================================
  for (let i = 0; i < householdData.length; i++) {
    const hh = householdData[i]
    const billId = `bill-2026-11-${hh.id}`

    // Status:
    // 0..4 (5 KK) -> LUNAS (PAID)
    // 5..6 (2 KK) -> SEBAGIAN (PARTIAL)
    // 7..9 (3 KK) -> BELUM BAYAR (UNPAID)
    let billStatus: 'PAID' | 'PARTIAL' | 'UNPAID' = 'UNPAID'
    if (i < 5) billStatus = 'PAID'
    else if (i < 7) billStatus = 'PARTIAL'

    await db.insert(bills).values({
      id: billId,
      householdId: hh.id,
      periodYear: 2026,
      periodMonth: 11,
      dueDate: '2026-11-10',
      status: billStatus,
      generatedBy: adminId,
    })

    const itemWajibId = `item-wajib-2026-11-${hh.id}`
    const itemKeamananId = `item-keamanan-2026-11-${hh.id}`

    // Tambah denda ronda untuk warga ke-1 dan ke-5
    const hasDenda = i === 0 || i === 4
    const itemDendaId = hasDenda ? `item-denda-2026-11-${hh.id}` : null

    // Nilai terbayar per item
    let wajibPaid = 0
    let keamananPaid = 0
    let dendaPaid = 0

    if (billStatus === 'PAID') {
      wajibPaid = rateWajib
      keamananPaid = rateKeamanan
      if (hasDenda) dendaPaid = rateDenda
    } else if (billStatus === 'PARTIAL') {
      // Hanya bayar iuran wajib
      wajibPaid = rateWajib
      keamananPaid = 0
    }

    await db.insert(billItems).values([
      {
        id: itemWajibId,
        billId,
        itemType: 'IURAN_WAJIB',
        amountDue: rateWajib,
        amountPaid: wajibPaid,
        status: wajibPaid === rateWajib ? 'PAID' : 'UNPAID',
      },
      {
        id: itemKeamananId,
        billId,
        itemType: 'IURAN_KEAMANAN',
        amountDue: rateKeamanan,
        amountPaid: keamananPaid,
        status: keamananPaid === rateKeamanan ? 'PAID' : 'UNPAID',
      },
    ])

    if (hasDenda && itemDendaId) {
      await db.insert(billItems).values({
        id: itemDendaId,
        billId,
        itemType: 'DENDA_RONDA',
        amountDue: rateDenda,
        amountPaid: dendaPaid,
        status: dendaPaid === rateDenda ? 'PAID' : 'UNPAID',
        fineDate: '2026-11-03',
        fineNote: 'Tidak hadir jadwal ronda malam pos 1',
      })
    }

    // Catat payment jika ada pembayaran (PAID atau PARTIAL)
    const totalPaid = wajibPaid + keamananPaid + dendaPaid
    if (totalPaid > 0) {
      const paymentId = `pay-2026-11-${hh.id}`

      await db.insert(payments).values({
        id: paymentId,
        billId,
        paidAmount: totalPaid,
        paymentMethod: i % 2 === 0 ? 'TRANSFER' : 'TUNAI',
        receiptFileKey: i % 2 === 0 ? `receipts/2026-11-${hh.id}.jpg` : null,
        notes: `Pembayaran iuran Nov 2026 ${hh.headName}`,
        createdBy: bendaharaId,
        createdAt: '2026-11-06T11:00:00.000Z',
      })

      if (wajibPaid > 0) {
        const ctxUmumId = `ctx-u-2026-11-${hh.id}`

        // Masuk Kas Umum
        await db.insert(cashTransactions).values({
          id: ctxUmumId,
          cashBookId: kasUmumId,
          categoryId: 'cat-u-inc-01',
          transactionType: 'INCOME',
          amount: wajibPaid,
          description: `Iuran Wajib Nov 2026 - ${hh.headName} (${hh.blockNumber})`,
          transactionDate: '2026-11-06',
          paymentId,
          isLocked: 1,
          status: 'POSTED',
          createdBy: bendaharaId,
          createdAt: '2026-11-06T11:00:00.000Z',
        })

        await db.insert(paymentAllocations).values({
          id: `alloc-wajib-2026-11-${hh.id}`,
          paymentId,
          billItemId: itemWajibId,
          allocatedAmount: wajibPaid,
          cashBookId: kasUmumId,
          cashTransactionId: ctxUmumId,
        })
      }

      if (keamananPaid > 0) {
        const ctxKeamananId = `ctx-k-2026-11-${hh.id}`

        // Masuk Kas Keamanan
        await db.insert(cashTransactions).values({
          id: ctxKeamananId,
          cashBookId: kasKeamananId,
          categoryId: 'cat-k-inc-01',
          transactionType: 'INCOME',
          amount: keamananPaid,
          description: `Iuran Keamanan Nov 2026 - ${hh.headName} (${hh.blockNumber})`,
          transactionDate: '2026-11-06',
          paymentId,
          isLocked: 1,
          status: 'POSTED',
          createdBy: bendaharaId,
          createdAt: '2026-11-06T11:00:00.000Z',
        })

        await db.insert(paymentAllocations).values({
          id: `alloc-keamanan-2026-11-${hh.id}`,
          paymentId,
          billItemId: itemKeamananId,
          allocatedAmount: keamananPaid,
          cashBookId: kasKeamananId,
          cashTransactionId: ctxKeamananId,
        })
      }

      if (dendaPaid > 0 && itemDendaId) {
        const ctxDendaId = `ctx-kd-2026-11-${hh.id}`

        // Denda masuk Kas Keamanan
        await db.insert(cashTransactions).values({
          id: ctxDendaId,
          cashBookId: kasKeamananId,
          categoryId: 'cat-k-inc-02',
          transactionType: 'INCOME',
          amount: dendaPaid,
          description: `Denda Absen Ronda Nov 2026 - ${hh.headName} (${hh.blockNumber})`,
          transactionDate: '2026-11-06',
          paymentId,
          isLocked: 1,
          status: 'POSTED',
          createdBy: bendaharaId,
          createdAt: '2026-11-06T11:00:00.000Z',
        })

        await db.insert(paymentAllocations).values({
          id: `alloc-denda-2026-11-${hh.id}`,
          paymentId,
          billItemId: itemDendaId,
          allocatedAmount: dendaPaid,
          cashBookId: kasKeamananId,
          cashTransactionId: ctxDendaId,
        })
      }
    }
  }

  // Pengeluaran Kas Operasional November 2026
  await db.insert(cashTransactions).values([
    {
      id: 'ctx-exp-u-2026-11',
      cashBookId: kasUmumId,
      categoryId: 'cat-u-exp-04',
      transactionType: 'EXPENSE',
      amount: 35000,
      description: 'Pembelian Lampu LED Jalan & Saklar Pos RT',
      transactionDate: '2026-11-12',
      isLocked: 0,
      status: 'POSTED',
      createdBy: bendaharaId,
      createdAt: '2026-11-12T10:00:00.000Z',
    },
    {
      id: 'ctx-exp-k-2026-11',
      cashBookId: kasKeamananId,
      categoryId: 'cat-k-exp-01',
      transactionType: 'EXPENSE',
      amount: 120000,
      description: 'Honor Satpam & Logistik Keamanan November',
      transactionDate: '2026-11-15',
      isLocked: 0,
      status: 'POSTED',
      createdBy: bendaharaId,
      createdAt: '2026-11-15T15:00:00.000Z',
    },
  ])

  console.log('Seeding completed successfully with 10 households and 2 months (Okt & Nov 2026)!')
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})

import { db } from './index'
import {
  households,
  bills,
  billItems,
  payments,
  paymentAllocations,
  cashTransactions,
  auditLogs,
  cashBooks,
} from './schema'
import { sql } from 'drizzle-orm'

async function cleanDemoData() {
  console.log('--- Mulai Pembersihan Data Demo ---')
  console.log('Menghapus data warga, tagihan, pembayaran, mutasi kas, dan audit log demo...')

  await db.run(sql`PRAGMA foreign_keys = OFF`)

  await db.delete(auditLogs).run()
  await db.delete(cashTransactions).run()
  await db.delete(paymentAllocations).run()
  await db.delete(payments).run()
  await db.delete(billItems).run()
  await db.delete(bills).run()
  await db.delete(households).run()

  // Reset saldo buku kas menjadi 0
  await db.update(cashBooks).set({ currentBalance: 0, openingBalance: 0 }).run()

  await db.run(sql`PRAGMA foreign_keys = ON`)

  console.log('✅ Pembersihan selesai dengan sukses!')
  console.log('• Data Warga & Tagihan: Kosong (0)')
  console.log('• Riwayat Transaksi Kas: Kosong (0), Saldo Kas: Rp 0')
  console.log('• Akun Pengurus (Admin, Bendahara, Ketua): Tetap Aman')
  console.log('• Pengaturan Nama Aplikasi & Tarif Master: Tetap Aman')
  console.log('Aplikasi kini siap digunakan untuk data riil warga!')
}

cleanDemoData().catch((err) => {
  console.error('Gagal membersihkan data:', err)
  process.exit(1)
})

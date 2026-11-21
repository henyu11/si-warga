import { db } from '@/db'
import { bills, billItems, households, cashTransactions, cashBooks, cashCategories } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { formatRupiah } from '@/lib/utils'
import { createSimplePdf } from '@/lib/pdf'

export async function generateBillsCSV(month: number, year: number): Promise<string> {
  const allBills = await db
    .select({
      id: bills.id,
      headName: households.headName,
      blockNumber: households.blockNumber,
      phoneWa: households.phoneWa,
      occupancyStatus: households.occupancyStatus,
      status: bills.status,
      periodMonth: bills.periodMonth,
      periodYear: bills.periodYear,
    })
    .from(bills)
    .innerJoin(households, eq(bills.householdId, households.id))
    .where(and(eq(bills.periodMonth, month), eq(bills.periodYear, year)))
    .orderBy(households.blockNumber)
    .all()

  const items = await db.select().from(billItems).all()

  const header = ['Nama KK', 'Blok', 'No WA', 'Status Hunian', 'Status Tagihan', 'Iuran Wajib', 'Iuran Keamanan', 'Denda Ronda', 'Total Tagihan', 'Total Dibayar', 'Sisa Tagihan']
  const rows: string[] = [header.map((h) => `"${h}"`).join(',')]

  for (const b of allBills) {
    const bItems = items.filter((i) => i.billId === b.id)
    const wajib = bItems.find((i) => i.itemType === 'IURAN_WAJIB')
    const keamanan = bItems.find((i) => i.itemType === 'IURAN_KEAMANAN')
    const denda = bItems.filter((i) => i.itemType === 'DENDA_RONDA')

    const wajibDue = wajib?.amountDue || 0
    const keamananDue = keamanan?.amountDue || 0
    const dendaDue = denda.reduce((s, i) => s + i.amountDue, 0)
    const totalDue = bItems.reduce((s, i) => s + i.amountDue, 0)
    const totalPaid = bItems.reduce((s, i) => s + i.amountPaid, 0)
    const totalRemaining = totalDue - totalPaid

    rows.push(
      [
        `"${b.headName.replace(/"/g, '""')}"`,
        `"${b.blockNumber}"`,
        `"${b.phoneWa}"`,
        `"${b.occupancyStatus}"`,
        `"${b.status}"`,
        wajibDue,
        keamananDue,
        dendaDue,
        totalDue,
        totalPaid,
        totalRemaining,
      ].join(',')
    )
  }

  return rows.join('\r\n')
}

export async function generateCashCSV(
  bookType: 'KAS_UMUM' | 'KAS_KEAMANAN',
  month?: number,
  year?: number
): Promise<string> {
  const book = await db
    .select()
    .from(cashBooks)
    .where(eq(cashBooks.bookType, bookType))
    .get()

  if (!book) {
    throw new Error(`Buku kas ${bookType} tidak ditemukan`)
  }

  const query = db
    .select({
      id: cashTransactions.id,
      transactionDate: cashTransactions.transactionDate,
      type: cashTransactions.transactionType,
      categoryName: cashCategories.name,
      description: cashTransactions.description,
      amount: cashTransactions.amount,
      status: cashTransactions.status,
    })
    .from(cashTransactions)
    .leftJoin(cashCategories, eq(cashTransactions.categoryId, cashCategories.id))
    .where(eq(cashTransactions.cashBookId, book.id))
    .orderBy(desc(cashTransactions.transactionDate))

  const txs = await query.all()

  const header = ['Tanggal', 'Jenis', 'Kategori', 'Keterangan', 'Nominal', 'Status']
  const rows: string[] = [header.map((h) => `"${h}"`).join(',')]

  for (const t of txs) {
    rows.push(
      [
        `"${t.transactionDate}"`,
        `"${t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}"`,
        `"${(t.categoryName || '-').replace(/"/g, '""')}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount,
        `"${t.status}"`,
      ].join(',')
    )
  }

  return rows.join('\r\n')
}

export async function generateBillsPDF(month: number, year: number): Promise<Uint8Array> {
  const allBills = await db
    .select({
      id: bills.id,
      headName: households.headName,
      blockNumber: households.blockNumber,
      status: bills.status,
    })
    .from(bills)
    .innerJoin(households, eq(bills.householdId, households.id))
    .where(and(eq(bills.periodMonth, month), eq(bills.periodYear, year)))
    .orderBy(households.blockNumber)
    .all()

  const items = await db.select().from(billItems).all()

  const headers = ['Blok', 'Nama Warga', 'Tagihan', 'Dibayar', 'Status']
  const rows: string[][] = []

  for (const b of allBills) {
    const bItems = items.filter((i) => i.billId === b.id)
    const totalDue = bItems.reduce((s, i) => s + i.amountDue, 0)
    const totalPaid = bItems.reduce((s, i) => s + i.amountPaid, 0)

    rows.push([
      b.blockNumber.padEnd(6, ' '),
      b.headName.padEnd(20, ' ').slice(0, 20),
      formatRupiah(totalDue).padStart(12, ' '),
      formatRupiah(totalPaid).padStart(12, ' '),
      b.status,
    ])
  }

  return createSimplePdf({
    title: `Laporan Tagihan Iuran Warga RT 04`,
    subtitle: `Periode: Bulan ${month} Tahun ${year} • SiWarga Komplek Melati`,
    headers,
    rows,
    footer: `Dokumen dicetak otomatis via SiWarga RT 04 pada ${new Date().toLocaleString('id-ID')}`,
  })
}

export async function generateCashPDF(
  bookType: 'KAS_UMUM' | 'KAS_KEAMANAN',
  month?: number,
  year?: number
): Promise<Uint8Array> {
  const book = await db
    .select()
    .from(cashBooks)
    .where(eq(cashBooks.bookType, bookType))
    .get()

  const txs = await db
    .select({
      transactionDate: cashTransactions.transactionDate,
      type: cashTransactions.transactionType,
      categoryName: cashCategories.name,
      description: cashTransactions.description,
      amount: cashTransactions.amount,
      status: cashTransactions.status,
    })
    .from(cashTransactions)
    .leftJoin(cashCategories, eq(cashTransactions.categoryId, cashCategories.id))
    .where(eq(cashTransactions.cashBookId, book!.id))
    .orderBy(desc(cashTransactions.transactionDate))
    .all()

  const headers = ['Tanggal', 'Jenis', 'Kategori', 'Keterangan', 'Nominal']
  const rows: string[][] = []

  for (const t of txs) {
    rows.push([
      t.transactionDate,
      t.type === 'INCOME' ? 'Masuk' : 'Keluar',
      (t.categoryName || '-').padEnd(14, ' ').slice(0, 14),
      t.description.padEnd(24, ' ').slice(0, 24),
      formatRupiah(t.amount).padStart(12, ' '),
    ])
  }

  return createSimplePdf({
    title: `Laporan Buku Kas: ${book?.name || bookType}`,
    subtitle: `Rekap Mutasi Transaksi Kas RT 04 Komplek Melati`,
    headers,
    rows,
    footer: `Dokumen resmi pembukuan kas SiWarga RT 04 • ${new Date().toLocaleString('id-ID')}`,
  })
}

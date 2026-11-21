import { db } from '@/db'
import { bills, billItems, households } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { formatRupiah } from '@/lib/utils'
import { createSimplePdf } from '@/lib/pdf'
import { listTransactions } from './cash.service'
import { getAppSettings } from './settings.service'
import ExcelJS from 'exceljs'

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

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

  const header = [
    'Nama KK',
    'Blok',
    'No WA',
    'Status Hunian',
    'Status Tagihan',
    'Iuran Wajib',
    'Iuran Keamanan',
    'Denda Ronda',
    'Total Tagihan',
    'Total Dibayar',
    'Sisa Tagihan',
  ]
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
  const result = await listTransactions({
    bookType,
    month,
    year,
  })

  const bookName = result.cashBook?.name || (bookType === 'KAS_UMUM' ? 'Kas Umum' : 'Kas Keamanan')
  const periodLabel = month && year ? `${MONTH_NAMES[month - 1]} ${year}` : 'Semua Periode'

  const lines: string[] = []
  lines.push(`"LAPORAN BUKU KAS: ${bookName.toUpperCase()}"`)
  lines.push(`"Periode: ${periodLabel}"`)
  lines.push(`"Saldo Awal: ${result.openingBalance}"`)
  lines.push(`"Total Pemasukan: ${result.periodIncome}"`)
  lines.push(`"Total Pengeluaran: ${result.periodExpense}"`)
  lines.push(`"Saldo Akhir: ${result.closingBalance}"`)
  lines.push('')

  const header = ['Tanggal', 'Jenis', 'Kategori', 'Keterangan', 'Nominal', 'Status']
  lines.push(header.map((h) => `"${h}"`).join(','))

  for (const t of result.transactions) {
    lines.push(
      [
        `"${t.transactionDate}"`,
        `"${t.transactionType === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}"`,
        `"${(t.categoryName || '-').replace(/"/g, '""')}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount,
        `"${t.status}"`,
      ].join(',')
    )
  }

  return lines.join('\r\n')
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

  let totalDueAll = 0
  let totalPaidAll = 0

  for (const b of allBills) {
    const bItems = items.filter((i) => i.billId === b.id)
    const totalDue = bItems.reduce((s, i) => s + i.amountDue, 0)
    const totalPaid = bItems.reduce((s, i) => s + i.amountPaid, 0)
    totalDueAll += totalDue
    totalPaidAll += totalPaid

    rows.push([
      b.blockNumber.padEnd(6, ' '),
      b.headName.padEnd(20, ' ').slice(0, 20),
      formatRupiah(totalDue).padStart(12, ' '),
      formatRupiah(totalPaid).padStart(12, ' '),
      b.status,
    ])
  }

  const settings = await getAppSettings()
  const appName = settings.app_name || 'siWarga Palmut'
  const communityName = settings.community_name || 'Kavling Palanji & Mutiara Indah'

  return createSimplePdf({
    title: `Laporan Tagihan Iuran Warga`,
    subtitle: `Periode: Bulan ${month} Tahun ${year} • ${appName} (${communityName})`,
    meta: [
      { label: 'Total Warga Ditagih', value: `${allBills.length} KK` },
      { label: 'Total Tagihan', value: formatRupiah(totalDueAll) },
      { label: 'Total Terbayar', value: formatRupiah(totalPaidAll) },
    ],
    headers,
    rows,
    footer: `Dokumen dicetak otomatis via ${appName} pada ${new Date().toLocaleString('id-ID')}`,
    signatures: [
      { title: `Mengetahui, Pengurus ${communityName}`, name: '( ................................... )' },
      { title: `Bendahara ${communityName}`, name: '( ................................... )' },
    ],
  })
}

export async function generateCashPDF(
  bookType: 'KAS_UMUM' | 'KAS_KEAMANAN',
  month?: number,
  year?: number
): Promise<Uint8Array> {
  const result = await listTransactions({
    bookType,
    month,
    year,
  })

  const bookName = result.cashBook?.name || (bookType === 'KAS_UMUM' ? 'Kas Umum' : 'Kas Keamanan')
  const periodLabel = month && year ? `${MONTH_NAMES[month - 1]} ${year}` : 'Semua Periode'

  const headers = ['Tanggal', 'Jenis', 'Kategori', 'Keterangan', 'Nominal', 'Status']
  const rows: string[][] = []

  for (const t of result.transactions) {
    const isVoided = t.status === 'VOIDED'
    const sign = t.transactionType === 'INCOME' ? '+' : '-'
    const nomStr = `${sign} ${formatRupiah(t.amount)}`

    rows.push([
      t.transactionDate,
      (t.transactionType === 'INCOME' ? 'Masuk' : 'Keluar').padEnd(6, ' '),
      (t.categoryName || '-').padEnd(14, ' ').slice(0, 14),
      (isVoided ? `[BATAL] ${t.description}` : t.description).padEnd(26, ' ').slice(0, 26),
      nomStr.padStart(14, ' '),
      t.status.padEnd(8, ' '),
    ])
  }

  const settings = await getAppSettings()
  const appName = settings.app_name || 'siWarga Palmut'
  const communityName = settings.community_name || 'Kavling Palanji & Mutiara Indah'

  return createSimplePdf({
    title: `BUKU KAS: ${bookName.toUpperCase()}`,
    subtitle: `Rekap Mutasi Transaksi ${communityName} • Periode: ${periodLabel}`,
    meta: [
      { label: 'Bank', value: result.cashBook?.bankName || 'Kas Tunai' },
      { label: 'No Rekening', value: result.cashBook?.accountNumber || '-' },
      { label: 'Total Transaksi', value: `${result.totalCount} entri` },
    ],
    kpi: [
      { label: 'Saldo Awal', value: formatRupiah(result.openingBalance) },
      { label: 'Pemasukan', value: formatRupiah(result.periodIncome), color: 'income' },
      { label: 'Pengeluaran', value: formatRupiah(result.periodExpense), color: 'expense' },
      { label: 'Saldo Akhir', value: formatRupiah(result.closingBalance) },
    ],
    headers,
    rows,
    footer: `Dokumen resmi pembukuan kas ${appName} • Dicetak: ${new Date().toLocaleString('id-ID')}`,
    signatures: [
      { title: `Mengetahui, Pengurus ${communityName}`, name: '( ................................... )' },
      { title: `Bendahara ${communityName}`, name: '( ................................... )' },
    ],
  })
}

export async function generateCashXLSX(
  bookType: 'KAS_UMUM' | 'KAS_KEAMANAN',
  month?: number,
  year?: number
): Promise<Uint8Array> {
  const result = await listTransactions({
    bookType,
    month,
    year,
  })

  const settings = await getAppSettings()
  const appName = settings.app_name || 'siWarga Palmut'
  const communityName = settings.community_name || 'Kavling Palanji & Mutiara Indah'

  const bookName = result.cashBook?.name || (bookType === 'KAS_UMUM' ? 'Kas Umum' : 'Kas Keamanan')
  const periodLabel = month && year ? `${MONTH_NAMES[month - 1]} ${year}` : 'Semua Periode'

  const workbook = new ExcelJS.Workbook()
  workbook.creator = appName
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet(bookType === 'KAS_UMUM' ? 'Kas Umum' : 'Kas Keamanan', {
    pageSetup: { paperSize: 9, orientation: 'landscape' }, // A4 Landscape
  })

  // 1. Header Kop
  worksheet.mergeCells('A1:H1')
  const titleCell = worksheet.getCell('A1')
  titleCell.value = `PEMBUKUAN KAS KEUANGAN ${communityName.toUpperCase()}`
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F766E' } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' }

  worksheet.mergeCells('A2:H2')
  const subCell = worksheet.getCell('A2')
  subCell.value = `${bookName} • ${communityName} • Periode: ${periodLabel} • Dicetak: ${new Date().toLocaleString('id-ID')}`
  subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF64748B' } }
  subCell.alignment = { vertical: 'middle', horizontal: 'left' }

  worksheet.addRow([]) // Row 3 blank

  // 2. KPI Summary Block (Row 4 & 5)
  worksheet.mergeCells('A4:B4')
  worksheet.mergeCells('C4:D4')
  worksheet.mergeCells('E4:F4')
  worksheet.mergeCells('G4:H4')

  worksheet.getCell('A4').value = 'SALDO AWAL PERIODE'
  worksheet.getCell('C4').value = 'TOTAL PEMASUKAN'
  worksheet.getCell('E4').value = 'TOTAL PENGELUARAN'
  worksheet.getCell('G4').value = 'SALDO AKHIR PERIODE'

  for (const col of ['A4', 'C4', 'E4', 'G4']) {
    const c = worksheet.getCell(col)
    c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF475569' } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }
    c.alignment = { horizontal: 'center', vertical: 'middle' }
  }

  worksheet.mergeCells('A5:B5')
  worksheet.mergeCells('C5:D5')
  worksheet.mergeCells('E5:F5')
  worksheet.mergeCells('G5:H5')

  worksheet.getCell('A5').value = result.openingBalance
  worksheet.getCell('C5').value = result.periodIncome
  worksheet.getCell('E5').value = result.periodExpense
  worksheet.getCell('G5').value = result.closingBalance

  worksheet.getCell('A5').font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0F172A' } }
  worksheet.getCell('C5').font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF15803D' } } // Green
  worksheet.getCell('E5').font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFBE123C' } } // Red
  worksheet.getCell('G5').font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0D9488' } } // Teal

  for (const col of ['A5', 'C5', 'E5', 'G5']) {
    const c = worksheet.getCell(col)
    c.numFmt = '"Rp "#,##0'
    c.alignment = { horizontal: 'center', vertical: 'middle' }
  }

  worksheet.addRow([]) // Row 6 blank

  // 3. Transactions Table Header (Row 7)
  const headers = [
    'No',
    'Tanggal',
    'Jenis',
    'Kategori',
    'Keterangan Transaksi',
    'Pemasukan (Rp)',
    'Pengeluaran (Rp)',
    'Status',
  ]
  const headerRow = worksheet.addRow(headers)
  headerRow.height = 24

  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0D9488' }, // Teal 600
    }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    }
  })

  // 4. Data Rows
  let rowNum = 1
  for (const tx of result.transactions) {
    const isIncome = tx.transactionType === 'INCOME'
    const isVoid = tx.status === 'VOIDED'

    const descText = isVoid
      ? `[DIBATALKAN: ${tx.voidReason || 'Void'}] ${tx.description}`
      : tx.description

    const dataRow = worksheet.addRow([
      rowNum++,
      tx.transactionDate,
      isIncome ? 'Pemasukan' : 'Pengeluaran',
      tx.categoryName || '-',
      descText,
      isIncome ? tx.amount : 0,
      !isIncome ? tx.amount : 0,
      tx.status,
    ])

    dataRow.height = 20

    dataRow.eachCell((cell, colNumber) => {
      cell.font = {
        name: 'Calibri',
        size: 9.5,
        strike: isVoid,
        color: isVoid ? { argb: 'FF94A3B8' } : undefined,
      }

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      }

      // Format Alignment
      if (colNumber === 1 || colNumber === 2 || colNumber === 3 || colNumber === 8) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      } else if (colNumber === 6 || colNumber === 7) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' }
        cell.numFmt = '"Rp "#,##0'
        if (!isVoid) {
          if (colNumber === 6 && isIncome) cell.font = { bold: true, color: { argb: 'FF15803D' } }
          if (colNumber === 7 && !isIncome) cell.font = { bold: true, color: { argb: 'FFBE123C' } }
        }
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' }
      }
    })
  }

  // 5. Total Row
  const totalRow = worksheet.addRow([
    '',
    '',
    '',
    '',
    'TOTAL TRANSAKSI PERIODE INI',
    result.periodIncome,
    result.periodExpense,
    '',
  ])
  totalRow.height = 22
  totalRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0D9488' } },
      bottom: { style: 'double', color: { argb: 'FF0D9488' } },
    }
    if (colNumber === 6 || colNumber === 7) {
      cell.numFmt = '"Rp "#,##0'
      cell.alignment = { horizontal: 'right', vertical: 'middle' }
    } else if (colNumber === 5) {
      cell.alignment = { horizontal: 'right', vertical: 'middle' }
    }
  })

  // 6. Signatures (Bottom)
  worksheet.addRow([])
  worksheet.addRow([])
  const sigTitleRow = worksheet.addRow([
    '',
    'Mengetahui,',
    '',
    '',
    '',
    'Petugas Bendahara,',
    '',
    '',
  ])
  sigTitleRow.font = { name: 'Calibri', size: 10, italic: true }

  worksheet.addRow([
    '',
    `Pengurus ${communityName}`,
    '',
    '',
    '',
    `Bendahara ${communityName}`,
    '',
    '',
  ])
  worksheet.addRow([])
  worksheet.addRow([])
  const sigNameRow = worksheet.addRow([
    '',
    '( .......................................... )',
    '',
    '',
    '',
    '( .......................................... )',
    '',
    '',
  ])
  sigNameRow.font = { name: 'Calibri', size: 10, bold: true }

  // Set explicit column widths
  worksheet.getColumn(1).width = 6 // No
  worksheet.getColumn(2).width = 14 // Tanggal
  worksheet.getColumn(3).width = 14 // Jenis
  worksheet.getColumn(4).width = 20 // Kategori
  worksheet.getColumn(5).width = 38 // Keterangan
  worksheet.getColumn(6).width = 18 // Pemasukan
  worksheet.getColumn(7).width = 18 // Pengeluaran
  worksheet.getColumn(8).width = 12 // Status

  const buffer = await workbook.xlsx.writeBuffer()
  return new Uint8Array(buffer as ArrayBuffer)
}

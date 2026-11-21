import { db } from '@/db'
import { bills, billItems, cashBooks, cashTransactions } from '@/db/schema'
import { eq, and, sql, gte, lte } from 'drizzle-orm'
import { getCashBooksSummary, listTransactions } from './cash.service'
import { formatRupiah } from '@/lib/utils'

export interface MonthChartItem {
  month: number
  year: number
  label: string
  kasUmumIncome: number
  kasUmumExpense: number
  kasKeamananIncome: number
  kasKeamananExpense: number
}

export interface DashboardData {
  periodMonth: number
  periodYear: number
  kasUmum: {
    id: string
    balance: number
    incomeThisMonth: number
    expenseThisMonth: number
  }
  kasKeamanan: {
    id: string
    balance: number
    incomeThisMonth: number
    expenseThisMonth: number
  }
  totalBalance: number
  paymentRatio: {
    paid: number
    total: number
    percentage: number
    totalArrearsAmount: number
    unpaidCount: number
  }
  monthlyChartData: MonthChartItem[]
  waReportText: string
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]

export async function getDashboardData(
  month: number,
  year: number
): Promise<DashboardData> {
  // 1. Dual cash summary
  const cashSummary = await getCashBooksSummary()

  // 2. Month transactions for each book
  const kasUmumTx = await listTransactions({
    bookType: 'KAS_UMUM',
    month,
    year,
  })

  const kasKeamananTx = await listTransactions({
    bookType: 'KAS_KEAMANAN',
    month,
    year,
  })

  // 3. Payment ratio for the current month
  const currentBills = await db
    .select({
      id: bills.id,
      status: bills.status,
    })
    .from(bills)
    .where(and(eq(bills.periodMonth, month), eq(bills.periodYear, year)))
    .all()

  const totalBills = currentBills.length
  const paidBills = currentBills.filter((b) => b.status === 'PAID').length
  const unpaidBills = currentBills.filter((b) => b.status !== 'PAID')

  let totalArrearsAmount = 0
  if (unpaidBills.length > 0) {
    const unpaidBillIds = unpaidBills.map((b) => b.id)
    const items = await db
      .select({
        billId: billItems.billId,
        amountDue: billItems.amountDue,
        amountPaid: billItems.amountPaid,
      })
      .from(billItems)
      .all()

    for (const item of items) {
      if (unpaidBillIds.includes(item.billId)) {
        totalArrearsAmount += item.amountDue - item.amountPaid
      }
    }
  }

  const percentage =
    totalBills > 0 ? Math.round((paidBills / totalBills) * 100) : 100

  // 4. Monthly chart data (last 6 months)
  const monthlyChartData: MonthChartItem[] = []
  for (let i = 5; i >= 0; i--) {
    let m = month - i
    let y = year
    while (m <= 0) {
      m += 12
      y -= 1
    }

    const mm = String(m).padStart(2, '0')
    const startStr = `${y}-${mm}-01`
    const lastDay = new Date(y, m, 0).getDate()
    const endStr = `${y}-${mm}-${String(lastDay).padStart(2, '0')}`

    const txs = await db
      .select({
        cashBookId: cashTransactions.cashBookId,
        type: cashTransactions.transactionType,
        total: sql<number>`coalesce(sum(${cashTransactions.amount}), 0)`,
      })
      .from(cashTransactions)
      .where(
        and(
          eq(cashTransactions.status, 'POSTED'),
          gte(cashTransactions.transactionDate, startStr),
          lte(cashTransactions.transactionDate, endStr)
        )
      )
      .groupBy(cashTransactions.cashBookId, cashTransactions.transactionType)
      .all()

    let kasUmumIncome = 0
    let kasUmumExpense = 0
    let kasKeamananIncome = 0
    let kasKeamananExpense = 0

    for (const row of txs) {
      if (row.cashBookId === cashSummary.kasUmum.id) {
        if (row.type === 'INCOME') kasUmumIncome = row.total
        else if (row.type === 'EXPENSE') kasUmumExpense = row.total
      } else if (row.cashBookId === cashSummary.kasKeamanan.id) {
        if (row.type === 'INCOME') kasKeamananIncome = row.total
        else if (row.type === 'EXPENSE') kasKeamananExpense = row.total
      }
    }

    monthlyChartData.push({
      month: m,
      year: y,
      label: MONTH_SHORT[m - 1],
      kasUmumIncome,
      kasUmumExpense,
      kasKeamananIncome,
      kasKeamananExpense,
    })
  }

  const totalBalance =
    cashSummary.kasUmum.balance + cashSummary.kasKeamanan.balance

  // 5. Generate formatted WA Report Text
  const periodLabel = `${MONTH_NAMES[month - 1]} ${year}`
  const waReportText = [
    `📢 *LAPORAN KAS & KEUANGAN RT 04*`,
    `📅 *Periode: ${periodLabel}*`,
    ``,
    `━━━━━━━━━━━━━━━━━━━`,
    `🏦 *1. KAS UMUM (Iuran Wajib & Ops)*`,
    `• Saldo Awal: ${formatRupiah(kasUmumTx.openingBalance)}`,
    `• Pemasukan: ${formatRupiah(kasUmumTx.periodIncome)}`,
    `• Pengeluaran: ${formatRupiah(kasUmumTx.periodExpense)}`,
    `👉 *Saldo Akhir Kas Umum: ${formatRupiah(cashSummary.kasUmum.balance)}*`,
    ``,
    `━━━━━━━━━━━━━━━━━━━`,
    `🛡️ *2. KAS KEAMANAN (Ronda & Satpam)*`,
    `• Saldo Awal: ${formatRupiah(kasKeamananTx.openingBalance)}`,
    `• Pemasukan: ${formatRupiah(kasKeamananTx.periodIncome)}`,
    `• Pengeluaran: ${formatRupiah(kasKeamananTx.periodExpense)}`,
    `👉 *Saldo Akhir Kas Keamanan: ${formatRupiah(cashSummary.kasKeamanan.balance)}*`,
    ``,
    `━━━━━━━━━━━━━━━━━━━`,
    `💰 *TOTAL KAS GABUNGAN RT: ${formatRupiah(totalBalance)}*`,
    `📊 Kepatuhan Bayar: ${paidBills}/${totalBills} KK (${percentage}%)`,
    `⚠️ Sisa Tunggakan: ${formatRupiah(totalArrearsAmount)}`,
    ``,
    `_Laporan resmi dibuat otomatis via siWarga Palmut (Kavling Palanji & Mutiara Indah)._ 🙏`,
  ].join('\n')

  return {
    periodMonth: month,
    periodYear: year,
    kasUmum: {
      id: cashSummary.kasUmum.id,
      balance: cashSummary.kasUmum.balance,
      incomeThisMonth: kasUmumTx.periodIncome,
      expenseThisMonth: kasUmumTx.periodExpense,
    },
    kasKeamanan: {
      id: cashSummary.kasKeamanan.id,
      balance: cashSummary.kasKeamanan.balance,
      incomeThisMonth: kasKeamananTx.periodIncome,
      expenseThisMonth: kasKeamananTx.periodExpense,
    },
    totalBalance,
    paymentRatio: {
      paid: paidBills,
      total: totalBills,
      percentage,
      totalArrearsAmount,
      unpaidCount: unpaidBills.length,
    },
    monthlyChartData,
    waReportText,
  }
}

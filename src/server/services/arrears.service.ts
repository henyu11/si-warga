import { db } from '@/db'
import { bills, billItems, households, appSettings } from '@/db/schema'
import { eq, and, inArray, desc } from 'drizzle-orm'
import { formatRupiah } from '@/lib/utils'
import { getAppSettings } from './settings.service'

export interface ArrearItem {
  billId: string
  householdId: string
  headName: string
  blockNumber: string
  phoneWa: string
  occupancyStatus: string
  periodYear: number
  periodMonth: number
  billStatus: string
  wajibDue: number
  keamananDue: number
  dendaDue: number
  totalDue: number
  totalPaid: number
  totalRemaining: number
  waMessageText: string
  waLink: string
}

export function formatWaBillingMessage({
  template,
  headName,
  blockNumber,
  periodStr,
  wajibAmount,
  keamananAmount,
  dendaAmount,
  totalRemaining,
  rekeningInfo,
}: {
  template: string
  headName: string
  blockNumber: string
  periodStr: string
  wajibAmount: number
  keamananAmount: number
  dendaAmount: number
  totalRemaining: number
  rekeningInfo: string
}): string {
  let text = template
  text = text.replace(/{nama}/g, headName)
  text = text.replace(/{blok}/g, blockNumber)
  text = text.replace(/{bulan_tahun}/g, periodStr)
  text = text.replace(/{iuran_wajib}/g, formatRupiah(wajibAmount))
  text = text.replace(/{iuran_keamanan}/g, formatRupiah(keamananAmount))
  text = text.replace(/{denda}/g, formatRupiah(dendaAmount))
  text = text.replace(/{total}/g, formatRupiah(totalRemaining))
  text = text.replace(/{rekening}/g, rekeningInfo)
  return text
}

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export async function listArrears(filters: {
  year?: number
  month?: number
  mode?: 'period' | 'accumulated'
  search?: string
}): Promise<ArrearItem[]> {
  const conditions = [inArray(bills.status, ['UNPAID', 'PARTIAL'])]

  if (filters.mode !== 'accumulated') {
    if (filters.year) conditions.push(eq(bills.periodYear, filters.year))
    if (filters.month) conditions.push(eq(bills.periodMonth, filters.month))
  }

  const rawBills = await db
    .select({
      id: bills.id,
      householdId: bills.householdId,
      periodYear: bills.periodYear,
      periodMonth: bills.periodMonth,
      status: bills.status,
      headName: households.headName,
      blockNumber: households.blockNumber,
      phoneWa: households.phoneWa,
      occupancyStatus: households.occupancyStatus,
    })
    .from(bills)
    .innerJoin(households, eq(bills.householdId, households.id))
    .where(and(...conditions))
    .orderBy(desc(bills.periodYear), desc(bills.periodMonth), households.blockNumber)
    .all()

  let filtered = rawBills
  if (filters.search) {
    const q = filters.search.toLowerCase()
    filtered = rawBills.filter(
      (b) =>
        b.headName.toLowerCase().includes(q) ||
        b.blockNumber.toLowerCase().includes(q) ||
        b.phoneWa.includes(q)
    )
  }

  if (filtered.length === 0) return []

  const billIds = filtered.map((b) => b.id)
  const items = await db
    .select()
    .from(billItems)
    .where(inArray(billItems.billId, billIds))
    .all()

  const itemsByBill: Record<string, typeof items> = {}
  for (const it of items) {
    if (!itemsByBill[it.billId]) itemsByBill[it.billId] = []
    itemsByBill[it.billId].push(it)
  }

  // Get settings template & accounts
  const settings = await getAppSettings()
  const template =
    settings.wa_billing_template ||
    'Yth. Bpk/Ibu *{nama}* (Blok {blok}),\nBerikut tagihan iuran RT {bulan_tahun}:\n- Iuran Wajib: {iuran_wajib}\n- Iuran Keamanan: {iuran_keamanan}\n- Denda Ronda: {denda}\n*Total Tagihan: {total}*\nRekening: {rekening}\nTerima kasih.'

  const rekeningInfo = [
    settings.rekening_kas_umum ? `Kas Umum: ${settings.rekening_kas_umum}` : '',
    settings.rekening_kas_keamanan ? `Kas Keamanan: ${settings.rekening_kas_keamanan}` : '',
  ]
    .filter(Boolean)
    .join(' | ') || 'Rekening Bendahara'

  return filtered.map((b) => {
    const billItemsList = itemsByBill[b.id] || []
    let wajibDue = 0
    let keamananDue = 0
    let dendaDue = 0
    let totalDue = 0
    let totalPaid = 0

    for (const it of billItemsList) {
      totalDue += it.amountDue
      totalPaid += it.amountPaid
      const remaining = it.amountDue - it.amountPaid
      if (it.itemType === 'IURAN_WAJIB') wajibDue += remaining
      else if (it.itemType === 'IURAN_KEAMANAN') keamananDue += remaining
      else if (it.itemType === 'DENDA_RONDA') dendaDue += remaining
    }

    const totalRemaining = Math.max(0, totalDue - totalPaid)
    const periodStr = `${monthNames[b.periodMonth - 1] || b.periodMonth} ${b.periodYear}`

    const waMessageText = formatWaBillingMessage({
      template,
      headName: b.headName,
      blockNumber: b.blockNumber,
      periodStr,
      wajibAmount: wajibDue,
      keamananAmount: keamananDue,
      dendaAmount: dendaDue,
      totalRemaining,
      rekeningInfo,
    })

    const waLink = `https://wa.me/${b.phoneWa}?text=${encodeURIComponent(
      waMessageText
    )}`

    return {
      billId: b.id,
      householdId: b.householdId,
      headName: b.headName,
      blockNumber: b.blockNumber,
      phoneWa: b.phoneWa,
      occupancyStatus: b.occupancyStatus,
      periodYear: b.periodYear,
      periodMonth: b.periodMonth,
      billStatus: b.status,
      wajibDue,
      keamananDue,
      dendaDue,
      totalDue,
      totalPaid,
      totalRemaining,
      waMessageText,
      waLink,
    }
  })
}

export function buildRekapTunggakanText(arrears: ArrearItem[], periodLabel: string, communityName?: string): string {
  const totalTunggakan = arrears.reduce((sum, a) => sum + a.totalRemaining, 0)
  const headerTitle = communityName ? `REKAP TUNGGAKAN IURAN ${communityName.toUpperCase()}` : 'REKAP TUNGGAKAN IURAN'

  let text = `*${headerTitle} — ${periodLabel.toUpperCase()}*\n`
  text += `Total Warga Belum Lunas: *${arrears.length} KK*\n`
  text += `Total Tunggakan: *${formatRupiah(totalTunggakan)}*\n\n`
  text += `*Daftar Rincian:*\n`

  arrears.forEach((a, idx) => {
    text += `${idx + 1}. *${a.headName}* (${a.blockNumber}) — ${formatRupiah(a.totalRemaining)}\n`
  })

  text += `\nMohon bagi warga yang belum melunasi dapat segera melakukan pembayaran ke rekening Kas atau tunai ke Bendahara.\nTerima kasih atas kerjasamanya.\n— _Pengurus ${communityName || 'Lingkungan'}_`
  return text
}

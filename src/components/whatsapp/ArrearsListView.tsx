'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  MessageSquare,
  Search,
  Users,
  Send,
  Eye,
  AlertCircle,
  Phone,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
} from 'lucide-react'
import { CopyWAButton } from './CopyWAButton'
import { formatRupiah } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

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

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export function ArrearsListView() {
  const currentDate = new Date()
  const [mode, setMode] = useState<'period' | 'accumulated'>('period')
  const [year, setYear] = useState<number>(currentDate.getFullYear())
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1)
  const [search, setSearch] = useState('')
  const [hideNominal, setHideNominal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [arrears, setArrears] = useState<ArrearItem[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [rekapText, setRekapText] = useState('')
  const [previewItem, setPreviewItem] = useState<ArrearItem | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const fetchArrears = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('mode', mode)
      if (mode === 'period') {
        params.set('year', year.toString())
        params.set('month', month.toString())
      }
      if (search) {
        params.set('search', search)
      }

      const res = await fetch(`/api/v1/arrears?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setArrears(json.data.arrears || [])
        setTotalAmount(json.data.totalAmount || 0)
        setRekapText(json.data.rekapText || '')
      }
    } catch (err) {
      console.error('Error fetching arrears:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArrears()
  }, [mode, year, month, search])

  // Generate rekap text respecting hideNominal toggle
  const customRekapText = useMemo(() => {
    const periodLabel =
      mode === 'accumulated'
        ? 'Semua Akumulasi Tunggakan'
        : `Periode ${MONTHS[month - 1]} ${year}`

    if (!hideNominal) {
      return rekapText
    }

    // Hide nominal variant: only name & block
    const lines = [
      `📢 *PENGUMUMAN REKAP IURAN RT 04*`,
      `📅 *${periodLabel}*`,
      ``,
      `Yth. Bapak/Ibu Warga RT 04, berikut daftar warga yang belum menyelesaikan konfirmasi iuran:`,
      ``,
    ]

    arrears.forEach((item, idx) => {
      lines.push(`${idx + 1}. ${item.headName} (${item.blockNumber})`)
    })

    lines.push(``)
    lines.push(
      `Mohon kesediaannya untuk melakukan transfer via rekening kas RT. Bagi yang sudah transfer, silakan kirim bukti ke pengurus. Terima kasih! 🙏`
    )
    return lines.join('\n')
  }, [arrears, rekapText, hideNominal, mode, month, year])

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Header and Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Penagihan WhatsApp
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              F-006
            </span>
          </h1>
          <p className="text-sm text-slate-500">
            Daftar warga dengan tagihan belum lunas (UNPAID/PARTIAL) beserta template pesan tagihan
          </p>
        </div>

        {/* Period Selector if in Period Mode */}
        {mode === 'period' && (
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="h-9 px-3 text-xs sm:text-sm font-medium bg-white border border-slate-200 rounded-lg text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-9 px-3 text-xs sm:text-sm font-medium bg-white border border-slate-200 rounded-lg text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Segmented Control Tabs */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl max-w-md">
        <button
          type="button"
          onClick={() => setMode('period')}
          className={`py-2 text-center rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            mode === 'period'
              ? 'bg-white text-slate-900 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-teal-600" />
          <span>{MONTHS[month - 1]} {year}</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('accumulated')}
          className={`py-2 text-center rounded-lg text-xs sm:text-sm font-medium transition-all ${
            mode === 'accumulated'
              ? 'bg-white text-slate-900 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Semua Tunggakan
        </button>
      </div>

      {/* Summary Alert Banner */}
      <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <div className="text-base font-bold text-rose-800 leading-tight">
              {arrears.length} KK Belum Lunas
            </div>
            <div className="text-xs text-rose-600 mt-0.5">
              Total Tunggakan: <span className="font-bold tabular-nums">{formatRupiah(totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold">
            {arrears.filter((a) => a.billStatus === 'UNPAID').length} Baru
          </span>
          <span className="text-rose-300">•</span>
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
            {arrears.filter((a) => a.billStatus === 'PARTIAL').length} Cicil
          </span>
        </div>
      </div>

      {/* Group Broadcast Card (Rekap Grup WA) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Rekap Daftar Grup WA
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Format sopan untuk diteruskan ke grup chat warga RT
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Toggle Switch */}
        <div className="flex items-center justify-between py-2.5 px-3.5 bg-slate-50 border border-slate-100 rounded-lg">
          <div className="pr-2">
            <div className="text-xs sm:text-sm font-medium text-slate-800 leading-tight">
              Sembunyikan nominal per KK
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Hanya cantumkan nama & nomor rumah warga demi privasi
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={hideNominal}
            onClick={() => setHideNominal(!hideNominal)}
            className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none shrink-0 ${
              hideNominal ? 'bg-teal-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`block w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${
                hideNominal ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Copy Broadcast Button */}
        <CopyWAButton
          text={customRekapText}
          label="Copy Rekap Pesan Grup WA"
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow-sm"
          onCopied={() => showToast('Format rekap grup WA berhasil disalin!')}
        />
      </div>

      {/* Search and List Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-900">
            Daftar Tagihan Per Warga
          </h3>
          <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs flex items-center justify-center font-bold">
            {arrears.length}
          </span>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama atau blok..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-sm"
          />
        </div>
      </div>

      {/* Residents Arrears Cards Stack */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          Memuat data tunggakan...
        </div>
      ) : arrears.length === 0 ? (
        <div className="py-12 text-center bg-white border border-slate-200 rounded-xl p-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          <div className="text-base font-semibold text-slate-800">
            Semua Iuran Lunas!
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tidak ada data tunggakan untuk kriteria pencarian ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {arrears.map((item) => (
            <div
              key={item.billId}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors"
            >
              {/* Header card: Name, Block, Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-bold text-slate-900 truncate">
                      {item.headName}
                    </h4>
                    <span className="text-xs px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                      Blok {item.blockNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{item.phoneWa}</span>
                    <span className="text-slate-300">•</span>
                    <span>
                      {MONTHS[item.periodMonth - 1]} {item.periodYear}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                    item.billStatus === 'PARTIAL'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {item.billStatus === 'PARTIAL' ? 'Sebagian' : 'Belum Bayar'}
                </span>
              </div>

              {/* Financial breakdown strip */}
              <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1.5 border border-slate-100">
                <div className="text-slate-600 flex flex-wrap gap-x-2.5 gap-y-1">
                  <span>
                    Wajib:{' '}
                    <b className="tabular-nums font-semibold text-slate-800">
                      {formatRupiah(item.wajibDue)}
                    </b>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>
                    Keamanan:{' '}
                    <b className="tabular-nums font-semibold text-slate-800">
                      {formatRupiah(item.keamananDue)}
                    </b>
                  </span>
                  {item.dendaDue > 0 && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-rose-600 font-medium">
                        Denda:{' '}
                        <b className="tabular-nums font-semibold">
                          {formatRupiah(item.dendaDue)}
                        </b>
                      </span>
                    </>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                    Total Tunggakan
                  </span>
                  <span className="text-sm font-bold text-rose-600 tabular-nums">
                    {formatRupiah(item.totalRemaining)}
                  </span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-2 pt-1">
                {/* Salin Teks Button */}
                <CopyWAButton
                  text={item.waMessageText}
                  label="Salin Teks"
                  className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg shadow-sm"
                  onCopied={() =>
                    showToast(`Teks tagihan ${item.headName} disalin!`)
                  }
                />

                {/* Kirim WA via wa.me link */}
                <a
                  href={item.waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim WA</span>
                </a>

                {/* Preview Button */}
                <button
                  type="button"
                  onClick={() => setPreviewItem(item)}
                  className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center shrink-0 active:scale-95 transition-all"
                  title="Lihat Pratinjau Teks WA"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog Preview WA Chat */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Pratinjau Pesan WhatsApp
            </DialogTitle>
          </DialogHeader>

          {previewItem && (
            <div className="space-y-3 py-2">
              <div className="text-xs text-slate-500">
                Penerima: <b className="text-slate-800">{previewItem.headName}</b> (Blok {previewItem.blockNumber}) • {previewItem.phoneWa}
              </div>

              {/* Chat bubble WhatsApp preview */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/60 text-slate-800 text-xs sm:text-sm font-sans whitespace-pre-wrap leading-relaxed shadow-sm">
                {previewItem.waMessageText}
              </div>
            </div>
          )}

          <DialogFooter className="flex sm:justify-between items-center gap-2">
            {previewItem && (
              <>
                <CopyWAButton
                  text={previewItem.waMessageText}
                  label="Salin Teks"
                  className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                  onCopied={() => showToast('Teks pesan WA disalin!')}
                />
                <a
                  href={previewItem.waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Sekarang</span>
                </a>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

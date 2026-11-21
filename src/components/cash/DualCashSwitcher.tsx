'use client'

import React, { useState, useEffect } from 'react'
import {
  Wallet,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Search,
  Plus,
  Eye,
  Lock,
  RotateCcw,
  AlertCircle,
  FileText,
  ChevronRight,
  Download,
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { CashTxModal } from './CashTxModal'
import { ReceiptViewerModal } from './ReceiptViewerModal'
import { ExportDropdown } from './ExportDropdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export function DualCashSwitcher() {
  const currentDate = new Date()
  const [activeBookType, setActiveBookType] = useState<'KAS_UMUM' | 'KAS_KEAMANAN'>('KAS_UMUM')
  const [year, setYear] = useState<number>(currentDate.getFullYear())
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1)
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL')
  const [search, setSearch] = useState('')

  const [summary, setSummary] = useState<any>(null)
  const [txData, setTxData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false)
  const [viewReceiptKey, setViewReceiptKey] = useState<string | null>(null)
  const [voidingTx, setVoidingTx] = useState<any | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const [voidLoading, setVoidLoading] = useState(false)
  const [voidError, setVoidError] = useState<string | null>(null)

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/v1/cash-books')
      const json = await res.json()
      if (json.success) {
        setSummary(json.data)
      }
    } catch (err) {
      console.error('Error fetching cash books summary:', err)
    }
  }

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('book_type', activeBookType)
      params.set('year', year.toString())
      params.set('month', month.toString())
      if (typeFilter !== 'ALL') {
        params.set('transaction_type', typeFilter)
      }

      const res = await fetch(`/api/v1/cash-transactions?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setTxData(json.data)
      }
    } catch (err) {
      console.error('Error fetching transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [activeBookType, year, month, typeFilter])

  const handleVoidSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!voidingTx) return
    if (!voidReason || voidReason.trim().length < 3) {
      setVoidError('Alasan pembatalan minimal 3 karakter')
      return
    }

    setVoidLoading(true)
    setVoidError(null)

    try {
      const res = await fetch(`/api/v1/cash-transactions/${voidingTx.id}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: voidReason.trim() }),
      })
      const json = await res.json()
      if (!json.success) {
        throw new Error(json.message || 'Gagal membatalkan transaksi')
      }

      setVoidingTx(null)
      setVoidReason('')
      fetchSummary()
      fetchTransactions()
    } catch (err: any) {
      setVoidError(err.message || 'Gagal membatalkan transaksi')
    } finally {
      setVoidLoading(false)
    }
  }

  const filteredTransactions = (txData?.transactions || []).filter((tx: any) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      tx.description?.toLowerCase().includes(q) ||
      tx.categoryName?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="w-full max-w-full space-y-4 sm:space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Buku Kas RT/RW
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-100 text-teal-800">
              F-007
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pencatatan dual-ledger terpisah antara Kas Umum & Kas Keamanan Komplek Melati
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {/* Period Dropdowns */}
          <div className="flex items-center justify-between sm:justify-start gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-xs text-xs">
            <div className="flex items-center gap-1.5 text-teal-700">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-medium text-slate-500 sm:hidden">Periode:</span>
            </div>
            <div className="flex items-center gap-1">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
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
                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ExportDropdown
            bookType={activeBookType}
            month={month}
            year={year}
          />

          <Button
            onClick={() => setIsTxModalOpen(true)}
            className="h-9 px-3.5 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white shadow-xs flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Catat Transaksi Kas</span>
          </Button>
        </div>
      </div>

      {/* Dual Ledger Cards Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Tab 1: Kas Umum */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveBookType('KAS_UMUM')}
          className={`p-3.5 sm:p-5 rounded-xl border transition-all cursor-pointer relative shadow-xs ${
            activeBookType === 'KAS_UMUM'
              ? 'border-2 border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-600'
              : 'border-slate-200 bg-white hover:border-emerald-300'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center shrink-0 ${
                  activeBookType === 'KAS_UMUM'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm sm:text-base font-bold text-slate-900">Kas Umum</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] sm:text-[11px] font-medium">
                    Ledger 01
                  </span>
                  {activeBookType === 'KAS_UMUM' && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Aktif
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
                  Iuran Wajib Warga, Sumbangan, & Operasional RT
                </p>
              </div>
            </div>
            <ChevronRight
              className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform ${
                activeBookType === 'KAS_UMUM'
                  ? 'text-emerald-700 translate-x-1'
                  : 'text-slate-300'
              }`}
            />
          </div>

          <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
              Posisi Saldo Real-time
            </span>
            <div className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-100/70 text-emerald-900 font-bold text-xs sm:text-sm tabular-nums shrink-0">
              {formatRupiah(summary?.kasUmum?.balance || 0)}
            </div>
          </div>
        </div>

        {/* Tab 2: Kas Keamanan */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveBookType('KAS_KEAMANAN')}
          className={`p-3.5 sm:p-5 rounded-xl border transition-all cursor-pointer relative shadow-xs ${
            activeBookType === 'KAS_KEAMANAN'
              ? 'border-2 border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600'
              : 'border-slate-200 bg-white hover:border-blue-300'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center shrink-0 ${
                  activeBookType === 'KAS_KEAMANAN'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm sm:text-base font-bold text-slate-900">
                    Kas Keamanan
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] sm:text-[11px] font-medium">
                    Ledger 02
                  </span>
                  {activeBookType === 'KAS_KEAMANAN' && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                      Aktif
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
                  Iuran Keamanan Warga, Denda Ronda, & Honor Satpam
                </p>
              </div>
            </div>
            <ChevronRight
              className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform ${
                activeBookType === 'KAS_KEAMANAN'
                  ? 'text-blue-700 translate-x-1'
                  : 'text-slate-300'
              }`}
            />
          </div>

          <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
              Posisi Saldo Real-time
            </span>
            <div className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-blue-100/70 text-blue-900 font-bold text-xs sm:text-sm tabular-nums shrink-0">
              {formatRupiah(summary?.kasKeamanan?.balance || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* 1. Saldo Awal */}
        <div className="p-3 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between min-w-0">
          <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
            Saldo Awal
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 tabular-nums my-0.5 sm:my-1 truncate">
            {formatRupiah(txData?.openingBalance || 0)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">
            01 {MONTHS[month - 1]} {year}
          </div>
        </div>

        {/* 2. Pemasukan Periode */}
        <div className="p-3 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between min-w-0">
          <div className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1 truncate">
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Pemasukan</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-emerald-700 tabular-nums my-0.5 sm:my-1 truncate">
            {formatRupiah(txData?.periodIncome || 0)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">Total kas masuk</div>
        </div>

        {/* 3. Pengeluaran Periode */}
        <div className="p-3 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between min-w-0">
          <div className="text-[10px] sm:text-[11px] font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-1 truncate">
            <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Pengeluaran</span>
          </div>
          <div className="text-base sm:text-lg font-bold text-rose-700 tabular-nums my-0.5 sm:my-1 truncate">
            {formatRupiah(txData?.periodExpense || 0)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">Total kas keluar</div>
        </div>

        {/* 4. Saldo Akhir */}
        <div className="p-3 sm:p-4 rounded-xl bg-slate-900 text-white shadow-xs flex flex-col justify-between min-w-0">
          <div className="text-[10px] sm:text-[11px] font-semibold text-slate-300 uppercase tracking-wider truncate">
            Saldo Akhir
          </div>
          <div className="text-base sm:text-lg font-bold text-emerald-400 tabular-nums my-0.5 sm:my-1 truncate">
            {formatRupiah(txData?.closingBalance || 0)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">
            Posisi kas terhitung
          </div>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden w-full max-w-full">
        {/* Table Controls */}
        <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                typeFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('INCOME')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                typeFilter === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('EXPENSE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                typeFilter === 'EXPENSE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Pengeluaran
            </button>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>
        </div>

        {/* Mobile View: Transaction Cards (< md) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Memuat data transaksi...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 px-4">
              Belum ada transaksi pada periode ini.
            </div>
          ) : (
            filteredTransactions.map((tx: any) => {
              const isVoided = tx.status === 'VOIDED'
              const isExpense = tx.transactionType === 'EXPENSE'

              return (
                <div
                  key={tx.id}
                  className={`p-3.5 space-y-2.5 ${
                    isVoided ? 'opacity-50 bg-slate-50/50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-500 text-[11px]">
                      {tx.transactionDate}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                        {tx.categoryName || 'Lain-lain'}
                      </span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                          isVoided
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-medium leading-snug break-words ${
                          isVoided ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {tx.description}
                      </p>
                      {tx.isLocked === 1 && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 mt-1 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Lock className="w-2.5 h-2.5" />
                          Auto Routing
                        </span>
                      )}
                      {isVoided && tx.voidReason && (
                        <p className="text-[10px] text-rose-600 italic mt-0.5">
                          Dibatalkan: {tx.voidReason}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`font-bold tabular-nums text-sm ${
                          isVoided
                            ? 'line-through text-slate-400'
                            : isExpense
                            ? 'text-rose-600'
                            : 'text-emerald-700'
                        }`}
                      >
                        {isExpense ? '- ' : '+ '}
                        {formatRupiah(tx.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      {tx.receiptFileKey ? (
                        <button
                          type="button"
                          onClick={() => setViewReceiptKey(tx.receiptFileKey)}
                          className="inline-flex items-center gap-1 text-[11px] text-teal-700 font-medium hover:underline"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Nota</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Tanpa Nota</span>
                      )}
                    </div>

                    <div>
                      {tx.isLocked === 1 ? (
                        <span className="text-[10px] text-slate-400 italic">
                          Terkunci (Auto)
                        </span>
                      ) : !isVoided ? (
                        <button
                          type="button"
                          onClick={() => setVoidingTx(tx)}
                          className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold"
                        >
                          Batalkan
                        </button>
                      ) : (
                        <span className="text-slate-300 text-[10px]">Dibatalkan</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Desktop View: Transactions Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Nota</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Memuat data transaksi...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada transaksi pada periode ini.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx: any) => {
                  const isVoided = tx.status === 'VOIDED'
                  const isExpense = tx.transactionType === 'EXPENSE'

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isVoided ? 'opacity-50 bg-slate-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {tx.transactionDate}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {tx.categoryName || 'Lain-lain'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`font-medium ${
                              isVoided ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {tx.description}
                          </span>
                          {tx.isLocked === 1 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Lock className="w-2.5 h-2.5" />
                              Auto Routing
                            </span>
                          )}
                          {isVoided && tx.voidReason && (
                            <span className="text-[10px] text-rose-600 italic">
                              (Dibatalkan: {tx.voidReason})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-semibold tabular-nums text-xs sm:text-sm ${
                            isVoided
                              ? 'line-through text-slate-400'
                              : isExpense
                              ? 'text-rose-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {isExpense ? '- ' : '+ '}
                          {formatRupiah(tx.amount)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isVoided
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {tx.receiptFileKey ? (
                          <button
                            type="button"
                            onClick={() => setViewReceiptKey(tx.receiptFileKey)}
                            className="p-1 rounded text-teal-700 hover:bg-teal-50 transition-colors"
                            title="Lihat Nota"
                          >
                            <Eye className="w-4 h-4 mx-auto" />
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {tx.isLocked === 1 ? (
                          <span
                            className="text-[11px] text-slate-400 cursor-not-allowed"
                            title="Transaksi otomatis dari pembayaran tidak dapat dibatalkan di sini"
                          >
                            Terkunci
                          </span>
                        ) : !isVoided ? (
                          <button
                            type="button"
                            onClick={() => setVoidingTx(tx)}
                            className="text-xs text-rose-600 hover:text-rose-800 hover:underline font-semibold"
                          >
                            Batalkan
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[11px]">Batal</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cash Tx Modal */}
      <CashTxModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSuccess={() => {
          fetchSummary()
          fetchTransactions()
        }}
        defaultBookType={activeBookType}
        books={{
          kasUmum: summary?.kasUmum,
          kasKeamanan: summary?.kasKeamanan,
        }}
      />

      {/* Receipt Viewer Modal */}
      <ReceiptViewerModal
        isOpen={!!viewReceiptKey}
        onClose={() => setViewReceiptKey(null)}
        fileKey={viewReceiptKey}
      />

      {/* Void Confirmation Dialog */}
      <Dialog open={!!voidingTx} onOpenChange={(open) => !open && setVoidingTx(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-rose-600">
              <AlertCircle className="w-5 h-5" />
              Batalkan Transaksi Kas
            </DialogTitle>
          </DialogHeader>

          {voidingTx && (
            <form onSubmit={handleVoidSubmit} className="space-y-4 pt-1">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                Apakah Anda yakin ingin membatalkan transaksi:{' '}
                <b>{voidingTx.description}</b> senilai{' '}
                <b>{formatRupiah(voidingTx.amount)}</b>? Saldo buku kas akan
                otomatis terkoreksi.
              </div>

              {voidError && (
                <div className="p-2 text-xs bg-rose-100 text-rose-700 rounded">
                  {voidError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Alasan Pembatalan *
                </Label>
                <Input
                  type="text"
                  placeholder="Contoh: Salah input nominal / nota dibatalkan"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="text-xs"
                  required
                  minLength={3}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVoidingTx(null)}
                  disabled={voidLoading}
                  className="h-9 px-4 text-xs font-semibold"
                >
                  Tutup
                </Button>
                <Button
                  type="submit"
                  disabled={voidLoading}
                  className="h-9 px-4 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {voidLoading ? 'Membatalkan...' : 'Konfirmasi Batalkan'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

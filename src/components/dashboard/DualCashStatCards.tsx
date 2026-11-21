import React from 'react'
import { Wallet, ShieldCheck, Layers, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'

interface DualCashStatCardsProps {
  kasUmum: {
    balance: number
    incomeThisMonth: number
    expenseThisMonth: number
  }
  kasKeamanan: {
    balance: number
    incomeThisMonth: number
    expenseThisMonth: number
  }
  totalBalance: number
  periodLabel: string
}

export function DualCashStatCards({
  kasUmum,
  kasKeamanan,
  totalBalance,
  periodLabel,
}: DualCashStatCardsProps) {
  return (
    <section aria-label="Buku Kas Ganda RT" className="flex flex-col gap-3.5 w-full">
      {/* 2 Ledger Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Card 1: Kas Umum */}
        <article className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative hover:border-emerald-300 transition-colors">
          {/* Structural top accent bar for Kas Umum */}
          <div className="h-1.5 w-full bg-emerald-600" />

          {/* Ledger Header */}
          <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide truncate">
                Kas Umum (Iuran Wajib & Ops)
              </span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
              {periodLabel}
            </span>
          </div>

          {/* Ledger Body */}
          <div className="p-4 flex flex-col justify-between flex-1">
            <div>
              <span className="text-xs text-slate-500 font-medium">
                Saldo Berjalan Saat Ini
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5 mb-3 tabular-nums">
                {formatRupiah(kasUmum.balance)}
              </div>
            </div>

            {/* 2-Column Mini Breakdown */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <div className="bg-slate-50 p-2.5 rounded-lg flex flex-col justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                  <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                  Masuk Bln Ini
                </span>
                <span className="text-xs sm:text-sm font-bold text-emerald-700 tabular-nums mt-1">
                  +{formatRupiah(kasUmum.incomeThisMonth)}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg flex flex-col justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                  <ArrowDownLeft className="w-3 h-3 text-rose-600" />
                  Keluar Bln Ini
                </span>
                <span className="text-xs sm:text-sm font-bold text-rose-600 tabular-nums mt-1">
                  -{formatRupiah(kasUmum.expenseThisMonth)}
                </span>
              </div>
            </div>
          </div>
        </article>

        {/* Card 2: Kas Keamanan */}
        <article className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative hover:border-blue-300 transition-colors">
          {/* Structural top accent bar for Kas Keamanan */}
          <div className="h-1.5 w-full bg-blue-600" />

          {/* Ledger Header */}
          <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wide truncate">
                Kas Keamanan (Ronda & Satpam)
              </span>
            </div>
            <span className="text-[10px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full shrink-0">
              Pos Ronda
            </span>
          </div>

          {/* Ledger Body */}
          <div className="p-4 flex flex-col justify-between flex-1">
            <div>
              <span className="text-xs text-slate-500 font-medium">
                Saldo Berjalan Saat Ini
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5 mb-3 tabular-nums">
                {formatRupiah(kasKeamanan.balance)}
              </div>
            </div>

            {/* 2-Column Mini Breakdown */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <div className="bg-slate-50 p-2.5 rounded-lg flex flex-col justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                  <ArrowUpRight className="w-3 h-3 text-blue-600" />
                  Iuran & Denda
                </span>
                <span className="text-xs sm:text-sm font-bold text-blue-700 tabular-nums mt-1">
                  +{formatRupiah(kasKeamanan.incomeThisMonth)}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg flex flex-col justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                  <ArrowDownLeft className="w-3 h-3 text-rose-600" />
                  Honor & Ops
                </span>
                <span className="text-xs sm:text-sm font-bold text-rose-600 tabular-nums mt-1">
                  -{formatRupiah(kasKeamanan.expenseThisMonth)}
                </span>
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Combined Total Strip */}
      <div className="bg-teal-900 text-white rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-teal-300" />
          </div>
          <div className="min-w-0">
            <span className="text-xs sm:text-sm text-white font-bold block leading-tight truncate">
              Total Saldo Gabungan RT
            </span>
            <span className="text-[11px] text-teal-200 block leading-tight truncate">
              Dual-ledger Kas 01 & 02 Terverifikasi
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-lg sm:text-2xl font-bold tabular-nums text-white tracking-tight">
            {formatRupiah(totalBalance)}
          </span>
        </div>
      </div>
    </section>
  )
}

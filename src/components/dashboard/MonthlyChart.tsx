'use client'

import React, { useState } from 'react'
import { MonthChartItem } from '@/server/services/dashboard.service'
import { formatRupiah } from '@/lib/utils'

interface MonthlyChartProps {
  data: MonthChartItem[]
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const [activeLedger, setActiveLedger] = useState<'KAS_UMUM' | 'KAS_KEAMANAN'>('KAS_UMUM')

  // Find max value for scale
  const maxVal = Math.max(
    ...data.map((d) =>
      activeLedger === 'KAS_UMUM'
        ? Math.max(d.kasUmumIncome, d.kasUmumExpense)
        : Math.max(d.kasKeamananIncome, d.kasKeamananExpense)
    ),
    1000000 // default minimum baseline 1 Jt
  )

  return (
    <section
      aria-label="Grafik Arus Kas"
      className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col"
    >
      {/* Header and Switcher */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Arus Kas 6 Bulan Terakhir
          </h2>
          <p className="text-[11px] text-slate-500">
            Perbandingan pemasukan vs pengeluaran historis
          </p>
        </div>

        {/* Ledger Switcher Pills */}
        <div className="bg-slate-100 p-0.5 rounded-lg flex items-center gap-0.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveLedger('KAS_UMUM')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              activeLedger === 'KAS_UMUM'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kas Umum
          </button>
          <button
            type="button"
            onClick={() => setActiveLedger('KAS_KEAMANAN')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              activeLedger === 'KAS_KEAMANAN'
                ? 'bg-white text-blue-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kas Keamanan
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div
            className={`w-3 h-3 rounded-full ${
              activeLedger === 'KAS_UMUM' ? 'bg-emerald-600' : 'bg-blue-600'
            }`}
          />
          <span className="text-slate-600 font-medium">Pemasukan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <span className="text-slate-600 font-medium">Pengeluaran</span>
        </div>
      </div>

      {/* Bars Chart Container */}
      <div className="w-full h-48 flex items-end justify-between gap-2 pt-4 pb-2 border-b border-slate-100">
        {data.map((item, idx) => {
          const income =
            activeLedger === 'KAS_UMUM' ? item.kasUmumIncome : item.kasKeamananIncome
          const expense =
            activeLedger === 'KAS_UMUM' ? item.kasUmumExpense : item.kasKeamananExpense

          const incomeHeight = Math.max(Math.round((income / maxVal) * 100), 4)
          const expenseHeight = Math.max(Math.round((expense / maxVal) * 100), 4)

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center h-full justify-end group relative"
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] p-1.5 rounded shadow pointer-events-none whitespace-nowrap">
                <span className="text-emerald-400">
                  Masuk: {formatRupiah(income)}
                </span>
                <span className="text-rose-400">
                  Keluar: {formatRupiah(expense)}
                </span>
              </div>

              {/* Bar Pairs */}
              <div className="w-full flex items-end justify-center gap-1.5 h-full pb-1">
                <div
                  className={`w-3.5 sm:w-5 rounded-t transition-all ${
                    activeLedger === 'KAS_UMUM'
                      ? 'bg-emerald-600 group-hover:bg-emerald-500'
                      : 'bg-blue-600 group-hover:bg-blue-500'
                  }`}
                  style={{ height: `${incomeHeight}%` }}
                  title={`Pemasukan: ${formatRupiah(income)}`}
                />
                <div
                  className="w-3.5 sm:w-5 bg-rose-500 group-hover:bg-rose-400 rounded-t transition-all"
                  style={{ height: `${expenseHeight}%` }}
                  title={`Pengeluaran: ${formatRupiah(expense)}`}
                />
              </div>

              {/* Month Label */}
              <span className="text-[11px] font-semibold text-slate-500 mt-1">
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

import React from 'react'
import Link from 'next/link'
import { PieChart, ArrowRight, AlertCircle } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'

interface PaymentRatioCardProps {
  paid: number
  total: number
  percentage: number
  unpaidCount: number
  totalArrearsAmount: number
  periodLabel: string
}

export function PaymentRatioCard({
  paid,
  total,
  percentage,
  unpaidCount,
  totalArrearsAmount,
  periodLabel,
}: PaymentRatioCardProps) {
  return (
    <section
      aria-label="Tingkat Kepatuhan Pembayaran Iuran"
      className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-teal-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Kepatuhan Bayar — {periodLabel}
            </h2>
          </div>
          <span className="text-[11px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded-full">
            Target 95%
          </span>
        </div>

        {/* Stats Row */}
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
            {paid}{' '}
            <span className="text-xs sm:text-sm font-normal text-slate-500">
              / {total} KK Lunas
            </span>
          </span>
          <span className="text-xl sm:text-2xl font-bold text-emerald-700 tabular-nums">
            {percentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden my-3 relative">
          <div
            className="h-full bg-teal-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            {unpaidCount} KK Belum Lunas
          </span>
          <span className="font-bold text-rose-600 tabular-nums">
            Tunggakan: {formatRupiah(totalArrearsAmount)}
          </span>
        </div>

        <Link
          href="/penagihan-wa"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors mt-1 group"
        >
          <span>Kirim Pengingat Cepat di Penagihan WA</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </section>
  )
}

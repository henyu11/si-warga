import React from 'react'
import Link from 'next/link'
import { getSessionUser } from '@/server/services/auth.service'
import { getAppSettings } from '@/server/services/settings.service'
import { getDashboardData } from '@/server/services/dashboard.service'
import { DualCashStatCards } from '@/components/dashboard/DualCashStatCards'
import { PaymentRatioCard } from '@/components/dashboard/PaymentRatioCard'
import { MonthlyChart } from '@/components/dashboard/MonthlyChart'
import { CopyReportButton } from '@/components/dashboard/CopyReportButton'
import { Download, Calendar, ShieldCheck, ChevronRight } from 'lucide-react'

export const metadata = {
  title: 'Beranda | siWarga Palmut',
  description: 'Dashboard Keuangan & Manajemen Kavling Palanji & Mutiara Indah',
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export default async function DashboardPage() {
  const user = await getSessionUser()
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const dashboardData = await getDashboardData(currentMonth, currentYear)
  const settings = await getAppSettings()
  const appName = settings.app_name || 'siWarga Palmut'
  const communityName = settings.community_name || 'Kavling Palanji & Mutiara Indah'
  const periodLabel = `${MONTH_NAMES[currentMonth - 1]} ${currentYear}`

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Banner / Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {appName}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              {user?.role || 'PENGURUS'}
            </span>
          </div>
          <p className="text-xs font-medium text-teal-700 mt-0.5">
            {communityName}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Selamat bertugas, <span className="font-semibold text-slate-700">{user?.fullName}</span>. Pantau keuangan lingkungan secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium text-xs shadow-sm">
            <Calendar className="w-4 h-4 text-teal-700" />
            <span>Periode: {periodLabel}</span>
          </div>
        </div>
      </div>

      {/* Quick Action Row */}
      <section aria-label="Aksi Cepat Pengurus RT" className="flex flex-col sm:flex-row gap-3 w-full">
        <CopyReportButton reportText={dashboardData.waReportText} className="flex-1" />
        <Link
          href="/api/v1/reports/export?type=all"
          className="h-11 flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Laporan Kas (PDF/CSV)</span>
        </Link>
      </section>

      {/* Dual Cash Stat Cards */}
      <DualCashStatCards
        kasUmum={dashboardData.kasUmum}
        kasKeamanan={dashboardData.kasKeamanan}
        totalBalance={dashboardData.totalBalance}
        periodLabel={periodLabel}
      />

      {/* Grid: Payment Ratio & Monthly Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PaymentRatioCard
          paid={dashboardData.paymentRatio.paid}
          total={dashboardData.paymentRatio.total}
          percentage={dashboardData.paymentRatio.percentage}
          unpaidCount={dashboardData.paymentRatio.unpaidCount}
          totalArrearsAmount={dashboardData.paymentRatio.totalArrearsAmount}
          periodLabel={periodLabel}
        />

        <MonthlyChart data={dashboardData.monthlyChartData} />
      </div>
    </div>
  )
}

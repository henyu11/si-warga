'use client'

import React, { useState, useEffect } from 'react'
import {
  Shield,
  Filter,
  Search,
  Lock,
  Calendar,
  User,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  History,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface AuditLogItem {
  id: string
  actorUserId: string
  actorRole: string
  actorFullName: string | null
  module: string
  entityType: string
  entityId: string
  action: string
  oldValues: string | null
  newValues: string | null
  reason: string | null
  ipAddress: string | null
  createdAt: string
}

export function AuditLogTable() {
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [moduleFilter, setModuleFilter] = useState('ALL')
  const [actionFilter, setActionFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (moduleFilter !== 'ALL') params.set('module', moduleFilter)
      if (actionFilter !== 'ALL') params.set('action', actionFilter)

      const res = await fetch(`/api/v1/audit-logs?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setLogs(json.data.logs || [])
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [moduleFilter, actionFilter])

  const filteredLogs = logs.filter((log) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      log.actorFullName?.toLowerCase().includes(q) ||
      log.module?.toLowerCase().includes(q) ||
      log.entityType?.toLowerCase().includes(q) ||
      log.reason?.toLowerCase().includes(q) ||
      log.entityId?.toLowerCase().includes(q)
    )
  })

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'RATE_CHANGE':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'VOID':
      case 'SOFT_DELETE':
        return 'bg-rose-100 text-rose-800 border-rose-200'
      case 'OVERRIDE':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  return (
    <div className="w-full max-w-full space-y-4">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Audit Trail Keuangan & Sistem
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Live Ledger
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Rekam jejak kepatuhan dan audit independen tata kelola kas lingkungan Kavling Palanji &amp; Mutiara Indah
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-xs shadow-xs">
            <Shield className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>Integritas Terverifikasi</span>
          </div>
        </div>
      </div>

      {/* Security & Immutability Banner */}
      <div className="rounded-xl bg-slate-900 text-white p-3.5 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        <div className="flex items-start md:items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-800 text-teal-300 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-white">
                Integritas Data Terkunci (Immutable Ledger)
              </h2>
              <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                Append-Only
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-1 leading-relaxed">
              Seluruh perubahan tarif iuran, pembayaran warga, pembatalan (void), dan transaksi kas terekam permanen dan tidak dapat diedit atau dihapus oleh siapa pun.
            </p>
          </div>
        </div>

        <div className="px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-semibold shrink-0 self-start md:self-center">
          Total {logs.length} Entri Audit
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-3.5 shadow-xs space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {/* Module Select */}
          <div>
            <label className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Modul
            </label>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
            >
              <option value="ALL">Semua Modul</option>
              <option value="BILLING">Tagihan (BILLING)</option>
              <option value="PAYMENT">Pembayaran (PAYMENT)</option>
              <option value="CASH">Buku Kas (CASH)</option>
              <option value="HOUSEHOLD">Warga (HOUSEHOLD)</option>
              <option value="TARIFF">Tarif & Pengaturan (TARIFF)</option>
              <option value="USER">Pengguna (USER)</option>
            </select>
          </div>

          {/* Action Select */}
          <div>
            <label className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Aksi
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
            >
              <option value="ALL">Semua Aksi</option>
              <option value="CREATE">CREATE (Tambah)</option>
              <option value="UPDATE">UPDATE (Ubah)</option>
              <option value="RATE_CHANGE">RATE_CHANGE (Ubah Tarif)</option>
              <option value="VOID">VOID (Batalkan)</option>
              <option value="OVERRIDE">OVERRIDE (Penyesuaian)</option>
              <option value="SOFT_DELETE">SOFT_DELETE (Nonaktifkan)</option>
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Pencarian
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari pengguna, modul, alasan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 h-9 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Mobile Card View (< md) vs Desktop Table (>= md) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden w-full max-w-full">
        {/* Mobile View: Cards (< md) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Memuat log aktivitas...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 px-4">
              Tidak ada log audit yang sesuai filter.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-3.5 space-y-2.5 bg-white">
                {/* Baris 1: Action Badge & Waktu */}
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${getActionBadge(
                      log.action
                    )}`}
                  >
                    {log.action}
                  </span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    {new Date(log.createdAt).toLocaleString('id-ID', {
                      dateStyle: 'short',
                      timeStyle: 'medium',
                    })}
                  </span>
                </div>

                {/* Baris 2: Pelaku & Modul */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs text-slate-800 truncate">
                      {log.actorFullName || 'System'}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Role: {log.actorRole}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {log.module}
                    </span>
                  </div>
                </div>

                {/* Baris 3: Entitas & Catatan/Alasan */}
                <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <span className="text-slate-500">Entitas:</span>
                    <span className="font-medium text-slate-800">
                      {log.entityType} ({log.entityId.slice(0, 12)}...)
                    </span>
                  </div>
                  {log.reason && (
                    <div className="text-[11px] text-slate-600 pt-0.5 border-t border-slate-200/60">
                      <span className="text-slate-400">Catatan: </span>
                      <span className="italic">{log.reason}</span>
                    </div>
                  )}
                </div>

                {/* Baris 4: Tombol Aksi Detail Diff */}
                <button
                  type="button"
                  onClick={() => setSelectedLog(log)}
                  className="w-full py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 font-medium text-xs rounded-lg border border-teal-200/80 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-teal-700" />
                  <span>Lihat Detail Perubahan Nilai</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Modul</th>
                <th className="py-3 px-4">Aksi</th>
                <th className="py-3 px-4">Entitas & ID</th>
                <th className="py-3 px-4">Alasan / Catatan</th>
                <th className="py-3 px-4 text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Memuat log aktivitas...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada log audit yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('id-ID', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </td>

                    <td className="py-3 px-4">
                      <div>
                        <div className="font-semibold text-slate-800">
                          {log.actorFullName || 'System'}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {log.actorRole}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-700">
                        {log.module}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-semibold ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">
                        {log.entityType}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 truncate max-w-[140px] block">
                        {log.entityId}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-slate-600 line-clamp-1">
                        {log.reason || '-'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="p-1 rounded text-teal-700 hover:bg-teal-50 transition-colors"
                        title="Lihat Perubahan Nilai"
                      >
                        <Eye className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog Detail Perubahan Nilai */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-700" />
              Detail Entri Audit Log
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">ID Log</span>
                  <span className="font-mono text-slate-800 break-all">{selectedLog.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Waktu Tercatat</span>
                  <span className="text-slate-800">
                    {new Date(selectedLog.createdAt).toLocaleString('id-ID', {
                      dateStyle: 'long',
                      timeStyle: 'medium',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Pelaku</span>
                  <span className="font-semibold text-slate-800">
                    {selectedLog.actorFullName || 'System'} ({selectedLog.actorRole})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Modul & Aksi</span>
                  <span className="font-semibold text-slate-800">
                    {selectedLog.module} • {selectedLog.action}
                  </span>
                </div>
              </div>

              {selectedLog.reason && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg">
                  <span className="font-semibold">Alasan Tercatat: </span>
                  {selectedLog.reason}
                </div>
              )}

              {/* JSON diff preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">
                    Nilai Sebelumnya (Old):
                  </span>
                  <pre className="p-3 bg-slate-100 text-slate-800 rounded-lg font-mono text-[10px] sm:text-[11px] overflow-x-auto max-h-48 border border-slate-200 whitespace-pre-wrap break-all">
                    {selectedLog.oldValues
                      ? JSON.stringify(JSON.parse(selectedLog.oldValues), null, 2)
                      : 'None (null)'}
                  </pre>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 block mb-1">
                    Nilai Baru (New):
                  </span>
                  <pre className="p-3 bg-slate-100 text-slate-800 rounded-lg font-mono text-[10px] sm:text-[11px] overflow-x-auto max-h-48 border border-slate-200 whitespace-pre-wrap break-all">
                    {selectedLog.newValues
                      ? JSON.stringify(JSON.parse(selectedLog.newValues), null, 2)
                      : 'None (null)'}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

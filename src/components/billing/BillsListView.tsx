'use client'

import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CreditCard,
  AlertTriangle,
  Search,
  CheckCircle,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { PaymentSheet } from './PaymentSheet'
import { FineModal } from './FineModal'
import { GenerateBillButton } from './GenerateBillButton'
import { useUser } from '@/components/layout/RoleGuard'
import { useAppSettings } from '@/components/layout/AppSettingsProvider'

interface BillsListViewProps {
  initialBills: any[]
}

export function BillsListView({ initialBills }: BillsListViewProps) {
  const [bills, setBills] = useState<any[]>(initialBills)
  const now = new Date()
  const [year, setYear] = useState<number>(now.getFullYear())
  const [month, setMonth] = useState<number>(now.getMonth() + 1)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [search, setSearch] = useState<string>('')

  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false)
  const [fineModalOpen, setFineModalOpen] = useState(false)
  const [activeBill, setActiveBill] = useState<any | null>(null)

  const user = useUser()
  const { communityName } = useAppSettings()
  const canPay = user?.role === 'BENDAHARA'
  const canAddFine = user?.role === 'ADMIN' || user?.role === 'BENDAHARA'
  const canGenerate = user?.role === 'ADMIN' || user?.role === 'BENDAHARA'

  async function fetchBills() {
    try {
      const params = new URLSearchParams()
      params.set('year', String(year))
      params.set('month', String(month))
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/v1/bills?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setBills(json.data)
      }
    } catch {
      // silent
    }
  }

  function handleFilter(e: React.FormEvent) {
    e.preventDefault()
    fetchBills()
  }

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ]

  const statusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="lunas">Lunas</Badge>
      case 'PARTIAL':
        return <Badge variant="sebagian">Sebagian</Badge>
      case 'UNPAID':
        return <Badge variant="belumBayar">Belum Bayar</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tagihan Iuran Warga
          </h1>
          <p className="text-sm text-muted-foreground">
            Rekap kewajiban iuran bulanan warga {communityName} (Iuran Wajib, Keamanan, Denda Ronda).
          </p>
        </div>

        {canGenerate && <GenerateBillButton onSuccess={fetchBills} />}
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-card border rounded-xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          {/* Month selector */}
          <Select
            value={String(month)}
            onValueChange={(val) => {
              setMonth(Number(val))
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((name, idx) => (
                <SelectItem key={idx + 1} value={String(idx + 1)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year selector */}
          <Select
            value={String(year)}
            onValueChange={(val) => {
              setYear(Number(val))
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2027">2027</SelectItem>
            </SelectContent>
          </Select>

          {/* Status selector */}
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val)
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="UNPAID">Belum Bayar</SelectItem>
              <SelectItem value="PARTIAL">Sebagian</SelectItem>
              <SelectItem value="PAID">Lunas</SelectItem>
            </SelectContent>
          </Select>

          {/* Search Button */}
          <Button onClick={fetchBills} variant="secondary" className="gap-2">
            <Search className="w-4 h-4" />
            <span>Terapkan Filter</span>
          </Button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari berdasarkan nama warga atau blok rumah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchBills()}
            className="pl-9"
          />
        </div>
      </div>

      {/* Bills Table */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Blok / No</TableHead>
              <TableHead>Kepala Keluarga</TableHead>
              <TableHead>Rincian Komponen</TableHead>
              <TableHead>Total Tagihan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Tidak ada data tagihan pada periode ini. Klik <strong>Generate Tagihan</strong> untuk membuat tagihan baru.
                </TableCell>
              </TableRow>
            ) : (
              bills.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-semibold text-foreground">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">
                      {b.blockNumber}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{b.headName}</span>
                      <span className="text-xs text-muted-foreground">+{b.phoneWa}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {b.items.map((it: any) => (
                        <span
                          key={it.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            it.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {it.itemType === 'IURAN_WAJIB'
                            ? 'Wajib'
                            : it.itemType === 'IURAN_KEAMANAN'
                            ? 'Keamanan'
                            : 'Denda'}{' '}
                          {formatRupiah(it.amountDue)}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground tabular-nums">
                        {formatRupiah(b.totalDue)}
                      </span>
                      {b.totalPaid > 0 && b.totalPaid < b.totalDue && (
                        <span className="text-[10px] text-emerald-600 font-semibold tabular-nums">
                          Dibayar: {formatRupiah(b.totalPaid)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{statusBadge(b.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {canAddFine && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setActiveBill(b)
                            setFineModalOpen(true)
                          }}
                          title="Tambah Denda Ronda"
                          className="text-amber-600 hover:text-amber-700 h-8 px-2"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      {canPay && b.status !== 'PAID' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setActiveBill(b)
                            setPaymentSheetOpen(true)
                          }}
                          className="h-8 gap-1.5 text-xs"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Bayar</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Sheets & Modals */}
      {activeBill && (
        <>
          <PaymentSheet
            open={paymentSheetOpen}
            onOpenChange={setPaymentSheetOpen}
            bill={activeBill}
            onSuccess={fetchBills}
          />
          <FineModal
            open={fineModalOpen}
            onOpenChange={setFineModalOpen}
            billId={activeBill.id}
            householdName={activeBill.headName}
            blockNumber={activeBill.blockNumber}
            onSuccess={fetchBills}
          />
        </>
      )}
    </div>
  )
}

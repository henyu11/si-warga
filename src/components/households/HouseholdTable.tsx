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
import { Edit2, UserX, MessageCircle, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import type { households } from '@/db/schema'
import { HouseholdFormSheet } from './HouseholdFormSheet'
import { useUser } from '@/components/layout/RoleGuard'

type Household = typeof households.$inferSelect

interface HouseholdTableProps {
  initialHouseholds: Household[]
}

export function HouseholdTable({ initialHouseholds }: HouseholdTableProps) {
  const [list, setList] = useState<Household[]>(initialHouseholds)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null)
  const user = useUser()
  const canEdit = user?.role === 'ADMIN' || user?.role === 'BENDAHARA'
  const canDelete = user?.role === 'ADMIN'

  async function fetchHouseholds() {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)

      const res = await fetch(`/api/v1/households?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setList(json.data)
      }
    } catch {
      toast.error('Gagal memuat data warga')
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchHouseholds()
  }

  async function handleDelete(h: Household) {
    if (
      confirm(
        `Apakah Anda yakin ingin menonaktifkan data warga ${h.headName} (${h.blockNumber})? Histori bayar lama tetap aman tersimpan.`
      )
    ) {
      try {
        const res = await fetch(`/api/v1/households/${h.id}`, { method: 'DELETE' })
        const json = await res.json()
        if (res.ok && json.success) {
          toast.success('Data warga berhasil dinonaktifkan.')
          fetchHouseholds()
        } else {
          toast.error(json.message || 'Gagal menonaktifkan warga')
        }
      } catch {
        toast.error('Terjadi kesalahan')
      }
    }
  }

  const occupancyBadge = (status: string) => {
    switch (status) {
      case 'TETAP':
        return <Badge variant="kasUmum">Warga Tetap</Badge>
      case 'KONTRAK':
        return <Badge variant="sebagian">Kontrak</Badge>
      case 'KOSONG':
        return <Badge variant="outline">Kosong</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Data Warga &amp; Rumah
          </h1>
          <p className="text-sm text-muted-foreground">
            Direktori Kepala Keluarga (KK), nomor WhatsApp, dan status hunian Kavling Palanji &amp; Mutiara Indah.
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={() => {
              setSelectedHousehold(null)
              setSheetOpen(true)
            }}
            className="gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Warga</span>
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Cari nama warga, blok rumah, atau nomor WA..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Cari
          </Button>
        </form>

        <Select
          value={statusFilter}
          onValueChange={(val) => {
            setStatusFilter(val)
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status Hunian" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Status</SelectItem>
            <SelectItem value="TETAP">Warga Tetap</SelectItem>
            <SelectItem value="KONTRAK">Warga Kontrak</SelectItem>
            <SelectItem value="KOSONG">Rumah Kosong</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Blok / No</TableHead>
              <TableHead>Kepala Keluarga</TableHead>
              <TableHead>Status Hunian</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Tagihan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Tidak ada data warga ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              list.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-semibold text-foreground">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">
                      {h.blockNumber}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{h.headName}</span>
                      {h.notes && (
                        <span className="text-xs text-muted-foreground">{h.notes}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{occupancyBadge(h.occupancyStatus)}</TableCell>
                  <TableCell>
                    <a
                      href={`https://wa.me/${h.phoneWa}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 hover:underline font-mono"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-wa-green" />
                      +{h.phoneWa}
                    </a>
                  </TableCell>
                  <TableCell>
                    {h.isBillingActive === 1 ? (
                      <Badge variant="kasUmum" className="text-[10px]">
                        Ditagih
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Bebas Iuran
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedHousehold(h)
                            setSheetOpen(true)
                          }}
                          title="Ubah Data"
                        >
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(h)}
                          title="Nonaktifkan Warga"
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <UserX className="w-4 h-4" />
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

      <HouseholdFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        householdToEdit={selectedHousehold}
        onSuccess={fetchHouseholds}
      />
    </div>
  )
}

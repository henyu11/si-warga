'use client'

import React, { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { households } from '@/db/schema'

type Household = typeof households.$inferSelect

interface HouseholdFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  householdToEdit?: Household | null
  onSuccess: () => void
}

export function HouseholdFormSheet({
  open,
  onOpenChange,
  householdToEdit,
  onSuccess,
}: HouseholdFormSheetProps) {
  const [blockNumber, setBlockNumber] = useState('')
  const [headName, setHeadName] = useState('')
  const [phoneWa, setPhoneWa] = useState('')
  const [occupancyStatus, setOccupancyStatus] = useState<'TETAP' | 'KONTRAK' | 'KOSONG'>('TETAP')
  const [isBillingActive, setIsBillingActive] = useState<number>(1)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (householdToEdit) {
      setBlockNumber(householdToEdit.blockNumber)
      setHeadName(householdToEdit.headName)
      setPhoneWa(householdToEdit.phoneWa)
      setOccupancyStatus(householdToEdit.occupancyStatus as any)
      setIsBillingActive(householdToEdit.isBillingActive)
      setNotes(householdToEdit.notes || '')
    } else {
      setBlockNumber('')
      setHeadName('')
      setPhoneWa('')
      setOccupancyStatus('TETAP')
      setIsBillingActive(1)
      setNotes('')
    }
  }, [householdToEdit, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (householdToEdit) {
        const res = await fetch(`/api/v1/households/${householdToEdit.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blockNumber,
            headName,
            phoneWa,
            occupancyStatus,
            isBillingActive,
            notes: notes || null,
          }),
        })
        const json = await res.json()
        if (!res.ok || !json.success) {
          toast.error(json.message || 'Gagal memperbarui data warga')
          return
        }
        toast.success('Data warga berhasil diperbarui!')
      } else {
        const res = await fetch('/api/v1/households', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blockNumber,
            headName,
            phoneWa,
            occupancyStatus,
            isBillingActive,
            notes: notes || null,
          }),
        })
        const json = await res.json()
        if (!res.ok || !json.success) {
          toast.error(json.message || 'Gagal menambahkan warga')
          return
        }
        toast.success('Warga baru berhasil ditambahkan!')
      }

      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Terjadi kesalahan pada server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {householdToEdit ? 'Ubah Data Warga / Rumah' : 'Tambah Warga / Rumah Baru'}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="h-block">Blok / Nomor Rumah</Label>
            <Input
              id="h-block"
              placeholder="Contoh: Blok A3/12"
              value={blockNumber}
              onChange={(e) => setBlockNumber(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="h-name">Nama Kepala Keluarga (KK)</Label>
            <Input
              id="h-name"
              placeholder="Contoh: Bpk. Bambang Sudarsono"
              value={headName}
              onChange={(e) => setHeadName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="h-wa">Nomor WhatsApp</Label>
            <Input
              id="h-wa"
              placeholder="Contoh: 081234567890"
              value={phoneWa}
              onChange={(e) => setPhoneWa(e.target.value)}
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Otomatis dinormalisasi ke format 628xxx untuk penagihan WA.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="h-status">Status Hunian</Label>
            <Select
              value={occupancyStatus}
              onValueChange={(val: any) => setOccupancyStatus(val)}
            >
              <SelectTrigger id="h-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TETAP">Warga Tetap</SelectItem>
                <SelectItem value="KONTRAK">Warga Kontrak / Sewa</SelectItem>
                <SelectItem value="KOSONG">Rumah Kosong</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="h-billing">Status Tagihan Bulanan</Label>
            <Select
              value={String(isBillingActive)}
              onValueChange={(val) => setIsBillingActive(Number(val))}
            >
              <SelectTrigger id="h-billing">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Aktif (Ikut Ditagih Setiap Bulan)</SelectItem>
                <SelectItem value="0">Nonaktif (Bebas Iuran / Pengecualian)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="h-notes">Catatan Tambahan (Opsional)</Label>
            <Textarea
              id="h-notes"
              placeholder="Misal: Posisi rumah hook, seberang taman..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <SheetFooter className="pt-4 flex flex-row gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : householdToEdit ? 'Simpan' : 'Tambah Warga'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

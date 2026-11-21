'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface FineModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  billId: string
  householdName: string
  blockNumber: string
  onSuccess: () => void
}

export function FineModal({
  open,
  onOpenChange,
  billId,
  householdName,
  blockNumber,
  onSuccess,
}: FineModalProps) {
  const [fineDate, setFineDate] = useState(new Date().toISOString().split('T')[0])
  const [fineNote, setFineNote] = useState('Tidak hadir jadwal ronda malam tanpa keterangan')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fineNote || fineNote.length < 3) {
      toast.error('Keterangan denda wajib diisi')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/v1/bills/${billId}/fines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fine_date: fineDate,
          fine_note: fineNote,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message || 'Gagal menambahkan denda')
        return
      }

      toast.success('Denda ronda berhasil ditambahkan ke tagihan warga!')
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Tambah Denda Ronda</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="p-3 bg-slate-50 border rounded-lg text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Warga Terkait:</span>
              <span className="font-semibold text-foreground">{householdName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Blok / No:</span>
              <span className="font-mono text-foreground">{blockNumber}</span>
            </div>
            <div className="flex justify-between pt-1 border-t">
              <span className="text-muted-foreground">Nominal Denda Standar:</span>
              <span className="font-bold text-rose-600">Rp 25.000</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fine-date">Tanggal Tidak Hadir Ronda</Label>
            <Input
              id="fine-date"
              type="date"
              value={fineDate}
              onChange={(e) => setFineDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fine-note">Keterangan Absen Ronda</Label>
            <Textarea
              id="fine-note"
              placeholder="Contoh: Tidak hadir jadwal ronda malam pos 1..."
              value={fineNote}
              onChange={(e) => setFineNote(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Tambahkan Denda'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

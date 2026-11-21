'use client'

import React, { useState, useEffect } from 'react'
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
import { AlertCircle, History } from 'lucide-react'
import { toast } from 'sonner'
import { formatRupiah } from '@/lib/utils'

interface FeeRateChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feeType: 'IURAN_WAJIB' | 'IURAN_KEAMANAN' | 'DENDA_RONDA'
  currentAmount: number
  title: string
  onSuccess: () => void
}

export function FeeRateChangeDialog({
  open,
  onOpenChange,
  feeType,
  currentAmount,
  title,
  onSuccess,
}: FeeRateChangeDialogProps) {
  const [newAmount, setNewAmount] = useState<string>('')
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [changeReason, setChangeReason] = useState('')
  const [applyToUnpaid, setApplyToUnpaid] = useState(false)
  const [affectedCount, setAffectedCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  // Fetch impact preview
  useEffect(() => {
    if (open) {
      setNewAmount(String(currentAmount))
      setChangeReason('')
      setApplyToUnpaid(false)

      const now = new Date()
      fetch(
        `/api/v1/fee-rates/impact-preview?fee_type=${feeType}&year=${now.getFullYear()}&month=${
          now.getMonth() + 1
        }`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setAffectedCount(data.data.affectedCount)
          }
        })
        .catch(() => {})
    }
  }, [open, feeType, currentAmount])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amountNum = Number(newAmount)
    if (!amountNum || amountNum <= 0) {
      toast.error('Nominal harus lebih dari 0')
      return
    }
    if (!changeReason || changeReason.length < 5) {
      toast.error('Alasan perubahan wajib diisi (minimal 5 karakter)')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/v1/fee-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeType,
          amount: amountNum,
          effectiveFrom,
          changeReason,
          applyToUnpaidCurrentMonth: applyToUnpaid,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message || 'Gagal mengubah tarif')
        return
      }

      toast.success('Tarif baru berhasil disimpan & dicatat di Audit Trail!')
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
          <DialogTitle>Penyesuaian Tarif: {title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Current vs New Amount */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border text-sm">
            <div>
              <span className="text-xs text-muted-foreground">Tarif Saat Ini</span>
              <div className="font-bold text-foreground text-base tabular-nums">
                {formatRupiah(currentAmount)}
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Besaran Baru (Rp)</span>
              <Input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="Contoh: 60000"
                className="h-8 font-bold text-primary tabular-nums mt-0.5"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="eff-date">Tanggal Mulai Berlaku</Label>
            <Input
              id="eff-date"
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="chg-reason">
              Alasan Perubahan / Catatan Hasil Rapat
            </Label>
            <Textarea
              id="chg-reason"
              placeholder="Contoh: Hasil keputusan musyawarah warga RT 04 tanggal 15 November..."
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              required
            />
          </div>

          {/* Option: Apply to unpaid current month */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={applyToUnpaid}
                onChange={(e) => setApplyToUnpaid(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-primary rounded accent-primary cursor-pointer"
              />
              <span className="text-xs text-amber-950 font-medium leading-relaxed">
                Terapkan nominal baru ini ke tagihan <strong>BELUM LUNAS</strong> bulan berjalan.
              </span>
            </label>

            {applyToUnpaid && (
              <p className="text-[11px] text-amber-800 pl-6 leading-tight flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Akan memperbarui <strong>{affectedCount} tagihan warga</strong> yang belum bayar. Tagihan yang sudah lunas tidak berubah.
                </span>
              </p>
            )}
          </div>

          {/* Audit trail warning */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <History className="w-4 h-4 text-primary" />
            <span>Setiap perubahan tarif otomatis tercatat permanen di Audit Trail.</span>
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
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

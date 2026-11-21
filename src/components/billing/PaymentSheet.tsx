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
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Check, UploadCloud, CreditCard, Banknote, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { formatRupiah } from '@/lib/utils'

interface PaymentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bill: any
  onSuccess: () => void
}

export function PaymentSheet({
  open,
  onOpenChange,
  bill,
  onSuccess,
}: PaymentSheetProps) {
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})
  const [paymentMethod, setPaymentMethod] = useState<'TUNAI' | 'TRANSFER'>('TRANSFER')
  const [notes, setNotes] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  // Initialize selected items when bill changes
  useEffect(() => {
    if (bill && bill.items) {
      const initial: Record<string, number> = {}
      for (const item of bill.items) {
        const remaining = item.amountDue - item.amountPaid
        if (remaining > 0) {
          initial[item.id] = remaining
        }
      }
      setSelectedItems(initial)
      setNotes('')
      setReceiptFile(null)
      setPaymentMethod('TRANSFER')
    }
  }, [bill, open])

  if (!bill) return null

  const totalPayment = Object.values(selectedItems).reduce((sum, amt) => sum + amt, 0)

  function toggleItem(itemId: string, remainingDue: number) {
    setSelectedItems((prev) => {
      const copy = { ...prev }
      if (copy[itemId] !== undefined) {
        delete copy[itemId]
      } else {
        copy[itemId] = remainingDue
      }
      return copy
    })
  }

  function handleAmountChange(itemId: string, val: string, maxDue: number) {
    const num = Number(val) || 0
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: Math.min(num, maxDue),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (totalPayment <= 0) {
      toast.error('Pilih minimal 1 komponen tagihan untuk dibayar.')
      return
    }

    setLoading(true)

    try {
      let receiptFileKey: string | null = null

      // Upload receipt file if provided
      if (receiptFile) {
        const presignRes = await fetch('/api/v1/uploads/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: receiptFile.name,
            contentType: receiptFile.type,
            size: receiptFile.size,
          }),
        })

        const presignJson = await presignRes.json()
        if (presignJson.success) {
          receiptFileKey = presignJson.data.fileKey
          // Attempt upload to presigned URL
          try {
            await fetch(presignJson.data.uploadUrl, {
              method: 'PUT',
              headers: { 'Content-Type': receiptFile.type },
              body: receiptFile,
            })
          } catch {
            // Soft fail if local mock upload
          }
        }
      }

      // Record payment
      const allocations = Object.entries(selectedItems).map(([billItemId, amount]) => ({
        billItemId,
        amount,
      }))

      const res = await fetch('/api/v1/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billId: bill.id,
          paymentMethod,
          allocations,
          receiptFileKey,
          notes: notes || null,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message || 'Gagal mencatat pembayaran')
        return
      }

      toast.success('Pembayaran berhasil dicatat & dialokasikan ke Buku Kas!')
      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Catat Pembayaran Iuran Warga</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Household Info Banner */}
          <div className="p-4 bg-slate-50 border rounded-xl flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-bold text-base text-foreground">{bill.headName}</span>
              <span className="text-xs text-muted-foreground">
                No. Rumah: <strong className="text-foreground">{bill.blockNumber}</strong> • Periode {bill.periodMonth}/{bill.periodYear}
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {bill.occupancyStatus}
            </Badge>
          </div>

          {/* Component Selection Checkboxes */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
              Pilih Komponen Tagihan yang Dibayar:
            </Label>

            <div className="space-y-2">
              {bill.items.map((item: any) => {
                const remaining = item.amountDue - item.amountPaid
                const isSelected = selectedItems[item.id] !== undefined
                const isPaid = item.status === 'PAID'

                const labelMap: Record<string, { name: string; tag: string; variant: any }> = {
                  IURAN_WAJIB: { name: 'Iuran Wajib Warga', tag: 'Kas Umum', variant: 'kasUmum' },
                  IURAN_KEAMANAN: { name: 'Iuran Keamanan', tag: 'Kas Keamanan', variant: 'kasKeamanan' },
                  DENDA_RONDA: { name: 'Denda Ronda Absen', tag: 'Kas Keamanan', variant: 'destructive' },
                }
                const meta = labelMap[item.itemType] || { name: item.itemType, tag: 'Kas', variant: 'outline' }

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border transition-all ${
                      isPaid
                        ? 'bg-slate-100/60 opacity-60'
                        : isSelected
                        ? 'border-primary bg-primary/5'
                        : 'bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          disabled={isPaid}
                          checked={isSelected}
                          onChange={() => toggleItem(item.id, remaining)}
                          className="w-4 h-4 rounded text-primary accent-primary cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-foreground">
                            {meta.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Dialokasikan ke <strong>{meta.tag}</strong>
                          </span>
                        </div>
                      </label>

                      <Badge variant={meta.variant} className="text-[10px]">
                        {isPaid ? 'Lunas' : formatRupiah(remaining)}
                      </Badge>
                    </div>

                    {isSelected && !isPaid && (
                      <div className="mt-2.5 pt-2 border-t flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">Nominal yang disetor:</span>
                        <div className="flex items-center gap-1.5 w-36">
                          <span className="text-xs text-muted-foreground font-semibold">Rp</span>
                          <Input
                            type="number"
                            value={selectedItems[item.id]}
                            onChange={(e) => handleAmountChange(item.id, e.target.value, remaining)}
                            className="h-8 text-right font-bold tabular-nums"
                            max={remaining}
                            min={1000}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
              Metode Pembayaran
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={paymentMethod === 'TRANSFER' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('TRANSFER')}
                className="gap-2 justify-center"
              >
                <CreditCard className="w-4 h-4" />
                <span>Transfer Bank</span>
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'TUNAI' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('TUNAI')}
                className="gap-2 justify-center"
              >
                <Banknote className="w-4 h-4" />
                <span>Uang Tunai (Cash)</span>
              </Button>
            </div>
          </div>

          {/* Receipt Upload (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="receipt-file">Bukti Transfer / Foto Nota (Opsional)</Label>
            <Input
              id="receipt-file"
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setReceiptFile(e.target.files[0])
                }
              }}
            />
            <p className="text-[11px] text-muted-foreground">
              Format JPG, PNG, atau WebP (maks. 2 MB).
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="pay-notes">Catatan Transaksi</Label>
            <Textarea
              id="pay-notes"
              rows={2}
              placeholder="Misal: Titip di pos satpam, transfer jam 09.00..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Summary Box */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-emerald-800 font-semibold">Total Pembayaran Disetor</span>
              <span className="text-xs text-emerald-700">Routing otomatis ke Dual Kas</span>
            </div>
            <div className="text-2xl font-bold text-emerald-900 tabular-nums">
              {formatRupiah(totalPayment)}
            </div>
          </div>

          <SheetFooter className="pt-2 flex flex-row gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || totalPayment <= 0}
              className="gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Menyimpan...' : 'Konfirmasi & Simpan'}</span>
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

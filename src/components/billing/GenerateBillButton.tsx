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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PlusCircle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface GenerateBillButtonProps {
  onSuccess: () => void
}

export function GenerateBillButton({ onSuccess }: GenerateBillButtonProps) {
  const [open, setOpen] = useState(false)
  const now = new Date()
  const [year, setYear] = useState<number>(now.getFullYear())
  const [month, setMonth] = useState<number>(now.getMonth() + 1)
  const [dueDate, setDueDate] = useState<string>(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-10`
  )
  const [loading, setLoading] = useState(false)

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ]

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/v1/bills/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_year: year,
          period_month: month,
          due_date: dueDate,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message || 'Gagal generate tagihan')
        return
      }

      const { createdCount, skippedCount } = json.data
      toast.success(
        `Generate selesai: ${createdCount} tagihan dibuat, ${skippedCount} sudah ada.`
      )
      setOpen(false)
      onSuccess()
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Sparkles className="w-4 h-4" />
        <span>Generate Tagihan Bulan Ini</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Tagihan Iuran Bulanan</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleGenerate} className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sistem akan otomatis membuat tagihan (Iuran Wajib &amp; Iuran Keamanan)
              untuk seluruh warga yang berstatus <strong>Aktif Ditagih</strong> sesuai
              tarif berlaku saat ini. Tagihan yang sudah pernah dibuat tidak akan terduplikasi.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Bulan Periode</Label>
                <Select
                  value={String(month)}
                  onValueChange={(val) => {
                    const m = Number(val)
                    setMonth(m)
                    setDueDate(`${year}-${String(m).padStart(2, '0')}-10`)
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
              </div>

              <div className="space-y-1.5">
                <Label>Tahun</Label>
                <Select
                  value={String(year)}
                  onValueChange={(val) => {
                    const y = Number(val)
                    setYear(y)
                    setDueDate(`${y}-${String(month).padStart(2, '0')}-10`)
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
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="due-date">Batas Waktu Jatuh Tempo</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                <PlusCircle className="w-4 h-4" />
                <span>{loading ? 'Memproses...' : 'Mulai Generate'}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

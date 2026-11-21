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
import { formatRupiah } from '@/lib/utils'
import { ArrowUpRight, ArrowDownLeft, Upload, FileText, CheckCircle2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  transactionType: 'INCOME' | 'EXPENSE'
}

interface CashBookItem {
  id: string
  bookType: 'KAS_UMUM' | 'KAS_KEAMANAN'
  name: string
  balance: number
  categories: Category[]
}

interface CashTxModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  defaultBookType?: 'KAS_UMUM' | 'KAS_KEAMANAN'
  books: {
    kasUmum?: CashBookItem
    kasKeamanan?: CashBookItem
  }
}

export function CashTxModal({
  isOpen,
  onClose,
  onSuccess,
  defaultBookType = 'KAS_UMUM',
  books,
}: CashTxModalProps) {
  const [selectedBookType, setSelectedBookType] = useState<'KAS_UMUM' | 'KAS_KEAMANAN'>(
    defaultBookType
  )
  const [txType, setTxType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE')
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [description, setDescription] = useState('')
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [receiptFileKey, setReceiptFileKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSelectedBookType(defaultBookType)
    setError(null)
  }, [defaultBookType, isOpen])

  const currentBook =
    selectedBookType === 'KAS_UMUM' ? books.kasUmum : books.kasKeamanan

  const availableCategories = (currentBook?.categories || []).filter(
    (c) => c.transactionType === txType
  )

  useEffect(() => {
    if (availableCategories.length > 0) {
      setCategoryId(availableCategories[0].id)
    } else {
      setCategoryId('')
    }
  }, [selectedBookType, txType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentBook) return
    if (!amount || amount <= 0) {
      setError('Nominal harus lebih dari 0')
      return
    }
    if (!description || description.trim().length < 3) {
      setError('Deskripsi transaksi minimal 3 karakter')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/v1/cash-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashBookId: currentBook.id,
          categoryId: categoryId || null,
          transactionType: txType,
          amount: Number(amount),
          description: description.trim(),
          transactionDate,
          receiptFileKey: receiptFileKey || null,
        }),
      })

      const data = await res.json()
      if (!data.success) {
        throw new Error(data.message || 'Gagal menyimpan transaksi')
      }

      // Reset and close
      setAmount('')
      setDescription('')
      setReceiptFileKey('')
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mencatat transaksi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900">
            Catat Transaksi Kas Manual
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Buku Kas Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Pilih Buku Kas
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedBookType('KAS_UMUM')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedBookType === 'KAS_UMUM'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="text-xs font-bold text-emerald-800">Kas Umum</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Operasional RT & Iuran Wajib
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBookType('KAS_KEAMANAN')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedBookType === 'KAS_KEAMANAN'
                    ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="text-xs font-bold text-blue-800">Kas Keamanan</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Iuran Keamanan & Denda Ronda
                </div>
              </button>
            </div>
          </div>

          {/* Tipe Transaksi: Pemasukan / Pengeluaran */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Jenis Transaksi
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTxType('EXPENSE')}
                className={`h-10 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  txType === 'EXPENSE'
                    ? 'bg-rose-50 border-rose-600 text-rose-700 ring-1 ring-rose-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-rose-600" />
                <span>Pengeluaran (Kas Keluar)</span>
              </button>

              <button
                type="button"
                onClick={() => setTxType('INCOME')}
                className={`h-10 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  txType === 'INCOME'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-700 ring-1 ring-emerald-600'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <span>Pemasukan (Kas Masuk)</span>
              </button>
            </div>
          </div>

          {/* Nominal */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Nominal (Rupiah) *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                Rp
              </span>
              <Input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="pl-9 text-sm font-semibold tabular-nums"
                required
                min={1}
              />
            </div>
            {amount && typeof amount === 'number' && amount > 0 && (
              <div className="text-xs text-teal-700 font-medium pl-1">
                Terbaca: {formatRupiah(amount)}
              </div>
            )}
          </div>

          {/* Kategori & Tanggal (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Kategori
              </Label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="">-- Pilih Kategori --</option>
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Tanggal Transaksi *
              </Label>
              <Input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="text-xs"
                required
              />
            </div>
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Deskripsi / Keterangan Transaksi *
            </Label>
            <Input
              type="text"
              placeholder="Contoh: Honor Satpam Bulan Nov / Perbaikan Lampu Jalan"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs"
              required
              minLength={3}
            />
          </div>

          {/* Upload Nota (Simulated / Key) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Bukti Nota / Resi (Opsional)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Key atau URL file nota (cth: receipts/nota-001.jpg)"
                value={receiptFileKey}
                onChange={(e) => setReceiptFileKey(e.target.value)}
                className="text-xs"
              />
              <Button
                type="button"
                variant="outline"
                className="h-9 text-xs shrink-0"
                onClick={() =>
                  setReceiptFileKey(
                    `receipts/cash-${Date.now().toString(36)}.jpg`
                  )
                }
              >
                <Upload className="w-3.5 h-3.5 mr-1" />
                Auto Key
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="h-9 px-4 text-xs font-semibold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-9 px-5 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white"
            >
              {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

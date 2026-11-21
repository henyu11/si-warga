'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileText, Download, ExternalLink, Image as ImageIcon } from 'lucide-react'

interface ReceiptViewerModalProps {
  isOpen: boolean
  onClose: () => void
  fileKey: string | null
  title?: string
}

export function ReceiptViewerModal({
  isOpen,
  onClose,
  fileKey,
  title = 'Bukti Transaksi',
}: ReceiptViewerModalProps) {
  const [viewUrl, setViewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !fileKey) {
      setViewUrl(null)
      return
    }

    // If fileKey is already a URL or mock path
    if (fileKey.startsWith('http://') || fileKey.startsWith('https://')) {
      setViewUrl(fileKey)
      return
    }

    setLoading(true)
    fetch(`/api/v1/uploads/view?key=${encodeURIComponent(fileKey)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.url) {
          setViewUrl(data.data.url)
        } else {
          setViewUrl(`/api/v1/uploads/view?key=${encodeURIComponent(fileKey)}`)
        }
      })
      .catch(() => {
        setViewUrl(null)
      })
      .finally(() => setLoading(false))
  }, [isOpen, fileKey])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <ImageIcon className="w-5 h-5 text-teal-600" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="py-2">
          {loading ? (
            <div className="py-16 text-center text-sm text-slate-400">
              Memuat bukti nota...
            </div>
          ) : viewUrl ? (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center max-h-[420px]">
                <img
                  src={viewUrl}
                  alt="Bukti Transaksi"
                  className="max-h-[400px] w-auto object-contain mx-auto"
                  onError={(e) => {
                    // Fallback to placeholder box
                    (e.target as HTMLElement).style.display = 'none'
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                <span className="font-mono truncate max-w-[240px]">{fileKey}</span>
                <a
                  href={viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka Tab Baru
                </a>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">
                Bukti nota tidak dapat dimuat
              </p>
              <p className="text-xs text-slate-400 mt-1">File key: {fileKey}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="h-9 px-4 text-xs font-semibold">
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

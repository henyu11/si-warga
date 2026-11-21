'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ExportDropdownProps {
  bookType: 'KAS_UMUM' | 'KAS_KEAMANAN'
  month: number
  year: number
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export function ExportDropdown({ bookType, month, year }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleExport = (format: 'xlsx' | 'pdf') => {
    const typeParam = bookType.toLowerCase() // kas_umum or kas_keamanan
    const bookTitle = bookType === 'KAS_UMUM' ? 'Kas Umum' : 'Kas Keamanan'
    const periodStr = `${MONTH_NAMES[month - 1]} ${year}`

    toast.info(`Menyiapkan unduhan ${format.toUpperCase()} (${bookTitle} - ${periodStr})...`)
    setIsOpen(false)

    // Trigger direct download
    const url = `/api/v1/reports/export?type=${typeParam}&format=${format}&month=${month}&year=${year}`
    window.open(url, '_blank')
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3 text-xs font-semibold border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 shadow-xs flex items-center gap-1.5 w-full sm:w-auto"
      >
        <Download className="w-3.5 h-3.5 text-teal-700" />
        <span>Export Laporan</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-lg ring-1 ring-black/5 z-50 p-1.5 animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="px-2.5 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Format Dokumen ({MONTH_NAMES[month - 1]} {year})
          </div>

          {/* Option 1: Excel */}
          <button
            type="button"
            onClick={() => handleExport('xlsx')}
            className="w-full mt-1 flex items-start gap-3 p-2.5 rounded-lg text-left hover:bg-emerald-50/70 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                  Export ke Excel
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-mono">
                  .xlsx
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                Lengkap KPI, styling tabel, & running balance
              </p>
            </div>
          </button>

          {/* Option 2: PDF */}
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            className="w-full flex items-start gap-3 p-2.5 rounded-lg text-left hover:bg-rose-50/70 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 group-hover:text-rose-900">
                  Export ke PDF
                </span>
                <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.2 rounded font-mono">
                  .pdf
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                Siap cetak dokumen A4 resmi & tanda tangan
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

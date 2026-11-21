'use client'

import React, { useState } from 'react'
import { MessageSquare, Check } from 'lucide-react'

interface CopyReportButtonProps {
  reportText: string
  className?: string
}

export function CopyReportButton({
  reportText,
  className = '',
}: CopyReportButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(reportText)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = reportText
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.error('Gagal menyalin:', err)
    }
  }

  return (
    <>
      {copied && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-300" />
          <span>Format Laporan WA berhasil disalin ke clipboard!</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleCopy}
        className={`h-11 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all ${className}`}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-200" />
            <span>Laporan Disalin!</span>
          </>
        ) : (
          <>
            <MessageSquare className="w-4 h-4" />
            <span>Copy Laporan Kas WA</span>
          </>
        )}
      </button>
    </>
  )
}

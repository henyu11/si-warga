'use client'

import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyWAButtonProps {
  text: string
  label?: string
  className?: string
  iconOnly?: boolean
  successMessage?: string
  onCopied?: () => void
}

export function CopyWAButton({
  text,
  label = 'Salin Teks',
  className = '',
  iconOnly = false,
  successMessage = 'Teks WA berhasil disalin!',
  onCopied,
}: CopyWAButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = text
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
      if (onCopied) onCopied()
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Gagal menyalin:', err)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 ${className}`}
      title={label}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-emerald-600 animate-in fade-in" />
          {!iconOnly && <span className="text-emerald-700 font-medium">Tersalin!</span>}
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          {!iconOnly && <span>{label}</span>}
        </>
      )}
    </button>
  )
}

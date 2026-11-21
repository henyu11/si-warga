import React from 'react'
import { FolderOpen, Plus } from 'lucide-react'
import { Button } from './button'

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`py-12 px-4 text-center bg-white border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>

      <h3 className="text-sm font-bold text-slate-800 leading-tight">
        {title}
      </h3>

      {description && (
        <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <Button
          type="button"
          onClick={onAction}
          className="mt-4 h-10 min-h-[44px] px-4 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{actionLabel}</span>
        </Button>
      )}
    </div>
  )
}

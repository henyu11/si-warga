'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit3, Wallet, Shield, AlertTriangle } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'

interface FeeRateCardProps {
  title: string
  feeType: 'IURAN_WAJIB' | 'IURAN_KEAMANAN' | 'DENDA_RONDA'
  amount: number
  targetKas: string
  targetKasType: 'kasUmum' | 'kasKeamanan'
  description: string
  effectiveFrom: string
  onEdit: () => void
  canEdit: boolean
}

export function FeeRateCard({
  title,
  amount,
  targetKas,
  targetKasType,
  description,
  effectiveFrom,
  onEdit,
  canEdit,
}: FeeRateCardProps) {
  const isKasUmum = targetKasType === 'kasUmum'

  return (
    <Card className="overflow-hidden relative flex flex-col justify-between">
      {/* Structural Accent Top Border */}
      <div
        className={`h-1.5 w-full ${
          isKasUmum ? 'bg-kas-umum' : 'bg-kas-keamanan'
        }`}
      />

      <CardContent className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <Badge variant={targetKasType} className="font-semibold text-xs">
              {targetKas}
            </Badge>
            <span className="text-[11px] text-muted-foreground font-mono">
              Sejak: {effectiveFrom}
            </span>
          </div>

          <h3 className="font-bold text-base text-foreground mt-1">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t flex items-end justify-between">
          <div>
            <span className="text-xs text-muted-foreground">Nominal Aktif</span>
            <div className="text-2xl font-bold tabular-nums text-foreground">
              {formatRupiah(amount)}
            </div>
          </div>

          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="gap-1.5 h-9 text-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Ubah Tarif</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

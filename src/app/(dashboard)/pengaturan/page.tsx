'use client'

import React, { useState, useEffect } from 'react'
import { FeeRateCard } from '@/components/settings/FeeRateCard'
import { FeeRateChangeDialog } from '@/components/settings/FeeRateChangeDialog'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUser } from '@/components/layout/RoleGuard'
import { useAppSettings } from '@/components/layout/AppSettingsProvider'
import { toast } from 'sonner'
import { Building2, MessageSquare, Save, History, Sparkles } from 'lucide-react'

export default function PengaturanPage() {
  const user = useUser()
  const canEdit = user?.role === 'ADMIN' || user?.role === 'BENDAHARA'
  const { updateSettingsState } = useAppSettings()

  const [rates, setRates] = useState<any>(null)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [appName, setAppName] = useState('')
  const [communityName, setCommunityName] = useState('')
  const [dialogState, setDialogState] = useState<{
    open: boolean
    feeType: 'IURAN_WAJIB' | 'IURAN_KEAMANAN' | 'DENDA_RONDA'
    currentAmount: number
    title: string
  }>({
    open: false,
    feeType: 'IURAN_WAJIB',
    currentAmount: 5000,
    title: 'Iuran Wajib',
  })

  const [rekeningUmum, setRekeningUmum] = useState('')
  const [rekeningKeamanan, setRekeningKeamanan] = useState('')
  const [templateWa, setTemplateWa] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)

  async function loadData() {
    try {
      const [rateRes, setRes] = useStateawait()
      // fetch rates
      const r = await fetch('/api/v1/fee-rates')
      const rJson = await r.json()
      if (rJson.success) setRates(rJson.data)

      // fetch settings
      const s = await fetch('/api/v1/settings')
      const sJson = await s.json()
      if (sJson.success) {
        setSettings(sJson.data)
        setAppName(sJson.data.app_name || 'siWarga Palmut')
        setCommunityName(sJson.data.community_name || 'Kavling Palanji & Mutiara Indah')
        setRekeningUmum(sJson.data.rekening_kas_umum || '')
        setRekeningKeamanan(sJson.data.rekening_kas_keamanan || '')
        setTemplateWa(sJson.data.wa_billing_template || '')
      }
    } catch {
      toast.error('Gagal memuat pengaturan')
    }
  }

  function useStateawait() {
    return [null, null]
  }

  useEffect(() => {
    loadData()
  }, [])

  function openEdit(
    feeType: 'IURAN_WAJIB' | 'IURAN_KEAMANAN' | 'DENDA_RONDA',
    currentAmount: number,
    title: string
  ) {
    setDialogState({
      open: true,
      feeType,
      currentAmount,
      title,
    })
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSavingSettings(true)
    const payload = {
      app_name: appName.trim() || 'siWarga Palmut',
      community_name: communityName.trim() || 'Kavling Palanji & Mutiara Indah',
      rekening_kas_umum: rekeningUmum,
      rekening_kas_keamanan: rekeningKeamanan,
      wa_billing_template: templateWa,
    }

    try {
      const res = await fetch('/api/v1/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        updateSettingsState(payload)
        toast.success('Pengaturan identitas aplikasi & operasional berhasil disimpan!')
      } else {
        toast.error(json.message || 'Gagal menyimpan pengaturan')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Pengaturan Tarif &amp; Operasional RT
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola besaran iuran dinamis, denda ronda, rekening penampung, dan template pesan WhatsApp.
        </p>
      </div>

      {/* 3 Tariff Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FeeRateCard
          title="Iuran Wajib Warga"
          feeType="IURAN_WAJIB"
          amount={rates?.IURAN_WAJIB?.amount || 5000}
          targetKas="Masuk: Buku Kas Umum"
          targetKasType="kasUmum"
          description="Iuran operasional bulanan: kebersihan, sampah, fasilitas umum, dan kegiatan sosial."
          effectiveFrom={rates?.IURAN_WAJIB?.effectiveFrom || '2026-01-01'}
          onEdit={() =>
            openEdit(
              'IURAN_WAJIB',
              rates?.IURAN_WAJIB?.amount || 5000,
              'Iuran Wajib Warga'
            )
          }
          canEdit={canEdit}
        />

        <FeeRateCard
          title="Iuran Keamanan Warga"
          feeType="IURAN_KEAMANAN"
          amount={rates?.IURAN_KEAMANAN?.amount || 20000}
          targetKas="Masuk: Buku Kas Keamanan"
          targetKasType="kasKeamanan"
          description="Iuran pos keamanan: honor gaji satpam, pemeliharaan portal, dan peralatan CCTV."
          effectiveFrom={rates?.IURAN_KEAMANAN?.effectiveFrom || '2026-01-01'}
          onEdit={() =>
            openEdit(
              'IURAN_KEAMANAN',
              rates?.IURAN_KEAMANAN?.amount || 20000,
              'Iuran Keamanan Warga'
            )
          }
          canEdit={canEdit}
        />

        <FeeRateCard
          title="Denda Ronda Absen"
          feeType="DENDA_RONDA"
          amount={rates?.DENDA_RONDA?.amount || 20000}
          targetKas="Masuk: Buku Kas Keamanan"
          targetKasType="kasKeamanan"
          description="Denda bagi warga yang berhalangan hadir jadwal ronda malam tanpa pengganti."
          effectiveFrom={rates?.DENDA_RONDA?.effectiveFrom || '2026-01-01'}
          onEdit={() =>
            openEdit(
              'DENDA_RONDA',
              rates?.DENDA_RONDA?.amount || 20000,
              'Denda Ronda Absen'
            )
          }
          canEdit={canEdit}
        />
      </div>

      {/* Settings Form: App Identity, Bank Accounts & WA Template */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Card Identitas Aplikasi & Wilayah */}
        <Card className="border-teal-200/80 bg-gradient-to-br from-teal-50/40 via-white to-emerald-50/20 shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Identitas Aplikasi &amp; Wilayah Kavling
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ubah nama aplikasi dan kavling di sini. Pengaturan ini otomatis memperbarui seluruh header, menu navigasi, mobile view, dan dokumen laporan.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="app-name" className="text-xs font-semibold">Nama Aplikasi</Label>
                <Input
                  id="app-name"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Contoh: siWarga Palmut"
                  disabled={!canEdit}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Nama utama sistem yang tampil di sidebar &amp; navigasi atas.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="community-name" className="text-xs font-semibold">Nama Wilayah / Kavling / RT</Label>
                <Input
                  id="community-name"
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  placeholder="Contoh: Kavling Palanji &amp; Mutiara Indah"
                  disabled={!canEdit}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Nama lingkungan perumahan/kavling yang tampil di sub-judul dan laporan.
                </p>
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="p-3 bg-white border border-teal-100 rounded-xl flex items-center justify-between text-xs shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold shrink-0 text-xs">
                  ID
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 truncate">
                    {appName || 'Nama Aplikasi'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {communityName || 'Nama Kavling / Lingkungan'}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full shrink-0">
                Pratinjau Langsung
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bank Accounts */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Nomor Rekening Kas Penampung
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="rek-umum">Rekening Kas Umum (Iuran Wajib)</Label>
                <Input
                  id="rek-umum"
                  value={rekeningUmum}
                  onChange={(e) => setRekeningUmum(e.target.value)}
                  placeholder="Contoh: BCA 1234567890 a.n. Kas Palmut"
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rek-keamanan">Rekening Kas Keamanan (Iuran &amp; Denda)</Label>
                <Input
                  id="rek-keamanan"
                  value={rekeningKeamanan}
                  onChange={(e) => setRekeningKeamanan(e.target.value)}
                  placeholder="Contoh: Mandiri 0987654321 a.n. Kas Keamanan Palmut"
                  disabled={!canEdit}
                />
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Template */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-wa-green" />
                <CardTitle className="text-base font-semibold">
                  Template Pesan Penagihan WhatsApp
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="wa-tmpl">Format Teks WhatsApp</Label>
                <Textarea
                  id="wa-tmpl"
                  rows={5}
                  value={templateWa}
                  onChange={(e) => setTemplateWa(e.target.value)}
                  placeholder="Format pesan tagihan..."
                  disabled={!canEdit}
                />
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Variabel otomatis: <code>{'{nama}'}</code>, <code>{'{blok}'}</code>,{' '}
                <code>{'{bulan_tahun}'}</code>, <code>{'{iuran_wajib}'}</code>,{' '}
                <code>{'{iuran_keamanan}'}</code>, <code>{'{denda}'}</code>,{' '}
                <code>{'{total}'}</code>, <code>{'{rekening}'}</code>.
              </p>
            </CardContent>
          </Card>
        </div>

        {canEdit && (
          <div className="flex justify-end">
            <Button type="submit" disabled={savingSettings} className="gap-2">
              <Save className="w-4 h-4" />
              <span>{savingSettings ? 'Menyimpan...' : 'Simpan Rekening & Template'}</span>
            </Button>
          </div>
        )}
      </form>

      {/* Dialog Change Tariff */}
      <FeeRateChangeDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((prev) => ({ ...prev, open }))}
        feeType={dialogState.feeType}
        currentAmount={dialogState.currentAmount}
        title={dialogState.title}
        onSuccess={loadData}
      />
    </div>
  )
}

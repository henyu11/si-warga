'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Lock, User, ArrowRight, ShieldCheck, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('admin')
  const [password, setPassword] = useState('Admin123!')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!identifier || !password) {
      toast.error('Harap masukkan username/email dan kata sandi.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        toast.error(json.message || 'Login gagal. Periksa kembali akun Anda.')
        return
      }

      toast.success('Login berhasil! Mengalihkan ke dashboard...')
      router.push('/')
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan jaringan atau server.')
    } finally {
      setLoading(false)
    }
  }

  function setDemoAccount(user: string, pass: string) {
    setIdentifier(user)
    setPassword(pass)
  }

  return (
    <div className="w-full max-w-[420px] bg-card rounded-2xl border shadow-lg p-6 sm:p-8 flex flex-col relative overflow-hidden">
      {/* Top Accent Strip */}
      <div className="h-1.5 w-full bg-primary absolute top-0 left-0" />

      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-3">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          siWarga RT 04
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Portal Administrasi &amp; Kas Warga Terintegrasi
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="identifier" className="text-sm font-semibold">
            Username atau Email
          </Label>
          <div className="relative flex items-center">
            <User className="w-4 h-4 text-muted-foreground absolute left-3 pointer-events-none" />
            <Input
              id="identifier"
              name="identifier"
              type="text"
              placeholder="contoh: admin / bendahara.rt04"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="pl-9"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-semibold">
              Kata Sandi
            </Label>
          </div>
          <div className="relative flex items-center">
            <Lock className="w-4 h-4 text-muted-foreground absolute left-3 pointer-events-none" />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan kata sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 p-1 text-muted-foreground hover:text-foreground"
              title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="mt-2 w-full h-11 text-base font-semibold gap-2"
        >
          {loading ? 'Memproses...' : 'Masuk ke Aplikasi'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </Button>
      </form>

      {/* Quick Demo Switcher */}
      <div className="mt-5 pt-4 border-t flex flex-col gap-2">
        <span className="text-xs text-muted-foreground font-medium text-center">
          Pilih Akun Demo Pengurus:
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDemoAccount('admin', 'Admin123!')}
            className="text-xs h-8 px-1"
          >
            Admin
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDemoAccount('bendahara.rt04', 'Bendahara123!')}
            className="text-xs h-8 px-1"
          >
            Bendahara
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDemoAccount('ketua.rt04', 'Ketua123!')}
            className="text-xs h-8 px-1"
          >
            Ketua RT
          </Button>
        </div>
      </div>

      {/* Security Footer Note */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Wallet className="w-4 h-4 text-primary" />
        <span>Dual-Ledger Kas Umum &amp; Kas Keamanan</span>
      </div>
    </div>
  )
}

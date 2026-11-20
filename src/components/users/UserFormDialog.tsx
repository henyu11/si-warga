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
import { toast } from 'sonner'
import type { UserPublic } from '@/server/services/auth.service'

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userToEdit?: UserPublic | null
  onSuccess: () => void
}

export function UserFormDialog({
  open,
  onOpenChange,
  userToEdit,
  onSuccess,
}: UserFormDialogProps) {
  const [fullName, setFullName] = useState(userToEdit?.fullName || '')
  const [username, setUsername] = useState(userToEdit?.username || '')
  const [email, setEmail] = useState(userToEdit?.email || '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'BENDAHARA' | 'KETUA'>(
    userToEdit?.role || 'BENDAHARA'
  )
  const [isActive, setIsActive] = useState<number>(userToEdit ? userToEdit.isActive : 1)
  const [loading, setLoading] = useState(false)

  // Sync state if userToEdit changes
  React.useEffect(() => {
    if (userToEdit) {
      setFullName(userToEdit.fullName)
      setUsername(userToEdit.username)
      setEmail(userToEdit.email || '')
      setPassword('')
      setRole(userToEdit.role)
      setIsActive(userToEdit.isActive)
    } else {
      setFullName('')
      setUsername('')
      setEmail('')
      setPassword('')
      setRole('BENDAHARA')
      setIsActive(1)
    }
  }, [userToEdit, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (userToEdit) {
        // Edit mode
        const payload: Record<string, any> = {
          fullName,
          username,
          email: email || null,
          role,
          isActive,
        }
        if (password) payload.password = password

        const res = await fetch(`/api/v1/users/${userToEdit.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!res.ok || !json.success) {
          toast.error(json.message || 'Gagal memperbarui pengguna')
          return
        }
        toast.success('Pengguna berhasil diperbarui!')
      } else {
        // Create mode
        if (!password || password.length < 8) {
          toast.error('Password minimal 8 karakter')
          setLoading(false)
          return
        }

        const res = await fetch('/api/v1/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName,
            username,
            email: email || null,
            password,
            role,
          }),
        })
        const json = await res.json()
        if (!res.ok || !json.success) {
          toast.error(json.message || 'Gagal menambahkan pengguna')
          return
        }
        toast.success('Pengguna baru berhasil ditambahkan!')
      }

      onOpenChange(false)
      onSuccess()
    } catch {
      toast.error('Terjadi kesalahan pada server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {userToEdit ? 'Ubah Akun Pengurus' : 'Tambah Akun Pengurus Baru'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="u-name">Nama Lengkap</Label>
            <Input
              id="u-name"
              placeholder="Contoh: Budi Santoso"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="u-user">Username</Label>
            <Input
              id="u-user"
              placeholder="Contoh: bendahara.rt04"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="u-email">Email (Opsional)</Label>
            <Input
              id="u-email"
              type="email"
              placeholder="nama@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="u-pass">
              {userToEdit ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password'}
            </Label>
            <Input
              id="u-pass"
              type="password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!userToEdit}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="u-role">Peran / Hak Akses</Label>
            <Select value={role} onValueChange={(val: any) => setRole(val)}>
              <SelectTrigger id="u-role">
                <SelectValue placeholder="Pilih peran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin / Sekretaris (Semua Akses)</SelectItem>
                <SelectItem value="BENDAHARA">Bendahara (Iuran, Kas, WA)</SelectItem>
                <SelectItem value="KETUA">Ketua RT (Monitoring &amp; Audit)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {userToEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="u-status">Status Akun</Label>
              <Select
                value={String(isActive)}
                onValueChange={(val) => setIsActive(Number(val))}
              >
                <SelectTrigger id="u-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Aktif</SelectItem>
                  <SelectItem value="0">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : userToEdit ? 'Simpan Perubahan' : 'Tambah Akun'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

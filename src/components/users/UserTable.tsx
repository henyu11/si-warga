'use client'

import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit2, UserX, Shield, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { UserPublic } from '@/server/services/auth.service'
import { UserFormDialog } from './UserFormDialog'

interface UserTableProps {
  initialUsers: UserPublic[]
}

export function UserTable({ initialUsers }: UserTableProps) {
  const [users, setUsers] = useState<UserPublic[]>(initialUsers)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserPublic | null>(null)

  async function refreshUsers() {
    try {
      const res = await fetch('/api/v1/users')
      const json = await res.json()
      if (json.success) {
        setUsers(json.data)
      }
    } catch {
      toast.error('Gagal memuat ulang daftar pengguna.')
    }
  }

  async function handleDeactivate(u: UserPublic) {
    if (confirm(`Apakah Anda yakin ingin menonaktifkan akun ${u.fullName}?`)) {
      try {
        const res = await fetch(`/api/v1/users/${u.id}`, { method: 'DELETE' })
        const json = await res.json()
        if (res.ok && json.success) {
          toast.success('Pengguna berhasil dinonaktifkan.')
          refreshUsers()
        } else {
          toast.error(json.message || 'Gagal menonaktifkan pengguna.')
        }
      } catch {
        toast.error('Terjadi kesalahan.')
      }
    }
  }

  function handleEdit(u: UserPublic) {
    setSelectedUser(u)
    setDialogOpen(true)
  }

  function handleAddNew() {
    setSelectedUser(null)
    setDialogOpen(true)
  }

  const roleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="default">Admin</Badge>
      case 'BENDAHARA':
        return <Badge variant="kasUmum">Bendahara</Badge>
      case 'KETUA':
        return <Badge variant="kasKeamanan">Ketua RT</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Daftar Pengurus RT
          </h2>
          <p className="text-sm text-muted-foreground">
            Kelola akun pengurus dengan kontrol akses berbasis peran (RBAC).
          </p>
        </div>
        <Button onClick={handleAddNew} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span>Tambah Pengurus</span>
        </Button>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Pengurus</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Peran</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Belum ada data pengurus.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {u.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span>{u.fullName}</span>
                        {u.email && (
                          <span className="text-xs text-muted-foreground font-normal">
                            {u.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {u.username}
                  </TableCell>
                  <TableCell>{roleBadge(u.role)}</TableCell>
                  <TableCell>
                    {u.isActive === 1 ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Nonaktif
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(u)}
                        title="Ubah Pengguna"
                      >
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      {u.isActive === 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivate(u)}
                          title="Nonaktifkan"
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <UserX className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userToEdit={selectedUser}
        onSuccess={refreshUsers}
      />
    </div>
  )
}

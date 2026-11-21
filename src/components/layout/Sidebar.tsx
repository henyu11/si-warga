'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Receipt,
  MessageCircle,
  Wallet,
  Users,
  Settings,
  History,
  UserCog,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from './RoleGuard'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: Array<'ADMIN' | 'BENDAHARA' | 'KETUA'>
}

const navItems: NavItem[] = [
  { title: 'Beranda', href: '/', icon: LayoutDashboard },
  { title: 'Tagihan Iuran', href: '/tagihan', icon: Receipt },
  { title: 'Penagihan WA', href: '/penagihan-wa', icon: MessageCircle },
  { title: 'Dual Buku Kas', href: '/kas', icon: Wallet },
  { title: 'Data Warga', href: '/warga', icon: Users, roles: ['ADMIN', 'BENDAHARA', 'KETUA'] },
  { title: 'Pengaturan', href: '/pengaturan', icon: Settings, roles: ['ADMIN', 'BENDAHARA'] },
  { title: 'Audit Trail', href: '/audit-log', icon: History },
  { title: 'Akun Pengguna', href: '/pengguna', icon: UserCog, roles: ['ADMIN'] },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const user = useUser()

  async function handleLogout() {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' })
      toast.success('Berhasil keluar.')
      window.location.href = '/login'
    } catch {
      toast.error('Gagal logout.')
    }
  }

  const roleLabel = {
    ADMIN: 'Admin / Sekretaris',
    BENDAHARA: 'Bendahara',
    KETUA: 'Ketua RT',
  }

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-card h-screen sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base leading-tight text-foreground">siWarga Palmut</span>
          <span className="text-xs text-muted-foreground truncate">Kavling Palanji &amp; Mutiara Indah</span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          if (item.roles && user && !item.roles.includes(user.role)) {
            return null
          }

          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? 'text-primary-foreground' : 'text-muted-foreground')} />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Footer */}
      {user && (
        <div className="p-4 border-t bg-slate-50/50 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-sm font-semibold text-foreground truncate">{user.fullName}</span>
              <span className="text-xs text-muted-foreground truncate">{roleLabel[user.role]}</span>
            </div>
            <Badge variant="outline" className="text-[10px] shrink-0 font-bold">
              {user.role}
            </Badge>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-rose-600 hover:text-rose-700 hover:underline pt-1 transition-colors w-fit"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Aplikasi</span>
          </button>
        </div>
      )}
    </aside>
  )
}

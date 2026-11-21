'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Receipt,
  MessageCircle,
  Wallet,
  Menu,
  Users,
  Settings,
  History,
  UserCog,
  LogOut,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from './RoleGuard'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const user = useUser()
  const [sheetOpen, setSheetOpen] = useState(false)

  const isMenuPath =
    pathname.startsWith('/warga') ||
    pathname.startsWith('/pengaturan') ||
    pathname.startsWith('/audit-log') ||
    pathname.startsWith('/pengguna')

  const primaryTabs = [
    { title: 'Beranda', href: '/', icon: LayoutDashboard },
    { title: 'Tagihan', href: '/tagihan', icon: Receipt },
    {
      title: 'Tagih WA',
      href: '/penagihan-wa',
      icon: MessageCircle,
      isCenter: true,
    },
    { title: 'Kas', href: '/kas', icon: Wallet },
  ]

  const menuItems = [
    {
      title: 'Data Warga',
      description: 'Daftar kepala keluarga, rumah & status hunian',
      href: '/warga',
      icon: Users,
      roles: ['ADMIN', 'BENDAHARA', 'KETUA'],
    },
    {
      title: 'Pengaturan RT & Tarif',
      description: 'Atur nominal iuran wajib, keamanan, ronda & profil RT',
      href: '/pengaturan',
      icon: Settings,
      roles: ['ADMIN', 'BENDAHARA'],
    },
    {
      title: 'Audit Trail',
      description: 'Riwayat aktivitas pencatatan & perubahan data',
      href: '/audit-log',
      icon: History,
      roles: ['ADMIN', 'BENDAHARA', 'KETUA'],
    },
    {
      title: 'Akun Pengguna',
      description: 'Kelola hak akses pengurus RT',
      href: '/pengguna',
      icon: UserCog,
      roles: ['ADMIN'],
    },
  ]

  async function handleLogout() {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' })
      toast.success('Berhasil keluar.')
      setSheetOpen(false)
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
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t z-40 flex items-center justify-around px-2 shadow-lg safe-area-inset-bottom">
        {primaryTabs.slice(0, 2).map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== '/' && pathname.startsWith(tab.href))
          const Icon = tab.icon

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2 rounded-md transition-colors min-w-[56px]',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] leading-tight">{tab.title}</span>
            </Link>
          )
        })}

        {/* Center WA Button */}
        {(() => {
          const tab = primaryTabs[2]
          const isActive = pathname.startsWith(tab.href)
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center -mt-5 group"
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md transition-transform group-active:scale-95',
                  isActive ? 'bg-wa-green ring-4 ring-wa-green/20' : 'bg-wa-green'
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold text-wa-green mt-1">
                {tab.title}
              </span>
            </Link>
          )
        })()}

        {/* Tab Kas */}
        {(() => {
          const tab = primaryTabs[3]
          const isActive = pathname.startsWith(tab.href)
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2 rounded-md transition-colors min-w-[56px]',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] leading-tight">{tab.title}</span>
            </Link>
          )
        })()}

        {/* 5th Tab: Menu Trigger Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2 rounded-md transition-colors min-w-[56px]',
                isMenuPath
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Menu className="w-5 h-5 mb-0.5" />
              <span className="text-[11px] leading-tight">Menu</span>
            </button>
          </SheetTrigger>

          <SheetContent side="bottom" className="p-0 rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <div className="p-5 pb-3 border-b bg-slate-50/70">
              <SheetHeader className="text-left">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <SheetTitle className="text-base font-bold text-slate-900 leading-tight">
                      siWarga Palmut
                    </SheetTitle>
                    <p className="text-xs text-slate-500">
                      Kavling Palanji &amp; Mutiara Indah
                    </p>
                  </div>
                </div>

                {user && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {user.fullName}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate">
                        {roleLabel[user.role] || user.role}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold shrink-0">
                      {user.role}
                    </Badge>
                  </div>
                )}
              </SheetHeader>
            </div>

            {/* Menu List */}
            <div className="p-3 space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Navigasi Lengkap
              </div>

              {menuItems.map((item) => {
                if (item.roles && user && !item.roles.includes(user.role)) {
                  return null
                }

                const isActive = pathname.startsWith(item.href)
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl transition-all',
                      isActive
                        ? 'bg-primary/10 border border-primary/20 text-primary'
                        : 'hover:bg-slate-100 text-slate-700'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate leading-tight">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  </Link>
                )
              })}
            </div>

            {/* Footer / Logout Button */}
            <div className="p-4 border-t bg-slate-50/50">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  )
}

'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Receipt, MessageCircle, Wallet, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileBottomNav() {
  const pathname = usePathname()

  const tabs = [
    { title: 'Beranda', href: '/', icon: LayoutDashboard },
    { title: 'Tagihan', href: '/tagihan', icon: Receipt },
    {
      title: 'Tagih WA',
      href: '/penagihan-wa',
      icon: MessageCircle,
      isCenter: true,
    },
    { title: 'Kas', href: '/kas', icon: Wallet },
    { title: 'Menu', href: '/warga', icon: Menu },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t z-40 flex items-center justify-around px-2 shadow-lg safe-area-inset-bottom">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href))
        const Icon = tab.icon

        if (tab.isCenter) {
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
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-2 rounded-md transition-colors min-w-[56px]',
              isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">{tab.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}

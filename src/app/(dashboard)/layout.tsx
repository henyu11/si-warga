import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
import { getSessionUser } from '@/server/services/auth.service'
import { getAppSettings } from '@/server/services/settings.service'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { UserProvider } from '@/components/layout/RoleGuard'
import { AppSettingsProvider } from '@/components/layout/AppSettingsProvider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }

  const settings = await getAppSettings()

  return (
    <UserProvider user={user}>
      <AppSettingsProvider initialSettings={settings}>
        <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
            {children}
          </div>
          <MobileBottomNav />
        </div>
      </AppSettingsProvider>
    </UserProvider>
  )
}

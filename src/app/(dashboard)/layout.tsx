import { redirect } from 'next/navigation'
import { getSessionUser } from '@/server/services/auth.service'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { UserProvider } from '@/components/layout/RoleGuard'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }

  return (
    <UserProvider user={user}>
      <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
          {children}
        </div>
        <MobileBottomNav />
      </div>
    </UserProvider>
  )
}

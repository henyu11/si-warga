import { getSessionUser } from '@/server/services/auth.service'

export default async function DashboardPage() {
  const user = await getSessionUser()

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">
          Selamat Datang, {user?.fullName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Sistem Informasi &amp; Manajemen Kas Lingkungan RT 04
        </p>
      </div>
    </div>
  )
}

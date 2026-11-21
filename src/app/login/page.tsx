import { redirect } from 'next/navigation'
import { getSessionUser } from '@/server/services/auth.service'
import { getAppSettings } from '@/server/services/settings.service'
import { LoginForm } from '@/components/auth/LoginForm'

export default async function LoginPage() {
  const user = await getSessionUser()
  if (user) {
    redirect('/')
  }

  const settings = await getAppSettings()

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50">
      <LoginForm
        appName={settings.app_name || 'siWarga Palmut'}
        communityName={settings.community_name || 'Kavling Palanji & Mutiara Indah'}
      />
    </main>
  )
}

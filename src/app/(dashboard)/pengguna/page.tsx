import { redirect } from 'next/navigation'
import { getSessionUser } from '@/server/services/auth.service'
import { listUsers } from '@/server/services/user.service'
import { UserTable } from '@/components/users/UserTable'

export default async function PenggunaPage() {
  const actor = await getSessionUser()
  if (!actor || actor.role !== 'ADMIN') {
    redirect('/')
  }

  const users = await listUsers()

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <UserTable initialUsers={users} />
    </div>
  )
}

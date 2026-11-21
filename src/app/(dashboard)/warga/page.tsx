import { redirect } from 'next/navigation'
import { getSessionUser } from '@/server/services/auth.service'
import { listHouseholds } from '@/server/services/household.service'
import { HouseholdTable } from '@/components/households/HouseholdTable'

export default async function WargaPage() {
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }

  const households = await listHouseholds()

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <HouseholdTable initialHouseholds={households} />
    </div>
  )
}

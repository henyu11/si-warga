import { redirect } from 'next/navigation'
import { getSessionUser } from '@/server/services/auth.service'
import { listBills } from '@/server/services/billing.service'
import { BillsListView } from '@/components/billing/BillsListView'

export default async function TagihanPage() {
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }

  const now = new Date()
  const bills = await listBills({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  })

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
      <BillsListView initialBills={bills} />
    </div>
  )
}

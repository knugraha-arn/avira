import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { RiskLibraryClient } from './RiskLibraryClient'
import type { AvrUserProfile } from '@/types'
import { canWrite } from '@/lib/roles'

export const metadata = { title: 'Risk Library' }
export const dynamic  = 'force-dynamic'

export default async function RiskLibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('avr_user_profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  // Only admin, risk_manager, auditor
  if (!['admin', 'risk_manager', 'auditor'].includes(profile.role)) redirect('/dashboard')

  const { data: items } = await supabase
    .from('avr_risk_library')
    .select('*, creator:avr_user_profiles!avr_risk_library_created_by_fkey(full_name), risk:avr_risks(risk_code, title)')
    .order('created_at', { ascending: false })

  const { count: unreadCount } = await supabase
    .from('avr_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id).eq('is_read', false)

  return (
    <div className="flex min-h-screen bg-brand-gray">
      <Sidebar profile={profile as AvrUserProfile} unreadCount={unreadCount ?? 0} />
      <main className="flex-1 ml-56 min-w-0">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <RiskLibraryClient
            initialItems={items ?? []}
            canWrite={canWrite(profile.role)}
            currentUserId={user.id}
          />
        </div>
      </main>
    </div>
  )
}

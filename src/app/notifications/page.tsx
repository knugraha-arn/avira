import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { NotificationsClient } from './NotificationsClient'
import type { AvrUserProfile } from '@/types'

export const metadata = { title: 'Notifikasi' }
export const dynamic  = 'force-dynamic'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('avr_user_profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const { data: notifications } = await supabase
    .from('avr_notifications')
    .select('*, risk:avr_risks(risk_code, title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const { count: unreadCount } = await supabase
    .from('avr_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return (
    <div className="flex min-h-screen bg-brand-gray">
      <Sidebar profile={profile as AvrUserProfile} unreadCount={unreadCount ?? 0} />
      <main className="flex-1 ml-56 min-w-0">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <NotificationsClient
            initialNotifications={notifications ?? []}
            userId={user.id}
          />
        </div>
      </main>
    </div>
  )
}

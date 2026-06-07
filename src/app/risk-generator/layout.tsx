import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import type { AvrUserProfile } from '@/types'

export const metadata = { title: 'Risk Generator' }

export default async function RiskGeneratorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('avr_user_profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const { count: unreadCount } = await supabase
    .from('avr_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id).eq('is_read', false)

  return (
    <div className="flex min-h-screen bg-brand-gray">
      <Sidebar profile={profile as AvrUserProfile} unreadCount={unreadCount ?? 0} />
      <main className="flex-1 ml-56 min-w-0">
        <div className="max-w-4xl mx-auto px-6 py-6">{children}</div>
      </main>
    </div>
  )
}

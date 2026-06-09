import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsersClient } from './UsersClient'

export const metadata = { title: 'Pengguna' }
export const dynamic  = 'force-dynamic'

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('avr_user_profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // Fetch users without complex joins to avoid ambiguity
  const { data: users } = await supabase
    .from('avr_user_profiles')
    .select('*')
    .order('full_name')

  // Fetch unit kerja separately
  const { data: unitKerjaList } = await supabase
    .from('avr_unit_kerja')
    .select('id, kode, nama')
    .eq('is_active', true)
    .order('nama')

  // Fetch inviter names separately
  const inviterIds = [...new Set((users ?? []).map(u => u.invited_by).filter(Boolean))]
  const { data: inviters } = inviterIds.length > 0
    ? await supabase.from('avr_user_profiles').select('id, full_name').in('id', inviterIds)
    : { data: [] }

  // Merge unit_kerja data into users
  const ukMap = new Map((unitKerjaList ?? []).map(uk => [uk.id, uk]))
  const invMap = new Map((inviters ?? []).map(i => [i.id, i]))

  const enrichedUsers = (users ?? []).map(u => ({
    ...u,
    unit_kerja: u.unit_kerja_id ? ukMap.get(u.unit_kerja_id) ?? null : null,
    inviter:    u.invited_by ? invMap.get(u.invited_by) ?? null : null,
  }))

  return (
    <UsersClient
      initialUsers={enrichedUsers}
      unitKerjaList={unitKerjaList ?? []}
      currentUserId={user.id}
    />
  )
}

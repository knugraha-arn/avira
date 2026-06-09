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

  const [
    { data: users },
    { data: unitKerjaList },
    { data: invites },
  ] = await Promise.all([
    supabase.from('avr_user_profiles').select('*').order('full_name'),
    supabase.from('avr_unit_kerja').select('id, kode, nama').eq('is_active', true).order('nama'),
    supabase.from('avr_user_invites').select('*').order('invited_at', { ascending: false }),
  ])

  // Merge unit_kerja into users
  const ukMap = new Map((unitKerjaList ?? []).map(uk => [uk.id, uk]))

  const enrichedUsers = (users ?? []).map(u => ({
    ...u,
    unit_kerja: u.unit_kerja_id ? ukMap.get(u.unit_kerja_id) ?? null : null,
  }))

  const enrichedInvites = (invites ?? []).map(i => ({
    ...i,
    unit_kerja: i.unit_kerja_id ? ukMap.get(i.unit_kerja_id) ?? null : null,
  }))

  return (
    <UsersClient
      initialUsers={enrichedUsers}
      initialInvites={enrichedInvites}
      unitKerjaList={unitKerjaList ?? []}
      currentUserId={user.id}
    />
  )
}

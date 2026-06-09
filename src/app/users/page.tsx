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

  const [{ data: users }, { data: unitKerjaList }] = await Promise.all([
    supabase
      .from('avr_user_profiles')
      .select(`
        *,
        unit_kerja:avr_unit_kerja(id, kode, nama),
        inviter:avr_user_profiles!avr_user_profiles_invited_by_fkey(full_name)
      `)
      .order('full_name'),
    supabase
      .from('avr_unit_kerja')
      .select('id, kode, nama')
      .eq('is_active', true)
      .order('nama'),
  ])

  return (
    <UsersClient
      initialUsers={users ?? []}
      unitKerjaList={unitKerjaList ?? []}
      currentUserId={user.id}
    />
  )
}

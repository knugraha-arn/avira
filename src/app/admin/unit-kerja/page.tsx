import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UnitKerjaClient } from './client'

export const metadata = { title: 'Unit Kerja' }

export default async function UnitKerjaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('avr_user_profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: list } = await supabase
    .from('avr_unit_kerja')
    .select('*')
    .order('nama')

  return <UnitKerjaClient initialData={list ?? []} />
}

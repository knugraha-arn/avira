import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PihakLainClient } from './client'

export const metadata = { title: 'Pihak Lain' }

export default async function PihakLainPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('avr_user_profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: list } = await supabase
    .from('avr_third_parties')
    .select('*')
    .order('nama')

  return <PihakLainClient initialData={list ?? []} />
}

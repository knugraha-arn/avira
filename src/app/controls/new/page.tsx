import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ControlForm } from '../ControlForm'

export const metadata = { title: 'Tambah Kontrol' }

export default async function NewControlPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('avr_user_profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'risk_manager'].includes(profile?.role ?? '')) redirect('/controls')

  const { data: users } = await supabase
    .from('avr_user_profiles')
    .select('id, full_name, job_title')
    .eq('is_active', true)
    .order('full_name')

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/controls" className="inline-flex items-center gap-1.5 text-xs text-black/40 hover:text-black mb-3 transition-colors">
          <ArrowLeft size={13} /> Kembali ke Control Library
        </Link>
        <span className="eyebrow">Control Library</span>
        <h1 className="mt-1">Tambah Kontrol Baru</h1>
        <p className="text-sm text-black/50 mt-0.5">Kontrol ini bisa dipasang ke satu atau lebih risiko setelah dibuat</p>
      </div>
      <ControlForm users={users ?? []} />
    </div>
  )
}

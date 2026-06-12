import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { RiskForm } from '@/components/risk/RiskForm'
import { canWrite } from '@/lib/roles'

export const metadata = { title: 'Tambah Risiko' }

export default async function NewRiskPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('avr_user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !canWrite(profile.role)) redirect('/risks')

  const [{ data: unitKerjaList }, { data: users }] = await Promise.all([
    supabase.from('avr_unit_kerja').select('id, kode, nama').eq('is_active', true).order('nama'),
    supabase.from('avr_user_profiles').select('id, full_name, job_title').eq('is_active', true).order('full_name'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <Link href="/risks" className="inline-flex items-center gap-1.5 text-xs text-black/40 hover:text-black mb-3 transition-colors">
          <ArrowLeft size={13} /> Kembali ke Risk Register
        </Link>
        <span className="eyebrow">Risk Register</span>
        <h1 className="mt-1">Tambah Risiko Baru</h1>
        <p className="text-sm text-black/50 mt-0.5">Isi seluruh informasi risiko sesuai hasil identifikasi</p>
      </div>
      <RiskForm
        unitKerjaList={unitKerjaList ?? []}
        users={users ?? []}
        currentUserId={user.id}
      />
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EditRiskForm } from './EditRiskForm'

interface Props { params: Promise<{ id: string }> }

export default async function EditRiskPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('avr_user_profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'risk_manager'].includes(profile?.role ?? '')) redirect(`/risks/${id}`)

  const [
    { data: risk },
    { data: unitKerjaList },
    { data: users },
    { data: thirdParties },
    { data: allControls },
    { data: linkedControls },
  ] = await Promise.all([
    supabase.from('avr_risks').select('*').eq('id', id).single(),
    supabase.from('avr_unit_kerja').select('id, kode, nama').order('nama'),
    supabase.from('avr_user_profiles').select('id, full_name, job_title').eq('is_active', true).order('full_name'),
    supabase.from('avr_third_parties').select('id, nama, tipe').order('nama'),
    supabase.from('avr_controls').select('id, control_code, nama, tipe, status').eq('is_active', true).order('control_code'),
    supabase.from('avr_risk_controls').select('control_id').eq('risk_id', id),
  ])

  if (!risk) notFound()
  if (risk.status === 'Closed') redirect(`/risks/${id}`)

  const linkedControlIds = (linkedControls ?? []).map((lc: any) => lc.control_id)

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href={`/risks/${id}`} className="inline-flex items-center gap-1.5 text-xs text-black/40 hover:text-black mb-3 transition-colors">
          <ArrowLeft size={13} /> Kembali ke Detail Risiko
        </Link>
        <span className="eyebrow">Edit</span>
        <h1 className="mt-1">Edit Risiko</h1>
        <p className="text-sm text-black/50 mt-0.5">
          <span className="font-mono text-brand-blue">{risk.risk_code}</span> · {risk.title}
        </p>
      </div>
      <EditRiskForm
        risk={risk}
        unitKerjaList={unitKerjaList ?? []}
        users={users ?? []}
        thirdParties={thirdParties ?? []}
        allControls={allControls ?? []}
        linkedControlIds={linkedControlIds}
        currentUserId={user.id}
      />
    </div>
  )
}

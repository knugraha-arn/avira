import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ApproveClosureForm } from './ApproveClosureForm'

interface Props { params: Promise<{ id: string }> }

export default async function ApproveClosurePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('avr_user_profiles').select('role, full_name').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect(`/risks/${id}`)

  const { data: risk } = await supabase
    .from('avr_risks')
    .select('id, risk_code, title, status, inherent_classification')
    .eq('id', id).single()
  if (!risk) notFound()

  const { data: closure } = await supabase
    .from('avr_risk_closures')
    .select(`
      *,
      requester:avr_user_profiles!avr_risk_closures_requested_by_fkey(full_name, job_title, email),
      approver:avr_user_profiles!avr_risk_closures_approver_id_fkey(full_name)
    `)
    .eq('risk_id', id)
    .eq('status', 'Pending')
    .single()

  if (!closure) redirect(`/risks/${id}`)
  if (closure.approver_id !== user.id) redirect(`/risks/${id}`)

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href={`/risks/${id}`} className="inline-flex items-center gap-1.5 text-xs text-black/40 hover:text-black mb-3 transition-colors">
          <ArrowLeft size={13} /> Kembali ke Detail Risiko
        </Link>
        <span className="eyebrow">Approval</span>
        <h1 className="mt-1">Review Penutupan Risiko</h1>
        <p className="text-sm text-black/50 mt-0.5">
          <span className="font-mono text-brand-blue">{risk.risk_code}</span> · {risk.title}
        </p>
      </div>
      <ApproveClosureForm
        risk={risk}
        closure={closure}
        currentUserId={user.id}
        approverName={profile?.full_name ?? 'Admin'}
      />
    </div>
  )
}

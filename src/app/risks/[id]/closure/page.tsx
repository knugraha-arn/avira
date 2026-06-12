import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ClosureForm } from './ClosureForm'

interface Props { params: Promise<{ id: string }> }

export default async function ClosurePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: risk } = await supabase
    .from('avr_risks')
    .select('id, risk_code, title, status, risk_owner_id, inherent_classification')
    .eq('id', id).single()
  if (!risk) notFound()
  if (risk.status === 'Closed') redirect(`/risks/${id}`)

  // Only risk owner or admin can request closure
  const { data: profile } = await supabase
    .from('avr_user_profiles').select('role').eq('id', user.id).single()
  const isOwner = risk.risk_owner_id === user.id
  const isAdmin = profile?.role === 'admin'
  if (!isOwner && !isAdmin) redirect(`/risks/${id}`)

  // Get admins as approvers (exclude self)
  const { data: approvers } = await supabase
    .from('avr_user_profiles')
    .select('id, full_name, job_title')
    .eq('role', 'admin')
    .eq('is_active', true)
    .neq('id', user.id)
    .order('full_name')

  // Check pending closure
  const { data: pendingClosure } = await supabase
    .from('avr_risk_closures')
    .select('id, status, requested_at')
    .eq('risk_id', id)
    .eq('status', 'Pending')
    .single()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href={`/risks/${id}`} className="inline-flex items-center gap-1.5 text-xs text-black/40 hover:text-black mb-3 transition-colors">
          <ArrowLeft size={13} /> Kembali ke Detail Risiko
        </Link>
        <span className="eyebrow">Closure</span>
        <h1 className="mt-1">Request Penutupan Risiko</h1>
        <p className="text-sm text-black/50 mt-0.5">
          <span className="font-mono text-brand-blue">{risk.risk_code}</span> · {risk.title}
        </p>
      </div>

      {pendingClosure ? (
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <span className="badge bg-brand-lime/20 text-brand-navy border-brand-lime/40">Menunggu Approval</span>
          </div>
          <p className="text-sm text-black/60">
            Request penutupan sudah diajukan pada {new Date(pendingClosure.requested_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Jakarta' })} WIB.
            Menunggu persetujuan dari admin.
          </p>
          <Link href={`/risks/${id}`} className="btn-secondary mt-4 inline-flex">Kembali</Link>
        </div>
      ) : (
        <ClosureForm
          riskId={id}
          approvers={approvers ?? []}
          currentUserId={user.id}
        />
      )}
    </div>
  )
}

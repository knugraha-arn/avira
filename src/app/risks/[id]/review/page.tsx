import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ReviewForm } from './ReviewForm'

interface Props { params: Promise<{ id: string }> }

export default async function ReviewPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('avr_user_profiles').select('role').eq('id', user.id).single()
  if (!['admin','risk_manager'].includes(profile?.role ?? '')) redirect(`/risks/${id}`)

  const [{ data: risk }, { data: reviews }] = await Promise.all([
    supabase.from('avr_risks')
      .select(`
        id, risk_code, title, description, category, status,
        likelihood, impact, inherent_score, inherent_classification,
        residual_likelihood, residual_impact, residual_score, residual_classification,
        treatment_strategy, treatment_notes, existing_control,
        date_identified, next_review_date,
        risk_owner:avr_user_profiles!avr_risks_risk_owner_id_fkey(full_name, job_title),
        treatment_owner:avr_user_profiles!avr_risks_treatment_owner_id_fkey(full_name, job_title),
        unit_kerja:avr_unit_kerja(nama)
      `)
      .eq('id', id).single(),
    supabase.from('avr_risk_reviews')
      .select('*, reviewer:avr_user_profiles(full_name)')
      .eq('risk_id', id)
      .order('review_date', { ascending: false })
      .limit(5),
  ])

  if (!risk) notFound()
  if (risk.status === 'Closed') redirect(`/risks/${id}`)

  return (
    <div className="space-y-4">
      <div>
        <Link href={`/risks/${id}`} className="inline-flex items-center gap-1.5 text-xs text-black/40 hover:text-black mb-3 transition-colors">
          <ArrowLeft size={13} /> Kembali ke Detail Risiko
        </Link>
        <span className="eyebrow">Review</span>
        <h1 className="mt-1">Tambah Review</h1>
        <p className="text-sm text-black/50 mt-0.5">
          <span className="font-mono text-brand-blue">{risk.risk_code}</span> · {risk.title}
        </p>
      </div>
      <ReviewForm risk={risk as any} reviews={reviews ?? []} currentUserId={user.id} />
    </div>
  )
}

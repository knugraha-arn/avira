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

  const { data: risk } = await supabase
    .from('avr_risks')
    .select('id, risk_code, title, likelihood, impact, inherent_score, inherent_classification, status')
    .eq('id', id).single()
  if (!risk) notFound()
  if (risk.status === 'Closed') redirect(`/risks/${id}`)

  return (
    <div className="space-y-6 max-w-2xl">
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
      <ReviewForm risk={risk} currentUserId={user.id} />
    </div>
  )
}

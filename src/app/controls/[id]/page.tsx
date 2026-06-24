import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { ControlForm } from '../ControlForm'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'

interface Props { params: Promise<{ id: string }> }

export default async function ControlDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('avr_user_profiles').select('role').eq('id', user.id).single()
  const canEdit = ['admin', 'risk_manager'].includes(profile?.role ?? '')

  const [{ data: control }, { data: users }, { data: linkedRisks }] = await Promise.all([
    supabase.from('avr_controls').select('*').eq('id', id).single(),
    supabase.from('avr_user_profiles').select('id, full_name, job_title').eq('is_active', true).order('full_name'),
    supabase.from('avr_risk_controls')
      .select('risk:avr_risks(id, risk_code, title, inherent_classification, status)')
      .eq('control_id', id),
  ])

  if (!control) notFound()

  const activeLinkedRisks = (linkedRisks ?? [])
    .map((r: any) => r.risk)
    .filter((r: any) => r && r.status !== 'Closed')

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/controls" className="inline-flex items-center gap-1.5 text-xs text-black/40 hover:text-black mb-3 transition-colors">
          <ArrowLeft size={13} /> Kembali ke Control Library
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs font-semibold text-brand-blue">{control.control_code}</span>
        </div>
        <h1 className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-brand-blue" />
          {control.nama}
        </h1>
      </div>

      {/* Risiko terhubung */}
      {activeLinkedRisks.length > 0 && (
        <div className="card bg-blue-50/40 border-brand-blue/15">
          <p className="text-xs font-medium text-brand-navy mb-2">
            Dipasang ke {activeLinkedRisks.length} risiko aktif
          </p>
          <div className="space-y-1.5">
            {activeLinkedRisks.map((r: any) => (
              <Link key={r.id} href={`/risks/${r.id}`}
                className="flex items-center gap-2 text-xs hover:underline">
                <span className="font-mono text-brand-blue">{r.risk_code}</span>
                <span className="text-black/70">{r.title}</span>
                <ClassificationBadge classification={r.inherent_classification} size="sm" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {!canEdit ? (
        <div className="card">
          <p className="text-sm text-black/50">{control.deskripsi ?? 'Tidak ada deskripsi'}</p>
        </div>
      ) : (
        <ControlForm
          initial={control}
          users={users ?? []}
          isEdit
        />
      )}
    </div>
  )
}

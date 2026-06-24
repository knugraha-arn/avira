import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Calendar, User, Building2,
  Shield, Clock, Flag, CheckCircle, AlertCircle,
  Pencil, XCircle,
} from 'lucide-react'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate, formatTimestamp, LIKELIHOOD_LABELS, IMPACT_LABELS } from '@/lib/utils'
import { MitigationSection } from './MitigationSection'
import { IncidentSection } from './IncidentSection'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ id: string }> }

export default async function RiskDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: risk } = await supabase
    .from('avr_risks')
    .select(`
      *,
      risk_owner:avr_user_profiles!avr_risks_risk_owner_id_fkey(id, full_name, job_title),
      treatment_owner:avr_user_profiles!avr_risks_treatment_owner_id_fkey(id, full_name, job_title),
      unit_kerja:avr_unit_kerja(id, kode, nama),
      third_party:avr_third_parties(id, nama, tipe)
    `)
    .eq('id', id).single()
  if (!risk) notFound()

  const [
    { data: mitigationLogs },
    { data: reviews },
    { data: auditLogs },
    { data: profile },
    { data: pendingClosure },
    { data: incidents },
  ] = await Promise.all([
    supabase.from('avr_mitigation_logs')
      .select('*, updater:avr_user_profiles(full_name)')
      .eq('risk_id', id).order('update_date', { ascending: false }),
    supabase.from('avr_risk_reviews')
      .select('*, reviewer:avr_user_profiles(full_name)')
      .eq('risk_id', id).order('review_date', { ascending: false }),
    supabase.from('avr_audit_logs')
      .select('*, actor:avr_user_profiles(full_name)')
      .eq('risk_id', id).order('created_at', { ascending: false }).limit(20),
    supabase.from('avr_user_profiles').select('role').eq('id', user.id).single(),
    supabase.from('avr_risk_closures')
      .select('id, status, approver:avr_user_profiles!avr_risk_closures_approver_id_fkey(full_name), requested_at')
      .eq('risk_id', id).eq('status', 'Pending').maybeSingle(),
    supabase.from('avr_risk_incidents')
      .select('*, reporter:avr_user_profiles(full_name)')
      .eq('risk_id', id).order('incident_date', { ascending: false }),
  ])

  const canEdit    = ['admin','risk_manager'].includes(profile?.role ?? '')
  const isAdmin    = profile?.role === 'admin'
  const isOwner    = risk.risk_owner_id === user.id
  const canClose   = (isOwner || isAdmin) && risk.status !== 'Closed'
  const isClosed   = risk.status === 'Closed'

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div>
        <Link href="/risks" className="inline-flex items-center gap-1.5 text-xs text-black/40 hover:text-black mb-3 transition-colors">
          <ArrowLeft size={13} /> Kembali ke Risk Register
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-xs font-semibold text-brand-blue">{risk.risk_code}</span>
              <ClassificationBadge classification={risk.inherent_classification} />
              <StatusBadge status={risk.status} />
              {risk.is_mrm_flagged && (
                <span className="badge bg-brand-lime text-brand-navy border-brand-lime">
                  <Flag size={10} /> MRM
                </span>
              )}
            </div>
            <h1 className="text-xl font-semibold text-brand-navy leading-snug">{risk.title}</h1>
            {risk.description && (
              <p className="text-sm text-black/50 mt-1 leading-relaxed">{risk.description}</p>
            )}
          </div>

          {/* Action buttons */}
          {!isClosed && (
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {canEdit && (
                <Link href={`/risks/${id}/edit`} className="btn-secondary text-sm gap-1.5">
                  <Pencil size={13} /> Edit
                </Link>
              )}
              {canEdit && (
                <Link href={`/risks/${id}/review`} className="btn-secondary text-sm gap-1.5">
                  <Clock size={13} /> Review
                </Link>
              )}
              {canClose && !pendingClosure && (
                <Link href={`/risks/${id}/closure`} className="btn-secondary text-sm gap-1.5">
                  <XCircle size={13} /> Tutup Risiko
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pending closure banner */}
      {pendingClosure && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-brand-lime/10 border border-brand-lime/30">
          <Clock size={15} className="text-brand-navy shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-brand-navy">Menunggu Approval Penutupan</p>
            <p className="text-xs text-black/50 mt-0.5">
              Diajukan {formatTimestamp(pendingClosure.requested_at)} · Approver: {(pendingClosure as any).approver?.full_name ?? '—'}
            </p>
          </div>
          {isAdmin && (
            <Link href={`/risks/${id}/approve-closure`} className="btn-primary text-xs gap-1">
              <CheckCircle size={13} /> Review Approval
            </Link>
          )}
        </div>
      )}

      {/* Closed banner */}
      {isClosed && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-black/4 border border-black/8">
          <CheckCircle size={15} className="text-black/40 shrink-0" />
          <p className="text-sm text-black/50">Risiko ini sudah ditutup. Seluruh data bersifat read-only.</p>
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="card space-y-3">
          <h3 className="mb-3">Identitas Risiko</h3>
          <InfoRow icon={<Shield size={13} />} label="Kategori" value={risk.category} />
          <InfoRow icon={<Building2 size={13} />} label="Unit Kerja"
            value={(risk as any).unit_kerja?.nama ?? '—'}
            sub={(risk as any).unit_kerja?.kode} />
          {(risk as any).third_party && (
            <InfoRow icon={<Building2 size={13} />} label="Pihak Lain"
              value={(risk as any).third_party.nama}
              sub={(risk as any).third_party.tipe} />
          )}
          {risk.asset_terkait && (
            <InfoRow icon={<Shield size={13} />} label="Aset Terkait" value={risk.asset_terkait} />
          )}
          <InfoRow icon={<Calendar size={13} />} label="Tanggal Identifikasi" value={formatDate(risk.date_identified)} />
          {risk.existing_control && (
            <div>
              <p className="text-xs text-black/40 mb-1">Kontrol yang Sudah Ada</p>
              <p className="text-sm text-black/70 leading-relaxed">{risk.existing_control}</p>
            </div>
          )}
        </div>

        <div className="card space-y-3">
          <h3 className="mb-3">Ownership & Penilaian</h3>
          <InfoRow icon={<User size={13} />} label="Risk Owner (Accountable)"
            value={(risk as any).risk_owner?.full_name ?? '—'}
            sub={(risk as any).risk_owner?.job_title} />
          <InfoRow icon={<User size={13} />} label="Treatment Owner (Responsible)"
            value={(risk as any).treatment_owner?.full_name ?? '—'}
            sub={(risk as any).treatment_owner?.job_title} />

          <div className="border-t border-black/5 pt-3">
            <p className="text-xs text-black/40 mb-2">Penilaian Risiko</p>
            <div className="grid grid-cols-2 gap-3">
              <ScoreCard label="Inherent" score={risk.inherent_score}
                classification={risk.inherent_classification}
                likelihood={risk.likelihood} impact={risk.impact} />
              {risk.residual_score > 0 && (
                <ScoreCard label="Residual" score={risk.residual_score}
                  classification={risk.residual_classification}
                  likelihood={risk.residual_likelihood} impact={risk.residual_impact} />
              )}
            </div>
          </div>

          <div className="border-t border-black/5 pt-3">
            <p className="text-xs text-black/40 mb-1">Treatment Strategy</p>
            <p className="text-sm font-medium">{risk.treatment_strategy ?? '—'}</p>
            {risk.treatment_notes && (
              <p className="text-xs text-black/50 mt-1 leading-relaxed">{risk.treatment_notes}</p>
            )}
          </div>

          <div className="border-t border-black/5 pt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-black/40">Review Berikutnya</p>
              {risk.next_review_date && (() => {
                const days = Math.ceil((new Date(risk.next_review_date).getTime() - Date.now()) / 86400000)
                return (
                  <span className={`text-xs font-medium ${days < 0 ? 'text-red-500' : days <= 14 ? 'text-[#7A4C00]' : 'text-black/40'}`}>
                    {days < 0 ? `${Math.abs(days)} hari lalu` : days === 0 ? 'Hari ini' : `${days} hari lagi`}
                  </span>
                )
              })()}
            </div>
            <p className="text-sm font-medium mt-0.5">{formatDate(risk.next_review_date)}</p>
          </div>
        </div>
      </div>

      {/* Mitigation Timeline */}
      <MitigationSection
        riskId={id} riskStatus={risk.status}
        logs={mitigationLogs ?? []}
        canEdit={canEdit} currentUserId={user.id}
      />

      {/* Insiden Terkait */}
      <IncidentSection
        riskId={id}
        incidents={incidents ?? []}
        canEdit={canEdit} currentUserId={user.id}
      />

      {/* Review History */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3>Histori Review</h3>
          {canEdit && !isClosed && (
            <Link href={`/risks/${id}/review`} className="btn-primary text-xs gap-1">
              <Clock size={13} /> Tambah Review
            </Link>
          )}
        </div>
        {reviews?.length === 0 ? (
          <p className="text-sm text-black/30 py-4 text-center">Belum ada review</p>
        ) : (
          <div className="space-y-3">
            {reviews?.map(r => (
              <div key={r.id} className="flex gap-4 p-3 rounded-lg bg-brand-gray">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-medium text-brand-navy">{formatTimestamp(r.review_date)}</span>
                    <span className="badge bg-blue-50 text-brand-blue border-brand-blue/20 text-[10px]">{r.review_decision}</span>
                    <span className="text-xs text-black/40">oleh {(r as any).reviewer?.full_name ?? '—'}</span>
                  </div>
                  {r.review_notes && <p className="text-xs text-black/60 leading-relaxed">{r.review_notes}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-black/40">Score: {r.previous_score ?? '—'} → {r.current_score}</span>
                    {r.current_class && <ClassificationBadge classification={r.current_class} size="sm" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Trail */}
      <div className="card">
        <h3 className="mb-4">Audit Trail</h3>
        {auditLogs?.length === 0 ? (
          <p className="text-sm text-black/30 py-4 text-center">Belum ada aktivitas</p>
        ) : (
          <div className="space-y-2">
            {auditLogs?.map(log => (
              <div key={log.id} className="flex items-start gap-3 py-2 border-b border-black/4 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-blue mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium">{log.action}</span>
                    <span className="text-xs text-black/40">oleh {(log as any).actor?.full_name ?? '—'}</span>
                  </div>
                  <span className="text-xs text-black/30">{formatTimestamp(log.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

function InfoRow({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-black/30 mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-black/40">{label}</p>
        <p className="text-sm font-medium text-black">{value}</p>
        {sub && <p className="text-xs text-black/40">{sub}</p>}
      </div>
    </div>
  )
}

function ScoreCard({ label, score, classification, likelihood, impact }: {
  label: string; score: number; classification: string | null
  likelihood: number | null; impact: number | null
}) {
  return (
    <div className="p-3 rounded-lg bg-brand-gray">
      <p className="text-xs text-black/40 mb-1">{label}</p>
      <p className="text-2xl font-bold text-brand-navy">{score}</p>
      <p className="text-xs text-black/30">L{likelihood} × I{impact}</p>
      {classification && <div className="mt-1"><ClassificationBadge classification={classification as any} size="sm" /></div>}
    </div>
  )
}

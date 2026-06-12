'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { classificationBadge, LIKELIHOOD_LABELS, IMPACT_LABELS, formatDate, formatTimestamp } from '@/lib/utils'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import type { AvrClassification } from '@/types'
import {
  Shield, User, Building2, Calendar, ChevronDown, ChevronUp, Clock,
} from 'lucide-react'

const MATRIX: Record<string, AvrClassification> = {
  '1-1':'Low','1-2':'Low','1-3':'Low','1-4':'Medium','1-5':'Medium',
  '2-1':'Low','2-2':'Low','2-3':'Medium','2-4':'Medium','2-5':'High',
  '3-1':'Low','3-2':'Medium','3-3':'Medium','3-4':'High','3-5':'Extreme',
  '4-1':'Medium','4-2':'Medium','4-3':'High','4-4':'High','4-5':'Extreme',
  '5-1':'Medium','5-2':'High','5-3':'High','5-4':'Extreme','5-5':'Extreme',
}

const DECISIONS = [
  { value: 'No Change',   label: 'No Change',   desc: 'Risiko tidak berubah, lanjutkan monitoring' },
  { value: 'Update Risk', label: 'Update Risk',  desc: 'Perbarui skor risiko berdasarkan kondisi terkini' },
  { value: 'Escalate',    label: 'Eskalasi',     desc: 'Tandai untuk dibahas di Management Review Meeting' },
  { value: 'Close Risk',  label: 'Tutup Risiko', desc: 'Ajukan penutupan risiko — memerlukan approval admin' },
]

interface Risk {
  id: string
  risk_code: string
  title: string
  description?: string | null
  category?: string | null
  status: string
  likelihood: number
  impact: number
  inherent_score: number
  inherent_classification: string
  residual_likelihood?: number | null
  residual_impact?: number | null
  residual_score?: number | null
  residual_classification?: string | null
  treatment_strategy?: string | null
  treatment_notes?: string | null
  existing_control?: string | null
  date_identified?: string | null
  next_review_date?: string | null
  risk_owner?: { full_name: string; job_title?: string | null } | null
  treatment_owner?: { full_name: string; job_title?: string | null } | null
  unit_kerja?: { nama: string } | null
}

interface Review {
  id: string
  review_date: string
  review_decision: string
  review_notes?: string | null
  previous_score?: number | null
  current_score?: number | null
  current_class?: string | null
  reviewer?: { full_name: string } | null
}

export function ReviewForm({
  risk,
  reviews,
  currentUserId,
}: {
  risk: Risk
  reviews: Review[]
  currentUserId: string
}) {
  const router = useRouter()
  const [loading, setLoading]       = useState(false)
  const [decision, setDecision]     = useState('No Change')
  const [notes, setNotes]           = useState('')
  const [likelihood, setLikelihood] = useState(risk.likelihood)
  const [impact, setImpact]         = useState(risk.impact)
  const [showHistory, setShowHistory] = useState(true)

  const newClass = MATRIX[`${likelihood}-${impact}`]
  const scoreChanged = likelihood !== risk.likelihood || impact !== risk.impact

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!notes.trim()) { toast.error('Review notes wajib diisi'); return }
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.from('avr_risk_reviews').insert({
      risk_id:              risk.id,
      reviewed_by:          currentUserId,
      review_date:          new Date().toISOString().split('T')[0],
      review_notes:         notes,
      previous_likelihood:  risk.likelihood,
      previous_impact:      risk.impact,
      previous_score:       risk.inherent_score,
      previous_class:       risk.inherent_classification,
      current_likelihood:   likelihood,
      current_impact:       impact,
      review_decision:      decision,
    })

    if (error) { toast.error('Gagal menyimpan', { description: error.message }); setLoading(false); return }

    toast.success('Review berhasil disimpan')
    router.push(`/risks/${risk.id}`)
    router.refresh()
  }

  // Days until next review
  const daysUntilReview = risk.next_review_date
    ? Math.ceil((new Date(risk.next_review_date).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className="flex gap-6 items-start">

      {/* ── Kiri: Form ── */}
      <div className="flex-1 min-w-0 space-y-5">

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Current score */}
          <div className="card bg-brand-gray border-0">
            <p className="text-xs text-black/40 mb-2">Skor Risiko Saat Ini</p>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-3xl font-bold text-brand-navy">{risk.inherent_score}</p>
                <p className="text-xs text-black/30">L{risk.likelihood} × I{risk.impact}</p>
              </div>
              <div className="w-px h-10 bg-black/10" />
              <ClassificationBadge classification={risk.inherent_classification as AvrClassification} />
              {(risk.residual_score ?? 0) > 0 && (
                <>
                  <div className="text-xs text-black/30">→ Residual</div>
                  <div>
                    <p className="text-xl font-bold text-brand-navy">{risk.residual_score}</p>
                  </div>
                  <ClassificationBadge classification={risk.residual_classification as AvrClassification} />
                </>
              )}
            </div>
          </div>

          {/* Review decision */}
          <div className="card">
            <h3 className="mb-3">Keputusan Review</h3>
            <div className="space-y-2">
              {DECISIONS.map(d => (
                <label key={d.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${decision === d.value ? 'border-brand-blue bg-blue-50' : 'border-black/8 hover:border-brand-blue/30'}`}>
                  <input type="radio" name="decision" value={d.value} checked={decision === d.value}
                    onChange={() => setDecision(d.value)} className="accent-brand-blue mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{d.label}</p>
                    <p className="text-xs text-black/40">{d.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Update score */}
          {decision === 'Update Risk' && (
            <div className="card">
              <h3 className="mb-1">Perbarui Skor Risiko</h3>
              <p className="text-xs text-black/40 mb-4">Sesuaikan likelihood dan impact berdasarkan kondisi terkini</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Likelihood</label>
                  <div className="space-y-1.5">
                    {[1,2,3,4,5].map(v => (
                      <label key={v} className={`flex items-start gap-3 p-2.5 rounded border cursor-pointer text-sm transition-colors ${likelihood === v ? 'border-brand-blue bg-blue-50' : 'border-black/8 hover:border-brand-blue/30'}`}>
                        <input type="radio" name="likelihood" value={v} checked={likelihood === v}
                          onChange={() => setLikelihood(v)} className="accent-brand-blue mt-0.5 shrink-0" />
                        <span><span className="font-semibold">{v}</span> — {LIKELIHOOD_LABELS[v]}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Impact</label>
                  <div className="space-y-1.5">
                    {[1,2,3,4,5].map(v => (
                      <label key={v} className={`flex items-start gap-3 p-2.5 rounded border cursor-pointer text-sm transition-colors ${impact === v ? 'border-brand-blue bg-blue-50' : 'border-black/8 hover:border-brand-blue/30'}`}>
                        <input type="radio" name="impact" value={v} checked={impact === v}
                          onChange={() => setImpact(v)} className="accent-brand-blue mt-0.5 shrink-0" />
                        <span><span className="font-semibold">{v}</span> — {IMPACT_LABELS[v]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {scoreChanged && (
                <div className="mt-4 p-3 rounded-lg bg-brand-gray flex items-center gap-6">
                  <div>
                    <p className="text-xs text-black/40 mb-1">Sebelum</p>
                    <p className="text-xl font-bold text-black/40 line-through">{risk.inherent_score}</p>
                  </div>
                  <span className="text-black/20">→</span>
                  <div>
                    <p className="text-xs text-black/40 mb-1">Sesudah</p>
                    <p className="text-xl font-bold text-brand-navy">{likelihood * impact}</p>
                  </div>
                  <div className="w-px h-10 bg-black/10" />
                  <div>
                    <p className="text-xs text-black/40 mb-1">Klasifikasi Baru</p>
                    {newClass && <ClassificationBadge classification={newClass} size="sm" />}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="card">
            <label className="label">Review Notes <span className="text-red-400">*</span></label>
            <textarea className="input min-h-[100px] resize-y"
              placeholder="Jelaskan hasil review: kondisi risiko saat ini, perubahan kontrol, perkembangan mitigasi, dan justifikasi keputusan..."
              value={notes} onChange={e => setNotes(e.target.value)} required />
          </div>

          <div className="flex gap-3 pb-8">
            <button type="submit" className="btn-primary px-6" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Review'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => router.back()}>Batal</button>
          </div>
        </form>
      </div>

      {/* ── Kanan: Drawer Info Risiko ── */}
      <div className="w-80 shrink-0 space-y-3 sticky top-6">

        {/* Risk Profile */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm">Profil Risiko</h3>
            <ClassificationBadge classification={risk.inherent_classification as AvrClassification} size="sm" />
          </div>

          {risk.description && (
            <p className="text-xs text-black/50 leading-relaxed border-b border-black/5 pb-3">{risk.description}</p>
          )}

          <DrawerRow icon={<Shield size={12} />} label="Kategori" value={risk.category ?? '—'} />
          <DrawerRow icon={<Building2 size={12} />} label="Unit Kerja" value={risk.unit_kerja?.nama ?? '—'} />
          <DrawerRow icon={<User size={12} />} label="Risk Owner"
            value={risk.risk_owner?.full_name ?? '—'}
            sub={risk.risk_owner?.job_title ?? undefined} />
          <DrawerRow icon={<User size={12} />} label="Treatment Owner"
            value={risk.treatment_owner?.full_name ?? '—'}
            sub={risk.treatment_owner?.job_title ?? undefined} />

          {risk.existing_control && (
            <div className="border-t border-black/5 pt-3">
              <p className="text-xs text-black/40 mb-1">Kontrol yang Ada</p>
              <p className="text-xs text-black/60 leading-relaxed">{risk.existing_control}</p>
            </div>
          )}

          {risk.treatment_strategy && (
            <div className="border-t border-black/5 pt-3">
              <p className="text-xs text-black/40 mb-1">Treatment Strategy</p>
              <p className="text-xs font-medium">{risk.treatment_strategy}</p>
              {risk.treatment_notes && <p className="text-xs text-black/50 mt-0.5">{risk.treatment_notes}</p>}
            </div>
          )}

          {/* Next review */}
          {risk.next_review_date && (
            <div className="border-t border-black/5 pt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-black/40">
                <Clock size={11} />
                <span>Next Review</span>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium">{formatDate(risk.next_review_date)}</p>
                {daysUntilReview !== null && (
                  <p className={`text-[10px] ${daysUntilReview < 0 ? 'text-red-500' : daysUntilReview <= 14 ? 'text-[#7A4C00]' : 'text-black/30'}`}>
                    {daysUntilReview < 0 ? `${Math.abs(daysUntilReview)} hari lalu` : daysUntilReview === 0 ? 'Hari ini' : `${daysUntilReview} hari lagi`}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Review History */}
        <div className="card">
          <button
            type="button"
            className="flex items-center justify-between w-full mb-3"
            onClick={() => setShowHistory(h => !h)}
          >
            <h3 className="text-sm">Histori Review ({reviews.length})</h3>
            {showHistory ? <ChevronUp size={14} className="text-black/30" /> : <ChevronDown size={14} className="text-black/30" />}
          </button>

          {showHistory && (
            reviews.length === 0
              ? <p className="text-xs text-black/30 py-2 text-center">Belum ada review</p>
              : <div className="space-y-3">
                  {reviews.map(r => (
                    <div key={r.id} className="border-b border-black/5 last:border-0 pb-3 last:pb-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-medium text-brand-navy">{formatTimestamp(r.review_date)}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          r.review_decision === 'Escalate' ? 'bg-red-50 text-red-600' :
                          r.review_decision === 'Update Risk' ? 'bg-blue-50 text-brand-blue' :
                          r.review_decision === 'Close Risk' ? 'bg-gray-100 text-black/50' :
                          'bg-green-50 text-green-700'
                        }`}>{r.review_decision}</span>
                      </div>
                      <p className="text-[10px] text-black/40 mb-1">oleh {r.reviewer?.full_name ?? '—'}</p>
                      {r.review_notes && (
                        <p className="text-xs text-black/60 leading-relaxed line-clamp-3">{r.review_notes}</p>
                      )}
                      {(r.previous_score || r.current_score) && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-black/30">Score: {r.previous_score ?? '—'} → {r.current_score ?? '—'}</span>
                          {r.current_class && <ClassificationBadge classification={r.current_class as AvrClassification} size="sm" />}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
          )}
        </div>

      </div>
    </div>
  )
}

function DrawerRow({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-black/25 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-black/40">{label}</p>
        <p className="text-xs font-medium text-black truncate">{value}</p>
        {sub && <p className="text-[10px] text-black/40">{sub}</p>}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { classificationBadge, LIKELIHOOD_LABELS, IMPACT_LABELS } from '@/lib/utils'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import type { AvrClassification } from '@/types'

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
  id: string; risk_code: string; title: string
  likelihood: number; impact: number
  inherent_score: number; inherent_classification: string
}

export function ReviewForm({ risk, currentUserId }: { risk: Risk; currentUserId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [decision, setDecision] = useState('No Change')
  const [notes, setNotes]       = useState('')
  const [likelihood, setLikelihood] = useState(risk.likelihood)
  const [impact, setImpact]         = useState(risk.impact)

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

  return (
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

      {/* Update score — show if decision is Update Risk */}
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
  )
}

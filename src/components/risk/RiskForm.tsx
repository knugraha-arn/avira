'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { classificationBadge, LIKELIHOOD_LABELS, IMPACT_LABELS } from '@/lib/utils'
import { RISK_FORM } from '@/lib/form-labels'
import { Tooltip } from '@/components/ui/Tooltip'
import { ThirdPartySelect } from '@/components/risk/ThirdPartySelect'
import { Info, Sparkles } from 'lucide-react'
import type { AvrClassification } from '@/types'

const CATEGORIES = [
  'Strategic','Operational','Financial','Compliance',
  'Technology','Human Resources','Reputational','Other',
]
const TREATMENTS = ['Mitigate','Accept','Transfer','Avoid'] as const
const FREQ_OPTIONS = [30, 90, 180, 365] as const

const MATRIX: Record<string, AvrClassification> = {
  '1-1':'Low','1-2':'Low','1-3':'Low','1-4':'Medium','1-5':'Medium',
  '2-1':'Low','2-2':'Low','2-3':'Medium','2-4':'Medium','2-5':'High',
  '3-1':'Low','3-2':'Medium','3-3':'Medium','3-4':'High','3-5':'Extreme',
  '4-1':'Medium','4-2':'Medium','4-3':'High','4-4':'High','4-5':'Extreme',
  '5-1':'Medium','5-2':'High','5-3':'High','5-4':'Extreme','5-5':'Extreme',
}

interface UnitKerja { id: string; kode: string; nama: string }
interface User { id: string; full_name: string; job_title: string | null }

interface Props {
  unitKerjaList: UnitKerja[]
  users: User[]
  currentUserId: string
}

export function RiskForm({ unitKerjaList, users, currentUserId }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check if pre-filled from AI generator
  const isAiGenerated = searchParams.get('ai_generated') === '1'
  const aiJudul       = searchParams.get('ai_judul') ?? ''
  const aiKategori    = searchParams.get('ai_kategori') ?? ''
  const aiDeskripsi   = searchParams.get('ai_deskripsi') ?? ''
  const aiLikelihood  = Number(searchParams.get('ai_likelihood') ?? 1)
  const aiImpact      = Number(searchParams.get('ai_impact') ?? 1)
  const aiTreatment   = searchParams.get('ai_treatment') ?? 'Mitigate'

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title:                aiJudul,
    description:          aiDeskripsi,
    category:             aiKategori,
    unit_kerja_id:        '',
    asset_terkait:        '',
    third_party_id:       '',
    risk_owner_id:        currentUserId,
    treatment_owner_id:   currentUserId,
    date_identified:      new Date().toISOString().split('T')[0],
    existing_control:     '',
    likelihood:           aiLikelihood || 1,
    impact:               aiImpact || 1,
    residual_likelihood:  '' as number | '',
    residual_impact:      '' as number | '',
    treatment_strategy:   (aiTreatment || 'Mitigate') as typeof TREATMENTS[number],
    treatment_notes:      '',
    review_frequency_days: 90,
  })

  const inherentClass = MATRIX[`${form.likelihood}-${form.impact}`]
  const residualClass = form.residual_likelihood && form.residual_impact
    ? MATRIX[`${form.residual_likelihood}-${form.residual_impact}`] : null

  function set(field: string, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.category || !form.unit_kerja_id) {
      toast.error('Lengkapi field yang wajib diisi')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const payload: Record<string, unknown> = {
      title:                form.title,
      description:          form.description || null,
      category:             form.category,
      unit_kerja_id:        form.unit_kerja_id,
      asset_terkait:        form.asset_terkait || null,
      third_party_id:       form.third_party_id || null,
      risk_owner_id:        form.risk_owner_id || null,
      treatment_owner_id:   form.treatment_owner_id || null,
      date_identified:      form.date_identified,
      existing_control:     form.existing_control || null,
      likelihood:           form.likelihood,
      impact:               form.impact,
      treatment_strategy:   form.treatment_strategy,
      treatment_notes:      form.treatment_notes || null,
      review_frequency_days: form.review_frequency_days,
      created_by:           currentUserId,
    }
    if (form.residual_likelihood && form.residual_impact) {
      payload.residual_likelihood = form.residual_likelihood
      payload.residual_impact     = form.residual_impact
    }
    const { data, error } = await supabase
      .from('avr_risks').insert(payload).select('id').single()
    if (error) {
      toast.error('Gagal menyimpan', { description: error.message })
      setLoading(false)
      return
    }
    toast.success('Risiko berhasil ditambahkan')
    router.push(`/risks/${data.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">

      {/* AI banner */}
      {isAiGenerated && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-blue/5 border border-brand-blue/20">
          <Sparkles size={15} className="text-brand-blue shrink-0" />
          <div className="text-xs text-brand-blue/80 leading-relaxed">
            <strong>Diisi dari Risk Generator AI.</strong> Review dan sesuaikan seluruh field sebelum menyimpan.
            Data ini akan tercatat sebagai <em>AI-assisted</em> dalam audit trail.
          </div>
        </div>
      )}

      {/* Step 1 */}
      <Section step="Step 1" title="Identitas Risiko">
        <div className="space-y-4">
          <Field label={RISK_FORM.title.label} tooltip={RISK_FORM.title.tooltip} required>
            <input className="input" placeholder={RISK_FORM.title.placeholder}
              value={form.title} onChange={e => set('title', e.target.value)} required />
          </Field>
          <Field label={RISK_FORM.description.label} tooltip={RISK_FORM.description.tooltip}>
            <textarea className="input min-h-[90px] resize-y" placeholder={RISK_FORM.description.placeholder}
              value={form.description} onChange={e => set('description', e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={RISK_FORM.category.label} tooltip={RISK_FORM.category.tooltip} required>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)} required>
                <option value="">{RISK_FORM.category.placeholder}</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label={RISK_FORM.unit_kerja.label} tooltip={RISK_FORM.unit_kerja.tooltip} required>
              <select className="input" value={form.unit_kerja_id} onChange={e => set('unit_kerja_id', e.target.value)} required>
                <option value="">{RISK_FORM.unit_kerja.placeholder}</option>
                {unitKerjaList.map(uk => (
                  <option key={uk.id} value={uk.id}>{uk.nama} ({uk.kode})</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label={RISK_FORM.asset_terkait.label} tooltip={RISK_FORM.asset_terkait.tooltip}>
            <input className="input" placeholder={RISK_FORM.asset_terkait.placeholder}
              value={form.asset_terkait} onChange={e => set('asset_terkait', e.target.value)} />
          </Field>
          <Field label={RISK_FORM.third_party.label} tooltip={RISK_FORM.third_party.tooltip}>
            <ThirdPartySelect value={form.third_party_id}
              onChange={(id) => set('third_party_id', id)}
              placeholder={RISK_FORM.third_party.placeholder} />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={RISK_FORM.date_identified.label} tooltip={RISK_FORM.date_identified.tooltip}>
              <input type="date" className="input" value={form.date_identified}
                onChange={e => set('date_identified', e.target.value)} />
            </Field>
          </div>
          <Field label={RISK_FORM.existing_control.label} tooltip={RISK_FORM.existing_control.tooltip}>
            <textarea className="input min-h-[100px] resize-y" placeholder={RISK_FORM.existing_control.placeholder}
              value={form.existing_control} onChange={e => set('existing_control', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* Step 2 */}
      <Section step="Step 2" title="Ownership (RACI)">
        <InfoBox text={RISK_FORM.raci_note} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field label={RISK_FORM.risk_owner.label} tooltip={RISK_FORM.risk_owner.tooltip}>
            <select className="input" value={form.risk_owner_id} onChange={e => set('risk_owner_id', e.target.value)}>
              <option value="">{RISK_FORM.risk_owner.placeholder}</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name}{u.job_title ? ` — ${u.job_title}` : ''}</option>)}
            </select>
          </Field>
          <Field label={RISK_FORM.treatment_owner.label} tooltip={RISK_FORM.treatment_owner.tooltip}>
            <select className="input" value={form.treatment_owner_id} onChange={e => set('treatment_owner_id', e.target.value)}>
              <option value="">{RISK_FORM.treatment_owner.placeholder}</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name}{u.job_title ? ` — ${u.job_title}` : ''}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {/* Step 3 */}
      <Section step="Step 3" title="Penilaian Risiko Inheren">
        {isAiGenerated && (
          <div className="flex items-center gap-2 mb-3 text-xs text-brand-blue/70">
            <Sparkles size={12} /> Nilai awal diisi oleh AI — review dan sesuaikan
          </div>
        )}
        <p className="text-xs text-black/40 mb-4">{RISK_FORM.inherent_score_note}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-1 mb-2">
              <span className="label mb-0">{RISK_FORM.likelihood.label}</span>
              <Tooltip text={RISK_FORM.likelihood.tooltip} />
            </div>
            <div className="space-y-1.5">
              {([1,2,3,4,5] as const).map(v => (
                <label key={v} className={`flex items-start gap-3 p-2.5 rounded border cursor-pointer transition-colors ${form.likelihood === v ? 'border-brand-blue bg-blue-50' : 'border-black/8 hover:border-brand-blue/30'}`}>
                  <input type="radio" name="likelihood" value={v} checked={form.likelihood === v}
                    onChange={() => set('likelihood', v)} className="accent-brand-blue mt-0.5 shrink-0" />
                  <span className="text-sm leading-snug">
                    <span className="font-semibold">{v}</span> — {RISK_FORM.likelihood.scale[v]}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-2">
              <span className="label mb-0">{RISK_FORM.impact.label}</span>
              <Tooltip text={RISK_FORM.impact.tooltip} />
            </div>
            <div className="space-y-1.5">
              {([1,2,3,4,5] as const).map(v => (
                <label key={v} className={`flex items-start gap-3 p-2.5 rounded border cursor-pointer transition-colors ${form.impact === v ? 'border-brand-blue bg-blue-50' : 'border-black/8 hover:border-brand-blue/30'}`}>
                  <input type="radio" name="impact" value={v} checked={form.impact === v}
                    onChange={() => set('impact', v)} className="accent-brand-blue mt-0.5 shrink-0" />
                  <span className="text-sm leading-snug">
                    <span className="font-semibold">{v}</span> — {RISK_FORM.impact.scale[v]}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
        {inherentClass && (
          <div className="mt-4 p-4 rounded-lg bg-brand-gray flex items-center gap-4">
            <div>
              <p className="text-xs text-black/40 mb-1">Inherent Risk Score</p>
              <p className="text-3xl font-bold text-brand-navy">{form.likelihood * form.impact}</p>
              <p className="text-xs text-black/30 mt-0.5">L{form.likelihood} × I{form.impact}</p>
            </div>
            <div className="w-px h-12 bg-black/10" />
            <div>
              <p className="text-xs text-black/40 mb-1">Klasifikasi</p>
              <span className={`badge text-sm px-3 py-1 ${classificationBadge(inherentClass).bg} ${classificationBadge(inherentClass).text} ${classificationBadge(inherentClass).border}`}>
                {inherentClass}
              </span>
            </div>
          </div>
        )}
      </Section>

      {/* Step 4 */}
      <Section step="Step 4" title="Residual Risk (Opsional)">
        <InfoBox text={RISK_FORM.residual_note} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field label={RISK_FORM.residual_likelihood.label} tooltip={RISK_FORM.residual_likelihood.tooltip}>
            <select className="input" value={form.residual_likelihood}
              onChange={e => set('residual_likelihood', e.target.value ? Number(e.target.value) : '')}>
              <option value="">{RISK_FORM.residual_likelihood.placeholder}</option>
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v} — {LIKELIHOOD_LABELS[v]}</option>)}
            </select>
          </Field>
          <Field label={RISK_FORM.residual_impact.label} tooltip={RISK_FORM.residual_impact.tooltip}>
            <select className="input" value={form.residual_impact}
              onChange={e => set('residual_impact', e.target.value ? Number(e.target.value) : '')}>
              <option value="">{RISK_FORM.residual_impact.placeholder}</option>
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v} — {IMPACT_LABELS[v]}</option>)}
            </select>
          </Field>
        </div>
        {residualClass && (
          <div className="mt-3 p-3 rounded-lg bg-brand-gray flex items-center gap-4">
            <div>
              <p className="text-xs text-black/40 mb-1">Residual Score</p>
              <p className="text-2xl font-bold text-brand-navy">
                {Number(form.residual_likelihood) * Number(form.residual_impact)}
              </p>
            </div>
            <div className="w-px h-10 bg-black/10" />
            <div>
              <p className="text-xs text-black/40 mb-1">Klasifikasi Residual</p>
              <span className={`badge ${classificationBadge(residualClass).bg} ${classificationBadge(residualClass).text} ${classificationBadge(residualClass).border}`}>
                {residualClass}
              </span>
            </div>
          </div>
        )}
      </Section>

      {/* Step 5 */}
      <Section step="Step 5" title="Risk Treatment">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {TREATMENTS.map(t => {
            const opt = RISK_FORM.treatment_options[t]
            return (
              <label key={t} className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors text-center ${form.treatment_strategy === t ? 'border-brand-blue bg-blue-50' : 'border-black/8 hover:border-brand-blue/30'}`}>
                <input type="radio" name="treatment" value={t} checked={form.treatment_strategy === t}
                  onChange={() => set('treatment_strategy', t)} className="sr-only" />
                <span className="text-2xl">{opt.icon}</span>
                <span className="text-sm font-medium">{t}</span>
                <span className="absolute top-1.5 right-1.5"><Tooltip text={opt.tooltip} /></span>
              </label>
            )
          })}
        </div>
        <Field label={RISK_FORM.treatment_notes.label} tooltip={RISK_FORM.treatment_notes.tooltip}>
          <textarea className="input min-h-[80px] resize-y" placeholder={RISK_FORM.treatment_notes.placeholder}
            value={form.treatment_notes} onChange={e => set('treatment_notes', e.target.value)} />
        </Field>
      </Section>

      {/* Step 6 */}
      <Section step="Step 6" title="Review Cycle">
        <div className="flex items-center gap-1 mb-3">
          <span className="label mb-0">{RISK_FORM.review_frequency.label}</span>
          <Tooltip text={RISK_FORM.review_frequency.tooltip} />
        </div>
        <p className="text-xs text-black/40 mb-3">{RISK_FORM.review_frequency.guide}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FREQ_OPTIONS.map(f => (
            <label key={f} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${form.review_frequency_days === f ? 'border-brand-blue bg-blue-50' : 'border-black/8 hover:border-brand-blue/30'}`}>
              <input type="radio" name="frequency" value={f} checked={form.review_frequency_days === f}
                onChange={() => set('review_frequency_days', f)} className="accent-brand-blue" />
              <span className="text-sm">{RISK_FORM.review_frequency.options[f]}</span>
            </label>
          ))}
        </div>
      </Section>

      <div className="flex items-center gap-3 pt-2 pb-8">
        <button type="submit" className="btn-primary px-6" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan Risiko'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.back()}>Batal</button>
      </div>

    </form>
  )
}

function Section({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="mb-4">
        <span className="eyebrow text-[10px] mb-1 inline-block">{step}</span>
        <h3>{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Field({ label, tooltip, required, children }: {
  label: string; tooltip?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-0.5 mb-1">
        <label className="label mb-0">{label}</label>
        {required && <span className="text-red-400 text-xs ml-0.5">*</span>}
        {tooltip && <Tooltip text={tooltip} />}
      </div>
      {children}
    </div>
  )
}

function InfoBox({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-brand-gray border border-black/5">
      <Info size={14} className="text-brand-blue shrink-0 mt-0.5" />
      <p className="text-xs text-black/60 leading-relaxed">{text}</p>
    </div>
  )
}

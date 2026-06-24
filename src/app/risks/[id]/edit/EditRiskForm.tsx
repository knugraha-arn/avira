'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { classificationBadge, LIKELIHOOD_LABELS, IMPACT_LABELS } from '@/lib/utils'
import { RISK_FORM } from '@/lib/form-labels'
import { Tooltip } from '@/components/ui/Tooltip'
import { DocumentLinksField, type DocLink } from '@/components/ui/DocumentLinksField'
import { ControlSelector, type ControlOption } from '@/components/ui/ControlSelector'
import { Info } from 'lucide-react'
import type { AvrClassification } from '@/types'

const CATEGORIES = ['Strategic','Operational','Financial','Compliance','Technology','Human Resources','Reputational','Other']
const TREATMENTS = ['Mitigate','Accept','Transfer','Avoid'] as const
const FREQ_OPTIONS = [30, 90, 180, 365] as const
const MATRIX: Record<string, AvrClassification> = {
  '1-1':'Low','1-2':'Low','1-3':'Low','1-4':'Medium','1-5':'Medium',
  '2-1':'Low','2-2':'Low','2-3':'Medium','2-4':'Medium','2-5':'High',
  '3-1':'Low','3-2':'Medium','3-3':'Medium','3-4':'High','3-5':'Extreme',
  '4-1':'Medium','4-2':'Medium','4-3':'High','4-4':'High','4-5':'Extreme',
  '5-1':'Medium','5-2':'High','5-3':'High','5-4':'Extreme','5-5':'Extreme',
}

interface Props {
  risk: any
  unitKerjaList: { id: string; kode: string; nama: string }[]
  users: { id: string; full_name: string; job_title: string | null }[]
  thirdParties: { id: string; nama: string; tipe: string }[]
  allControls: ControlOption[]
  linkedControlIds: string[]
  currentUserId: string
}

export function EditRiskForm({ risk, unitKerjaList, users, thirdParties, allControls, linkedControlIds, currentUserId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title:                risk.title ?? '',
    description:          risk.description ?? '',
    category:             risk.category ?? '',
    unit_kerja_id:        risk.unit_kerja_id ?? '',
    asset_terkait:        risk.asset_terkait ?? '',
    third_party_id:       risk.third_party_id ?? '',
    risk_owner_id:        risk.risk_owner_id ?? '',
    treatment_owner_id:   risk.treatment_owner_id ?? '',
    date_identified:      risk.date_identified ?? '',
    existing_control:     risk.existing_control ?? '',
    likelihood:           risk.likelihood ?? 1,
    impact:               risk.impact ?? 1,
    residual_likelihood:  risk.residual_likelihood ?? '' as number | '',
    residual_impact:      risk.residual_impact ?? '' as number | '',
    treatment_strategy:   risk.treatment_strategy ?? 'Mitigate',
    treatment_notes:      risk.treatment_notes ?? '',
    review_frequency_days: risk.review_frequency_days ?? 90,
    is_mrm_flagged:       risk.is_mrm_flagged ?? false,
    mrm_reason:           risk.mrm_reason ?? '',
    related_documents:    (risk.related_documents ?? []) as DocLink[],
  })
  const [selectedControlIds, setSelectedControlIds] = useState<string[]>(linkedControlIds)

  function set(field: string, value: unknown) { setForm(f => ({ ...f, [field]: value })) }

  const inherentClass = MATRIX[`${form.likelihood}-${form.impact}`]
  const residualClass = form.residual_likelihood && form.residual_impact
    ? MATRIX[`${form.residual_likelihood}-${form.residual_impact}`] : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.category || !form.unit_kerja_id) {
      toast.error('Lengkapi field yang wajib diisi'); return
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
      is_mrm_flagged:       form.is_mrm_flagged,
      mrm_reason:           form.mrm_reason || null,
      related_documents:    form.related_documents.filter(d => d.nama.trim() || d.url.trim()),
    }
    if (form.residual_likelihood && form.residual_impact) {
      payload.residual_likelihood = form.residual_likelihood
      payload.residual_impact     = form.residual_impact
    } else {
      payload.residual_likelihood = null
      payload.residual_impact     = null
    }

    const { error } = await supabase.from('avr_risks').update(payload).eq('id', risk.id)
    if (error) { toast.error('Gagal menyimpan', { description: error.message }); setLoading(false); return }

    // Sync kontrol terhubung — hapus semua, insert ulang (simpel untuk jumlah kecil)
    await supabase.from('avr_risk_controls').delete().eq('risk_id', risk.id)
    if (selectedControlIds.length > 0) {
      await supabase.from('avr_risk_controls').insert(
        selectedControlIds.map(control_id => ({
          risk_id: risk.id,
          control_id,
          linked_by: currentUserId,
        }))
      )
    }

    // Kirim email eskalasi MRM kalau baru di-flag (sebelumnya false, sekarang true)
    if (form.is_mrm_flagged && !risk.is_mrm_flagged) {
      await fetch('/api/email/mrm-escalation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riskCode:  risk.risk_code,
          riskTitle: form.title,
          mrmReason: form.mrm_reason || null,
          riskId:    risk.id,
        }),
      })
    }

    toast.success('Risiko berhasil diperbarui')
    router.push(`/risks/${risk.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      <Section step="Identitas Risiko">
        <div className="space-y-4">
          <Field label={RISK_FORM.title.label} tooltip={RISK_FORM.title.tooltip} required>
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)} required />
          </Field>
          <Field label={RISK_FORM.description.label} tooltip={RISK_FORM.description.tooltip}>
            <textarea className="input min-h-[80px] resize-y" value={form.description} onChange={e => set('description', e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={RISK_FORM.category.label} required>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)} required>
                <option value="">Pilih kategori</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label={RISK_FORM.unit_kerja.label} required>
              <select className="input" value={form.unit_kerja_id} onChange={e => set('unit_kerja_id', e.target.value)} required>
                <option value="">Pilih unit kerja</option>
                {unitKerjaList.map(uk => <option key={uk.id} value={uk.id}>{uk.nama} ({uk.kode})</option>)}
              </select>
            </Field>
          </div>
          <Field label={RISK_FORM.asset_terkait.label}>
            <input className="input" placeholder={RISK_FORM.asset_terkait.placeholder} value={form.asset_terkait} onChange={e => set('asset_terkait', e.target.value)} />
          </Field>
          <Field label={RISK_FORM.third_party.label}>
            <select className="input" value={form.third_party_id} onChange={e => set('third_party_id', e.target.value)}>
              <option value="">— Tidak ada —</option>
              {thirdParties.map(tp => <option key={tp.id} value={tp.id}>{tp.nama} ({tp.tipe})</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field label={RISK_FORM.risk_owner.label} tooltip={RISK_FORM.risk_owner.tooltip}>
            <select className="input" value={form.risk_owner_id} onChange={e => set('risk_owner_id', e.target.value)}>
              <option value="">Pilih Risk Owner</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name}{u.job_title ? ` — ${u.job_title}` : ''}</option>)}
            </select>
          </Field>
          <Field label={RISK_FORM.treatment_owner.label} tooltip={RISK_FORM.treatment_owner.tooltip}>
            <select className="input" value={form.treatment_owner_id} onChange={e => set('treatment_owner_id', e.target.value)}>
              <option value="">Pilih Treatment Owner</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name}{u.job_title ? ` — ${u.job_title}` : ''}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      <Section step="Penilaian Risiko Inheren">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Likelihood</label>
            <div className="space-y-1.5">
              {[1,2,3,4,5].map(v => (
                <label key={v} className={`flex items-start gap-3 p-2.5 rounded border cursor-pointer text-sm transition-colors ${form.likelihood === v ? 'border-brand-blue bg-blue-50' : 'border-black/8 hover:border-brand-blue/30'}`}>
                  <input type="radio" name="likelihood" value={v} checked={form.likelihood === v} onChange={() => set('likelihood', v)} className="accent-brand-blue mt-0.5 shrink-0" />
                  <span><span className="font-semibold">{v}</span> — {LIKELIHOOD_LABELS[v]}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Impact</label>
            <div className="space-y-1.5">
              {[1,2,3,4,5].map(v => (
                <label key={v} className={`flex items-start gap-3 p-2.5 rounded border cursor-pointer text-sm transition-colors ${form.impact === v ? 'border-brand-blue bg-blue-50' : 'border-black/8 hover:border-brand-blue/30'}`}>
                  <input type="radio" name="impact" value={v} checked={form.impact === v} onChange={() => set('impact', v)} className="accent-brand-blue mt-0.5 shrink-0" />
                  <span><span className="font-semibold">{v}</span> — {IMPACT_LABELS[v]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        {inherentClass && (
          <div className="mt-4 p-3 rounded-lg bg-brand-gray flex items-center gap-4">
            <div><p className="text-3xl font-bold text-brand-navy">{form.likelihood * form.impact}</p><p className="text-xs text-black/30">L{form.likelihood} × I{form.impact}</p></div>
            <div className="w-px h-10 bg-black/10" />
            <span className={`badge text-sm px-3 py-1 ${classificationBadge(inherentClass).bg} ${classificationBadge(inherentClass).text} ${classificationBadge(inherentClass).border}`}>{inherentClass}</span>
          </div>
        )}
      </Section>

      <Section step="Residual Risk (Opsional)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Residual Likelihood" tooltip={RISK_FORM.residual_likelihood.tooltip}>
            <select className="input" value={form.residual_likelihood} onChange={e => set('residual_likelihood', e.target.value ? Number(e.target.value) : '')}>
              <option value="">— Tidak diisi —</option>
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v} — {LIKELIHOOD_LABELS[v]}</option>)}
            </select>
          </Field>
          <Field label="Residual Impact" tooltip={RISK_FORM.residual_impact.tooltip}>
            <select className="input" value={form.residual_impact} onChange={e => set('residual_impact', e.target.value ? Number(e.target.value) : '')}>
              <option value="">— Tidak diisi —</option>
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v} — {IMPACT_LABELS[v]}</option>)}
            </select>
          </Field>
        </div>
        {residualClass && (
          <div className="mt-3 p-3 rounded-lg bg-brand-gray flex items-center gap-4">
            <div><p className="text-2xl font-bold text-brand-navy">{Number(form.residual_likelihood) * Number(form.residual_impact)}</p></div>
            <div className="w-px h-8 bg-black/10" />
            <span className={`badge ${classificationBadge(residualClass).bg} ${classificationBadge(residualClass).text} ${classificationBadge(residualClass).border}`}>{residualClass}</span>
          </div>
        )}
      </Section>

      <Section step="Kontrol & Dokumen Pendukung">
        <div className="space-y-5">
          <Field label="Kontrol dari Control Library" tooltip="Pilih kontrol yang sudah terdaftar di Control Library. Satu kontrol bisa dipasang ke banyak risiko — kalau status kontrol berubah, semua risiko terkait ikut ter-flag.">
            <ControlSelector
              allControls={allControls}
              selectedIds={selectedControlIds}
              onChange={setSelectedControlIds}
            />
          </Field>

          <Field label={RISK_FORM.existing_control?.label ?? 'Kontrol Lain (Catatan Bebas)'} tooltip="Untuk kontrol yang belum terdaftar di Control Library, atau catatan tambahan yang tidak perlu jadi entity terpisah.">
            <textarea className="input min-h-[70px] resize-y" value={form.existing_control} onChange={e => set('existing_control', e.target.value)} />
          </Field>

          <Field label="Dokumen Terkait" tooltip="Link ke SOP, kebijakan, atau bukti lain di platform dokumen Anda (Google Drive, SharePoint, dll). Bukan upload file.">
            <DocumentLinksField
              value={form.related_documents}
              onChange={links => set('related_documents', links)}
            />
          </Field>
        </div>
      </Section>

      <Section step="Risk Treatment">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {TREATMENTS.map(t => (
            <label key={t} className={`flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer text-center transition-colors ${form.treatment_strategy === t ? 'border-brand-blue bg-blue-50' : 'border-black/8 hover:border-brand-blue/30'}`}>
              <input type="radio" name="treatment" value={t} checked={form.treatment_strategy === t} onChange={() => set('treatment_strategy', t)} className="sr-only" />
              <span className="text-2xl">{RISK_FORM.treatment_options[t as keyof typeof RISK_FORM.treatment_options].icon}</span>
              <span className="text-sm font-medium">{t}</span>
            </label>
          ))}
        </div>
        <Field label="Catatan Treatment">
          <textarea className="input min-h-[70px] resize-y" placeholder={RISK_FORM.treatment_notes.placeholder} value={form.treatment_notes} onChange={e => set('treatment_notes', e.target.value)} />
        </Field>
      </Section>

      <Section step="Review Cycle">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FREQ_OPTIONS.map(f => (
            <label key={f} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${form.review_frequency_days === f ? 'border-brand-blue bg-blue-50' : 'border-black/8 hover:border-brand-blue/30'}`}>
              <input type="radio" name="frequency" value={f} checked={form.review_frequency_days === f} onChange={() => set('review_frequency_days', f)} className="accent-brand-blue" />
              <span className="text-sm">{RISK_FORM.review_frequency.options[f]}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section step="Management Review">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.is_mrm_flagged} onChange={e => set('is_mrm_flagged', e.target.checked)} className="accent-brand-blue w-4 h-4" />
          <div>
            <p className="text-sm font-medium">Tandai sebagai agenda MRM</p>
            <p className="text-xs text-black/40">Risiko ini akan masuk dalam agenda Management Review Meeting — email notifikasi dikirim ke semua Admin</p>
          </div>
        </label>
        {form.is_mrm_flagged && (
          <div className="mt-3">
            <label className="label">Alasan MRM</label>
            <input className="input" placeholder="Contoh: Risiko meningkat signifikan, perlu keputusan direksi" value={form.mrm_reason} onChange={e => set('mrm_reason', e.target.value)} />
          </div>
        )}
      </Section>

      <div className="flex gap-3 pb-8">
        <button type="submit" className="btn-primary px-6" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.back()}>Batal</button>
      </div>
    </form>
  )
}

function Section({ step, children }: { step: string; children: React.ReactNode }) {
  return <div className="card"><h3 className="mb-4">{step}</h3>{children}</div>
}

function Field({ label, tooltip, required, children }: { label: string; tooltip?: string; required?: boolean; children: React.ReactNode }) {
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

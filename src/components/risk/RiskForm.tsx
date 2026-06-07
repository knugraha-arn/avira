'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { LIKELIHOOD_LABELS, IMPACT_LABELS, classificationBadge } from '@/lib/utils'
import type { AvrClassification } from '@/types'

const CATEGORIES = [
  'Strategic', 'Operational', 'Financial', 'Compliance',
  'Technology', 'Human Resources', 'Reputational', 'Other',
]

const TREATMENTS = ['Mitigate', 'Accept', 'Transfer', 'Avoid']
const FREQUENCIES = [
  { label: 'Bulanan (30 hari)',    value: 30 },
  { label: 'Triwulan (90 hari)',   value: 90 },
  { label: 'Semesteran (180 hari)', value: 180 },
  { label: 'Tahunan (365 hari)',   value: 365 },
]

interface User { id: string; full_name: string; department: string | null }

interface Props {
  users: User[]
  currentUserId: string
}

// Risk matrix classification (same as DB)
const MATRIX: Record<string, AvrClassification> = {
  '1-1':'Low','1-2':'Low','1-3':'Low','1-4':'Medium','1-5':'Medium',
  '2-1':'Low','2-2':'Low','2-3':'Medium','2-4':'Medium','2-5':'High',
  '3-1':'Low','3-2':'Medium','3-3':'Medium','3-4':'High','3-5':'Extreme',
  '4-1':'Medium','4-2':'Medium','4-3':'High','4-4':'High','4-5':'Extreme',
  '5-1':'Medium','5-2':'High','5-3':'High','5-4':'Extreme','5-5':'Extreme',
}

export function RiskForm({ users, currentUserId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    department: '',
    related_asset: '',
    related_vendor: '',
    risk_owner_id: currentUserId,
    treatment_owner_id: currentUserId,
    date_identified: new Date().toISOString().split('T')[0],
    existing_control: '',
    likelihood: 1,
    impact: 1,
    residual_likelihood: '' as number | '',
    residual_impact: '' as number | '',
    treatment_strategy: 'Mitigate',
    treatment_notes: '',
    review_frequency_days: 90,
  })

  const inherentClass = MATRIX[`${form.likelihood}-${form.impact}`]
  const residualClass = form.residual_likelihood && form.residual_impact
    ? MATRIX[`${form.residual_likelihood}-${form.residual_impact}`]
    : null

  function set(field: string, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.category || !form.department) {
      toast.error('Lengkapi field yang wajib diisi')
      return
    }
    setLoading(true)
    const supabase = createClient()

    const payload: Record<string, unknown> = {
      title:                form.title,
      description:          form.description || null,
      category:             form.category,
      department:           form.department,
      related_asset:        form.related_asset || null,
      related_vendor:       form.related_vendor || null,
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
      .from('avr_risks')
      .insert(payload)
      .select('id')
      .single()

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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">

      {/* ── Identitas Risiko ── */}
      <Section title="Identitas Risiko" eyebrow="Step 1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Judul Risiko <Required /></label>
            <input className="input" placeholder="Contoh: Kebocoran data pelanggan via API" value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>
          <div className="md:col-span-2">
            <label className="label">Deskripsi Risiko</label>
            <textarea className="input min-h-[80px] resize-none" placeholder="Jelaskan risiko secara detail..." value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div>
            <label className="label">Kategori <Required /></label>
            <select className="input" value={form.category} onChange={e => set('category', e.target.value)} required>
              <option value="">Pilih kategori</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Departemen <Required /></label>
            <input className="input" placeholder="Contoh: IT, Finance, Operations" value={form.department} onChange={e => set('department', e.target.value)} required />
          </div>
          <div>
            <label className="label">Aset Terkait</label>
            <input className="input" placeholder="Contoh: Database pelanggan, Server produksi" value={form.related_asset} onChange={e => set('related_asset', e.target.value)} />
          </div>
          <div>
            <label className="label">Vendor Terkait</label>
            <input className="input" placeholder="Contoh: AWS, Midtrans" value={form.related_vendor} onChange={e => set('related_vendor', e.target.value)} />
          </div>
          <div>
            <label className="label">Tanggal Identifikasi</label>
            <input type="date" className="input" value={form.date_identified} onChange={e => set('date_identified', e.target.value)} />
          </div>
          <div>
            <label className="label">Kontrol yang Sudah Ada</label>
            <input className="input" placeholder="Kontrol existing sebelum mitigasi" value={form.existing_control} onChange={e => set('existing_control', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* ── Ownership ── */}
      <Section title="Ownership" eyebrow="Step 2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Risk Owner</label>
            <select className="input" value={form.risk_owner_id} onChange={e => set('risk_owner_id', e.target.value)}>
              <option value="">Pilih Risk Owner</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name}{u.department ? ` — ${u.department}` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Treatment Owner</label>
            <select className="input" value={form.treatment_owner_id} onChange={e => set('treatment_owner_id', e.target.value)}>
              <option value="">Pilih Treatment Owner</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name}{u.department ? ` — ${u.department}` : ''}</option>)}
            </select>
          </div>
        </div>
      </Section>

      {/* ── Penilaian Risiko ── */}
      <Section title="Penilaian Risiko Inheren" eyebrow="Step 3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Likelihood (Kemungkinan)</label>
            <div className="space-y-2 mt-1">
              {[1,2,3,4,5].map(v => (
                <label key={v} className={`flex items-center gap-3 p-2.5 rounded border cursor-pointer transition-colors ${form.likelihood === v ? 'border-brand-blue bg-blue-50' : 'border-black/8 hover:border-brand-blue/30'}`}>
                  <input type="radio" name="likelihood" value={v} checked={form.likelihood === v} onChange={() => set('likelihood', v)} className="accent-brand-blue" />
                  <span className="text-sm"><span className="font-medium">{v}</span> — {LIKELIHOOD_LABELS[v]}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Impact (Dampak)</label>
            <div className="space-y-2 mt-1">
              {[1,2,3,4,5].map(v => (
                <label key={v} className={`flex items-center gap-3 p-2.5 rounded border cursor-pointer transition-colors ${form.impact === v ? 'border-brand-blue bg-blue-50' : 'border-black/8 hover:border-brand-blue/30'}`}>
                  <input type="radio" name="impact" value={v} checked={form.impact === v} onChange={() => set('impact', v)} className="accent-brand-blue" />
                  <span className="text-sm"><span className="font-medium">{v}</span> — {IMPACT_LABELS[v]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Score preview */}
        <div className="mt-4 p-4 rounded-lg bg-brand-gray flex items-center gap-4">
          <div>
            <p className="text-xs text-black/40 mb-1">Inherent Risk Score</p>
            <p className="text-3xl font-bold text-brand-navy">{form.likelihood * form.impact}</p>
            <p className="text-xs text-black/40">L{form.likelihood} × I{form.impact}</p>
          </div>
          <div className="w-px h-12 bg-black/10" />
          <div>
            <p className="text-xs text-black/40 mb-1">Klasifikasi</p>
            {inherentClass && (
              <span className={`badge ${classificationBadge(inherentClass).bg} ${classificationBadge(inherentClass).text} ${classificationBadge(inherentClass).border} text-sm px-3 py-1`}>
                {inherentClass}
              </span>
            )}
          </div>
        </div>
      </Section>

      {/* ── Residual Risk ── */}
      <Section title="Residual Risk (Opsional)" eyebrow="Step 4">
        <p className="text-sm text-black/40 mb-4">Isi jika kontrol sudah diterapkan dan Anda ingin mencatat skor risiko residual.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Residual Likelihood</label>
            <select className="input" value={form.residual_likelihood} onChange={e => set('residual_likelihood', e.target.value ? Number(e.target.value) : '')}>
              <option value="">— Tidak diisi —</option>
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v} — {LIKELIHOOD_LABELS[v]}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Residual Impact</label>
            <select className="input" value={form.residual_impact} onChange={e => set('residual_impact', e.target.value ? Number(e.target.value) : '')}>
              <option value="">— Tidak diisi —</option>
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v} — {IMPACT_LABELS[v]}</option>)}
            </select>
          </div>
        </div>
        {residualClass && (
          <div className="mt-3 p-3 rounded-lg bg-brand-gray flex items-center gap-4">
            <div>
              <p className="text-xs text-black/40 mb-1">Residual Score</p>
              <p className="text-2xl font-bold text-brand-navy">{Number(form.residual_likelihood) * Number(form.residual_impact)}</p>
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

      {/* ── Treatment ── */}
      <Section title="Risk Treatment" eyebrow="Step 5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {TREATMENTS.map(t => (
            <label key={t} className={`flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors text-center ${form.treatment_strategy === t ? 'border-brand-blue bg-blue-50' : 'border-black/8 hover:border-brand-blue/30'}`}>
              <input type="radio" name="treatment" value={t} checked={form.treatment_strategy === t} onChange={() => set('treatment_strategy', t)} className="sr-only" />
              <TreatmentIcon type={t} />
              <span className="text-sm font-medium">{t}</span>
            </label>
          ))}
        </div>
        <div>
          <label className="label">Catatan Treatment</label>
          <textarea className="input min-h-[70px] resize-none" placeholder="Jelaskan rencana penanganan risiko..." value={form.treatment_notes} onChange={e => set('treatment_notes', e.target.value)} />
        </div>
      </Section>

      {/* ── Review Cycle ── */}
      <Section title="Review Cycle" eyebrow="Step 6">
        <div>
          <label className="label">Frekuensi Review</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {FREQUENCIES.map(f => (
              <label key={f.value} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${form.review_frequency_days === f.value ? 'border-brand-blue bg-blue-50' : 'border-black/8 hover:border-brand-blue/30'}`}>
                <input type="radio" name="frequency" value={f.value} checked={form.review_frequency_days === f.value} onChange={() => set('review_frequency_days', f.value)} className="accent-brand-blue" />
                <span className="text-sm">{f.label}</span>
              </label>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Actions ── */}
      <div className="flex items-center gap-3 pt-2 pb-8">
        <button type="submit" className="btn-primary px-6" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan Risiko'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.back()}>
          Batal
        </button>
      </div>

    </form>
  )
}

function Section({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="mb-4">
        <span className="eyebrow text-[10px] mb-1 inline-block">{eyebrow}</span>
        <h3 className="text-base font-semibold text-brand-navy">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Required() {
  return <span className="text-red-400 ml-0.5">*</span>
}

function TreatmentIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    Mitigate: '🛡️', Accept: '✅', Transfer: '🤝', Avoid: '🚫',
  }
  return <span className="text-2xl">{icons[type]}</span>
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles, ChevronRight, RotateCcw, HelpCircle,
  Loader2, BookMarked, Check, Cpu,
} from 'lucide-react'
import { toast } from 'sonner'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import { createClient } from '@/lib/supabase/client'
import type { AvrClassification } from '@/types'

const SCOPE_OPTIONS = [
  'Proses Bisnis', 'Sistem / Aplikasi', 'Departemen / Unit Kerja',
  'Proyek', 'Aset Informasi', 'Infrastruktur IT', 'Vendor / Pihak Ketiga',
]

const FOKUS_OPTIONS = [
  'Keamanan Informasi', 'Operasional', 'Kepatuhan & Regulasi',
  'Sumber Daya Manusia', 'Finansial', 'Reputasi', 'Teknologi',
]

const LOADING_STEPS = [
  { label: 'Menganalisis konteks',             pct: 20 },
  { label: 'Mengidentifikasi ancaman',          pct: 45 },
  { label: 'Menilai likelihood & dampak',       pct: 65 },
  { label: 'Menyusun pertanyaan reflektif',     pct: 82 },
  { label: 'Memvalidasi terhadap ISO 27001',    pct: 95 },
]

interface GeneratedRisk {
  judul: string
  kategori: string
  deskripsi: string
  mengapa_relevan: string
  pertanyaan_reflektif: string[]
  likelihood: number
  impact: number
  klasifikasi: AvrClassification
  kontrol_yang_mungkin_ada: string
  treatment_saran: string
}

type Stage = 'input' | 'generating' | 'result' | 'saved'

function resetState() {
  return {
    stage:    'input' as Stage,
    risks:    [] as GeneratedRisk[],
    selected: new Set<number>(),
    deskripsi: '',
    scope:    '',
    fokus:    [] as string[],
  }
}

export default function RiskGeneratorPage() {
  const router = useRouter()

  const [stage, setStage]         = useState<Stage>('input')
  const [scope, setScope]         = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [fokus, setFokus]         = useState<string[]>([])
  const [risks, setRisks]         = useState<GeneratedRisk[]>([])
  const [selected, setSelected]   = useState<Set<number>>(new Set())
  const [progress, setProgress]   = useState(0)
  const [stepIdx, setStepIdx]     = useState(0)
  const [saving, setSaving]       = useState(false)

  function handleReset() {
    setStage('input')
    setRisks([])
    setSelected(new Set())
    setDeskripsi('')
    setScope('')
    setFokus([])
    setProgress(0)
    setStepIdx(0)
  }

  function toggleFokus(f: string) {
    setFokus(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  }

  function toggleSelect(i: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  async function handleGenerate() {
    if (!deskripsi.trim()) { toast.error('Deskripsikan konteks terlebih dahulu'); return }
    setStage('generating')
    setProgress(0)
    setStepIdx(0)
    setRisks([])
    setSelected(new Set())

    let currentStep = 0
    const interval = setInterval(() => {
      if (currentStep < LOADING_STEPS.length - 1) {
        currentStep++
        setStepIdx(currentStep)
        setProgress(LOADING_STEPS[currentStep].pct)
      }
    }, 2200)

    try {
      const res = await fetch('/api/risk-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, deskripsi, fokus }),
      })
      clearInterval(interval)
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Gagal mendapatkan respons')

      const parsed: GeneratedRisk[] = data.risks
      setRisks(parsed)

      const autoSelect = new Set<number>()
      parsed.forEach((r, i) => {
        if (['High', 'Extreme'].includes(r.klasifikasi)) autoSelect.add(i)
      })
      setSelected(autoSelect)
      setProgress(100)
      setTimeout(() => setStage('result'), 400)
    } catch (err) {
      clearInterval(interval)
      toast.error('Gagal menghubungi AI', { description: err instanceof Error ? err.message : '' })
      setStage('input')
    }
  }

  async function handleSaveToLibrary() {
    if (selected.size === 0) { toast.error('Pilih minimal satu risiko'); return }
    setSaving(true)
    const supabase = createClient()

    const payload = Array.from(selected).map(i => {
      const r = risks[i]
      return {
        ai_scope:                 scope || null,
        ai_fokus:                 fokus.length > 0 ? fokus : null,
        ai_context:               deskripsi,
        judul:                    r.judul,
        kategori:                 r.kategori,
        deskripsi:                r.deskripsi,
        mengapa_relevan:          r.mengapa_relevan,
        pertanyaan_reflektif:     r.pertanyaan_reflektif,
        likelihood:               r.likelihood,
        impact:                   r.impact,
        klasifikasi:              r.klasifikasi,
        kontrol_yang_mungkin_ada: r.kontrol_yang_mungkin_ada,
        treatment_saran:          r.treatment_saran,
        status:                   'pending',
      }
    })

    const { error } = await supabase.from('avr_risk_library').insert(payload)
    if (error) {
      toast.error('Gagal menyimpan ke Library', { description: error.message })
      setSaving(false)
      return
    }

    toast.success(`${selected.size} risiko disimpan ke Risk Library`)
    setStage('saved')
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div>
        <span className="eyebrow">AI-Powered · Admin Only</span>
        <h1 className="mt-1 flex items-center gap-2">
          <Sparkles size={22} className="text-brand-blue" />
          Risk Generator
        </h1>
        <p className="text-sm text-black/50 mt-0.5">
          Ceritakan konteks — AI mengidentifikasi potensi risiko, simpan ke Library, lalu proses ke Risk Register
        </p>
        {/* Model info */}
        <div className="flex items-center gap-2 mt-2">
          <Cpu size={12} className="text-black/30" />
          <span className="text-xs text-black/30">Powered by <span className="font-medium text-black/50">Claude Haiku 4.5</span> (claude-haiku-4-5) · Anthropic</span>
        </div>
      </div>

      {/* Input */}
      {stage === 'input' && (
        <div className="space-y-4">
          <div className="card space-y-5">
            <div>
              <label className="label">Scope Identifikasi</label>
              <div className="flex flex-wrap gap-2">
                {SCOPE_OPTIONS.map(s => (
                  <button key={s} type="button" onClick={() => setScope(scope === s ? '' : s)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${scope === s ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-black/60 border-black/10 hover:border-brand-blue/40'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Deskripsikan Konteks <span className="text-red-400">*</span></label>
              <textarea className="input min-h-[140px] resize-y text-sm leading-relaxed"
                placeholder={`Ceritakan secara bebas. Semakin detail, semakin relevan risiko yang dihasilkan.\n\nContoh: "Kami akan meluncurkan fitur pembayaran baru dalam 2 bulan. Tim developer 8 orang, sebagian remote. Integrasi dengan Midtrans dan BCA. Data transaksi di server on-premise. Belum ada penetration testing."`}
                value={deskripsi} onChange={e => setDeskripsi(e.target.value)} />
              <p className="text-xs text-black/30 mt-1">{deskripsi.length} karakter</p>
            </div>

            <div>
              <label className="label">Fokus Risiko (opsional)</label>
              <div className="flex flex-wrap gap-2">
                {FOKUS_OPTIONS.map(f => (
                  <button key={f} type="button" onClick={() => toggleFokus(f)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${fokus.includes(f) ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-black/60 border-black/10 hover:border-black/30'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-brand-blue/15">
            <HelpCircle size={15} className="text-brand-blue shrink-0 mt-0.5" />
            <p className="text-xs text-brand-blue/80 leading-relaxed">
              <strong>Cara kerja:</strong> AI menghasilkan 5 potensi risiko. Pilih yang relevan → simpan ke <strong>Risk Library</strong> → dari Library, proses satu per satu ke Risk Register dengan form lengkap.
            </p>
          </div>

          <button onClick={handleGenerate} disabled={deskripsi.trim().length < 20}
            className="btn-primary px-6 py-2.5 gap-2 disabled:opacity-40">
            <Sparkles size={16} /> Identifikasi Risiko <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* Generating */}
      {stage === 'generating' && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-full bg-brand-blue/10 flex items-center justify-center shrink-0">
              <Loader2 size={18} className="text-brand-blue animate-spin" />
            </div>
            <div>
              <p className="font-medium text-brand-navy">AI sedang menganalisis...</p>
              <p className="text-xs text-black/40 mt-0.5">{LOADING_STEPS[stepIdx]?.label}</p>
            </div>
          </div>
          <div className="space-y-2 mb-6">
            <div className="w-full h-2 bg-black/6 rounded-full overflow-hidden">
              <div className="h-full bg-brand-blue rounded-full transition-all duration-[2000ms] ease-out"
                style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between text-xs text-black/30">
              <span>Memproses konteks Anda</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
          <div className="space-y-2">
            {LOADING_STEPS.map((step, i) => {
              const done = i < stepIdx; const active = i === stepIdx
              return (
                <div key={step.label} className={`flex items-center gap-3 p-2.5 rounded-lg text-xs transition-all ${done ? 'bg-risk-low text-risk-low-text' : active ? 'bg-blue-50 text-brand-blue' : 'text-black/25'}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${done ? 'bg-[#5A9E2F] text-white' : active ? 'bg-brand-blue text-white' : 'bg-black/8'}`}>
                    {done ? '✓' : i + 1}
                  </span>
                  {step.label}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Result */}
      {stage === 'result' && risks.length > 0 && (
        <div className="space-y-4">
          <div className="card py-3 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Sparkles size={15} className="text-brand-blue" />
              <span className="text-sm font-medium">{risks.length} potensi risiko teridentifikasi</span>
              <span className="text-xs text-black/40">{selected.size} dipilih</span>
            </div>
            <div className="flex gap-2">
              <button onClick={handleReset} className="btn-ghost text-xs gap-1">
                <RotateCcw size={13} /> Generate Ulang
              </button>
              <button onClick={handleSaveToLibrary} disabled={selected.size === 0 || saving}
                className="btn-primary text-xs gap-1">
                <BookMarked size={13} />
                {saving ? 'Menyimpan...' : `Simpan ${selected.size > 0 ? `(${selected.size})` : ''} ke Library`}
              </button>
            </div>
          </div>

          {risks.map((risk, i) => {
            const isSelected = selected.has(i)
            return (
              <div key={i} className={`rounded-lg border transition-all bg-white ${isSelected ? 'border-brand-blue shadow-card-hover' : 'border-black/8 shadow-card'}`}>
                <div className="p-4 flex items-start gap-3">
                  <button type="button" onClick={() => toggleSelect(i)}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-brand-blue border-brand-blue' : 'border-black/20 hover:border-brand-blue'}`}>
                    {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <ClassificationBadge classification={risk.klasifikasi} size="sm" />
                      <span className="text-xs text-black/40 bg-black/5 px-2 py-0.5 rounded">{risk.kategori}</span>
                      <span className="text-xs text-black/30">L{risk.likelihood} × I{risk.impact} = {risk.likelihood * risk.impact}</span>
                    </div>
                    <p className="font-semibold text-brand-navy text-sm leading-snug">{risk.judul}</p>
                    <p className="text-xs text-black/50 mt-1 leading-relaxed">{risk.mengapa_relevan}</p>
                  </div>
                </div>
              </div>
            )
          })}

          <div className="flex items-center justify-between pt-2 pb-8">
            <button onClick={handleReset} className="btn-secondary gap-1.5">
              <RotateCcw size={14} /> Generate Ulang
            </button>
            <button onClick={handleSaveToLibrary} disabled={selected.size === 0 || saving} className="btn-primary gap-1.5">
              <BookMarked size={15} />
              {saving ? 'Menyimpan...' : `Simpan ${selected.size} Risiko ke Library`}
            </button>
          </div>
        </div>
      )}

      {/* Saved */}
      {stage === 'saved' && (
        <div className="card text-center py-12 space-y-4">
          <div className="w-14 h-14 rounded-full bg-risk-low flex items-center justify-center mx-auto">
            <Check size={24} className="text-risk-low-text" />
          </div>
          <div>
            <p className="font-semibold text-brand-navy text-lg">Tersimpan ke Risk Library</p>
            <p className="text-sm text-black/50 mt-1">
              Risiko siap diproses ke Risk Register dari halaman Risk Library
            </p>
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <button onClick={() => router.push('/risk-library')} className="btn-primary gap-1.5">
              <BookMarked size={15} /> Buka Risk Library
            </button>
            <button onClick={handleReset} className="btn-secondary gap-1.5">
              <Sparkles size={14} /> Generate Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

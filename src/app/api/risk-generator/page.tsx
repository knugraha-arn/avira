'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles, ChevronRight, RotateCcw, Plus,
  HelpCircle, AlertTriangle, ArrowRight, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { classificationBadge } from '@/lib/utils'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import type { AvrClassification } from '@/types'

const SCOPE_OPTIONS = [
  'Proses Bisnis', 'Sistem / Aplikasi', 'Departemen / Unit Kerja',
  'Proyek', 'Aset Informasi', 'Infrastruktur IT', 'Vendor / Pihak Ketiga',
]

const FOKUS_OPTIONS = [
  'Keamanan Informasi', 'Operasional', 'Kepatuhan & Regulasi',
  'Sumber Daya Manusia', 'Finansial', 'Reputasi', 'Teknologi',
]

const LOADING_MESSAGES = [
  'Menganalisis konteks yang diberikan...',
  'Mengidentifikasi potensi ancaman...',
  'Menilai likelihood dan dampak...',
  'Menyusun pertanyaan reflektif...',
  'Memvalidasi terhadap ISO 27001...',
  'Menyiapkan hasil identifikasi...',
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

type Stage = 'input' | 'generating' | 'result'

export default function RiskGeneratorPage() {
  const router = useRouter()

  const [stage, setStage]         = useState<Stage>('input')
  const [scope, setScope]         = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [fokus, setFokus]         = useState<string[]>([])
  const [risks, setRisks]         = useState<GeneratedRisk[]>([])
  const [selected, setSelected]   = useState<Set<number>>(new Set())
  const [expanded, setExpanded]   = useState<number | null>(null)
  const [progress, setProgress]   = useState(0)
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0])

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
    setRisks([])
    setSelected(new Set())

    // Animate progress bar and cycle messages
    let prog = 0
    let msgIdx = 0
    const interval = setInterval(() => {
      prog = Math.min(prog + Math.random() * 8, 88)
      setProgress(prog)
      if (prog > msgIdx * 15 && msgIdx < LOADING_MESSAGES.length - 1) {
        msgIdx++
        setLoadingMsg(LOADING_MESSAGES[msgIdx])
      }
    }, 400)

    try {
      const res = await fetch('/api/risk-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, deskripsi, fokus }),
      })

      if (!res.ok) throw new Error(await res.text())

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.error) throw new Error(data.error)
            if (data.chunk) fullText += data.chunk
            if (data.done) {
              clearInterval(interval)
              setProgress(100)
              setLoadingMsg('Selesai!')

              const parsed: GeneratedRisk[] = JSON.parse(data.full)
              setRisks(parsed)

              const autoSelect = new Set<number>()
              parsed.forEach((r, i) => {
                if (['High', 'Extreme'].includes(r.klasifikasi)) autoSelect.add(i)
              })
              setSelected(autoSelect)

              setTimeout(() => setStage('result'), 400)
            }
          } catch (parseErr) {
            // ignore partial chunks
          }
        }
      }
    } catch (err) {
      clearInterval(interval)
      toast.error('Gagal menghubungi AI', { description: err instanceof Error ? err.message : '' })
      setStage('input')
    }
  }

  function handleAddToRegister(idx: number) {
    const risk = risks[idx]
    const params = new URLSearchParams({
      ai_judul:      risk.judul,
      ai_kategori:   risk.kategori,
      ai_deskripsi:  risk.deskripsi,
      ai_likelihood: String(risk.likelihood),
      ai_impact:     String(risk.impact),
      ai_treatment:  risk.treatment_saran,
      ai_generated:  '1',
    })
    router.push(`/risks/new?${params.toString()}`)
  }

  function handleAddSelected() {
    if (selected.size === 0) { toast.error('Pilih minimal satu risiko'); return }
    handleAddToRegister(Array.from(selected)[0])
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div>
        <span className="eyebrow">AI-Powered</span>
        <h1 className="mt-1 flex items-center gap-2">
          <Sparkles size={22} className="text-brand-blue" />
          Risk Generator
        </h1>
        <p className="text-sm text-black/50 mt-0.5">
          Ceritakan konteks Anda — AI akan mengidentifikasi potensi risiko dan memancing Anda berpikir lebih kritis
        </p>
      </div>

      {/* ── Input ── */}
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
              <textarea
                className="input min-h-[140px] resize-y text-sm leading-relaxed"
                placeholder={`Ceritakan secara bebas. Semakin detail, semakin relevan risiko yang dihasilkan.\n\nContoh: "Kami akan meluncurkan fitur pembayaran baru dalam 2 bulan. Tim developer 8 orang, sebagian remote. Integrasi dengan payment gateway Midtrans dan BCA. Data transaksi disimpan di server on-premise. Belum ada penetration testing sebelumnya."`}
                value={deskripsi}
                onChange={e => setDeskripsi(e.target.value)}
              />
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
              <strong>Cara kerja:</strong> AI menganalisis konteks Anda dan menghasilkan potensi risiko lengkap dengan pertanyaan reflektif. Pilih risiko yang relevan, sesuaikan, lalu simpan ke Risk Register. Setiap risiko ditandai <em>AI-Generated</em> untuk keperluan audit ISO 27001.
            </p>
          </div>

          <button onClick={handleGenerate} disabled={deskripsi.trim().length < 20}
            className="btn-primary px-6 py-2.5 gap-2 disabled:opacity-40">
            <Sparkles size={16} />
            Identifikasi Risiko
            <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* ── Generating ── */}
      {stage === 'generating' && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-full bg-brand-blue/10 flex items-center justify-center shrink-0">
              <Loader2 size={18} className="text-brand-blue animate-spin" />
            </div>
            <div>
              <p className="font-medium text-brand-navy">AI sedang menganalisis...</p>
              <p className="text-xs text-black/40 mt-0.5">{loadingMsg}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="w-full h-2 bg-black/6 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-blue rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-black/30">
              <span>Menganalisis konteks</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Steps indicator */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            {['Analisis Konteks', 'Identifikasi Risiko', 'Susun Pertanyaan'].map((step, i) => {
              const done = progress > (i + 1) * 30
              const active = progress > i * 30 && !done
              return (
                <div key={step} className={`flex items-center gap-2 p-2.5 rounded-lg text-xs transition-colors ${done ? 'bg-risk-low text-risk-low-text' : active ? 'bg-blue-50 text-brand-blue' : 'bg-brand-gray text-black/30'}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${done ? 'bg-[#5A9E2F] text-white' : active ? 'bg-brand-blue text-white' : 'bg-black/10 text-black/30'}`}>
                    {done ? '✓' : i + 1}
                  </span>
                  {step}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Result ── */}
      {stage === 'result' && risks.length > 0 && (
        <div className="space-y-4">

          <div className="card py-3 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Sparkles size={15} className="text-brand-blue" />
              <span className="text-sm font-medium">{risks.length} potensi risiko teridentifikasi</span>
              <span className="text-xs text-black/40">{selected.size} dipilih</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setStage('input'); setRisks([]) }} className="btn-ghost text-xs gap-1">
                <RotateCcw size={13} /> Generate Ulang
              </button>
              <button onClick={handleAddSelected} disabled={selected.size === 0} className="btn-primary text-xs gap-1">
                <Plus size={13} /> Tambah {selected.size > 0 ? `(${selected.size})` : ''} ke Register
              </button>
            </div>
          </div>

          {risks.map((risk, i) => {
            const isSelected = selected.has(i)
            const isExpanded = expanded === i

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
                  <button type="button" onClick={() => setExpanded(isExpanded ? null : i)}
                    className="btn-ghost py-1 px-2 text-xs gap-1 shrink-0">
                    {isExpanded ? 'Tutup' : 'Detail'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-black/5 px-4 pb-4 pt-3 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-black/40 uppercase tracking-wide mb-1">Deskripsi</p>
                      <p className="text-sm text-black/70 leading-relaxed">{risk.deskripsi}</p>
                    </div>

                    <div className="bg-brand-amber/10 rounded-lg p-3 border border-brand-amber/20">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={13} className="text-[#7A4C00]" />
                        <p className="text-xs font-semibold text-[#7A4C00] uppercase tracking-wide">Pertanyaan untuk Anda</p>
                      </div>
                      <ul className="space-y-2">
                        {risk.pertanyaan_reflektif.map((q, qi) => (
                          <li key={qi} className="flex items-start gap-2 text-sm text-[#7A4C00]">
                            <span className="font-bold shrink-0">{qi + 1}.</span>
                            <span className="leading-relaxed">{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-brand-gray rounded-lg p-3">
                        <p className="text-xs font-semibold text-black/40 uppercase tracking-wide mb-1">Kontrol yang Mungkin Sudah Ada</p>
                        <p className="text-xs text-black/60 leading-relaxed">{risk.kontrol_yang_mungkin_ada}</p>
                      </div>
                      <div className="bg-brand-gray rounded-lg p-3">
                        <p className="text-xs font-semibold text-black/40 uppercase tracking-wide mb-1">Saran Treatment</p>
                        <span className="text-xs font-medium text-brand-blue">{risk.treatment_saran}</span>
                      </div>
                    </div>

                    <button onClick={() => handleAddToRegister(i)} className="btn-primary text-xs gap-1.5 w-full justify-center py-2">
                      <Plus size={13} />
                      Tambah Risiko Ini ke Register
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          <div className="flex items-center justify-between pt-2 pb-8">
            <button onClick={() => { setStage('input'); setRisks([]) }} className="btn-secondary gap-1.5">
              <RotateCcw size={14} /> Generate Ulang
            </button>
            <button onClick={handleAddSelected} disabled={selected.size === 0} className="btn-primary gap-1.5">
              <Plus size={15} />
              Tambah {selected.size} Risiko Terpilih ke Register
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

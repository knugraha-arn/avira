'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  BookMarked, Search, Filter, X, ArrowRight,
  ChevronDown, AlertTriangle, RotateCcw, Clock,
  CheckCircle, XCircle, Sparkles,
} from 'lucide-react'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import { formatDate } from '@/lib/utils'
import type { AvrClassification } from '@/types'

interface LibraryItem {
  id: string
  created_at: string
  created_by: string
  ai_scope: string | null
  ai_fokus: string[] | null
  ai_context: string
  judul: string
  kategori: string
  deskripsi: string | null
  mengapa_relevan: string | null
  pertanyaan_reflektif: string[]
  likelihood: number
  impact: number
  klasifikasi: AvrClassification
  kontrol_yang_mungkin_ada: string | null
  treatment_saran: string | null
  status: 'pending' | 'used' | 'dismissed' | 'expired'
  dismiss_reason: string | null
  risk_id: string | null
  used_at: string | null
  creator?: { full_name: string } | null
  risk?: { risk_code: string; title: string } | null
}

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-blue-50 text-brand-blue border-brand-blue/20' },
  used:      { label: 'Dipakai',   color: 'bg-risk-low text-risk-low-text border-risk-low-text/20' },
  dismissed: { label: 'Dismissed', color: 'bg-black/5 text-black/50 border-black/10' },
  expired:   { label: 'Expired',   color: 'bg-brand-amber/10 text-[#7A4C00] border-brand-amber/20' },
}

interface Props {
  initialItems: LibraryItem[]
  canWrite: boolean
  currentUserId: string
}

export function RiskLibraryClient({ initialItems, canWrite, currentUserId }: Props) {
  const router = useRouter()
  const [items, setItems]           = useState<LibraryItem[]>(initialItems)
  const [selected, setSelected]     = useState<LibraryItem | null>(null)
  const [search, setSearch]         = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('pending')
  const [filterClass, setFilterClass]   = useState<string>('')
  const [dismissReason, setDismissReason] = useState('')
  const [showDismiss, setShowDismiss]   = useState(false)
  const [loading, setLoading]       = useState(false)

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (filterStatus && item.status !== filterStatus) return false
      if (filterClass && item.klasifikasi !== filterClass) return false
      if (search) {
        const q = search.toLowerCase()
        return item.judul.toLowerCase().includes(q) ||
          item.kategori.toLowerCase().includes(q) ||
          item.ai_context.toLowerCase().includes(q)
      }
      return true
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [items, filterStatus, filterClass, search])

  async function handleAddToRegister(item: LibraryItem) {
    const params = new URLSearchParams({
      ai_judul:      item.judul,
      ai_kategori:   item.kategori,
      ai_deskripsi:  item.deskripsi ?? '',
      ai_likelihood: String(item.likelihood),
      ai_impact:     String(item.impact),
      ai_treatment:  item.treatment_saran ?? 'Mitigate',
      ai_generated:  '1',
      library_id:    item.id,
    })
    router.push(`/risks/new?${params.toString()}`)
  }

  async function handleDismiss() {
    if (!selected) return
    if (!dismissReason.trim()) { toast.error('Alasan dismiss wajib diisi'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('avr_risk_library').update({
      status:        'dismissed',
      dismiss_reason: dismissReason,
      dismissed_at:  new Date().toISOString(),
      dismissed_by:  currentUserId,
    }).eq('id', selected.id)
    if (error) { toast.error(error.message); setLoading(false); return }
    setItems(i => i.map(x => x.id === selected.id ? { ...x, status: 'dismissed', dismiss_reason: dismissReason } : x))
    toast.success('Risiko di-dismiss')
    setSelected(null); setShowDismiss(false); setDismissReason('')
    setLoading(false)
  }

  async function handleReactivate(item: LibraryItem) {
    const supabase = createClient()
    const { error } = await supabase.from('avr_risk_library').update({
      status:     'pending',
      expired_at: null,
      updated_at: new Date().toISOString(),
    }).eq('id', item.id)
    if (error) { toast.error(error.message); return }
    setItems(i => i.map(x => x.id === item.id ? { ...x, status: 'pending' } : x))
    toast.success('Risiko diaktifkan kembali')
  }

  const counts = {
    pending:   items.filter(i => i.status === 'pending').length,
    used:      items.filter(i => i.status === 'used').length,
    dismissed: items.filter(i => i.status === 'dismissed').length,
    expired:   items.filter(i => i.status === 'expired').length,
  }

  return (
    <div className="flex gap-0 relative">

      {/* Main list */}
      <div className={`flex-1 space-y-5 transition-all ${selected ? 'mr-[420px]' : ''}`}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="eyebrow">AI-Powered</span>
            <h1 className="mt-1 flex items-center gap-2">
              <BookMarked size={20} className="text-brand-blue" />
              Risk Library
            </h1>
            <p className="text-sm text-black/50 mt-0.5">
              Staging area risiko dari AI Generator sebelum masuk ke Risk Register
            </p>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 border-b border-black/8 flex-wrap">
          {([
            { key: 'pending',   label: `Pending (${counts.pending})` },
            { key: 'used',      label: `Dipakai (${counts.used})` },
            { key: 'dismissed', label: `Dismissed (${counts.dismissed})` },
            { key: 'expired',   label: `Expired (${counts.expired})` },
            { key: '',          label: `Semua (${items.length})` },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setFilterStatus(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${filterStatus === t.key ? 'border-brand-blue text-brand-blue' : 'border-transparent text-black/40 hover:text-black'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
            <input className="input pl-8" placeholder="Cari judul, kategori, atau konteks..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-40" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
            <option value="">Semua Klasifikasi</option>
            {['Extreme', 'High', 'Medium', 'Low'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 gap-3">
            <BookMarked size={32} className="text-black/15" />
            <p className="text-sm text-black/30">
              {filterStatus === 'pending' ? 'Tidak ada risiko pending — generate dari Risk Generator' : 'Tidak ada risiko'}
            </p>
            {filterStatus === 'pending' && (
              <button onClick={() => router.push('/risk-generator')} className="btn-primary text-xs gap-1.5 mt-2">
                <Sparkles size={13} /> Buka Risk Generator
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(item => {
              const statusCfg = STATUS_CONFIG[item.status]
              const isActive = selected?.id === item.id
              return (
                <div key={item.id}
                  onClick={() => setSelected(isActive ? null : item)}
                  className={`card cursor-pointer transition-all hover:shadow-card-hover ${isActive ? 'border-brand-blue' : 'border-black/8'}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <ClassificationBadge classification={item.klasifikasi} size="sm" />
                        <span className="text-xs text-black/40 bg-black/5 px-2 py-0.5 rounded">{item.kategori}</span>
                        <span className={`badge text-[10px] ${statusCfg.color}`}>{statusCfg.label}</span>
                        <span className="text-xs text-black/30">L{item.likelihood}×I{item.impact}</span>
                      </div>
                      <p className="font-semibold text-brand-navy text-sm leading-snug">{item.judul}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-xs text-black/40 flex items-center gap-1">
                          <Sparkles size={10} /> {item.creator?.full_name ?? '—'}
                        </span>
                        <span className="text-xs text-black/30">{formatDate(item.created_at)}</span>
                        {item.ai_scope && (
                          <span className="text-xs text-black/30 bg-black/5 px-2 py-0.5 rounded">{item.ai_scope}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {canWrite && item.status === 'pending' && (
                        <button onClick={e => { e.stopPropagation(); handleAddToRegister(item) }}
                          className="btn-primary text-xs gap-1 py-1.5">
                          <ArrowRight size={12} /> Register
                        </button>
                      )}
                      {canWrite && item.status === 'expired' && (
                        <button onClick={e => { e.stopPropagation(); handleReactivate(item) }}
                          className="btn-secondary text-xs gap-1 py-1.5">
                          <RotateCcw size={12} /> Aktifkan
                        </button>
                      )}
                      {item.status === 'used' && item.risk && (
                        <button onClick={e => { e.stopPropagation(); router.push(`/risks/${item.risk_id}`) }}
                          className="btn-ghost text-xs gap-1 py-1.5">
                          <ArrowRight size={12} /> Lihat Risk
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Drawer */}
      {selected && (
        <div className="fixed top-0 right-0 h-full w-[400px] bg-white border-l border-black/8 shadow-xl z-40 flex flex-col">

          {/* Drawer header */}
          <div className="flex items-start justify-between p-5 border-b border-black/8">
            <div className="flex-1 min-w-0 pr-3">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <ClassificationBadge classification={selected.klasifikasi} size="sm" />
                <span className={`badge text-[10px] ${STATUS_CONFIG[selected.status].color}`}>
                  {STATUS_CONFIG[selected.status].label}
                </span>
              </div>
              <p className="font-semibold text-brand-navy text-sm leading-snug">{selected.judul}</p>
            </div>
            <button onClick={() => { setSelected(null); setShowDismiss(false) }} className="btn-ghost p-1 shrink-0">
              <X size={16} />
            </button>
          </div>

          {/* Drawer content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* Meta */}
            <div className="text-xs text-black/40 space-y-1">
              <p><span className="font-medium">Digenerate oleh:</span> {selected.creator?.full_name ?? '—'}</p>
              <p><span className="font-medium">Tanggal:</span> {formatDate(selected.created_at)}</p>
              {selected.ai_scope && <p><span className="font-medium">Scope:</span> {selected.ai_scope}</p>}
              {selected.ai_fokus?.length ? <p><span className="font-medium">Fokus:</span> {selected.ai_fokus.join(', ')}</p> : null}
            </div>

            {/* Konteks AI */}
            <div>
              <p className="text-xs font-semibold text-black/40 uppercase tracking-wide mb-1">Konteks Generate</p>
              <div className="p-3 bg-brand-gray rounded-lg text-xs text-black/60 leading-relaxed">
                {selected.ai_context}
              </div>
            </div>

            {/* Score */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-brand-gray rounded-lg">
                <p className="text-xs text-black/40 mb-1">Score</p>
                <p className="text-2xl font-bold text-brand-navy">{selected.likelihood * selected.impact}</p>
                <p className="text-xs text-black/30">L{selected.likelihood} × I{selected.impact}</p>
              </div>
              <div className="p-3 bg-brand-gray rounded-lg">
                <p className="text-xs text-black/40 mb-1">Treatment Saran</p>
                <p className="text-sm font-medium text-brand-blue">{selected.treatment_saran ?? '—'}</p>
              </div>
            </div>

            {/* Deskripsi */}
            {selected.deskripsi && (
              <div>
                <p className="text-xs font-semibold text-black/40 uppercase tracking-wide mb-1">Deskripsi</p>
                <p className="text-sm text-black/70 leading-relaxed">{selected.deskripsi}</p>
              </div>
            )}

            {/* Mengapa relevan */}
            {selected.mengapa_relevan && (
              <div>
                <p className="text-xs font-semibold text-black/40 uppercase tracking-wide mb-1">Mengapa Relevan</p>
                <p className="text-sm text-black/60 leading-relaxed">{selected.mengapa_relevan}</p>
              </div>
            )}

            {/* Pertanyaan reflektif */}
            {selected.pertanyaan_reflektif?.length > 0 && (
              <div className="bg-brand-amber/10 rounded-lg p-3 border border-brand-amber/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={13} className="text-[#7A4C00]" />
                  <p className="text-xs font-semibold text-[#7A4C00] uppercase tracking-wide">Pertanyaan Reflektif</p>
                </div>
                <ul className="space-y-2">
                  {selected.pertanyaan_reflektif.map((q, qi) => (
                    <li key={qi} className="flex items-start gap-2 text-sm text-[#7A4C00]">
                      <span className="font-bold shrink-0">{qi + 1}.</span>
                      <span className="leading-relaxed">{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Kontrol */}
            {selected.kontrol_yang_mungkin_ada && (
              <div>
                <p className="text-xs font-semibold text-black/40 uppercase tracking-wide mb-1">Kontrol yang Mungkin Ada</p>
                <p className="text-sm text-black/60 leading-relaxed">{selected.kontrol_yang_mungkin_ada}</p>
              </div>
            )}

            {/* Dismiss reason */}
            {selected.status === 'dismissed' && selected.dismiss_reason && (
              <div className="bg-black/4 rounded-lg p-3">
                <p className="text-xs font-semibold text-black/40 uppercase tracking-wide mb-1">Alasan Dismiss</p>
                <p className="text-sm text-black/60">{selected.dismiss_reason}</p>
              </div>
            )}

            {/* Used info */}
            {selected.status === 'used' && selected.risk && (
              <div className="bg-risk-low rounded-lg p-3">
                <p className="text-xs font-semibold text-risk-low-text uppercase tracking-wide mb-1">Sudah di Risk Register</p>
                <p className="text-sm font-medium">{selected.risk.risk_code} — {selected.risk.title}</p>
                <p className="text-xs text-black/40 mt-0.5">{formatDate(selected.used_at)}</p>
              </div>
            )}

            {/* Dismiss form */}
            {showDismiss && (
              <div className="space-y-2">
                <label className="label">Alasan Dismiss <span className="text-red-400">*</span></label>
                <textarea className="input min-h-[80px] resize-none text-sm"
                  placeholder="Jelaskan mengapa risiko ini tidak relevan atau tidak perlu dimasukkan ke Register..."
                  value={dismissReason} onChange={e => setDismissReason(e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={handleDismiss} disabled={loading} className="btn-primary text-xs flex-1 justify-center gap-1 py-2">
                    <XCircle size={12} /> {loading ? 'Menyimpan...' : 'Konfirmasi Dismiss'}
                  </button>
                  <button onClick={() => { setShowDismiss(false); setDismissReason('') }} className="btn-secondary text-xs">
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Drawer actions */}
          {canWrite && selected.status === 'pending' && !showDismiss && (
            <div className="p-4 border-t border-black/8 space-y-2">
              <button onClick={() => handleAddToRegister(selected)}
                className="btn-primary w-full justify-center gap-1.5">
                <ArrowRight size={15} /> Masuk Risk Register
              </button>
              <button onClick={() => setShowDismiss(true)}
                className="btn-secondary w-full justify-center gap-1.5 text-sm">
                <XCircle size={14} /> Dismiss
              </button>
            </div>
          )}
          {canWrite && selected.status === 'expired' && (
            <div className="p-4 border-t border-black/8">
              <button onClick={() => handleReactivate(selected)}
                className="btn-secondary w-full justify-center gap-1.5">
                <RotateCcw size={14} /> Aktifkan Kembali
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

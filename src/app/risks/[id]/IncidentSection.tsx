'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, AlertTriangle, X, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Incident {
  id: string
  incident_date: string
  title: string
  description: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  reporter?: { full_name: string } | null
}

interface Props {
  riskId: string
  incidents: Incident[]
  canEdit: boolean
  currentUserId: string
}

const SEVERITY_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  Low:      { bg: 'bg-risk-low',      text: 'text-risk-low-text',      dot: 'bg-[#1E5C0A]' },
  Medium:   { bg: 'bg-risk-medium',   text: 'text-risk-medium-text',   dot: 'bg-brand-amber' },
  High:     { bg: 'bg-risk-high',     text: 'text-risk-high-text',     dot: 'bg-[#E07800]' },
  Critical: { bg: 'bg-risk-extreme',  text: 'text-risk-extreme-text',  dot: 'bg-white' },
}

export function IncidentSection({ riskId, incidents: initialIncidents, canEdit, currentUserId }: Props) {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    incident_date: new Date().toISOString().split('T')[0],
    title:         '',
    description:   '',
    severity:      'Medium' as Incident['severity'],
  })

  function set(field: string, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.title.trim())       { toast.error('Judul insiden wajib diisi'); return }
    if (!form.description.trim()) { toast.error('Deskripsi insiden wajib diisi'); return }
    setSaving(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('avr_risk_incidents')
      .insert({
        risk_id:       riskId,
        reported_by:   currentUserId,
        incident_date: form.incident_date,
        title:         form.title,
        description:   form.description,
        severity:      form.severity,
      })
      .select('*, reporter:avr_user_profiles(full_name)')
      .single()

    if (error) { toast.error('Gagal menyimpan', { description: error.message }); setSaving(false); return }

    setIncidents(prev => [data as Incident, ...prev].sort((a, b) =>
      new Date(b.incident_date).getTime() - new Date(a.incident_date).getTime()
    ))
    setForm({ incident_date: new Date().toISOString().split('T')[0], title: '', description: '', severity: 'Medium' })
    setShowForm(false)
    toast.success('Insiden ditambahkan')
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const supabase = createClient()
    const { error } = await supabase.from('avr_risk_incidents').delete().eq('id', id)
    if (error) { toast.error('Gagal menghapus', { description: error.message }); setDeletingId(null); return }
    setIncidents(prev => prev.filter(i => i.id !== id))
    toast.success('Insiden dihapus')
    setDeletingId(null)
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3>Insiden Terkait</h3>
          <p className="text-xs text-black/40 mt-0.5">
            Kejadian nyata yang membuktikan risiko ini pernah terjadi
          </p>
        </div>
        {canEdit && (
          <button onClick={() => setShowForm(v => !v)} className="btn-primary text-xs gap-1">
            {showForm ? <X size={13} /> : <Plus size={13} />}
            {showForm ? 'Batal' : 'Catat Insiden'}
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-5 p-4 rounded-lg border border-red-200 bg-red-50/40 space-y-3">
          <p className="text-xs font-semibold text-brand-navy">Insiden Baru</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Tanggal Insiden <span className="text-red-400">*</span></label>
              <input type="date" className="input bg-white"
                value={form.incident_date}
                onChange={e => set('incident_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Severity</label>
              <div className="flex gap-1.5">
                {(['Low', 'Medium', 'High', 'Critical'] as const).map(s => (
                  <button key={s} type="button" onClick={() => set('severity', s)}
                    className={`flex-1 text-xs py-1.5 rounded border transition-colors ${
                      form.severity === s
                        ? `${SEVERITY_STYLE[s].bg} ${SEVERITY_STYLE[s].text} border-current font-medium`
                        : 'bg-white text-black/40 border-black/10 hover:border-black/20'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="label">Judul Insiden <span className="text-red-400">*</span></label>
            <input className="input bg-white"
              placeholder="Contoh: Downtime EDC 6 jam akibat kegagalan vendor"
              value={form.title}
              onChange={e => set('title', e.target.value)} />
          </div>

          <div>
            <label className="label">Deskripsi <span className="text-red-400">*</span></label>
            <textarea className="input min-h-[80px] resize-none bg-white"
              placeholder="Jelaskan apa yang terjadi, dampak, dan bagaimana ditangani..."
              value={form.description}
              onChange={e => set('description', e.target.value)} />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} className="btn-primary text-xs" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Insiden'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-xs">Batal</button>
          </div>
        </div>
      )}

      {/* List */}
      {incidents.length === 0 ? (
        <p className="text-sm text-black/30 py-4 text-center">Belum ada insiden tercatat untuk risiko ini</p>
      ) : (
        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-px bg-black/8" />
          <div className="space-y-4">
            {incidents.map((inc, i) => {
              const sev = SEVERITY_STYLE[inc.severity] ?? SEVERITY_STYLE.Medium
              return (
                <div key={inc.id} className="relative pl-8">
                  <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ${i === 0 ? 'bg-red-500' : 'bg-black/15'}`} />
                  <div className="bg-brand-gray rounded-lg p-3">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-xs font-semibold text-brand-navy">{formatDate(inc.incident_date)}</span>
                      <span className={`badge ${sev.bg} ${sev.text} text-[10px] px-1.5 py-0`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                        {inc.severity}
                      </span>
                      <span className="text-xs text-black/40">oleh {inc.reporter?.full_name ?? '—'}</span>
                      {canEdit && (
                        <button
                          onClick={() => handleDelete(inc.id)}
                          disabled={deletingId === inc.id}
                          className="ml-auto text-black/20 hover:text-red-500 transition-colors"
                          title="Hapus insiden"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm font-medium text-black/80 flex items-center gap-1.5">
                      <AlertTriangle size={12} className="text-red-400 shrink-0" />
                      {inc.title}
                    </p>
                    <p className="text-sm text-black/60 leading-relaxed mt-1">{inc.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

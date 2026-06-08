'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, CheckCircle, AlertCircle, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface MitigationLog {
  id: string
  update_date: string
  progress_percentage: number
  mitigation_notes: string
  target_completion_date: string | null
  actual_completion_date: string | null
  days_deviation: number | null
  evidence_reference: string | null
  attachment_url: string | null
  updater?: { full_name: string } | null
}

interface Props {
  riskId: string
  riskStatus: string
  logs: MitigationLog[]
  canEdit: boolean
  currentUserId: string
}

export function MitigationSection({ riskId, riskStatus, logs: initialLogs, canEdit, currentUserId }: Props) {
  const [logs, setLogs]           = useState<MitigationLog[]>(initialLogs)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)

  const [form, setForm] = useState({
    progress_percentage:    0,
    mitigation_notes:       '',
    target_completion_date: '',
    actual_completion_date: '',
    evidence_reference:     '',
  })

  function set(field: string, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.mitigation_notes.trim()) { toast.error('Catatan mitigasi wajib diisi'); return }
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('avr_mitigation_logs')
      .insert({
        risk_id:                riskId,
        updated_by:             currentUserId,
        update_date:            new Date().toISOString().split('T')[0],
        progress_percentage:    form.progress_percentage,
        mitigation_notes:       form.mitigation_notes,
        target_completion_date: form.target_completion_date || null,
        actual_completion_date: form.actual_completion_date || null,
        evidence_reference:     form.evidence_reference || null,
      })
      .select('*, updater:avr_user_profiles(full_name)')
      .single()

    if (error) { toast.error('Gagal menyimpan', { description: error.message }); setSaving(false); return }

    setLogs(l => [data as MitigationLog, ...l])
    setForm({ progress_percentage: 0, mitigation_notes: '', target_completion_date: '', actual_completion_date: '', evidence_reference: '' })
    setShowForm(false)
    toast.success('Log mitigasi ditambahkan')
    setSaving(false)
  }

  const latestProgress = logs[0]?.progress_percentage ?? 0

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3>Timeline Mitigasi</h3>
          {logs.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-24 h-1.5 bg-black/8 rounded-full overflow-hidden">
                <div className="h-full bg-brand-blue rounded-full transition-all"
                  style={{ width: `${latestProgress}%` }} />
              </div>
              <span className="text-xs text-black/40">{latestProgress}% selesai</span>
            </div>
          )}
        </div>
        {canEdit && riskStatus !== 'Closed' && (
          <button onClick={() => setShowForm(v => !v)} className="btn-primary text-xs gap-1">
            {showForm ? <X size={13} /> : <Plus size={13} />}
            {showForm ? 'Batal' : 'Tambah Log'}
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-5 p-4 rounded-lg border border-brand-blue/20 bg-blue-50 space-y-3">
          <p className="text-xs font-semibold text-brand-navy">Log Mitigasi Baru</p>

          <div>
            <label className="label">Progress (%)</label>
            <div className="flex items-center gap-3">
              <input type="range" min={0} max={100} step={5}
                value={form.progress_percentage}
                onChange={e => set('progress_percentage', Number(e.target.value))}
                className="flex-1 accent-brand-blue" />
              <span className="text-sm font-semibold text-brand-navy w-10 text-right">
                {form.progress_percentage}%
              </span>
            </div>
          </div>

          <div>
            <label className="label">Catatan Mitigasi <span className="text-red-400">*</span></label>
            <textarea className="input min-h-[80px] resize-none bg-white"
              placeholder="Jelaskan tindakan yang sudah dilakukan dan perkembangan terkini..."
              value={form.mitigation_notes}
              onChange={e => set('mitigation_notes', e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Target Penyelesaian</label>
              <input type="date" className="input bg-white"
                value={form.target_completion_date}
                onChange={e => set('target_completion_date', e.target.value)} />
            </div>
            <div>
              <label className="label">Tanggal Aktual Selesai</label>
              <input type="date" className="input bg-white"
                value={form.actual_completion_date}
                onChange={e => set('actual_completion_date', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Evidence Reference</label>
            <input className="input bg-white"
              placeholder="Contoh: SOP IT-SEC-001 Rev.03, Minutes Meeting MRM-2026-05"
              value={form.evidence_reference}
              onChange={e => set('evidence_reference', e.target.value)} />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} className="btn-primary text-xs" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Log'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-xs">Batal</button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {logs.length === 0 ? (
        <p className="text-sm text-black/30 py-4 text-center">Belum ada log mitigasi</p>
      ) : (
        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-px bg-black/8" />
          <div className="space-y-4">
            {logs.map((log, i) => {
              const overdue = log.days_deviation !== null && log.days_deviation > 0
              const onTime  = log.days_deviation !== null && log.days_deviation <= 0
              return (
                <div key={log.id} className="relative pl-8">
                  <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ${i === 0 ? 'bg-brand-blue' : 'bg-black/15'}`} />
                  <div className="bg-brand-gray rounded-lg p-3">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-xs font-semibold text-brand-navy">{formatDate(log.update_date)}</span>
                      <span className="text-xs text-black/40">oleh {log.updater?.full_name ?? '—'}</span>
                      <div className="ml-auto flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-black/10 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-blue rounded-full"
                            style={{ width: `${log.progress_percentage}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-brand-blue">{log.progress_percentage}%</span>
                      </div>
                    </div>
                    <p className="text-sm text-black/70 leading-relaxed">{log.mitigation_notes}</p>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      {log.target_completion_date && (
                        <span className="text-xs text-black/40">
                          Target: {formatDate(log.target_completion_date)}
                        </span>
                      )}
                      {log.actual_completion_date && (
                        <span className="text-xs text-black/40">
                          Aktual: {formatDate(log.actual_completion_date)}
                        </span>
                      )}
                      {overdue && (
                        <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                          <AlertCircle size={11} /> Terlambat {log.days_deviation} hari
                        </span>
                      )}
                      {onTime && log.actual_completion_date && (
                        <span className="flex items-center gap-1 text-xs text-[#5A9E2F] font-medium">
                          <CheckCircle size={11} /> Tepat waktu
                        </span>
                      )}
                      {log.evidence_reference && (
                        <span className="text-xs text-brand-blue">📎 {log.evidence_reference}</span>
                      )}
                    </div>
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

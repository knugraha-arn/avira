'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ShieldCheck, AlertTriangle } from 'lucide-react'

interface Props {
  riskId: string
  approvers: { id: string; full_name: string; job_title: string | null }[]
  currentUserId: string
}

export function ClosureForm({ riskId, approvers, currentUserId }: Props) {
  const router = useRouter()
  const [loading, setLoading]       = useState(false)
  const [approver_id, setApproverId] = useState('')
  const [justification, setJustification] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!approver_id) { toast.error('Pilih approver terlebih dahulu'); return }
    if (!justification.trim()) { toast.error('Justifikasi wajib diisi'); return }
    if (approver_id === currentUserId) { toast.error('Approver tidak boleh diri sendiri'); return }

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.from('avr_risk_closures').insert({
      risk_id:       riskId,
      requested_by:  currentUserId,
      approver_id,
      justification,
      status:        'Pending',
    })

    if (error) { toast.error('Gagal mengajukan', { description: error.message }); setLoading(false); return }

    // Update risk status to Pending Approval
    await supabase.from('avr_risks')
      .update({ status: 'Pending Approval' })
      .eq('id', riskId)

    toast.success('Request penutupan berhasil diajukan')
    router.push(`/risks/${riskId}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-brand-amber/10 border border-brand-amber/20">
        <AlertTriangle size={16} className="text-[#7A4C00] shrink-0 mt-0.5" />
        <div className="text-sm text-[#7A4C00] leading-relaxed">
          <strong>Perhatian:</strong> Setelah disetujui, risiko akan berstatus <em>Closed</em> dan seluruh data menjadi read-only secara permanen. Pastikan semua mitigasi sudah selesai dan terdokumentasi sebelum mengajukan penutupan.
        </div>
      </div>

      {/* Approver */}
      <div className="card">
        <h3 className="mb-3">Pilih Approver</h3>
        <p className="text-xs text-black/40 mb-3">
          Sesuai prinsip segregation of duties ISO 27001 — approver tidak boleh orang yang sama dengan pengaju.
        </p>
        {approvers.length === 0 ? (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            Tidak ada admin lain yang tersedia sebagai approver. Hubungi administrator sistem.
          </div>
        ) : (
          <div className="space-y-2">
            {approvers.map(a => (
              <label key={a.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${approver_id === a.id ? 'border-brand-blue bg-blue-50' : 'border-black/8 hover:border-brand-blue/30'}`}>
                <input type="radio" name="approver" value={a.id} checked={approver_id === a.id}
                  onChange={() => setApproverId(a.id)} className="accent-brand-blue shrink-0" />
                <div>
                  <p className="text-sm font-medium">{a.full_name}</p>
                  {a.job_title && <p className="text-xs text-black/40">{a.job_title}</p>}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Justification */}
      <div className="card">
        <h3 className="mb-1">Justifikasi Efektivitas Mitigasi</h3>
        <p className="text-xs text-black/40 mb-3">
          Jelaskan mengapa risiko ini layak ditutup: mitigasi apa yang sudah dilaksanakan, bukti efektivitasnya, dan mengapa risiko dianggap sudah terkendali.
        </p>
        <textarea
          className="input min-h-[120px] resize-y"
          placeholder="Contoh: Seluruh rencana mitigasi telah dilaksanakan. Firewall WAF sudah terpasang dan dikonfigurasi (bukti: Change Ticket DEV-2026-0815). Penetration testing telah dilakukan tanpa temuan kritis (laporan: PT-2026-003). Monitoring aktif sudah berjalan 30 hari tanpa insiden..."
          value={justification}
          onChange={e => setJustification(e.target.value)}
          required
        />
        <p className="text-xs text-black/30 mt-1">{justification.length} karakter</p>
      </div>

      <div className="flex gap-3 pb-8">
        <button type="submit" className="btn-primary px-6 gap-2" disabled={loading || approvers.length === 0}>
          <ShieldCheck size={15} />
          {loading ? 'Mengajukan...' : 'Ajukan Penutupan'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.back()}>Batal</button>
      </div>
    </form>
  )
}

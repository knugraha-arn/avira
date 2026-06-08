'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import { formatDate } from '@/lib/utils'
import type { AvrClassification } from '@/types'

interface Props {
  risk: any
  closure: any
  currentUserId: string
}

export function ApproveClosureForm({ risk, closure, currentUserId }: Props) {
  const router = useRouter()
  const [loading, setLoading]           = useState(false)
  const [decision, setDecision]         = useState<'Approved' | 'Rejected' | ''>('')
  const [rejectionReason, setRejection] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!decision) { toast.error('Pilih keputusan terlebih dahulu'); return }
    if (decision === 'Rejected' && !rejectionReason.trim()) {
      toast.error('Alasan penolakan wajib diisi'); return
    }
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('avr_risk_closures')
      .update({
        status:           decision,
        rejection_reason: decision === 'Rejected' ? rejectionReason : null,
        decided_at:       new Date().toISOString(),
      })
      .eq('id', closure.id)

    if (error) { toast.error('Gagal menyimpan', { description: error.message }); setLoading(false); return }

    if (decision === 'Approved') {
      toast.success('Risiko berhasil ditutup')
    } else {
      toast.success('Penutupan risiko ditolak — status kembali ke Open')
    }

    router.push(`/risks/${risk.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Closure request detail */}
      <div className="card space-y-3">
        <h3 className="mb-1">Detail Pengajuan</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-black/40 mb-0.5">Diajukan oleh</p>
            <p className="font-medium">{closure.requester?.full_name ?? '—'}</p>
            {closure.requester?.job_title && <p className="text-xs text-black/40">{closure.requester.job_title}</p>}
          </div>
          <div>
            <p className="text-xs text-black/40 mb-0.5">Tanggal Pengajuan</p>
            <p className="font-medium">{formatDate(closure.requested_at)}</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-black/40 mb-1">Klasifikasi Risiko</p>
          <ClassificationBadge classification={risk.inherent_classification as AvrClassification} />
        </div>
        <div>
          <p className="text-xs text-black/40 mb-1">Justifikasi Efektivitas Mitigasi</p>
          <div className="p-3 rounded-lg bg-brand-gray text-sm text-black/70 leading-relaxed">
            {closure.justification}
          </div>
        </div>
      </div>

      {/* Warning for extreme/high */}
      {['Extreme','High'].includes(risk.inherent_classification) && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-brand-amber/10 border border-brand-amber/20">
          <AlertTriangle size={15} className="text-[#7A4C00] shrink-0 mt-0.5" />
          <p className="text-sm text-[#7A4C00] leading-relaxed">
            Risiko ini berkategori <strong>{risk.inherent_classification}</strong>. Pastikan seluruh bukti mitigasi sudah diverifikasi sebelum memberikan persetujuan.
          </p>
        </div>
      )}

      {/* Decision */}
      <div className="card">
        <h3 className="mb-3">Keputusan Anda</h3>
        <div className="space-y-2">
          <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${decision === 'Approved' ? 'border-[#5A9E2F] bg-risk-low' : 'border-black/8 hover:border-[#5A9E2F]/40'}`}>
            <input type="radio" name="decision" value="Approved" checked={decision === 'Approved'}
              onChange={() => setDecision('Approved')} className="accent-[#5A9E2F] mt-0.5 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-[#5A9E2F]" />
                <p className="text-sm font-medium">Setujui Penutupan</p>
              </div>
              <p className="text-xs text-black/40 mt-0.5">Risiko akan ditutup permanen dan seluruh data menjadi read-only</p>
            </div>
          </label>
          <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${decision === 'Rejected' ? 'border-red-400 bg-red-50' : 'border-black/8 hover:border-red-300'}`}>
            <input type="radio" name="decision" value="Rejected" checked={decision === 'Rejected'}
              onChange={() => setDecision('Rejected')} className="accent-red-500 mt-0.5 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <XCircle size={14} className="text-red-500" />
                <p className="text-sm font-medium">Tolak Penutupan</p>
              </div>
              <p className="text-xs text-black/40 mt-0.5">Status risiko kembali ke Open, mitigasi perlu dilanjutkan</p>
            </div>
          </label>
        </div>

        {decision === 'Rejected' && (
          <div className="mt-4">
            <label className="label">Alasan Penolakan <span className="text-red-400">*</span></label>
            <textarea className="input min-h-[80px] resize-y"
              placeholder="Jelaskan mengapa penutupan ditolak dan tindakan apa yang perlu dilakukan..."
              value={rejectionReason} onChange={e => setRejection(e.target.value)} required />
          </div>
        )}
      </div>

      <div className="flex gap-3 pb-8">
        <button type="submit" disabled={!decision || loading}
          className={`px-6 btn-primary gap-2 ${decision === 'Rejected' ? 'bg-red-600 hover:bg-red-700' : ''}`}>
          {decision === 'Approved'
            ? <><CheckCircle size={15} /> {loading ? 'Memproses...' : 'Setujui Penutupan'}</>
            : decision === 'Rejected'
            ? <><XCircle size={15} /> {loading ? 'Memproses...' : 'Tolak Penutupan'}</>
            : 'Pilih Keputusan'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.back()}>Batal</button>
      </div>
    </form>
  )
}

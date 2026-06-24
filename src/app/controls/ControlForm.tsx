'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { DocumentLinksField, type DocLink } from '@/components/ui/DocumentLinksField'
import { Trash2 } from 'lucide-react'

const TIPE_OPTIONS = ['Preventive', 'Detective', 'Corrective'] as const
const STATUS_OPTIONS = ['Effective', 'Needs Improvement', 'Not Effective', 'Not Tested'] as const

interface ControlData {
  id?: string
  control_code?: string
  nama: string
  deskripsi: string
  tipe: string
  control_owner_id: string
  status: string
  last_tested_date: string
  test_notes: string
  related_document: DocLink[]
}

interface Props {
  initial?: Partial<ControlData>
  users: { id: string; full_name: string; job_title: string | null }[]
  isEdit?: boolean
}

export function ControlForm({ initial, users, isEdit }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<ControlData>({
    nama:             initial?.nama ?? '',
    deskripsi:        initial?.deskripsi ?? '',
    tipe:             initial?.tipe ?? 'Preventive',
    control_owner_id: initial?.control_owner_id ?? '',
    status:           initial?.status ?? 'Not Tested',
    last_tested_date: initial?.last_tested_date ?? '',
    test_notes:       initial?.test_notes ?? '',
    related_document: initial?.related_document ?? [],
  })

  function set(field: keyof ControlData, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nama.trim()) { toast.error('Nama kontrol wajib diisi'); return }
    setLoading(true)
    const supabase = createClient()

    const payload = {
      nama:             form.nama,
      deskripsi:        form.deskripsi || null,
      tipe:             form.tipe,
      control_owner_id: form.control_owner_id || null,
      status:           form.status,
      last_tested_date: form.last_tested_date || null,
      test_notes:       form.test_notes || null,
      related_document: form.related_document.filter(d => d.nama.trim() || d.url.trim()),
    }

    if (isEdit && initial?.id) {
      const { error } = await supabase.from('avr_controls').update(payload).eq('id', initial.id)
      if (error) { toast.error('Gagal menyimpan', { description: error.message }); setLoading(false); return }
      toast.success('Kontrol berhasil diperbarui')
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('avr_controls').insert({ ...payload, created_by: user?.id })
      if (error) { toast.error('Gagal menyimpan', { description: error.message }); setLoading(false); return }
      toast.success('Kontrol berhasil ditambahkan')
    }

    router.push('/controls')
    router.refresh()
  }

  async function handleDelete() {
    if (!initial?.id) return
    if (!confirm('Hapus kontrol ini? Kontrol akan terlepas dari semua risiko yang terhubung.')) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('avr_controls').update({ is_active: false }).eq('id', initial.id)
    if (error) { toast.error('Gagal menghapus', { description: error.message }); setDeleting(false); return }
    toast.success('Kontrol dihapus')
    router.push('/controls')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">

      <div className="card space-y-4">
        <div>
          <label className="label">Nama Kontrol <span className="text-red-400">*</span></label>
          <input className="input" placeholder="Contoh: MFA untuk akun admin"
            value={form.nama} onChange={e => set('nama', e.target.value)} required />
        </div>

        <div>
          <label className="label">Deskripsi</label>
          <textarea className="input min-h-[70px] resize-y"
            placeholder="Jelaskan cara kerja kontrol ini..."
            value={form.deskripsi} onChange={e => set('deskripsi', e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Tipe Kontrol</label>
            <div className="flex gap-2">
              {TIPE_OPTIONS.map(t => (
                <button key={t} type="button" onClick={() => set('tipe', t)}
                  className={`flex-1 text-xs py-2 rounded border transition-colors ${form.tipe === t ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-black/50 border-black/10 hover:border-brand-blue/40'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Control Owner</label>
            <select className="input" value={form.control_owner_id} onChange={e => set('control_owner_id', e.target.value)}>
              <option value="">Pilih owner</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name}{u.job_title ? ` — ${u.job_title}` : ''}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <h3 className="mb-1">Efektivitas Kontrol</h3>
        <div>
          <label className="label">Status</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {STATUS_OPTIONS.map(s => (
              <button key={s} type="button" onClick={() => set('status', s)}
                className={`text-xs py-2 rounded border transition-colors ${form.status === s ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-black/50 border-black/10 hover:border-brand-blue/40'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Tanggal Terakhir Diuji</label>
            <input type="date" className="input"
              value={form.last_tested_date} onChange={e => set('last_tested_date', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Catatan Pengujian</label>
          <textarea className="input min-h-[60px] resize-y"
            placeholder="Hasil pengujian, temuan, atau catatan terkait efektivitas kontrol..."
            value={form.test_notes} onChange={e => set('test_notes', e.target.value)} />
        </div>
      </div>

      <div className="card">
        <label className="label">Dokumen Pendukung</label>
        <DocumentLinksField
          value={form.related_document}
          onChange={links => set('related_document', links)}
        />
      </div>

      <div className="flex items-center justify-between pb-8">
        <div className="flex gap-3">
          <button type="submit" className="btn-primary px-6" disabled={loading}>
            {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Kontrol'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => router.back()}>Batal</button>
        </div>
        {isEdit && (
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors">
            <Trash2 size={13} /> {deleting ? 'Menghapus...' : 'Hapus Kontrol'}
          </button>
        )}
      </div>
    </form>
  )
}

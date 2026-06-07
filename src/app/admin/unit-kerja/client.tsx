'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Pencil, ToggleLeft, ToggleRight, X } from 'lucide-react'
import { UNIT_KERJA_FORM } from '@/lib/form-labels'
import { Tooltip } from '@/components/ui/Tooltip'

interface UnitKerja {
  id: string; kode: string; nama: string; is_active: boolean; created_at: string
}

export function UnitKerjaClient({ initialData }: { initialData: UnitKerja[] }) {
  const [list, setList]         = useState<UnitKerja[]>(initialData)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]   = useState<UnitKerja | null>(null)
  const [kode, setKode]         = useState('')
  const [nama, setNama]         = useState('')
  const [saving, setSaving]     = useState(false)

  function openAdd() { setEditing(null); setKode(''); setNama(''); setShowModal(true) }
  function openEdit(uk: UnitKerja) { setEditing(uk); setKode(uk.kode); setNama(uk.nama); setShowModal(true) }

  async function handleSave() {
    if (!kode.trim() || !nama.trim()) { toast.error('Kode dan nama wajib diisi'); return }
    setSaving(true)
    const supabase = createClient()
    if (editing) {
      const { data, error } = await supabase
        .from('avr_unit_kerja').update({ kode: kode.trim().toUpperCase(), nama: nama.trim() })
        .eq('id', editing.id).select().single()
      if (error) { toast.error(error.message); setSaving(false); return }
      setList(l => l.map(x => x.id === editing.id ? data : x))
      toast.success('Unit kerja diperbarui')
    } else {
      const { data, error } = await supabase
        .from('avr_unit_kerja').insert({ kode: kode.trim().toUpperCase(), nama: nama.trim() })
        .select().single()
      if (error) { toast.error(error.message); setSaving(false); return }
      setList(l => [...l, data])
      toast.success('Unit kerja ditambahkan')
    }
    setSaving(false); setShowModal(false)
  }

  async function toggleActive(uk: UnitKerja) {
    const supabase = createClient()
    const { error } = await supabase
      .from('avr_unit_kerja').update({ is_active: !uk.is_active }).eq('id', uk.id)
    if (error) { toast.error(error.message); return }
    setList(l => l.map(x => x.id === uk.id ? { ...x, is_active: !x.is_active } : x))
    toast.success(uk.is_active ? 'Unit kerja dinonaktifkan' : 'Unit kerja diaktifkan')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="eyebrow">Admin</span>
          <h1 className="mt-1">Unit Kerja</h1>
          <p className="text-sm text-black/50 mt-0.5">{list.length} unit kerja terdaftar</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={15} /> Tambah Unit Kerja
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Nama Unit Kerja</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={4} className="text-center py-10 text-black/30">Belum ada unit kerja</td></tr>
            )}
            {list.map(uk => (
              <tr key={uk.id}>
                <td><span className="font-mono text-xs font-semibold text-brand-blue">{uk.kode}</span></td>
                <td className="font-medium">{uk.nama}</td>
                <td>
                  <span className={`badge ${uk.is_active ? 'bg-risk-low text-risk-low-text border-risk-low-text/20' : 'bg-black/5 text-black/40 border-black/10'}`}>
                    {uk.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => openEdit(uk)} className="btn-ghost py-1 px-2 text-xs gap-1">
                      <Pencil size={12} /> Edit
                    </button>
                    <button onClick={() => toggleActive(uk)} className="btn-ghost py-1 px-2 text-xs gap-1">
                      {uk.is_active ? <ToggleRight size={14} className="text-brand-blue" /> : <ToggleLeft size={14} />}
                      {uk.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3>{editing ? 'Edit Unit Kerja' : 'Tambah Unit Kerja'}</h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="label mb-0">{UNIT_KERJA_FORM.kode.label}</label>
                  <Tooltip text={UNIT_KERJA_FORM.kode.tooltip} />
                </div>
                <input className="input uppercase" placeholder={UNIT_KERJA_FORM.kode.placeholder}
                  value={kode} onChange={e => setKode(e.target.value.toUpperCase())} maxLength={10} />
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="label mb-0">{UNIT_KERJA_FORM.nama.label}</label>
                  <Tooltip text={UNIT_KERJA_FORM.nama.tooltip} />
                </div>
                <input className="input" placeholder={UNIT_KERJA_FORM.nama.placeholder}
                  value={nama} onChange={e => setNama(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} className="btn-primary flex-1 justify-center" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button onClick={() => setShowModal(false)} className="btn-secondary">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

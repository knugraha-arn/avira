'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Pencil, ToggleLeft, ToggleRight, X } from 'lucide-react'
import { THIRD_PARTY_FORM } from '@/lib/form-labels'

const TIPE_OPTIONS = ['Vendor','Mitra','Prinsipal','Bank','Penyedia Jasa','Lainnya']

interface ThirdParty {
  id: string; nama: string; tipe: string; keterangan: string | null; is_active: boolean
}

export function PihakLainClient({ initialData }: { initialData: ThirdParty[] }) {
  const [list, setList]           = useState<ThirdParty[]>(initialData)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState<ThirdParty | null>(null)
  const [nama, setNama]           = useState('')
  const [tipe, setTipe]           = useState('Vendor')
  const [ket, setKet]             = useState('')
  const [saving, setSaving]       = useState(false)
  const [search, setSearch]       = useState('')

  function openAdd() { setEditing(null); setNama(''); setTipe('Vendor'); setKet(''); setShowModal(true) }
  function openEdit(tp: ThirdParty) { setEditing(tp); setNama(tp.nama); setTipe(tp.tipe); setKet(tp.keterangan ?? ''); setShowModal(true) }

  async function handleSave() {
    if (!nama.trim()) { toast.error('Nama wajib diisi'); return }
    setSaving(true)
    const supabase = createClient()
    if (editing) {
      const { data, error } = await supabase
        .from('avr_third_parties')
        .update({ nama: nama.trim(), tipe, keterangan: ket || null })
        .eq('id', editing.id).select().single()
      if (error) { toast.error(error.message); setSaving(false); return }
      setList(l => l.map(x => x.id === editing.id ? data : x))
      toast.success('Pihak lain diperbarui')
    } else {
      const { data, error } = await supabase
        .from('avr_third_parties')
        .insert({ nama: nama.trim(), tipe, keterangan: ket || null })
        .select().single()
      if (error) { toast.error(error.message); setSaving(false); return }
      setList(l => [...l, data])
      toast.success('Pihak lain ditambahkan')
    }
    setSaving(false); setShowModal(false)
  }

  async function toggleActive(tp: ThirdParty) {
    const supabase = createClient()
    const { error } = await supabase
      .from('avr_third_parties').update({ is_active: !tp.is_active }).eq('id', tp.id)
    if (error) { toast.error(error.message); return }
    setList(l => l.map(x => x.id === tp.id ? { ...x, is_active: !x.is_active } : x))
    toast.success(tp.is_active ? 'Dinonaktifkan' : 'Diaktifkan')
  }

  const filtered = list.filter(tp =>
    tp.nama.toLowerCase().includes(search.toLowerCase()) ||
    tp.tipe.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="eyebrow">Admin</span>
          <h1 className="mt-1">Pihak Lain</h1>
          <p className="text-sm text-black/50 mt-0.5">Vendor, mitra, prinsipal, bank, dan penyedia jasa lainnya</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={15} /> Tambah Pihak Lain
        </button>
      </div>

      <div className="card py-3">
        <input className="input" placeholder="Cari nama atau tipe..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Tipe</th>
              <th>Keterangan</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-black/30">Belum ada data</td></tr>
            )}
            {filtered.map(tp => (
              <tr key={tp.id}>
                <td className="font-medium">{tp.nama}</td>
                <td><span className="badge bg-blue-50 text-brand-blue border-brand-blue/20">{tp.tipe}</span></td>
                <td className="text-black/50 text-xs max-w-[200px] truncate">{tp.keterangan ?? '—'}</td>
                <td>
                  <span className={`badge ${tp.is_active ? 'bg-risk-low text-risk-low-text border-risk-low-text/20' : 'bg-black/5 text-black/40 border-black/10'}`}>
                    {tp.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => openEdit(tp)} className="btn-ghost py-1 px-2 text-xs gap-1">
                      <Pencil size={12} /> Edit
                    </button>
                    <button onClick={() => toggleActive(tp)} className="btn-ghost py-1 px-2 text-xs gap-1">
                      {tp.is_active ? <ToggleRight size={14} className="text-brand-blue" /> : <ToggleLeft size={14} />}
                      {tp.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3>{editing ? 'Edit Pihak Lain' : 'Tambah Pihak Lain'}</h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">{THIRD_PARTY_FORM.nama.label} <span className="text-red-400">*</span></label>
                <input className="input" placeholder={THIRD_PARTY_FORM.nama.placeholder}
                  value={nama} onChange={e => setNama(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="label">{THIRD_PARTY_FORM.tipe.label}</label>
                <select className="input" value={tipe} onChange={e => setTipe(e.target.value)}>
                  {TIPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{THIRD_PARTY_FORM.keterangan.label}</label>
                <textarea className="input min-h-[80px] resize-none" placeholder={THIRD_PARTY_FORM.keterangan.placeholder}
                  value={ket} onChange={e => setKet(e.target.value)} />
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

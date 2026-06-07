'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, X, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { THIRD_PARTY_FORM } from '@/lib/form-labels'

const TIPE_OPTIONS = ['Vendor', 'Mitra', 'Prinsipal', 'Bank', 'Penyedia Jasa', 'Lainnya']

interface ThirdParty {
  id: string
  nama: string
  tipe: string
}

interface Props {
  value: string
  onChange: (id: string, nama: string) => void
  placeholder?: string
}

export function ThirdPartySelect({ value, onChange, placeholder = 'Cari atau tambah pihak lain...' }: Props) {
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState<ThirdParty[]>([])
  const [selected, setSelected]     = useState<ThirdParty | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showModal, setShowModal]   = useState(false)
  const [loading, setLoading]       = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // New third party form
  const [newNama, setNewNama]       = useState('')
  const [newTipe, setNewTipe]       = useState('Vendor')
  const [newKet, setNewKet]         = useState('')
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    if (!query || query.length < 1) { setResults([]); return }
    const timeout = setTimeout(async () => {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('avr_third_parties')
        .select('id, nama, tipe')
        .eq('is_active', true)
        .ilike('nama', `%${query}%`)
        .order('nama')
        .limit(8)
      setResults(data ?? [])
      setLoading(false)
      setShowDropdown(true)
    }, 200)
    return () => clearTimeout(timeout)
  }, [query])

  function handleSelect(tp: ThirdParty) {
    setSelected(tp)
    setQuery('')
    setShowDropdown(false)
    onChange(tp.id, tp.nama)
  }

  function handleClear() {
    setSelected(null)
    setQuery('')
    onChange('', '')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  async function handleSaveNew() {
    if (!newNama.trim()) { toast.error('Nama wajib diisi'); return }
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('avr_third_parties')
      .insert({ nama: newNama.trim(), tipe: newTipe, keterangan: newKet || null })
      .select('id, nama, tipe')
      .single()
    if (error) { toast.error('Gagal menyimpan', { description: error.message }); setSaving(false); return }
    toast.success(`${data.nama} berhasil ditambahkan`)
    handleSelect(data)
    setShowModal(false)
    setNewNama(''); setNewTipe('Vendor'); setNewKet('')
    setSaving(false)
  }

  return (
    <div className="relative">
      {selected ? (
        <div className="input flex items-center justify-between">
          <span className="text-sm">
            <span className="font-medium">{selected.nama}</span>
            <span className="ml-2 text-xs text-black/40">{selected.tipe}</span>
          </span>
          <button type="button" onClick={handleClear} className="text-black/30 hover:text-black ml-2">
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
          <input
            ref={inputRef}
            className="input pl-8 pr-24"
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => query && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          />
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-1 px-2 text-xs gap-1"
          >
            <Plus size={12} /> Tambah
          </button>
        </div>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-40 w-full mt-1 bg-white rounded-lg border border-black/8 shadow-card-hover overflow-hidden">
          {loading && <div className="px-4 py-3 text-sm text-black/40">Mencari...</div>}
          {!loading && results.length === 0 && query && (
            <div className="px-4 py-3 text-sm text-black/40">
              Tidak ditemukan.{' '}
              <button type="button" onClick={() => { setShowModal(true); setShowDropdown(false) }} className="text-brand-blue hover:underline">
                Tambah "{query}"
              </button>
            </div>
          )}
          {results.map(tp => (
            <button
              key={tp.id}
              type="button"
              onMouseDown={() => handleSelect(tp)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-brand-gray text-left text-sm"
            >
              <span className="font-medium">{tp.nama}</span>
              <span className="text-xs text-black/40 ml-2">{tp.tipe}</span>
            </button>
          ))}
        </div>
      )}

      {/* Modal tambah baru */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3>Tambah Pihak Lain</h3>
              <button type="button" onClick={() => setShowModal(false)} className="btn-ghost p-1">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">{THIRD_PARTY_FORM.nama.label} <span className="text-red-400">*</span></label>
                <input
                  className="input"
                  placeholder={THIRD_PARTY_FORM.nama.placeholder}
                  value={newNama}
                  onChange={e => setNewNama(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="label">{THIRD_PARTY_FORM.tipe.label}</label>
                <select className="input" value={newTipe} onChange={e => setNewTipe(e.target.value)}>
                  {TIPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{THIRD_PARTY_FORM.keterangan.label}</label>
                <textarea
                  className="input min-h-[70px] resize-none"
                  placeholder={THIRD_PARTY_FORM.keterangan.placeholder}
                  value={newKet}
                  onChange={e => setNewKet(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="button" onClick={handleSaveNew} className="btn-primary flex-1 justify-center" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

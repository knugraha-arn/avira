'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, X, ShieldCheck, ExternalLink } from 'lucide-react'

export interface ControlOption {
  id: string
  control_code: string
  nama: string
  tipe: string
  status: string
}

const STATUS_DOT: Record<string, string> = {
  'Effective':         'bg-[#1E5C0A]',
  'Needs Improvement': 'bg-brand-amber',
  'Not Effective':     'bg-red-500',
  'Not Tested':        'bg-black/20',
}

interface Props {
  allControls: ControlOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

/**
 * Multi-select kontrol dari Control Library untuk dipasang ke risiko.
 * Satu kontrol bisa dipasang ke banyak risiko (many-to-many via avr_risk_controls).
 */
export function ControlSelector({ allControls, selectedIds, onChange }: Props) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const selected = allControls.filter(c => selectedIds.includes(c.id))
  const filtered = allControls.filter(c =>
    !selectedIds.includes(c.id) &&
    (c.nama.toLowerCase().includes(search.toLowerCase()) ||
     c.control_code.toLowerCase().includes(search.toLowerCase()))
  )

  function toggleAdd(id: string) {
    onChange([...selectedIds, id])
    setSearch('')
  }

  function remove(id: string) {
    onChange(selectedIds.filter(x => x !== id))
  }

  return (
    <div className="space-y-2">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(c => (
            <span key={c.id} className="flex items-center gap-1.5 text-xs pl-2 pr-1 py-1 rounded-full bg-blue-50 border border-brand-blue/20 text-brand-navy">
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[c.status] ?? 'bg-black/20'}`} />
              <span className="font-mono text-[10px] text-brand-blue">{c.control_code}</span>
              {c.nama}
              <button type="button" onClick={() => remove(c.id)} className="ml-0.5 text-black/30 hover:text-red-500">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search & add */}
      <div className="relative">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black/30" />
          <input
            className="input pl-8 text-sm"
            placeholder="Cari kontrol dari Control Library..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
          />
        </div>

        {open && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-black/10 rounded-lg shadow-lg max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-3 text-xs text-black/40 text-center">
                {allControls.length === 0
                  ? 'Belum ada kontrol di Control Library'
                  : 'Tidak ada kontrol yang cocok'}
              </div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleAdd(c.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-brand-gray transition-colors text-sm"
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[c.status] ?? 'bg-black/20'}`} />
                  <span className="font-mono text-[10px] text-brand-blue shrink-0">{c.control_code}</span>
                  <span className="flex-1 truncate">{c.nama}</span>
                  <span className="text-[10px] text-black/30 shrink-0">{c.tipe}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <Link href="/controls" target="_blank" className="inline-flex items-center gap-1 text-xs text-black/40 hover:text-brand-blue transition-colors">
        <ExternalLink size={11} /> Kelola Control Library
      </Link>
    </div>
  )
}

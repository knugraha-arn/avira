'use client'

import { Plus, X, Link2 } from 'lucide-react'

export interface DocLink {
  nama: string
  url: string
}

interface Props {
  value: DocLink[]
  onChange: (links: DocLink[]) => void
}

/**
 * Field untuk menambah referensi link dokumen eksternal (SOP, kebijakan, dll).
 * Tidak menyimpan file — hanya nama + URL ke platform dokumen yang sudah ada
 * (Google Drive, SharePoint, dll). Dipakai di form risiko dan form kontrol.
 */
export function DocumentLinksField({ value, onChange }: Props) {
  function addLink() {
    onChange([...value, { nama: '', url: '' }])
  }

  function updateLink(i: number, field: keyof DocLink, val: string) {
    const next = [...value]
    next[i] = { ...next[i], [field]: val }
    onChange(next)
  }

  function removeLink(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-2">
      {value.map((link, i) => (
        <div key={i} className="flex gap-2 items-start">
          <input
            className="input flex-1"
            placeholder="Nama dokumen (contoh: SOP IT-SEC-001)"
            value={link.nama}
            onChange={e => updateLink(i, 'nama', e.target.value)}
          />
          <input
            className="input flex-[1.5]"
            placeholder="https://drive.google.com/... atau link SharePoint"
            value={link.url}
            onChange={e => updateLink(i, 'url', e.target.value)}
          />
          <button
            type="button"
            onClick={() => removeLink(i)}
            className="shrink-0 p-2 text-black/30 hover:text-red-500 transition-colors"
            title="Hapus"
          >
            <X size={15} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addLink}
        className="flex items-center gap-1.5 text-xs text-brand-blue hover:underline"
      >
        <Plus size={13} /> Tambah link dokumen
      </button>
      {value.length === 0 && (
        <p className="text-xs text-black/30">
          Belum ada dokumen terkait — tambahkan link ke SOP, kebijakan, atau bukti lain di platform dokumen Anda.
        </p>
      )}
    </div>
  )
}

/** Komponen display read-only untuk halaman detail */
export function DocumentLinksList({ links }: { links: DocLink[] }) {
  if (!links || links.length === 0) return null
  return (
    <div className="space-y-1">
      {links.map((link, i) => (
        <a
          key={i}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-brand-blue hover:underline"
        >
          <Link2 size={11} className="shrink-0" />
          {link.nama || link.url}
        </a>
      ))}
    </div>
  )
}

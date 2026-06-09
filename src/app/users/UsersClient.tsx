'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Plus, Pencil, ToggleLeft, ToggleRight,
  X, UserCheck, AlertTriangle, Mail, Clock,
} from 'lucide-react'

const ROLES = [
  { value: 'admin',        label: 'Admin',        desc: 'Semua akses + kelola user + approve closure' },
  { value: 'risk_manager', label: 'Risk Manager', desc: 'Buat/edit risk, mitigasi, review, request closure' },
  { value: 'viewer',       label: 'Viewer',       desc: 'Read-only — cocok untuk direksi atau auditor' },
]

interface UnitKerja { id: string; kode: string; nama: string }

interface User {
  id: string
  full_name: string
  email: string
  role: string
  job_title: string | null
  is_active: boolean
  last_login_at: string | null
  invited_at: string | null
  unit_kerja_id: string | null
  unit_kerja?: UnitKerja | null
}

interface Invite {
  id: string
  email: string
  full_name: string
  role: string
  job_title: string | null
  unit_kerja_id: string | null
  invited_at: string
  accepted_at: string | null
  is_active: boolean
  unit_kerja?: UnitKerja | null
}

interface Props {
  initialUsers: User[]
  initialInvites: Invite[]
  unitKerjaList: UnitKerja[]
  currentUserId: string
}

export function UsersClient({ initialUsers, initialInvites, unitKerjaList, currentUserId }: Props) {
  const [users, setUsers]     = useState<User[]>(initialUsers)
  const [invites, setInvites] = useState<Invite[]>(initialInvites)
  const [showInvite, setShowInvite] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [saving, setSaving]   = useState(false)
  const [search, setSearch]   = useState('')
  const [tab, setTab]         = useState<'users' | 'invites'>('users')

  // Invite form
  const [invEmail, setInvEmail] = useState('')
  const [invName, setInvName]   = useState('')
  const [invRole, setInvRole]   = useState('viewer')
  const [invUK, setInvUK]       = useState('')
  const [invTitle, setInvTitle] = useState('')

  // Edit form
  const [editRole, setEditRole]   = useState('')
  const [editUK, setEditUK]       = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editName, setEditName]   = useState('')

  const ukMap = new Map(unitKerjaList.map(uk => [uk.id, uk]))

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.unit_kerja?.nama ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const filteredInvites = invites.filter(i =>
    i.full_name.toLowerCase().includes(search.toLowerCase()) ||
    i.email.toLowerCase().includes(search.toLowerCase())
  )

  async function handleInvite() {
    if (!invEmail.trim()) { toast.error('Email wajib diisi'); return }
    if (!invEmail.toLowerCase().includes('@arranetwork.com')) {
      toast.error('Hanya email @arranetwork.com yang diizinkan'); return
    }
    if (!invName.trim()) { toast.error('Nama wajib diisi'); return }

    const emailLower = invEmail.trim().toLowerCase()
    if (users.some(u => u.email === emailLower)) {
      toast.error('Email ini sudah terdaftar sebagai pengguna aktif'); return
    }
    if (invites.some(i => i.email === emailLower && i.is_active && !i.accepted_at)) {
      toast.error('Email ini sudah memiliki undangan yang aktif'); return
    }

    setSaving(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('avr_user_invites')
      .insert({
        email:         emailLower,
        full_name:     invName.trim(),
        role:          invRole,
        job_title:     invTitle || null,
        unit_kerja_id: invUK || null,
        invited_by:    currentUserId,
      })
      .select('*')
      .single()

    if (error) {
      toast.error('Gagal mengundang', { description: error.message })
      setSaving(false); return
    }

    const newInvite: Invite = {
      ...data,
      unit_kerja: invUK ? ukMap.get(invUK) ?? null : null,
    }

    setInvites(i => [...i, newInvite])
    setTab('invites')
    toast.success(`Undangan untuk ${invName} berhasil dibuat`)
    setShowInvite(false)
    setInvEmail(''); setInvName(''); setInvRole('viewer'); setInvUK(''); setInvTitle('')
    setSaving(false)
  }

  function openEdit(u: User) {
    setEditing(u)
    setEditRole(u.role)
    setEditUK(u.unit_kerja_id ?? '')
    setEditTitle(u.job_title ?? '')
    setEditName(u.full_name)
  }

  async function handleSaveEdit() {
    if (!editing) return
    setSaving(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('avr_user_profiles')
      .update({
        full_name:     editName,
        role:          editRole,
        unit_kerja_id: editUK || null,
        job_title:     editTitle || null,
      })
      .eq('id', editing.id)
      .select('*')
      .single()

    if (error) { toast.error(error.message); setSaving(false); return }

    const updated: User = {
      ...data,
      unit_kerja: editUK ? ukMap.get(editUK) ?? null : null,
    }

    setUsers(u => u.map(x => x.id === editing.id ? updated : x))
    toast.success('Data pengguna diperbarui')
    setEditing(null); setSaving(false)
  }

  async function toggleActive(u: User) {
    if (u.id === currentUserId) {
      toast.error('Tidak bisa menonaktifkan akun sendiri'); return
    }
    if (u.is_active) {
      const supabase = createClient()
      const { count } = await supabase
        .from('avr_risks')
        .select('*', { count: 'exact', head: true })
        .eq('risk_owner_id', u.id)
        .neq('status', 'Closed')
      if (count && count > 0) {
        toast.warning(
          `${u.full_name} masih menjadi Risk Owner di ${count} risiko aktif. Pastikan sudah di-reassign dulu.`,
          { duration: 6000 }
        )
        return
      }
    }
    const supabase = createClient()
    const { error } = await supabase
      .from('avr_user_profiles')
      .update({ is_active: !u.is_active })
      .eq('id', u.id)
    if (error) { toast.error(error.message); return }
    setUsers(us => us.map(x => x.id === u.id ? { ...x, is_active: !x.is_active } : x))
    toast.success(u.is_active ? `${u.full_name} dinonaktifkan` : `${u.full_name} diaktifkan`)
  }

  async function cancelInvite(invite: Invite) {
    const supabase = createClient()
    const { error } = await supabase
      .from('avr_user_invites')
      .update({ is_active: false })
      .eq('id', invite.id)
    if (error) { toast.error(error.message); return }
    setInvites(i => i.map(x => x.id === invite.id ? { ...x, is_active: false } : x))
    toast.success('Undangan dibatalkan')
  }

  const roleBadge = (role: string) => ({
    admin:        'bg-risk-extreme text-risk-extreme-text border-red-700/30',
    risk_manager: 'bg-blue-50 text-brand-blue border-brand-blue/20',
    viewer:       'bg-black/5 text-black/50 border-black/10',
  }[role] ?? 'bg-black/5 text-black/50 border-black/10')

  const roleLabel = (role: string) =>
    role === 'risk_manager' ? 'Risk Manager' : role.charAt(0).toUpperCase() + role.slice(1)

  const pendingInvites = invites.filter(i => !i.accepted_at && i.is_active)

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="eyebrow">Admin</span>
          <h1 className="mt-1">Pengguna</h1>
          <p className="text-sm text-black/50 mt-0.5">
            {users.filter(u => u.is_active).length} aktif
            {pendingInvites.length > 0 && ` · ${pendingInvites.length} undangan menunggu`}
          </p>
        </div>
        <button onClick={() => setShowInvite(true)} className="btn-primary gap-1.5">
          <Plus size={15} /> Undang Pengguna
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-black/8">
        {[
          { key: 'users',   label: `Pengguna (${users.length})` },
          { key: 'invites', label: `Undangan (${pendingInvites.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-brand-blue text-brand-blue' : 'border-transparent text-black/40 hover:text-black'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="card py-3">
        <input className="input" placeholder="Cari nama atau email..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Users table */}
      {tab === 'users' && (
        <div className="card p-0 overflow-hidden">
          <table className="table-base">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Unit Kerja</th>
                <th>Jabatan</th>
                <th>Role</th>
                <th>Status</th>
                <th>Login Terakhir</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-black/30">Tidak ada pengguna</td></tr>
              )}
              {filteredUsers.map(u => (
                <tr key={u.id} className={!u.is_active ? 'opacity-50' : ''}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue text-xs font-semibold shrink-0">
                        {u.full_name.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-medium text-sm">{u.full_name}</p>
                    </div>
                  </td>
                  <td className="text-xs text-black/60">{u.email}</td>
                  <td className="text-xs">
                    {u.unit_kerja
                      ? <span>{u.unit_kerja.nama} <span className="text-black/30">({u.unit_kerja.kode})</span></span>
                      : <span className="text-black/25">—</span>}
                  </td>
                  <td className="text-xs text-black/60">{u.job_title ?? '—'}</td>
                  <td><span className={`badge text-[11px] ${roleBadge(u.role)}`}>{roleLabel(u.role)}</span></td>
                  <td>
                    <span className={`badge ${u.is_active ? 'bg-risk-low text-risk-low-text border-risk-low-text/20' : 'bg-black/5 text-black/40 border-black/10'}`}>
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="text-xs text-black/40">
                    {u.last_login_at
                      ? new Date(u.last_login_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                      : <span className="text-black/25">Belum pernah</span>}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => openEdit(u)} className="btn-ghost py-1 px-2 text-xs gap-1">
                        <Pencil size={11} /> Edit
                      </button>
                      {u.id !== currentUserId && (
                        <button onClick={() => toggleActive(u)} className="btn-ghost py-1 px-2 text-xs gap-1">
                          {u.is_active ? <ToggleRight size={13} className="text-brand-blue" /> : <ToggleLeft size={13} />}
                          {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invites table */}
      {tab === 'invites' && (
        <div className="card p-0 overflow-hidden">
          <table className="table-base">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Unit Kerja</th>
                <th>Role</th>
                <th>Status</th>
                <th>Diundang</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredInvites.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-black/30">Tidak ada undangan</td></tr>
              )}
              {filteredInvites.map(i => (
                <tr key={i.id} className={!i.is_active ? 'opacity-40' : ''}>
                  <td className="font-medium text-sm">{i.full_name}</td>
                  <td className="text-xs text-black/60">{i.email}</td>
                  <td className="text-xs">
                    {i.unit_kerja
                      ? <span>{i.unit_kerja.nama}</span>
                      : <span className="text-black/25">—</span>}
                  </td>
                  <td><span className={`badge text-[11px] ${roleBadge(i.role)}`}>{roleLabel(i.role)}</span></td>
                  <td>
                    {i.accepted_at ? (
                      <span className="badge bg-risk-low text-risk-low-text border-risk-low-text/20">Diterima</span>
                    ) : i.is_active ? (
                      <span className="flex items-center gap-1 text-xs text-brand-amber font-medium">
                        <Clock size={11} /> Menunggu login
                      </span>
                    ) : (
                      <span className="badge bg-black/5 text-black/40 border-black/10">Dibatalkan</span>
                    )}
                  </td>
                  <td className="text-xs text-black/40">
                    {new Date(i.invited_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    {!i.accepted_at && i.is_active && (
                      <button onClick={() => cancelInvite(i)} className="btn-ghost py-1 px-2 text-xs gap-1 text-red-500">
                        <X size={11} /> Batalkan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3>Undang Pengguna</h3>
                <p className="text-xs text-black/40 mt-0.5">Role aktif saat pertama kali login dengan Google</p>
              </div>
              <button onClick={() => setShowInvite(false)} className="btn-ghost p-1"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Email <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
                  <input className="input pl-8" placeholder="nama@arranetwork.com"
                    value={invEmail} onChange={e => setInvEmail(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Nama Lengkap <span className="text-red-400">*</span></label>
                <input className="input" placeholder="Nama sesuai akun Google"
                  value={invName} onChange={e => setInvName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Unit Kerja</label>
                  <select className="input" value={invUK} onChange={e => setInvUK(e.target.value)}>
                    <option value="">— Pilih —</option>
                    {unitKerjaList.map(uk => <option key={uk.id} value={uk.id}>{uk.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Jabatan</label>
                  <input className="input" placeholder="Contoh: IT Manager"
                    value={invTitle} onChange={e => setInvTitle(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Level Akses <span className="text-red-400">*</span></label>
                <div className="space-y-2">
                  {ROLES.map(r => (
                    <label key={r.value} className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${invRole === r.value ? 'border-brand-blue bg-blue-50' : 'border-black/8 hover:border-brand-blue/30'}`}>
                      <input type="radio" name="inv-role" value={r.value} checked={invRole === r.value}
                        onChange={() => setInvRole(r.value)} className="accent-brand-blue mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{r.label}</p>
                        <p className="text-xs text-black/40">{r.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleInvite} className="btn-primary flex-1 justify-center gap-1.5" disabled={saving}>
                <UserCheck size={15} /> {saving ? 'Mengundang...' : 'Undang Pengguna'}
              </button>
              <button onClick={() => setShowInvite(false)} className="btn-secondary">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3>Edit Pengguna</h3>
                <p className="text-xs text-black/40 mt-0.5">{editing.email}</p>
              </div>
              <button onClick={() => setEditing(null)} className="btn-ghost p-1"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Nama Lengkap</label>
                <input className="input" value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Unit Kerja</label>
                  <select className="input" value={editUK} onChange={e => setEditUK(e.target.value)}>
                    <option value="">— Pilih —</option>
                    {unitKerjaList.map(uk => <option key={uk.id} value={uk.id}>{uk.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Jabatan</label>
                  <input className="input" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Level Akses</label>
                {editing.id === currentUserId && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-brand-amber/10 border border-brand-amber/20 mb-2">
                    <AlertTriangle size={12} className="text-[#7A4C00] shrink-0" />
                    <p className="text-xs text-[#7A4C00]">Tidak bisa mengubah role akun sendiri</p>
                  </div>
                )}
                <div className="space-y-2">
                  {ROLES.map(r => (
                    <label key={r.value} className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${editing.id === currentUserId ? 'opacity-50 cursor-not-allowed' : ''} ${editRole === r.value ? 'border-brand-blue bg-blue-50' : 'border-black/8 hover:border-brand-blue/30'}`}>
                      <input type="radio" name="edit-role" value={r.value} checked={editRole === r.value}
                        onChange={() => editing.id !== currentUserId && setEditRole(r.value)}
                        disabled={editing.id === currentUserId}
                        className="accent-brand-blue mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{r.label}</p>
                        <p className="text-xs text-black/40">{r.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSaveEdit} className="btn-primary flex-1 justify-center" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button onClick={() => setEditing(null)} className="btn-secondary">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/Sidebar'
import { ShieldCheck, Plus, ExternalLink } from 'lucide-react'
import type { AvrUserProfile } from '@/types'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Control Library' }

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  'Effective':         { bg: 'bg-risk-low',    text: 'text-risk-low-text',    dot: 'bg-[#1E5C0A]' },
  'Needs Improvement': { bg: 'bg-risk-medium', text: 'text-risk-medium-text', dot: 'bg-brand-amber' },
  'Not Effective':     { bg: 'bg-risk-extreme',text: 'text-risk-extreme-text',dot: 'bg-red-600' },
  'Not Tested':        { bg: 'bg-black/5',     text: 'text-black/40',         dot: 'bg-black/20' },
}

export default async function ControlsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('avr_user_profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/auth/login')

  const canWrite = ['admin', 'risk_manager'].includes(profile.role)

  const { count: unreadCount } = await supabase
    .from('avr_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id).eq('is_read', false)

  const { data: controls } = await supabase
    .from('avr_v_control_usage')
    .select('*')
    .order('control_code', { ascending: true })

  return (
    <div className="flex min-h-screen bg-brand-gray">
      <Sidebar profile={profile as AvrUserProfile} unreadCount={unreadCount ?? 0} />
      <main className="flex-1 ml-56 min-w-0">
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">

          <div className="flex items-center justify-between">
            <div>
              <span className="eyebrow">Governance</span>
              <h1 className="mt-1 flex items-center gap-2">
                <ShieldCheck size={20} className="text-brand-blue" />
                Control Library
              </h1>
              <p className="text-sm text-black/50 mt-0.5">
                Kontrol terpusat yang bisa dipasang ke banyak risiko sekaligus
              </p>
            </div>
            {canWrite && (
              <Link href="/controls/new" className="btn-primary gap-1.5">
                <Plus size={15} /> Tambah Kontrol
              </Link>
            )}
          </div>

          <div className="card p-0 overflow-hidden">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Nama Kontrol</th>
                  <th>Tipe</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th>Terakhir Diuji</th>
                  <th>Risiko Terhubung</th>
                </tr>
              </thead>
              <tbody>
                {controls?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-black/30">
                      Belum ada kontrol — tambahkan kontrol pertama untuk mulai membangun Control Library
                    </td>
                  </tr>
                )}
                {controls?.map((c: any) => {
                  const s = STATUS_STYLE[c.status] ?? STATUS_STYLE['Not Tested']
                  return (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/controls/${c.id}`} className="font-mono text-xs text-brand-blue hover:underline font-medium">
                          {c.control_code}
                        </Link>
                      </td>
                      <td>
                        <Link href={`/controls/${c.id}`} className="font-medium text-black hover:text-brand-blue transition-colors">
                          {c.nama}
                        </Link>
                      </td>
                      <td className="text-xs text-black/60">{c.tipe}</td>
                      <td>
                        <span className={`badge ${s.bg} ${s.text} text-[10px]`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {c.status}
                        </span>
                      </td>
                      <td className="text-xs text-black/60">{c.control_owner_name ?? '—'}</td>
                      <td className="text-xs text-black/50">{formatDate(c.last_tested_date)}</td>
                      <td>
                        {c.linked_risk_count > 0 ? (
                          <Link href={`/risks?control=${c.id}`} className="text-xs text-brand-blue hover:underline flex items-center gap-1">
                            {c.linked_risk_count} risiko <ExternalLink size={10} />
                          </Link>
                        ) : (
                          <span className="text-xs text-black/30">Belum dipasang</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="card bg-white border-0 p-4">
            <p className="text-xs text-black/40 leading-relaxed">
              <strong className="text-black/60">Tentang Control Library:</strong> Satu kontrol di sini bisa dipasang ke banyak risiko di Risk Register. Kalau status kontrol berubah (misal "Effective" → "Needs Improvement" setelah temuan audit), semua risiko yang menggunakan kontrol tersebut akan terdampak — Anda bisa lihat dampaknya langsung dari kolom "Risiko Terhubung".
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}

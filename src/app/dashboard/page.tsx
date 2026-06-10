import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ShieldAlert, TrendingUp, Clock, AlertTriangle,
  CheckCircle, Flag, ArrowRight, Users,
} from 'lucide-react'
import { RiskHeatmap } from '@/components/risk/RiskHeatmap'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils'
import type {
  AvrDashboardSummary, AvrHeatmapCell,
  AvrOverdueMitigation, AvrRisk,
} from '@/types'

export const metadata = { title: 'Dashboard' }
export const revalidate = 60

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('avr_user_profiles').select('role').eq('id', user.id).single()

  const isAdmin = profile?.role === 'admin'

  const [
    { data: summary },
    { data: heatmap },
    { data: overdue },
    { data: topRisks },
    { data: myActions },
  ] = await Promise.all([
    supabase.from('avr_v_dashboard_summary').select('*').single(),
    supabase.from('avr_v_heatmap').select('*'),
    supabase.from('avr_v_overdue_mitigations').select('*').limit(5),
    supabase.from('avr_risks')
      .select('*, risk_owner:avr_user_profiles!avr_risks_risk_owner_id_fkey(full_name)')
      .in('inherent_classification', ['Extreme', 'High'])
      .neq('status', 'Closed')
      .order('inherent_score', { ascending: false })
      .limit(5),
    supabase.from('avr_v_my_actions').select('*').limit(5),
  ])

  // Periodic access review — hanya untuk admin
  let inactiveUsers: { id: string; full_name: string; last_login_at: string | null }[] = []
  if (isAdmin) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 90)
    const { data } = await supabase
      .from('avr_user_profiles')
      .select('id, full_name, last_login_at')
      .eq('is_active', true)
      .or(`last_login_at.is.null,last_login_at.lt.${cutoff.toISOString()}`)
      .neq('id', user.id)
      .order('last_login_at', { ascending: true, nullsFirst: true })
      .limit(5)
    inactiveUsers = data ?? []
  }

  const s = summary as AvrDashboardSummary

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="eyebrow">Overview</span>
        <h1 className="mt-1">Dashboard Risiko</h1>
        <p className="text-sm text-black/50 mt-0.5">Status terkini seluruh risiko organisasi</p>
      </div>

      {/* Periodic Access Review Alert — admin only */}
      {isAdmin && inactiveUsers.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-brand-amber/10 border border-brand-amber/20">
          <Users size={16} className="text-[#7A4C00] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#7A4C00]">
              Periodic Access Review — {inactiveUsers.length} pengguna tidak aktif {'>'} 90 hari
            </p>
            <p className="text-xs text-[#7A4C00]/70 mt-0.5 mb-2">
              ISO 27001 A.9.2.5 — Review akses pengguna secara berkala untuk memastikan hak akses masih valid.
            </p>
            <div className="space-y-1">
              {inactiveUsers.map(u => (
                <div key={u.id} className="flex items-center gap-2 text-xs text-[#7A4C00]/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7A4C00]/40 shrink-0" />
                  <span className="font-medium">{u.full_name}</span>
                  <span className="text-[#7A4C00]/50">—</span>
                  <span>
                    {u.last_login_at
                      ? `terakhir login ${formatDate(u.last_login_at)}`
                      : 'belum pernah login'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <Link href="/users" className="btn-secondary text-xs shrink-0 gap-1 py-1.5">
            Review Akses <ArrowRight size={11} />
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Risiko Aktif"
          value={s?.total_open ?? 0}
          icon={<ShieldAlert size={18} className="text-brand-blue" />}
          sub={`${s?.total_closed ?? 0} closed`}
        />
        <KpiCard
          label="Extreme / High"
          value={(s?.total_extreme ?? 0) + (s?.total_high ?? 0)}
          icon={<AlertTriangle size={18} className="text-[#E07800]" />}
          sub={`${s?.total_extreme ?? 0} extreme`}
          accent="amber"
        />
        <KpiCard
          label="Perlu Review"
          value={s?.due_review_soon ?? 0}
          icon={<Clock size={18} className="text-brand-blue" />}
          sub="dalam 14 hari"
        />
        <KpiCard
          label="Agenda MRM"
          value={s?.total_mrm_flagged ?? 0}
          icon={<Flag size={18} className="text-brand-navy" />}
          sub="perlu dibahas"
        />
      </div>

      {/* Heatmap + Top Risks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3>Risk Heatmap</h3>
            <span className="text-xs text-black/40">Klik sel untuk filter</span>
          </div>
          <RiskHeatmap data={(heatmap as AvrHeatmapCell[]) ?? []} />
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3>Risiko Extreme & High</h3>
            <Link href="/risks?classification=Extreme,High" className="text-xs text-brand-blue hover:underline flex items-center gap-1">
              Lihat semua <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {(topRisks as AvrRisk[])?.length === 0 && (
              <p className="text-sm text-black/40 py-4 text-center">Tidak ada risiko High/Extreme</p>
            )}
            {(topRisks as AvrRisk[])?.map(risk => (
              <Link key={risk.id} href={`/risks/${risk.id}`}
                className="flex items-center gap-3 p-3 rounded border border-black/5 hover:border-brand-blue/20 hover:bg-brand-gray transition-colors">
                <ClassificationBadge classification={risk.inherent_classification} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">{risk.title}</p>
                  <p className="text-xs text-black/40">{risk.risk_code} · {risk.category}</p>
                </div>
                <StatusBadge status={risk.status} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Overdue Mitigations + My Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3>Mitigasi Terlambat</h3>
            <Link href="/risks?filter=overdue" className="text-xs text-brand-blue hover:underline flex items-center gap-1">
              Lihat semua <ArrowRight size={12} />
            </Link>
          </div>
          {(overdue as AvrOverdueMitigation[])?.length === 0 ? (
            <div className="flex items-center gap-2 py-4 text-sm text-black/40 justify-center">
              <CheckCircle size={16} className="text-[#5A9E2F]" />
              Tidak ada mitigasi terlambat
            </div>
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Risiko</th>
                  <th>Target</th>
                  <th>Keterlambatan</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {(overdue as AvrOverdueMitigation[])?.map(o => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/risks/${o.risk_id}`} className="font-medium text-brand-blue hover:underline text-xs">
                        {o.risk_code}
                      </Link>
                      <p className="text-xs text-black/40 truncate max-w-[140px]">{o.risk_title}</p>
                    </td>
                    <td className="text-xs">{formatDate(o.target_completion_date)}</td>
                    <td>
                      <span className="text-xs font-medium text-red-600">+{o.days_overdue}h</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-black/8 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-blue rounded-full"
                            style={{ width: `${o.progress_percentage}%` }} />
                        </div>
                        <span className="text-xs text-black/40">{o.progress_percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3>Tindakan Saya</h3>
            <span className="text-xs text-black/40">Risiko yang Anda kelola</span>
          </div>
          <div className="space-y-2">
            {myActions?.length === 0 && (
              <p className="text-sm text-black/40 py-4 text-center">Tidak ada tindakan yang diperlukan</p>
            )}
            {myActions?.map((a: any) => (
              <Link key={a.id} href={`/risks/${a.id}`}
                className="flex items-center gap-3 p-3 rounded border border-black/5 hover:border-brand-blue/20 hover:bg-brand-gray transition-colors">
                <ClassificationBadge classification={a.inherent_classification} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">{a.title}</p>
                  <div className="flex gap-2 mt-0.5">
                    {a.has_overdue_mitigation && (
                      <span className="text-[10px] text-red-500 font-medium">● Mitigasi terlambat</span>
                    )}
                    {a.pending_my_approval && (
                      <span className="text-[10px] text-brand-blue font-medium">● Menunggu approval Anda</span>
                    )}
                    {a.days_until_review !== null && a.days_until_review <= 14 && (
                      <span className="text-[10px] text-[#7A4C00] font-medium">● Review dalam {a.days_until_review}h</span>
                    )}
                  </div>
                </div>
                <ArrowRight size={14} className="text-black/20 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, icon, sub, accent }: {
  label: string; value: number; icon: React.ReactNode; sub: string; accent?: 'amber'
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-black/50 font-medium">{label}</p>
          <p className={`text-3xl font-semibold mt-1 ${accent === 'amber' ? 'text-[#7A4C00]' : 'text-brand-navy'}`}>
            {value}
          </p>
          <p className="text-xs text-black/30 mt-1">{sub}</p>
        </div>
        <div className="p-2 rounded-lg bg-brand-gray">{icon}</div>
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Filter } from 'lucide-react'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils'
import type { AvrRisk, AvrClassification, AvrRiskStatus } from '@/types'

export const metadata = { title: 'Risk Register' }

interface Props {
  searchParams: Promise<{
    classification?: string
    status?: string
    department?: string
    q?: string
  }>
}

export default async function RisksPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('avr_user_profiles')
    .select('role')
    .single()

  let query = supabase
    .from('avr_risks')
    .select(`
      *,
      risk_owner:avr_user_profiles!avr_risks_risk_owner_id_fkey(id, full_name, department)
    `)
    .order('created_at', { ascending: false })

  if (params.classification) {
    const cls = params.classification.split(',') as AvrClassification[]
    query = query.in('inherent_classification', cls)
  }
  if (params.status) {
    query = query.eq('status', params.status as AvrRiskStatus)
  }
  if (params.department) {
    query = query.eq('department', params.department)
  }
  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,risk_code.ilike.%${params.q}%,description.ilike.%${params.q}%`)
  }

  const { data: risks, count } = await query.limit(100)

  const canWrite = profile?.role === 'admin' || profile?.role === 'risk_manager'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="eyebrow">Register</span>
          <h1 className="mt-1">Risk Register</h1>
          <p className="text-sm text-black/50 mt-0.5">{count ?? risks?.length ?? 0} risiko ditemukan</p>
        </div>
        {canWrite && (
          <Link href="/risks/new" className="btn-primary">
            <Plus size={16} />
            Tambah Risiko
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-3 items-center py-3">
        <Filter size={14} className="text-black/30 shrink-0" />
        <FilterChip href="/risks" label="Semua" active={!params.classification && !params.status} />
        <FilterChip href="/risks?classification=Extreme" label="Extreme" active={params.classification === 'Extreme'} />
        <FilterChip href="/risks?classification=High" label="High" active={params.classification === 'High'} />
        <FilterChip href="/risks?classification=Extreme,High" label="Extreme + High" active={params.classification === 'Extreme,High'} />
        <FilterChip href="/risks?status=Open" label="Open" active={params.status === 'Open'} />
        <FilterChip href="/risks?status=In Progress" label="In Progress" active={params.status === 'In Progress'} />
        <FilterChip href="/risks?status=Pending Approval" label="Pending Approval" active={params.status === 'Pending Approval'} />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Judul Risiko</th>
              <th>Kategori</th>
              <th>Inherent</th>
              <th>Residual</th>
              <th>Status</th>
              <th>Risk Owner</th>
              <th>Next Review</th>
            </tr>
          </thead>
          <tbody>
            {risks?.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12 text-black/30">
                  Tidak ada risiko yang sesuai filter
                </td>
              </tr>
            )}
            {(risks as AvrRisk[])?.map(risk => (
              <tr key={risk.id}>
                <td>
                  <Link href={`/risks/${risk.id}`} className="font-mono text-xs text-brand-blue hover:underline font-medium">
                    {risk.risk_code}
                  </Link>
                </td>
                <td>
                  <Link href={`/risks/${risk.id}`} className="font-medium text-black hover:text-brand-blue transition-colors">
                    {risk.title}
                  </Link>
                  <p className="text-xs text-black/40 mt-0.5">{risk.department}</p>
                </td>
                <td className="text-xs text-black/60">{risk.category}</td>
                <td><ClassificationBadge classification={risk.inherent_classification} size="sm" /></td>
                <td>
                  {risk.residual_classification
                    ? <ClassificationBadge classification={risk.residual_classification} size="sm" />
                    : <span className="text-xs text-black/25">—</span>}
                </td>
                <td><StatusBadge status={risk.status} /></td>
                <td className="text-xs text-black/60">
                  {(risk as any).risk_owner?.full_name ?? '—'}
                </td>
                <td className="text-xs">
                  {risk.next_review_date
                    ? <ReviewDate date={risk.next_review_date} />
                    : <span className="text-black/25">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`text-xs px-3 py-1 rounded-full border transition-colors ${
        active
          ? 'bg-brand-blue text-white border-brand-blue'
          : 'bg-white text-black/50 border-black/10 hover:border-brand-blue/40 hover:text-black'
      }`}
    >
      {label}
    </Link>
  )
}

function ReviewDate({ date }: { date: string }) {
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000)
  const overdue = days < 0
  const soon    = days >= 0 && days <= 7
  return (
    <span className={overdue ? 'text-red-500 font-medium' : soon ? 'text-[#7A4C00]' : 'text-black/50'}>
      {formatDate(date)}
      {overdue && <span className="ml-1 text-[10px]">({Math.abs(days)}h lalu)</span>}
      {soon && !overdue && <span className="ml-1 text-[10px]">({days}h lagi)</span>}
    </span>
  )
}

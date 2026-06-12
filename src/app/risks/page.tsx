import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Filter, Clock } from 'lucide-react'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils'
import type { AvrRisk, AvrClassification, AvrRiskStatus } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Risk Register' }

interface Props {
  searchParams: Promise<{
    classification?: string
    status?: string
    department?: string
    q?: string
    filter?: string
  }>
}

export default async function RisksPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('avr_user_profiles').select('role').eq('id', user.id).single()

  const isReviewFilter = params.filter === 'review_due'

  // Untuk review filter: ambil semua risk_id yang pernah di-review
  let reviewedRiskIds: string[] = []
  if (isReviewFilter) {
    const { data: reviewed } = await supabase
      .from('avr_risk_reviews')
      .select('risk_id')
    reviewedRiskIds = [...new Set((reviewed ?? []).map((r: any) => r.risk_id))]
  }

  let query = supabase
    .from('avr_risks')
    .select(`
      *,
      risk_owner:avr_user_profiles!avr_risks_risk_owner_id_fkey(id, full_name),
      unit_kerja:avr_unit_kerja(kode, nama)
    `)
    .neq('status', 'Closed')
    .order('created_at', { ascending: false })

  // Review filter: tampilkan risiko yang punya next_review_date ATAU pernah di-review
  if (isReviewFilter) {
    if (reviewedRiskIds.length > 0) {
      query = query.or(`next_review_date.not.is.null,id.in.(${reviewedRiskIds.join(',')})`)
    } else {
      query = query.not('next_review_date', 'is', null)
    }
    query = query.order('next_review_date', { ascending: true, nullsFirst: false })
  }

  if (params.classification) {
    const cls = params.classification.split(',') as AvrClassification[]
    query = query.in('inherent_classification', cls)
  }
  if (params.status) {
    query = query.eq('status', params.status as AvrRiskStatus)
  }
  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,risk_code.ilike.%${params.q}%`)
  }

  const { data: risks } = await query.limit(200)

  const canWrite = ['admin', 'risk_manager'].includes(profile?.role ?? '')

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="eyebrow">{isReviewFilter ? 'Review' : 'Register'}</span>
          <h1 className="mt-1">{isReviewFilter ? 'Risiko Perlu Review' : 'Risk Register'}</h1>
          <p className="text-sm text-black/50 mt-0.5">
            {isReviewFilter
              ? `${risks?.length ?? 0} risiko dengan jadwal review atau sudah pernah di-review`
              : `${risks?.length ?? 0} risiko ditemukan`}
          </p>
        </div>
        {canWrite && !isReviewFilter && (
          <Link href="/risks/new" className="btn-primary">
            <Plus size={16} /> Tambah Risiko
          </Link>
        )}
      </div>

      {/* Filter chips — hanya tampil di mode Register biasa */}
      {!isReviewFilter && (
        <div className="card flex flex-wrap gap-2 items-center py-3">
          <Filter size={14} className="text-black/30 shrink-0" />
          <FilterChip href="/risks" label="Semua" active={!params.classification && !params.status} />
          <FilterChip href="/risks?classification=Extreme" label="Extreme" active={params.classification === 'Extreme'} />
          <FilterChip href="/risks?classification=High" label="High" active={params.classification === 'High'} />
          <FilterChip href="/risks?classification=Extreme,High" label="Extreme + High" active={params.classification === 'Extreme,High'} />
          <FilterChip href="/risks?status=Open" label="Open" active={params.status === 'Open'} />
          <FilterChip href="/risks?status=In Progress" label="In Progress" active={params.status === 'In Progress'} />
          <FilterChip href="/risks?status=Pending Approval" label="Pending Approval" active={params.status === 'Pending Approval'} />
        </div>
      )}

      {/* Review mode info bar */}
      {isReviewFilter && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-amber/10 border border-brand-amber/20">
          <Clock size={14} className="text-[#7A4C00] shrink-0" />
          <p className="text-xs text-[#7A4C00]">
            Menampilkan risiko yang memiliki jadwal review (semua waktu) dan risiko yang sudah pernah di-review. Klik risiko untuk melakukan review.
          </p>
          <Link href="/risks" className="ml-auto text-xs text-brand-blue hover:underline whitespace-nowrap">
            Lihat semua →
          </Link>
        </div>
      )}

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
              {isReviewFilter
                ? <th>Jadwal Review</th>
                : <th>Next Review</th>}
            </tr>
          </thead>
          <tbody>
            {risks?.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12 text-black/30">
                  {isReviewFilter
                    ? 'Tidak ada risiko dengan jadwal review'
                    : 'Tidak ada risiko yang sesuai filter'}
                </td>
              </tr>
            )}
            {(risks as AvrRisk[])?.map(risk => {
              const days = risk.next_review_date
                ? Math.ceil((new Date(risk.next_review_date).getTime() - Date.now()) / 86400000)
                : null

              return (
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
                    <p className="text-xs text-black/40 mt-0.5">
                      {(risk as any).unit_kerja?.nama ?? risk.category}
                    </p>
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
                    {isReviewFilter ? (
                      <div className="flex items-center gap-1.5">
                        {days !== null ? (
                          <span className={`font-semibold ${days < 0 ? 'text-red-500' : days <= 7 ? 'text-[#7A4C00]' : 'text-black/60'}`}>
                            {days < 0 ? `${Math.abs(days)}h overdue` : days === 0 ? 'Hari ini' : `${days} hari`}
                          </span>
                        ) : (
                          <span className="text-black/25">—</span>
                        )}
                        <Link href={`/risks/${risk.id}/review`}
                          className="text-[10px] px-2 py-0.5 rounded bg-brand-blue text-white hover:bg-brand-blue-hover transition-colors">
                          Review
                        </Link>
                      </div>
                    ) : (
                      <ReviewDate date={risk.next_review_date} />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className={`text-xs px-3 py-1 rounded-full border transition-colors ${
      active
        ? 'bg-brand-blue text-white border-brand-blue'
        : 'bg-white text-black/50 border-black/10 hover:border-brand-blue/40 hover:text-black'
    }`}>
      {label}
    </Link>
  )
}

function ReviewDate({ date }: { date: string | null }) {
  if (!date) return <span className="text-black/25">—</span>
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
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

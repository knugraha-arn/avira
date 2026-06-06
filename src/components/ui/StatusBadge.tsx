import { cn } from '@/lib/utils'
import type { AvrRiskStatus } from '@/types'

const STATUS_STYLE: Record<AvrRiskStatus, string> = {
  'Open':             'bg-blue-50 text-brand-blue border-brand-blue/20',
  'In Progress':      'bg-brand-amber/10 text-[#7A4C00] border-brand-amber/30',
  'Pending Approval': 'bg-brand-lime/20 text-brand-navy border-brand-lime/40',
  'Closed':           'bg-black/5 text-black/40 border-black/10',
}

export function StatusBadge({ status }: { status: AvrRiskStatus }) {
  return (
    <span className={cn('badge', STATUS_STYLE[status])}>
      {status}
    </span>
  )
}

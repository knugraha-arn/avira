import { cn, classificationBadge } from '@/lib/utils'
import type { AvrClassification } from '@/types'

interface Props {
  classification: AvrClassification | null
  size?: 'sm' | 'md'
}

export function ClassificationBadge({ classification, size = 'md' }: Props) {
  if (!classification) return <span className="text-black/30 text-xs">—</span>
  const c = classificationBadge(classification)
  return (
    <span className={cn(
      'badge',
      c.bg, c.text, c.border,
      size === 'sm' && 'text-[10px] px-1.5 py-0'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', c.dot)} />
      {c.label}
    </span>
  )
}

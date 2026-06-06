'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { AvrHeatmapCell, AvrClassification } from '@/types'

const CELL_COLOR: Record<AvrClassification, { bg: string; text: string; hover: string }> = {
  Low:     { bg: 'bg-risk-low',     text: 'text-risk-low-text',     hover: 'hover:brightness-95' },
  Medium:  { bg: 'bg-risk-medium',  text: 'text-risk-medium-text',  hover: 'hover:brightness-95' },
  High:    { bg: 'bg-risk-high',    text: 'text-risk-high-text',    hover: 'hover:brightness-95' },
  Extreme: { bg: 'bg-risk-extreme', text: 'text-risk-extreme-text', hover: 'hover:brightness-90' },
}

const MATRIX_DEFAULT: Record<AvrClassification, AvrClassification[][]> = {
  // Used for fallback coloring when no data
  Low: [], Medium: [], High: [], Extreme: [],
}

// Pre-built classification grid (row=likelihood 5→1, col=impact 1→5)
const GRID: AvrClassification[][] = [
  ['Medium','High',   'High',   'Extreme','Extreme'], // L5
  ['Medium','Medium', 'High',   'High',   'Extreme'], // L4
  ['Low',   'Medium', 'Medium', 'High',   'Extreme'], // L3
  ['Low',   'Low',    'Medium', 'Medium', 'High'   ], // L2
  ['Low',   'Low',    'Low',    'Medium', 'Medium' ], // L1
]

const LIKELIHOOD_LABELS = ['Sangat Jarang','Jarang','Kadang','Sering','Pasti']
const IMPACT_LABELS     = ['Sangat Kecil','Kecil','Sedang','Besar','Kritis']

interface Props {
  data: AvrHeatmapCell[]
}

export function RiskHeatmap({ data }: Props) {
  const router = useRouter()

  // Build lookup: likelihood-impact → cell data
  const lookup = new Map<string, AvrHeatmapCell>()
  data.forEach(c => lookup.set(`${c.likelihood}-${c.impact}`, c))

  function handleCellClick(l: number, i: number, cell: AvrHeatmapCell | undefined) {
    if (!cell || cell.risk_count === 0) return
    router.push(`/risks?likelihood=${l}&impact=${i}`)
  }

  return (
    <div>
      <div className="flex gap-1 mb-1 ml-10">
        {IMPACT_LABELS.map((label, i) => (
          <div key={i} className="flex-1 text-[10px] text-black/40 text-center truncate px-0.5">
            {label}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {GRID.map((row, rowIdx) => {
          const likelihood = 5 - rowIdx
          return (
            <div key={likelihood} className="flex items-center gap-1">
              <div className="w-9 text-[10px] text-black/40 text-right pr-1 shrink-0">
                {LIKELIHOOD_LABELS[likelihood - 1]}
              </div>
              {row.map((classification, colIdx) => {
                const impact = colIdx + 1
                const cell   = lookup.get(`${likelihood}-${impact}`)
                const count  = cell?.risk_count ?? 0
                const col    = CELL_COLOR[classification]
                return (
                  <button
                    key={impact}
                    onClick={() => handleCellClick(likelihood, impact, cell)}
                    className={cn(
                      'flex-1 aspect-square rounded flex flex-col items-center justify-center transition-all',
                      col.bg, col.text, col.hover,
                      count > 0 ? 'cursor-pointer' : 'cursor-default opacity-60'
                    )}
                    title={`L${likelihood} × I${impact} — ${classification}${count > 0 ? ` (${count} risiko)` : ''}`}
                  >
                    {count > 0 && (
                      <span className="text-base font-semibold leading-none">{count}</span>
                    )}
                    <span className={cn('text-[9px] font-medium opacity-60', count === 0 && 'hidden')}>
                      risiko
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-3 mt-3 flex-wrap">
        {(['Low','Medium','High','Extreme'] as AvrClassification[]).map(c => (
          <span key={c} className="flex items-center gap-1 text-[11px] text-black/50">
            <span className={cn('w-2.5 h-2.5 rounded-sm', CELL_COLOR[c].bg)} />
            {c}
          </span>
        ))}
      </div>
    </div>
  )
}

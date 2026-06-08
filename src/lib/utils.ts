import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { AvrClassification } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Risk classification helpers ──────────────────────────────
export const CLASSIFICATION_CONFIG: Record<AvrClassification, {
  label: string
  bg: string
  text: string
  border: string
  dot: string
}> = {
  Low: {
    label:  'Low',
    bg:     'bg-risk-low',
    text:   'text-risk-low-text',
    border: 'border-risk-low-text/20',
    dot:    'bg-[#1E5C0A]',
  },
  Medium: {
    label:  'Medium',
    bg:     'bg-risk-medium',
    text:   'text-risk-medium-text',
    border: 'border-risk-medium-text/20',
    dot:    'bg-brand-amber',
  },
  High: {
    label:  'High',
    bg:     'bg-risk-high',
    text:   'text-risk-high-text',
    border: 'border-risk-high-text/20',
    dot:    'bg-[#E07800]',
  },
  Extreme: {
    label:  'Extreme',
    bg:     'bg-risk-extreme',
    text:   'text-risk-extreme-text',
    border: 'border-red-700/30',
    dot:    'bg-white',
  },
}

export function classificationBadge(c: AvrClassification | null) {
  if (!c) return CLASSIFICATION_CONFIG.Low
  return CLASSIFICATION_CONFIG[c]
}

// ─── Date helpers ──────────────────────────────────────────────
export function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('id-ID', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  })
}

export function daysFromToday(d: string | null): number | null {
  if (!d) return null
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000)
}

// ─── Likelihood / Impact labels ───────────────────────────────
export const LIKELIHOOD_LABELS: Record<number, string> = {
  1: 'Sangat Jarang',
  2: 'Jarang',
  3: 'Kadang',
  4: 'Sering',
  5: 'Pasti Terjadi',
}

export const IMPACT_LABELS: Record<number, string> = {
  1: 'Sangat Kecil',
  2: 'Kecil',
  3: 'Sedang',
  4: 'Besar',
  5: 'Kritis',
}

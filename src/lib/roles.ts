// Centralized role definitions for AVIRA
// Single source of truth for access control

export type AvrRole = 'admin' | 'risk_manager' | 'auditor' | 'viewer'

export const ROLES: Record<AvrRole, { label: string; desc: string; color: string }> = {
  admin: {
    label: 'Admin',
    desc:  'Full access — kelola user, approve closure, semua fitur',
    color: 'bg-risk-extreme text-risk-extreme-text border-red-700/30',
  },
  risk_manager: {
    label: 'Risk Manager',
    desc:  'Kelola risiko miliknya — tambah, edit, review, mitigasi, request closure',
    color: 'bg-blue-50 text-brand-blue border-brand-blue/20',
  },
  auditor: {
    label: 'Auditor',
    desc:  'Read-only + generate laporan — cocok untuk auditor internal/eksternal',
    color: 'bg-brand-lime/20 text-brand-navy border-brand-lime/40',
  },
  viewer: {
    label: 'Viewer',
    desc:  'Read-only — lihat data tanpa bisa generate laporan',
    color: 'bg-black/5 text-black/50 border-black/10',
  },
}

// Access control helpers
export const canWrite       = (role: string) => ['admin', 'risk_manager'].includes(role)
export const canReport      = (role: string) => ['admin', 'risk_manager', 'auditor'].includes(role)
export const canAdmin       = (role: string) => role === 'admin'
export const canApprove     = (role: string) => role === 'admin'
export const canUseAI       = (role: string) => ['admin', 'risk_manager'].includes(role)

export const canEditRisk = (role: string, userId: string, riskOwnerId?: string | null, treatmentOwnerId?: string | null) => {
  if (role === 'admin') return true
  if (role === 'risk_manager') {
    return userId === riskOwnerId || userId === treatmentOwnerId
  }
  return false
}

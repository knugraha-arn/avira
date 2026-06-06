// ─── Enums ────────────────────────────────────────────────────
export type AvrUserRole       = 'admin' | 'risk_manager' | 'viewer'
export type AvrRiskCategory   = 'Strategic' | 'Operational' | 'Financial' | 'Compliance' | 'Technology' | 'Human Resources' | 'Reputational' | 'Other'
export type AvrRiskStatus     = 'Open' | 'In Progress' | 'Pending Approval' | 'Closed'
export type AvrTreatment      = 'Mitigate' | 'Accept' | 'Transfer' | 'Avoid'
export type AvrClassification = 'Low' | 'Medium' | 'High' | 'Extreme'
export type AvrReviewDecision = 'No Change' | 'Update Risk' | 'Escalate' | 'Close Risk'
export type AvrClosureStatus  = 'Pending' | 'Approved' | 'Rejected'

// ─── Tables ───────────────────────────────────────────────────
export interface AvrUserProfile {
  id:          string
  full_name:   string
  email:       string
  department:  string | null
  job_title:   string | null
  role:        AvrUserRole
  is_active:   boolean
  avatar_url:  string | null
  created_at:  string
  updated_at:  string
}

export interface AvrRisk {
  id:                      string
  risk_code:               string
  title:                   string
  description:             string | null
  category:                AvrRiskCategory
  department:              string
  related_asset:           string | null
  related_vendor:          string | null
  risk_owner_id:           string | null
  treatment_owner_id:      string | null
  date_identified:         string
  existing_control:        string | null
  likelihood:              number
  impact:                  number
  inherent_score:          number
  inherent_classification: AvrClassification | null
  residual_likelihood:     number | null
  residual_impact:         number | null
  residual_score:          number
  residual_classification: AvrClassification | null
  treatment_strategy:      AvrTreatment | null
  treatment_notes:         string | null
  review_frequency_days:   number
  last_review_date:        string | null
  next_review_date:        string | null
  is_mrm_flagged:          boolean
  mrm_reason:              string | null
  status:                  AvrRiskStatus
  created_by:              string | null
  created_at:              string
  updated_at:              string
  // joined
  risk_owner?:             AvrUserProfile
  treatment_owner?:        AvrUserProfile
}

export interface AvrMitigationLog {
  id:                     string
  risk_id:                string
  updated_by:             string | null
  update_date:            string
  progress_percentage:    number
  mitigation_notes:       string
  target_completion_date: string | null
  actual_completion_date: string | null
  days_deviation:         number | null
  evidence_reference:     string | null
  attachment_url:         string | null
  created_at:             string
  updater?:               AvrUserProfile
}

export interface AvrRiskReview {
  id:                   string
  risk_id:              string
  reviewed_by:          string | null
  review_date:          string
  review_notes:         string | null
  previous_likelihood:  number | null
  previous_impact:      number | null
  previous_score:       number | null
  previous_class:       AvrClassification | null
  current_likelihood:   number
  current_impact:       number
  current_score:        number
  current_class:        AvrClassification | null
  review_decision:      AvrReviewDecision
  created_at:           string
  reviewer?:            AvrUserProfile
}

export interface AvrRiskClosure {
  id:               string
  risk_id:          string
  requested_by:     string | null
  approver_id:      string | null
  justification:    string
  status:           AvrClosureStatus
  rejection_reason: string | null
  requested_at:     string
  decided_at:       string | null
  requester?:       AvrUserProfile
  approver?:        AvrUserProfile
}

export interface AvrAuditLog {
  id:           string
  risk_id:      string
  action:       string
  performed_by: string | null
  old_data:     Record<string, unknown> | null
  new_data:     Record<string, unknown> | null
  created_at:   string
  actor?:       AvrUserProfile
}

export interface AvrNotification {
  id:         string
  user_id:    string
  risk_id:    string | null
  type:       string
  title:      string
  message:    string | null
  is_read:    boolean
  created_at: string
}

// ─── Dashboard Views ──────────────────────────────────────────
export interface AvrDashboardSummary {
  total_open:       number
  total_extreme:    number
  total_high:       number
  total_medium:     number
  total_low:        number
  total_closed:     number
  total_mrm_flagged: number
  due_review_soon:  number
}

export interface AvrHeatmapCell {
  likelihood:     number
  impact:         number
  classification: AvrClassification
  risk_count:     number
  risk_ids:       string[]
}

export interface AvrOverdueMitigation {
  id:                     string
  risk_id:                string
  risk_code:              string
  risk_title:             string
  risk_owner_id:          string
  risk_owner_name:        string
  target_completion_date: string
  days_overdue:           number
  progress_percentage:    number
}

export interface AvrMyAction {
  id:                    string
  risk_code:             string
  title:                 string
  inherent_classification: AvrClassification
  status:                AvrRiskStatus
  next_review_date:      string | null
  days_until_review:     number | null
  my_role_on_risk:       'owner' | 'treatment_owner'
  has_overdue_mitigation: boolean
  pending_my_approval:   boolean
}

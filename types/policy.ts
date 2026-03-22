export type PolicyStatus = 'active' | 'expiring' | 'expired' | 'lapsed' | 'pending' | 'cancelled'

export type PolicyType =
  | 'motor'
  | 'home'
  | 'life'
  | 'health'
  | 'travel'
  | 'business'
  | 'other'

export type Policy = {
  id: string
  user_id: string
  insurer: string
  policy_number: string
  type: PolicyType
  status: PolicyStatus
  premium_amount: number
  premium_frequency: 'monthly' | 'annual'
  start_date: string
  expiry_date: string
  cover_amount?: number
  notes?: string
  created_at: string
  updated_at: string
}

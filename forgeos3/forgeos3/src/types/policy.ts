export interface PolicyRule {
  toolName: string
  domain: string
  decision: 'allowed' | 'blocked' | 'approval_required'
  sensitivity: 'low' | 'medium' | 'high' | 'critical'
}

export interface PolicyPresetFull {
  id: string
  name: string
  level: 'low' | 'medium' | 'strict'
  strictness: number
  description: string
  rules: PolicyRule[]
}

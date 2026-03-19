export type Sensitivity  = 'low' | 'medium' | 'high' | 'critical'
export type PolicyLevel  = 'low' | 'medium' | 'strict'
export type RiskMode     = 'safe' | 'normal'
export type Decision     = 'allowed' | 'blocked' | 'approval_required'

export interface PolicyInput {
  toolName:         string
  domain:           string
  policyLevel:      PolicyLevel
  sensitivity:      Sensitivity
  riskMode:         RiskMode
  requiresApproval: boolean
}

export interface PolicyResult {
  decision: Decision
  reason:   string
}

export function evaluatePolicy(input: PolicyInput): PolicyResult {
  const { policyLevel, sensitivity, riskMode, requiresApproval, toolName, domain } = input

  // Critical + strict → always block
  if (sensitivity === 'critical' && policyLevel === 'strict') {
    return {
      decision: 'blocked',
      reason: `Tool "${toolName}" is critical sensitivity and blocked by strict policy in domain "${domain}"`
    }
  }

  // Critical + non-strict → approval required
  if (sensitivity === 'critical') {
    return {
      decision: 'approval_required',
      reason: `Tool "${toolName}" is critical sensitivity — human approval required`
    }
  }

  // High sensitivity → approval required
  if (sensitivity === 'high') {
    return {
      decision: 'approval_required',
      reason: `Tool "${toolName}" has high sensitivity — human approval required`
    }
  }

  // Safe mode + medium or above → approval required
  if (riskMode === 'safe' && sensitivity === 'medium') {
    return {
      decision: 'approval_required',
      reason: `Tool "${toolName}" requires approval in safe mode for medium sensitivity`
    }
  }

  // Explicit approval flag
  if (requiresApproval) {
    return {
      decision: 'approval_required',
      reason: `Tool "${toolName}" is configured to always require approval`
    }
  }

  // Medium + strict policy → approval required
  if (sensitivity === 'medium' && policyLevel === 'strict') {
    return {
      decision: 'approval_required',
      reason: `Tool "${toolName}" requires approval under strict policy`
    }
  }

  return {
    decision: 'allowed',
    reason: `Tool "${toolName}" is allowed under current policy`
  }
}
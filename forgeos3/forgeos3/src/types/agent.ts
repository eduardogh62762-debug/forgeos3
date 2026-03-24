export type DomainProfile = 'healthtech' | 'agrotech' | 'fintech' | 'health' | 'gov' | 'marketing' | 'custom'
export type RiskMode = 'normal' | 'safe'
export type PolicyLevel = 'low' | 'medium' | 'strict'
export type RuntimeKey = 'openclaw' | 'langgraph' | 'autogen' | 'crewai' | 'custom'

export interface ToolItem {
  id: string; name: string; description: string
  sensitivity: 'low' | 'medium' | 'high' | 'critical'
  requiresApproval: boolean
}
export interface ToolPack {
  id: string; name: string; description: string
  domain: DomainProfile; tools: ToolItem[]
}
export interface DomainProfileConfig {
  id: string; key: DomainProfile; name: string
  description: string; icon: string; color: string; riskMode: RiskMode
}
export interface PolicyPreset {
  id: string; name: string; level: PolicyLevel
  description: string; strictness: number
}
export interface Agent {
  id: string; name: string; description: string
  runtime: RuntimeKey; domainProfile: DomainProfile
  toolPackId: string; policyPresetId: string; riskMode: RiskMode
  requiresApprovalFor: string[]
  status: 'active' | 'inactive' | 'deploying'; createdAt: string
}
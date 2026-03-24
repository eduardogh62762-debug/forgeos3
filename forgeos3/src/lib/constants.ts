import type { DomainProfileConfig, ToolPack, PolicyPreset } from '../types/agent'

export const DOMAIN_PROFILES: DomainProfileConfig[] = [
  { id: '1', key: 'healthtech', name: 'HealthTech', icon: '♥', description: 'Clinical documentation, diagnostics and patient support agents', color: 'blue', riskMode: 'safe' },
  { id: '2', key: 'agrotech',   name: 'AgroTech',   icon: '⬡', description: 'Crop monitoring, yield prediction and agricultural automation', color: 'green', riskMode: 'safe' },
  { id: '3', key: 'fintech',    name: 'FinTech',    icon: '◈', description: 'Financial analysis, fraud detection and transaction automation', color: 'amber', riskMode: 'normal' },
  { id: '4', key: 'custom',     name: 'Custom',     icon: '◎', description: 'Define your own domain policies and rules', color: 'gray', riskMode: 'normal' },
]

export const TOOL_PACKS: ToolPack[] = [
  {
    id: 'tp-healthtech', name: 'HealthTech Core', description: 'Medical documentation tools', domain: 'healthtech',
    tools: [
      { id: 't1', name: 'summarize',    description: 'Summarize patient intake',        sensitivity: 'low',      requiresApproval: false },
      { id: 't2', name: 'checklist',    description: 'Generate follow-up checklist',    sensitivity: 'low',      requiresApproval: false },
      { id: 't3', name: 'diagnose',     description: 'Diagnostic assistance',           sensitivity: 'critical', requiresApproval: true  },
      { id: 't4', name: 'write_record', description: 'Write to patient record',         sensitivity: 'high',     requiresApproval: true  },
    ]
  },
  {
    id: 'tp-agrotech', name: 'AgroTech Core', description: 'Agricultural workflow tools', domain: 'agrotech',
    tools: [
      { id: 't5', name: 'analyze_crop',   description: 'Analyze crop health from sensor data', sensitivity: 'low',      requiresApproval: false },
      { id: 't6', name: 'predict_yield',  description: 'Predict harvest yield',                sensitivity: 'medium',   requiresApproval: false },
      { id: 't7', name: 'apply_treatment',description: 'Schedule field treatment',             sensitivity: 'high',     requiresApproval: true  },
      { id: 't8', name: 'write_report',   description: 'Write to agricultural registry',       sensitivity: 'critical', requiresApproval: true  },
    ]
  },
  {
    id: 'tp-fintech', name: 'FinTech Core', description: 'Financial automation tools', domain: 'fintech',
    tools: [
      { id: 't9',  name: 'analyze',        description: 'Analyze financial data',          sensitivity: 'low',      requiresApproval: false },
      { id: 't10', name: 'detect_fraud',   description: 'Flag suspicious transactions',    sensitivity: 'medium',   requiresApproval: false },
      { id: 't11', name: 'generate_report',description: 'Generate financial report',       sensitivity: 'medium',   requiresApproval: false },
      { id: 't12', name: 'execute_transfer',description: 'Execute financial transfer',     sensitivity: 'critical', requiresApproval: true  },
    ]
  },
]

export const POLICY_PRESETS: PolicyPreset[] = [
  { id: 'pp-low',    name: 'Permissive', level: 'low',    strictness: 1, description: 'Allow most actions, minimal approvals' },
  { id: 'pp-medium', name: 'Balanced',   level: 'medium', strictness: 3, description: 'Block critical, approval for high-risk tools' },
  { id: 'pp-strict', name: 'Strict',     level: 'strict', strictness: 5, description: 'Maximum governance, all sensitive tools need approval' },
]

// DOMAIN_PROFILES, TOOL_PACKS, and POLICY_PRESETS are static config used by the Builder.
// Runs and Approvals are fetched from the real backend — see runStore.ts.
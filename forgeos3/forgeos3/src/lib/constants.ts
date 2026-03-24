import type { DomainProfileConfig, ToolPack, PolicyPreset } from '../types/agent'
import type { Run } from '../types/run'
import type { ApprovalRequest } from '../types/approval'

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

export const MOCK_RUNS: Run[] = [
  {
    id: 'run-001', agentId: 'ag-1', agentName: 'HealthAgent Alpha', domain: 'healthtech',
    status: 'finished', input: 'Summarize patient intake form #4821 and create follow-up checklist',
    loopRiskScore: 12, startedAt: new Date(Date.now() - 300000).toISOString(),
    finishedAt: new Date(Date.now() - 60000).toISOString(),
    toolEvents: [
      { id: 'te-1', runId: 'run-001', toolName: 'summarize',    decision: 'allowed',  input: {}, riskScore: 5,  timestamp: new Date(Date.now() - 280000).toISOString(), durationMs: 1200 },
      { id: 'te-2', runId: 'run-001', toolName: 'checklist',    decision: 'allowed',  input: {}, riskScore: 8,  timestamp: new Date(Date.now() - 200000).toISOString(), durationMs: 800  },
      { id: 'te-3', runId: 'run-001', toolName: 'diagnose',     decision: 'blocked',  input: {}, riskScore: 12, timestamp: new Date(Date.now() - 120000).toISOString(), reason: 'Diagnosis tools blocked in healthtech domain by policy' },
    ]
  },
  {
    id: 'run-002', agentId: 'ag-2', agentName: 'AgroBot Prime', domain: 'agrotech',
    status: 'waiting_approval', input: 'Analyze crop sensor data for field #22 and schedule treatment if needed',
    loopRiskScore: 34, startedAt: new Date(Date.now() - 120000).toISOString(),
    toolEvents: [
      { id: 'te-4', runId: 'run-002', toolName: 'analyze_crop',    decision: 'allowed',           input: {}, riskScore: 10, timestamp: new Date(Date.now() - 110000).toISOString(), durationMs: 600 },
      { id: 'te-5', runId: 'run-002', toolName: 'predict_yield',   decision: 'allowed',           input: {}, riskScore: 18, timestamp: new Date(Date.now() - 90000).toISOString(),  durationMs: 400 },
      { id: 'te-6', runId: 'run-002', toolName: 'apply_treatment', decision: 'approval_required', input: { field: '#22', treatment: 'pesticide_b', area_ha: 4.5 }, riskScore: 34, timestamp: new Date(Date.now() - 30000).toISOString() },
    ]
  },
  {
    id: 'run-003', agentId: 'ag-3', agentName: 'FinAgent', domain: 'fintech',
    status: 'finished', input: 'Analyze Q1 transactions and generate fraud risk report',
    loopRiskScore: 20, startedAt: new Date(Date.now() - 600000).toISOString(),
    finishedAt: new Date(Date.now() - 400000).toISOString(),
    toolEvents: [
      { id: 'te-7', runId: 'run-003', toolName: 'analyze',         decision: 'allowed',           input: {}, riskScore: 5,  timestamp: new Date(Date.now() - 580000).toISOString(), durationMs: 900  },
      { id: 'te-8', runId: 'run-003', toolName: 'detect_fraud',    decision: 'allowed',           input: {}, riskScore: 10, timestamp: new Date(Date.now() - 540000).toISOString(), durationMs: 2100 },
      { id: 'te-9', runId: 'run-003', toolName: 'execute_transfer',decision: 'approval_required', input: { account: 'ACC-9921', amount: 15000, currency: 'MXN' }, riskScore: 20, timestamp: new Date(Date.now() - 500000).toISOString() },
    ]
  },
]

export const MOCK_APPROVALS: ApprovalRequest[] = [
  {
    id: 'apr-001', runId: 'run-002', agentId: 'ag-2', agentName: 'AgroBot Prime',
    domain: 'agrotech', toolName: 'apply_treatment', status: 'pending',
    reason: 'Applying field treatment requires human approval per AgroTech safety policy',
    payload: { field: '#22', treatment: 'pesticide_b', area_ha: 4.5, scheduled_date: '2025-03-15' },
    createdAt: new Date(Date.now() - 30000).toISOString(), waitingMs: 30000,
  },
  {
    id: 'apr-002', runId: 'run-003', agentId: 'ag-3', agentName: 'FinAgent',
    domain: 'fintech', toolName: 'execute_transfer', status: 'approved',
    reason: 'Financial transfers above threshold require approval',
    payload: { account: 'ACC-9921', amount: 15000, currency: 'MXN' },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    reviewedBy: 'admin@forgeos3.dev', reviewedAt: new Date(Date.now() - 3500000).toISOString(),
  },
  {
    id: 'apr-003', runId: 'run-004', agentId: 'ag-1', agentName: 'HealthAgent Alpha',
    domain: 'healthtech', toolName: 'write_record', status: 'rejected',
    reason: 'Writing to patient record requires approval',
    payload: { patientId: '4821', field: 'notes', value: 'Follow-up scheduled' },
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    reviewedBy: 'admin@forgeos3.dev', reviewedAt: new Date(Date.now() - 7100000).toISOString(),
  },
]
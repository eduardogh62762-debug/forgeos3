export type Domain = 'healthtech' | 'agrotech' | 'fintech'

export interface Message {
  id:       string
  role:     'user' | 'agent'
  content:  string
  ts:       number
  loading?: boolean
  thoughts?: string
  artifacts?: Array<{
    id: string
    type: 'ticket' | 'map' | 'table' | 'report'
    title: string
    data: any
  }>
}

export interface GovernanceEvent {
  id:        string
  toolName:  string
  decision:  'allowed' | 'blocked' | 'approval_required'
  reason?:   string
  ts:        number
}

export interface AgentConfig {
  id:          string
  name:        string
  domain:      Domain
  agentId:     string
  color:       string
  icon:        string
  tagline:     string
  description: string
  examples:    string[]
}

export const AGENTS: AgentConfig[] = [
  {
    id:          'health-agent',
    name:        'HealthAgent Alpha',
    domain:      'healthtech',
    agentId:     'a1d50d7a-5525-4ed7-be87-1f82d85f2213',
    color:       '#00d084',
    icon:        '♥',
    tagline:     'Clinical documentation',
    description: 'Summarizes patient intake, generates follow-up checklists, and assists clinical workflows. Critical actions require human approval.',
    examples: [
      'Summarize patient intake form #4821',
      'Create a follow-up checklist for post-op recovery',
      'Review symptoms: fever 38.5°C, fatigue, 3 days',
    ]
  },
  {
    id:          'agro-agent',
    name:        'AgroBot Prime',
    domain:      'agrotech',
    agentId:     '13dc50b6-be94-4555-856a-54cc9cde997a',
    color:       '#7fc943',
    icon:        '⬡',
    tagline:     'Precision agriculture',
    description: 'Analyzes IoT sensor data, predicts harvest yields, recommends treatments. All field actions require authorization.',
    examples: [
      'Analyze crop sensor data for field #22',
      'Predict yield for the north sector',
      'Soil moisture 34% — recommend treatment',
    ]
  },
  {
    id:          'fin-agent',
    name:        'FinAgent',
    domain:      'fintech',
    agentId:     '9b7b152c-38fe-4252-8a06-c5b9c982c8cc',
    color:       '#f5a623',
    icon:        '◈',
    tagline:     'Financial analysis',
    description: 'Detects fraud, analyzes transactions, generates compliance reports. All transfers frozen pending authorization.',
    examples: [
      'Analyze Q1 transactions for ACC-9921',
      'Flag suspicious activity in the last 30 days',
      'Generate fraud risk report for this portfolio',
    ]
  },
]

import { create } from 'zustand'
import type { Agent } from '../types/agent'

const MOCK_AGENTS: Agent[] = [
  {
    id: 'ag-1',
    name: 'HealthAgent Alpha',
    description: 'Patient intake and documentation',
    runtime: 'openclaw',
    domainProfile: 'healthtech',
    toolPackId: 'tp-healthtech',
    policyPresetId: 'pp-strict',
    riskMode: 'safe',
    requiresApprovalFor: ['diagnose', 'write_record'],
    status: 'active',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'ag-2',
    name: 'AgroBot Prime',
    description: 'Crop monitoring and agricultural automation',
    runtime: 'openclaw',
    domainProfile: 'agrotech',
    toolPackId: 'tp-agrotech',
    policyPresetId: 'pp-medium',
    riskMode: 'safe',
    requiresApprovalFor: ['apply_treatment', 'write_report'],
    status: 'active',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'ag-3',
    name: 'FinAgent',
    description: 'Financial analysis and fraud detection',
    runtime: 'openclaw',
    domainProfile: 'fintech',
    toolPackId: 'tp-fintech',
    policyPresetId: 'pp-medium',
    riskMode: 'normal',
    requiresApprovalFor: ['execute_transfer'],
    status: 'active',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
]

interface AgentState {
  agents: Agent[]
  selectedAgent: Agent | null
  loading: boolean
  error: string | null
  fetchAgents: () => Promise<void>
  setSelectedAgent: (agent: Agent | null) => void
  addAgent: (agent: Agent) => void
  clearError: () => void
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: MOCK_AGENTS,
  selectedAgent: null,
  loading: false,
  error: null,

  fetchAgents: async () => {
    set({ loading: true, error: null })
    try {
      await new Promise(r => setTimeout(r, 600))

      // TODO Día 3: reemplazar por llamada real
      // const { data } = await api.get('/api/agents')
      // set({ agents: data.data, loading: false })

      set({ agents: MOCK_AGENTS, loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch agents'
      set({ error: message, loading: false })
    }
  },

  setSelectedAgent: (agent) => set({ selectedAgent: agent }),

  addAgent: (agent) => set((s) => ({ agents: [agent, ...s.agents] })),

  clearError: () => set({ error: null }),
}))

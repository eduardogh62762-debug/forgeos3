import { create } from 'zustand'
import type { Agent } from '../types/agent'
import api from '../lib/api'

interface AgentState {
  agents: Agent[]
  selectedAgent: Agent | null
  loading: boolean
  error: string | null
  fetchAgents: () => Promise<void>
  createAgent: (payload: Omit<Agent, 'id' | 'createdAt'>) => Promise<void>
  setSelectedAgent: (agent: Agent | null) => void
  addAgent: (agent: Agent) => void
  clearError: () => void
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: [],
  selectedAgent: null,
  loading: false,
  error: null,

  fetchAgents: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.get<{ data: Agent[] }>('/api/agents')
      set({ agents: data.data, loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch agents'
      set({ error: message, loading: false })
    }
  },

  createAgent: async (payload) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post<{ data: Agent }>('/api/agents', payload)
      set((s) => ({ agents: [data.data, ...s.agents], loading: false }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create agent'
      set({ error: message, loading: false })
      throw err
    }
  },

  setSelectedAgent: (agent) => set({ selectedAgent: agent }),

  addAgent: (agent) => set((s) => ({ agents: [agent, ...s.agents] })),

  clearError: () => set({ error: null }),
}))

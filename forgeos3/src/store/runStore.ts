import { create } from 'zustand'
import type { Run } from '../types/run'
import type { ApprovalRequest } from '../types/approval'
import { MOCK_RUNS, MOCK_APPROVALS } from '../lib/constants'

interface RunState {
  runs: Run[]
  selectedRun: Run | null
  approvals: ApprovalRequest[]
  loading: boolean
  loadingApprovals: boolean
  error: string | null
  fetchRuns: () => Promise<void>
  fetchApprovals: () => Promise<void>
  setSelectedRun: (run: Run | null) => void
  resolveApproval: (id: string, decision: 'approved' | 'rejected') => void
  clearError: () => void
}

export const useRunStore = create<RunState>((set) => ({
  runs: MOCK_RUNS,
  selectedRun: MOCK_RUNS[1],
  approvals: MOCK_APPROVALS,
  loading: false,
  loadingApprovals: false,
  error: null,

  fetchRuns: async () => {
    set({ loading: true, error: null })
    try {
      await new Promise(r => setTimeout(r, 600))

      // TODO Día 3: reemplazar por llamada real
      // const { data } = await api.get('/api/runs')
      // set({ runs: data.data, loading: false })

      set({ runs: MOCK_RUNS, loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch runs'
      set({ error: message, loading: false })
    }
  },

  fetchApprovals: async () => {
    set({ loadingApprovals: true, error: null })
    try {
      await new Promise(r => setTimeout(r, 600))

      // TODO Día 3: reemplazar por llamada real
      // const { data } = await api.get('/api/approvals')
      // set({ approvals: data.data, loadingApprovals: false })

      set({ approvals: MOCK_APPROVALS, loadingApprovals: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch approvals'
      set({ error: message, loadingApprovals: false })
    }
  },

  setSelectedRun: (run) => set({ selectedRun: run }),

  resolveApproval: (id, decision) => set((s) => ({
    approvals: s.approvals.map(a =>
      a.id === id
        ? { ...a, status: decision, reviewedBy: 'admin@forgeos3.dev', reviewedAt: new Date().toISOString() }
        : a
    ),
  })),

  clearError: () => set({ error: null }),
}))

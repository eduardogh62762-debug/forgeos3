import { create } from 'zustand'
import type { Run, ToolEvent } from '../types/run'
import type { ApprovalRequest } from '../types/approval'
import api from '../lib/api'

interface RunState {
  runs: Run[]
  selectedRun: Run | null
  approvals: ApprovalRequest[]
  // loading aliases — algunos componentes usan runsLoading/runsError
  loading: boolean
  runsLoading: boolean
  loadingApprovals: boolean
  error: string | null
  runsError: string | null
  // acciones
  fetchRuns: () => Promise<void>
  fetchApprovals: () => Promise<void>
  fetchRunToolEvents: (runId: string) => Promise<void>
  setSelectedRun: (run: Run | null) => void
  resolveApproval: (id: string, decision: 'approved' | 'rejected') => Promise<void>
  clearError: () => void
}

export const useRunStore = create<RunState>((set, get) => ({
  runs: [],
  selectedRun: null,
  approvals: [],
  loading: false,
  runsLoading: false,
  loadingApprovals: false,
  error: null,
  runsError: null,

  fetchRuns: async () => {
    set({ loading: true, runsLoading: true, error: null, runsError: null })
    try {
      const { data } = await api.get<{ data: Run[] }>('/api/runs')
      const runs = data.data
      const current = get().selectedRun
      set({
        runs,
        selectedRun: current ? runs.find(r => r.id === current.id) ?? runs[0] ?? null : runs[0] ?? null,
        loading: false,
        runsLoading: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch runs'
      set({ error: message, runsError: message, loading: false, runsLoading: false })
    }
  },

  fetchApprovals: async () => {
    set({ loadingApprovals: true, error: null })
    try {
      const { data } = await api.get<{ data: ApprovalRequest[] }>('/api/approvals')
      set({ approvals: data.data, loadingApprovals: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch approvals'
      set({ error: message, loadingApprovals: false })
    }
  },

  // Refresca los toolEvents de un run específico desde GET /api/runs/:id/tools
  fetchRunToolEvents: async (runId: string) => {
    try {
      const { data } = await api.get<{ data: ToolEvent[] }>(`/api/runs/${runId}/tools`)
      const toolEvents: ToolEvent[] = data.data
      set((s) => ({
        runs: s.runs.map(r => r.id === runId ? { ...r, toolEvents } : r),
        selectedRun: s.selectedRun?.id === runId
          ? { ...s.selectedRun, toolEvents }
          : s.selectedRun,
      }))
    } catch {
      // silencioso — no sobreescribir errores globales por polling
    }
  },

  setSelectedRun: (run) => set({ selectedRun: run }),

  // Resuelve approval contra POST /api/approvals/resolve (con optimistic update)
  resolveApproval: async (id, decision) => {
    // Optimistic update inmediato
    set((s) => ({
      approvals: s.approvals.map(a =>
        a.id === id
          ? { ...a, status: decision, reviewedBy: 'admin@forgeos3.dev', reviewedAt: new Date().toISOString() }
          : a
      ),
    }))
    try {
      await api.post(`/api/approvals/resolve`, { id, decision })
    } catch (err) {
      // Si falla la API, revertimos el estado optimista
      const message = err instanceof Error ? err.message : 'Failed to resolve approval'
      set((s) => ({
        approvals: s.approvals.map(a =>
          a.id === id ? { ...a, status: 'pending', reviewedBy: undefined, reviewedAt: undefined } : a
        ),
        error: message,
      }))
    }
  },

  clearError: () => set({ error: null, runsError: null }),
}))

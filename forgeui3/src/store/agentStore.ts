import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Message, GovernanceEvent, Domain } from '../types'

interface AgentState {
  domain:      Domain | null
  messages:    Message[]
  govEvents:   GovernanceEvent[]
  running:     boolean
  runId:       string | null
  lang:        'ESP' | 'ENG' | 'NHN'

  setDomain:   (d: Domain) => void
  setLang:     (l: 'ESP' | 'ENG' | 'NHN') => void
  addMessage:  (m: Message) => void
  updateLast:  (content: string, thoughts?: string, artifacts?: Message['artifacts']) => void
  addGovEvent: (e: GovernanceEvent) => void
  setRunning:  (v: boolean) => void
  setRunId:    (id: string | null) => void
  clear:       () => void
  isFullscreen: boolean
  setIsFullscreen: (v: boolean) => void
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set) => ({
      domain:    null,
      messages:  [],
      govEvents: [],
      running:   false,
      runId:     null,
      lang:      'ESP',

      setDomain:   (domain)  => set({ domain }),
      setLang:     (lang)    => set({ lang }),
      addMessage:  (m)       => set(s => ({ messages:  [...s.messages,  m] })),
      updateLast:  (content: string, thoughts?: string, artifacts?: Message['artifacts']) => set(s => {
        const msgs = [...s.messages]
        const lastIdx = msgs.length - 1
        if (lastIdx >= 0) {
          const updatedMsg = { 
            ...msgs[lastIdx], 
            content, 
            loading: false,
          }
          if (thoughts !== undefined) updatedMsg.thoughts = thoughts
          if (artifacts !== undefined) updatedMsg.artifacts = artifacts
          msgs[lastIdx] = updatedMsg
        }
        return { messages: msgs }
      }),
      addGovEvent: (e)       => set(s => ({ govEvents: [...s.govEvents, e] })),
      setRunning:  (running) => set({ running }),
      setRunId:    (runId)   => set({ runId }),
      clear:       ()        => set({ messages: [], govEvents: [], runId: null, running: false }),
      isFullscreen: false,
      setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
    }),
    {
      name: 'forge-agent-storage',
      partialize: (state) => ({
        domain:    state.domain,
        messages:  state.messages,
        govEvents: state.govEvents,
        lang:      state.lang,
        runId:     state.runId,
      }),
    }
  )
)

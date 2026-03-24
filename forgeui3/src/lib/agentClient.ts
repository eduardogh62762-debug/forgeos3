import type { Domain } from '../types'

export interface AgentRunOptions {
  domain:    Domain
  agentId:   string
  agentName: string
  input:     string
  onToken:   (chunk: string, thoughts?: string, artifacts?: any[]) => void
  onGovEvent:(event: { toolName: string; decision: string; reason?: string }) => void
  onDone:    (output: string) => void
  onError:   (msg: string) => void
}

function tryParseJson(str: string) {
  try { return JSON.parse(str) }
  catch { return str }
}

const AGENT_BASE = import.meta.env.VITE_AGENT_URL || 'http://localhost:4000'

export async function runAgent(opts: AgentRunOptions) {
  const { domain, agentId, agentName, input, onToken, onGovEvent, onDone, onError } = opts

  try {
    const response = await fetch(`${AGENT_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, agentId, agentName, input })
    })

    if (!response.ok) {
      throw new Error(`Agent Server Error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No readable stream')
    
    const decoder = new TextDecoder()
    let buffer = ''
    let fullResponse = ''
    let thoughts = ''
    let artifacts: any[] = []

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (!line.startsWith('event: ')) continue
        
        const eventType = line.slice(7).trim()
        const dataLine = lines[++i]
        
        if (!dataLine || !dataLine.startsWith('data: ')) continue
        
        const rawData = dataLine.slice(6).trim()
        if (!rawData) continue
        
        try {
          const evtData = JSON.parse(rawData)
          
          if (eventType === 'token') {
            const token = evtData.text || ''
            fullResponse += token
            
            // Real-time parsing of thoughts and artifacts
            // This is a simplified regex-based extractor for streaming
            const thoughtMatch = fullResponse.match(/<thought>([\s\S]*?)<\/thought>/)
            if (thoughtMatch) {
              thoughts = thoughtMatch[1]
            } else if (fullResponse.includes('<thought>')) {
              thoughts = fullResponse.split('<thought>')[1]
            }

            // Extract artifacts (assuming JSON inside <artifact> tags)
            const artifactMatches = [...fullResponse.matchAll(/<artifact type="([^"]+)" title="([^"]+)">([\s\S]*?)<\/artifact>/g)]
            artifacts = artifactMatches.map(m => ({
              id: Math.random().toString(36).slice(2),
              type: m[1],
              title: m[2],
              data: tryParseJson(m[3])
            }))

            // Clean content (strip tags for the main display)
            let cleanContent = fullResponse
              .replace(/<thought>[\s\S]*?<\/thought>/g, '')
              .replace(/<thought>[\s\S]*/g, '')
              .replace(/<artifact[\s\S]*?<\/artifact>/g, '')
              .trim()

            onToken(cleanContent, thoughts, artifacts)
          } else if (eventType === 'gov_event') {
            onGovEvent(evtData)
          } else if (eventType === 'error') {
            onError(evtData.message || 'Unknown stream error')
          } else if (eventType === 'done') {
            // Final cleanup
            onDone(fullResponse)
          }
        } catch (e) {
          console.error("Failed to parse SSE data", rawData, e)
        }
      }
    }
  } catch (err) {
    onError(err instanceof Error ? err.message : 'Connection to Agent Server lost')
  }
}

import Anthropic from "@anthropic-ai/sdk"
import { TOOLS, TOOL_HANDLERS } from "../tools/registry"
import { 
  startRun, 
  beforeToolCall, 
  afterToolCall, 
  requestApproval, 
  finishRun, 
  log 
} from "../adapter/openclawAdapter"

interface ExecuteOptions {
  agentId: string
  agentName: string
  domain: string
  input: string
  onToken: (text: string) => void
  onGovEvent: (event: any) => void
}

export class AgentExecutor {
  private anthropic: Anthropic

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }

  async execute(options: ExecuteOptions) {
    const { agentId, agentName, domain, input, onToken, onGovEvent } = options
    let runId: string | null = null
    let messages: any[] = [{ role: "user", content: input }]
    let loopCount = 0
    const maxLoops = 5

    try {
      const run = await startRun(agentId, input)
      runId = run.id

      while (loopCount < maxLoops) {
        loopCount++
        
        const response = await this.anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          system: this.getSystemPrompt(domain),
          messages,
          tools: TOOLS[domain] as any,
          stream: true,
        })

        let fullText = ""
        let toolCalls: any[] = []

        for await (const chunk of response) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            const text = chunk.delta.text
            fullText += text
            onToken(text)
          }
          if (chunk.type === "content_block_start" && chunk.content_block.type === "tool_use") {
            toolCalls.push({ 
              id: chunk.content_block.id, 
              name: chunk.content_block.name, 
              input: {} 
            })
          }
          if (chunk.type === "content_block_delta" && chunk.delta.type === "input_json_delta") {
            const lastCall = toolCalls[toolCalls.length - 1]
            lastCall.partialInput = (lastCall.partialInput || "") + chunk.delta.partial_json
          }
        }

        // Finalize tool call inputs
        toolCalls = toolCalls.map(tc => ({
          ...tc,
          input: JSON.parse(tc.partialInput || "{}")
        }))

        // If no tool calls, we are done
        if (toolCalls.length === 0) {
          await finishRun(runId, "finished", fullText)
          break
        }

        // Handle tool calls with Governance
        const toolResults: any[] = []
        messages.push({ role: "assistant", content: [{ type: "text", text: fullText || "Using tools..." }, ...toolCalls.map(tc => ({ type: "tool_use", id: tc.id, name: tc.name, input: tc.input }))] })

        for (const tc of toolCalls) {
          const start = Date.now()
          log("🛠️", `Agent wants to use "${tc.name}"`, "#f59e0b" as any)
          
          // 1. Governance PRERUN
          const decision = await beforeToolCall(runId!, tc.name, domain, tc.input)
          onGovEvent({ toolName: tc.name, decision, reason: "Evaluated by ForgeOS3 Executor" })

          let toolOutput: any = null

          if (decision === "allowed") {
            toolOutput = await this.runTool(tc.name, tc.input)
            await afterToolCall(runId!, tc.name, { status: "success", result: toolOutput }, Date.now() - start)
          } 
          else if (decision === "approval_required") {
            onToken(`\n\n⏳ Tool "${tc.name}" requires administrator approval...`)
            const approved = await requestApproval(runId!, tc.name, `Human approval required for ${tc.name}`, {
              agentId, agentName, domain, payload: tc.input
            })

            if (approved) {
              onToken(`\n✅ Approved. Executing...`)
              toolOutput = await this.runTool(tc.name, tc.input)
              await afterToolCall(runId!, tc.name, { status: "approved_and_executed", result: toolOutput }, Date.now() - start)
            } else {
              onToken(`\n❌ Blocked by administrator.`)
              toolOutput = { error: "Action blocked by human operator." }
              await afterToolCall(runId!, tc.name, { status: "rejected", result: toolOutput }, Date.now() - start)
            }
          }
          else {
            onToken(`\n🚫 Blocked by policy engine.`)
            toolOutput = { error: "Action blocked by automated policy." }
            await afterToolCall(runId!, tc.name, { status: "blocked", result: toolOutput }, Date.now() - start)
          }

          toolResults.push({
            type: "tool_result",
            tool_use_id: tc.id,
            content: JSON.stringify(toolOutput)
          })
        }

        messages.push({ role: "user", content: toolResults })
        // Continue loop to process tool output
      }

    } catch (err: any) {
      log("🛑", `Executor Error: ${err.message}`, "#ef4444" as any)
      if (runId) await finishRun(runId, "blocked", err.message).catch(() => {})
      throw err
    }
  }

  private async runTool(name: string, input: any) {
    if (name === "consult_expert") {
      log("🤝", `Internal Consultation: ${input.expertDomain}...`, "#8b5cf6" as any)
      return {
        expertResponse: `[Expert ${input.expertDomain}] Based on your query "${input.query}", our recommendation is to proceed with caution and ensure all safety protocols are met. Integration between ${input.expertDomain} and our current domain is feasible but requires careful monitoring.`,
        consultationId: `cons_${Math.random().toString(36).slice(2)}`
      }
    }
    const handler = TOOL_HANDLERS[name]
    if (!handler) return { error: `Tool ${name} not found in registry.` }
    try {
      return await handler(input)
    } catch (err: any) {
      return { error: err.message }
    }
  }

  private getSystemPrompt(domain: string): string {
    const base = "You are a professional AI assistant governed by ForgeOS3. You have access to specialized tools."
    const domainPrompts: Record<string, string> = {
      healthtech: "Focus on clinical accuracy and patient privacy.",
      agrotech: "Focus on sensor data and agronomic recommendations.",
      fintech: "Focus on fraud detection and transaction compliance."
    }
    return `${base} ${domainPrompts[domain] || ""}`
  }
}
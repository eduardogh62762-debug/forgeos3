import "dotenv/config"
import express from "express"
import cors from "cors"
import Anthropic from "@anthropic-ai/sdk"
import { startRun, beforeToolCall, afterToolCall, requestApproval, evaluateLoop, finishRun, log } from "./adapter/openclawAdapter"

import { AgentExecutor } from "./runtime/executor"

const app = express()
app.use(cors())
app.use(express.json())

const executor = new AgentExecutor()

// Health check endpoint for UI live status monitoring
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    adapter: 'openclaw_v1',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
})

app.post("/api/chat", async (req, res) => {
  const { domain, agentId, agentName, input } = req.body

  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")
  res.setHeader("Access-Control-Allow-Origin", "*")

  const sendEvent = (type: string, data: any) => {
    res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  try {
    await executor.execute({
      agentId,
      agentName,
      domain,
      input,
      onToken: (text) => sendEvent("token", { text }),
      onGovEvent: (event) => sendEvent("gov_event", event),
    })

    sendEvent("done", { fullOutput: "Execution finished." })
    res.end()

  } catch (err: any) {
    sendEvent("error", { message: err.message || "Unknown error" })
    res.end()
  }
})


const PORT = 4000
app.listen(PORT, () => {
  log("🚀", `ForgeOS3 Agent Server running on http://localhost:${PORT}`)
})

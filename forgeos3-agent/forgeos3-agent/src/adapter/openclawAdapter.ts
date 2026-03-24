import axios from "axios"
import "dotenv/config"
import { createClient } from "@supabase/supabase-js"

const API_URL = process.env.VITE_API_URL || process.env.FORGEOS3_API_URL || "https://forgeos3-production.up.railway.app"
const API_KEY  = process.env.AGENT_API_KEY || ""

export const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || ""
)

// ─── COLORES ────────────────────────────────────────────────────────────────
export const c = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  cyan: "\x1b[36m", green: "\x1b[32m", yellow: "\x1b[33m",
  red: "\x1b[31m", magenta: "\x1b[35m", blue: "\x1b[34m",
}

export function log(icon: string, msg: string, color = c.cyan) {
  const ts = new Date().toLocaleTimeString("es-MX", { hour12: false })
  console.log(`${c.dim}[${ts}]${c.reset} ${color}${c.bold}${icon}${c.reset} ${msg}`)
}

export function logSection(title: string) {
  console.log(`\n${c.magenta}${"═".repeat(58)}${c.reset}`)
  console.log(`${c.bold}${c.magenta}  ${title}${c.reset}`)
  console.log(`${c.magenta}${"═".repeat(58)}${c.reset}\n`)
}

function headers() {
  return API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// ─── START RUN ───────────────────────────────────────────────────────────────
export async function startRun(agent: string, input: string): Promise<{ id: string }> {
  try {
    const res = await axios.post(`${API_URL}/api/runs/start`,
      { agentId: agent, agentName: agent, domain: inferDomain(agent), input },
      { timeout: 4000, headers: headers() }
    )
    log("🚀", `Starting run: ${agent}`, c.cyan)
    log("🟢", `Run registered in DB → id: ${res.data.id}`, c.green)
    return { id: res.data.id }
  } catch (err) {
    log("🛑", `Failed to start run with ForgeOS3: ${err}`, c.red)
    throw new Error('ForgeOS3 API unavailable - startRun failed')
  }
}

// ─── BEFORE TOOL CALL ────────────────────────────────────────────────────────
// Regresa: "allowed" | "blocked" | "approval_required"
export async function beforeToolCall(
  runId: string,
  toolName: string,
  domain: string,
  input: Record<string, unknown> = {}
): Promise<"allowed" | "blocked" | "approval_required"> {
  const start = Date.now()
  try {
    const res = await axios.post(`${API_URL}/api/tools/evaluate`,
      { runId, toolName, domain, input },
      { timeout: 4000, headers: headers() }
    )
    const decision: string = res.data.decision
    const ms = Date.now() - start
    printToolDecision(toolName, decision, res.data.reason, ms, "real")
    return decision as any
  } catch (err) {
    log("🛑", `Failed to evaluate tool: ${err}`, c.red)
    throw new Error('ForgeOS3 API unavailable - beforeToolCall failed')
  }
}

// ─── AFTER TOOL CALL ─────────────────────────────────────────────────────────
export async function afterToolCall(
  runId: string,
  toolName: string,
  output: unknown,
  durationMs: number
): Promise<void> {
  try {
    await axios.post(`${API_URL}/api/tools/log`,
      { runId, toolName, output, durationMs },
      { timeout: 4000, headers: headers() }
    )
    log("📝", `Tool result logged (real) — ${toolName} (${durationMs}ms)`, c.dim as any)
  } catch (err) {
    log("🛑", `Failed to log tool: ${err}`, c.red)
    throw new Error('ForgeOS3 API unavailable - afterToolCall failed')
  }
}

// ─── REQUEST APPROVAL (polling) ──────────────────────────────────────────────
export async function requestApproval(
  runId: string,
  toolName: string,
  reason: string,
  meta: { agentId: string; agentName: string; domain: string; payload?: Record<string, unknown> } = { agentId: '', agentName: 'agent', domain: 'custom' }
): Promise<boolean> {
  log("⏳", `Approval required for "${toolName}"`, c.yellow)
  console.log(`${c.dim}   Reason: ${reason}${c.reset}`)

  try {
    const createRes = await axios.post(`${API_URL}/api/approvals/request`,
      {
        runId,
        toolName,
        reason,
        agentId:   meta.agentId,
        agentName: meta.agentName,
        domain:    meta.domain,
        payload:   meta.payload ?? {},
      },
      { timeout: 4000, headers: headers() }
    )
    const approvalId = createRes.data.id
    log("⏳", `Waiting for operator decision... (id: ${approvalId})`, c.yellow)

    // Notify External (Pro Feature)
    try {
      log("📱", "Sending External Notification to Mobile Operator...", "#3b82f6" as any)
      // Simulate real hook call
      await axios.post("https://webhook.site/dummy-hook", { 
        event: "APPROVAL_REQUIRED", 
        agent: meta.agentName, 
        tool: toolName, 
        id: approvalId 
      }).catch(() => {}) 
    } catch {}

    for (let i = 0; i < 20; i++) {
      await sleep(3000)
      const res = await axios.get(`${API_URL}/api/approvals/${approvalId}`,
        { timeout: 4000, headers: headers() }
      )
      if (res.data.status === "approved") {
        log("✅", `Approval GRANTED for "${toolName}" — continuing run`, c.green)
        return true
      }
      if (res.data.status === "rejected") {
        log("❌", `Approval REJECTED for "${toolName}" — run will be blocked`, c.red)
        return false
      }
      log("⏳", `Still waiting... (attempt ${i + 1}/20)`, c.dim as any)
    }
    log("⚠️", `Approval timeout — defaulting to DENY (safe mode)`, c.red)
    return false

  } catch (err) {
    log("🛑", `Approval failed entirely: ${err}`, c.red)
    return false
  }
}

// ─── EVALUATE LOOP ───────────────────────────────────────────────────────────
export async function evaluateLoop(runId: string): Promise<{ score: number; action: "normal" | "safe_mode" | "kill" }> {
  try {
    const res = await axios.post(`${API_URL}/api/risk/evaluate-loop`,
      { runId },
      { timeout: 4000, headers: headers() }
    )
    const { score, recommendation } = res.data
    printLoopScore(score, recommendation, "real")
    return { score, action: recommendation }
  } catch (err) {
    log("🛑", `Loop evaluation failed securely: ${err}`, c.red)
    throw new Error('ForgeOS3 API unavailable - evaluateLoop failed')
  }
}

// ─── FINISH RUN ──────────────────────────────────────────────────────────────
export async function finishRun(
  runId: string,
  status: "finished" | "blocked" | "safe_mode",
  output?: string
): Promise<void> {
  try {
    await axios.post(`${API_URL}/api/runs/finish`,
      { runId, status, output },
      { timeout: 4000, headers: headers() }
    )
    printRunFinished(runId, status, "real")
  } catch (err) {
    log("🛑", `Finish run fallback failed securely: ${err}`, c.red)
  }
}

// ─── HELPERS VISUALES ────────────────────────────────────────────────────────
function inferDomain(agent: string): string {
  if (agent.includes("health")) return "healthtech"
  if (agent.includes("gov"))    return "agrotech"   // Maps GovTech to AgroTech domain in DB
  if (agent.includes("market")) return "fintech"
  return "custom"
}

function printToolDecision(tool: string, decision: string, reason: string, ms: number, mode: string) {
  if (decision === "allowed") {
    log("🔍", `Tool intent: ${tool} → ${c.green}✅ allowed${c.reset} (${ms}ms · ${mode})`)
  } else if (decision === "blocked") {
    log("🔍", `Tool intent: ${tool} → ${c.red}❌ blocked${c.reset} (${reason})`)
  } else {
    log("🔍", `Tool intent: ${tool} → ${c.yellow}⏳ approval_required${c.reset} (${reason})`)
  }
}

function printLoopScore(score: number, action: string, mode: string) {
  const filled = Math.round(score / 10)
  const bar    = `[${"█".repeat(filled)}${"░".repeat(10 - filled)}]`
  const color  = score >= 50 ? c.red : score >= 30 ? c.yellow : c.green
  const status = action === "kill"      ? `${c.red}${c.bold}KILL — run terminated${c.reset}` :
                 action === "safe_mode" ? `${c.yellow}${c.bold}SAFE MODE activated${c.reset}` :
                                          `${c.green}normal${c.reset}`
  console.log(`${color}🔄 [Loop Guard / ${mode}]${c.reset} score: ${color}${score}/100${c.reset} ${bar} → ${status}`)
}

function printRunFinished(runId: string, status: string, mode: string) {
  const color = status === "finished" ? c.green : status === "safe_mode" ? c.yellow : c.red
  const icon  = status === "finished" ? "✅" : status === "safe_mode" ? "⚠️" : "🛑"
  log(icon, `Run finished (${mode}): ${runId.slice(0, 24)}... → ${color}${status}${c.reset}`)
}

<div align="center">

<img src="forgeos3/public/favicon.svg" alt="ForgeOS3" width="64" height="64" />

# ForgeOS3

### Runtime-Agnostic Infrastructure for Safe AI Agents

**Build once. Govern anywhere.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-f59e0b?style=flat-square)](LICENSE)

<br />

> Built at **AI Tinkerers Hackathon · Durango, Mexico 2025**

</div>

---

## What is ForgeOS3?

ForgeOS3 is **not another agent runtime**. It is a reusable infrastructure layer that sits on top of existing agent frameworks and makes them safe, auditable, and production-ready.

While frameworks like LangGraph, AutoGen, and CrewAI focus on *how* agents think, ForgeOS3 focuses on *what* they're allowed to do — and ensures every decision is enforced, logged, and explainable.

```
[ Your Agent Runtime ]
        ↓
[ ForgeOS3 Infrastructure Layer ]
   Policy Engine · Tool Gateway · Loop Guard
   Approval Router · Sandbox · Audit Trail
        ↓
[ Supabase · Event Log · Approval Queue ]
```

---

## Core Capabilities

| Module | Description |
|---|---|
| 🏗️ **Builder Console** | Create agents from reusable templates with domain profiles, tool packs and policy presets |
| 📦 **Registry Manager** | Centralized store of domain profiles, tool packs, policy configs and runtime adapters |
| ⚖️ **Policy Engine** | Evaluates every tool intent and returns `allowed`, `blocked`, or `approval_required` |
| 🔀 **Tool Gateway** | Intercept layer — every tool call passes through before execution |
| 🔁 **Loop Guard** | Detects runaway behavior, tracks loop risk scores, activates safe mode or kill switch |
| 🧱 **Sandbox Layer** | Isolated execution with timeouts, resource limits, network allowlist and secret scoping |
| 👁️ **Sentinel Studio** | Live dashboard of active runs, tool timelines and decision badges |
| 📋 **Audit Trail** | Full institutional record of runs, decisions, approvals and risk events |
| ✅ **Approvals Panel** | Human-in-the-loop workflow for sensitive tool calls |
| 🔌 **Runtime Adapters** | Connect to any agent framework — OpenClaw (live), LangGraph, AutoGen, CrewAI (planned) |

---

## Demo — One Agent, Three Governance Modes

The same agent behaves differently depending on its domain profile and policy preset.

**Scenario A — Health**
```
Input: "Summarize patient intake #4821 and create a follow-up checklist"

summarize      → ✅ allowed
checklist      → ✅ allowed
diagnose       → ❌ blocked  (critical sensitivity · strict policy)
```

**Scenario B — Gov**
```
Input: "Analyze public request #2291 and route to the right department"

classify       → ✅ allowed
route          → ✅ allowed
write_external → ⏳ approval required  (writes to municipal DB)
```

**Scenario C — Marketing**
```
Input: "Generate a campaign workflow and prepare a content draft"

summarize      → ✅ allowed
draft          → ✅ allowed
publish        → ⏳ approval required  (external channel publish)
```

**Scenario D — Loop Guard**
```
Same tool called repeatedly → risk score escalates → safe mode activated → kill switch
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   ForgeOS3 Web App                       │
│  Builder · Registry · Policy · Sentinel · Audit          │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP
┌──────────────────────────▼──────────────────────────────┐
│                  ForgeOS3 Core API                        │
│  Policy Engine · Tool Gateway · Loop Guard               │
│  Approval Router · Sandbox Layer · Audit & Event Log     │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│               Runtime Adapter Layer                       │
│  OpenClaw Adapter (live) · LangGraph · AutoGen (planned) │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                  Agent Runtime(s)                         │
│              OpenClaw · Custom Enterprise                 │
└─────────────────────────────────────────────────────────┘
```

---

## Repository Structure

```
forgeos3/                    ← Frontend (Cristian)
├── src/
│   ├── pages/               # 13 pages — Builder, Sentinel, Audit, etc
│   ├── components/          # UI system — Badge, Button, Card, Modal...
│   ├── store/               # Zustand — auth, agents, runs
│   └── types/               # Shared TypeScript types

forgeos3-backend/            ← API + Core Engine (Diego)
├── src/
│   ├── routes/              # REST endpoints
│   ├── engine/              # Policy, Gateway, LoopGuard, Audit, Sandbox
│   └── db/                  # Supabase client + seeds

forgeos3-agent/              ← OpenClaw Adapter (William)
├── src/
│   ├── adapter/             # RuntimeAdapter implementation
│   ├── scenarios/           # Health, Gov, Marketing demo scenarios
│   └── tools/               # Tool definitions per domain
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- A Supabase project
- OpenClaw installed

### 1. Clone
```bash
git clone https://github.com/diegoramirez772/forgeos3.git
cd forgeos3
```

### 2. Backend
```bash
cd forgeos3-backend
npm install
cp .env.example .env        # add your Supabase credentials
npm run dev                 # runs on http://localhost:3001
```

### 3. Frontend
```bash
cd forgeos3
npm install
cp .env.example .env        # set VITE_API_URL=http://localhost:3001
npm run dev                 # runs on http://localhost:5173
```

### 4. Agent
```bash
cd forgeos3-agent
npm install
cp .env.example .env        # set FORGEOS3_API_URL=http://localhost:3001
npm run demo:health         # run the Health scenario
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, Zustand, Framer Motion |
| Backend | Node.js, Express, TypeScript, Zod |
| Database | Supabase (PostgreSQL) |
| Agent Runtime | OpenClaw |
| Shared | TypeScript interfaces across all three projects |

---

## Team

| Role | Person |
|---|---|
| Backend · DB · Core Engine | Diego |
| Runtime · OpenClaw Adapter | William |
| Frontend · Dashboard · UI | Cristian |

---

## Roadmap

- [x] Frontend scaffold — all 13 pages built
- [x] Mock data layer — full demo with realistic data
- [ ] Supabase schema + seeds
- [ ] Core API endpoints
- [ ] Policy Engine logic
- [ ] OpenClaw Adapter integration
- [ ] Full end-to-end demo (4 scenarios)
- [ ] Deploy

---

<div align="center">

**ForgeOS3** · AI Tinkerers Hackathon · Durango, Mexico 2025

*We are not building another agent. We are building the infrastructure layer that makes agents safer, reusable, and production-ready across runtimes.*

</div>

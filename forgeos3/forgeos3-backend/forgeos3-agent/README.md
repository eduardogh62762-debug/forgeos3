# ForgeOS3 — Backend

API central de ForgeOS3. Expone todos los endpoints que consume el frontend y el agente. Contiene el Policy Engine, Tool Gateway, Loop Guard, Audit Layer y Sandbox Layer.

---

## Stack

- **Node.js** + **TypeScript**
- **Express** — servidor HTTP
- **Supabase** — base de datos (PostgreSQL)
- **Zod** — validación de payloads
- **dotenv** — variables de entorno

---

## Estructura

```
src/
├── routes/
│   ├── agents.ts        # CRUD de agentes
│   ├── runs.ts          # iniciar/finalizar runs
│   ├── tools.ts         # evaluate + log tool calls
│   ├── approvals.ts     # request + resolve approvals
│   └── registry.ts      # templates, profiles, packs, presets
├── engine/
│   ├── policyEngine.ts  # lógica allow/block/approval
│   ├── toolGateway.ts   # interceptor de tool calls
│   ├── loopGuard.ts     # detección de loops y risk score
│   ├── auditLayer.ts    # registro trazable de eventos
│   └── sandboxLayer.ts  # timeouts, recursos, red, secrets
├── db/
│   ├── supabase.ts      # cliente de Supabase
│   └── seeds.ts         # datos demo (dominios, tools, presets)
├── types/
│   ├── agent.ts
│   ├── run.ts
│   └── approval.ts
├── middleware/
│   ├── auth.ts          # verificación de API key / JWT
│   └── errorHandler.ts  # manejo global de errores
└── index.ts             # entry point
```

---

## Setup

```bash
cd forgeos3-backend
npm install
cp .env.example .env    # llenar con tus credenciales
npm run dev
```

El servidor corre en [http://localhost:3001](http://localhost:3001)

Verifica que funciona:
```bash
curl http://localhost:3001/health
# { "status": "ok", "service": "forgeos3-backend" }
```

---

## Variables de entorno

```
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
```

---

## API — Endpoints

### Registry
```
GET  /api/templates
GET  /api/domain-profiles
GET  /api/tool-packs
GET  /api/policy-presets
GET  /api/runtime-presets
```

### Agentes
```
POST /api/agents
GET  /api/agents
GET  /api/agents/:id
POST /api/agents/:id/deploy
```

### Runs
```
POST /api/runs/start
POST /api/runs/finish
GET  /api/runs
GET  /api/runs/:id
GET  /api/runs/:id/tools
```

### Tool Gateway + Policy Engine
```
POST /api/tools/evaluate    # recibe tool intent, devuelve allowed/blocked/approval_required
POST /api/tools/log         # registra el resultado de la ejecución
```

### Approvals
```
POST /api/approvals/request
POST /api/approvals/resolve
GET  /api/approvals
GET  /api/approvals/:id
```

### Loop Guard
```
POST /api/risk/evaluate-loop
```

---

## Base de datos — Tablas principales

| Tabla | Descripción |
|---|---|
| `agent_templates` | Templates reutilizables |
| `domain_profiles` | Health, Gov, Marketing, Custom |
| `tool_packs` | Colecciones de tools por dominio |
| `tool_pack_items` | Tools individuales con sensibilidad |
| `policy_presets` | Permissive, Balanced, Strict |
| `runtime_presets` | OpenClaw, LangGraph, etc |
| `created_agents` | Agentes creados con su config |
| `agent_runs` | Ejecuciones con estado y loop risk score |
| `tool_events` | Cada tool call con decisión y payload |
| `approval_requests` | Solicitudes con estado y revisor |

---

## Lógica del Policy Engine

Recibe: `{ toolName, domain, policyLevel, sensitivity, riskMode }`

Devuelve:
- `allowed` — si la tool es de bajo riesgo y la política lo permite
- `blocked` — si la tool es crítica y la política es strict
- `approval_required` — si la sensibilidad es alta o la tool lo requiere

---

## Comandos

```bash
npm run dev      # desarrollo con hot reload
npm run build    # compilar TypeScript
npm run start    # correr el build
```
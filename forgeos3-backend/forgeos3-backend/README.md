# ForgeOS3 — Agent (OpenClaw)

Implementación del RuntimeAdapter de ForgeOS3 sobre OpenClaw. Incluye los 3 escenarios demo del hackathon: Health, Gov y Marketing.

---

## Stack

- **Node.js** + **TypeScript**
- **OpenClaw** — runtime del agente
- **Axios** — llamadas al backend de ForgeOS3

---

## Estructura

```
src/
├── adapter/
│   └── openclawAdapter.ts   # implementa la interfaz RuntimeAdapter
├── scenarios/
│   ├── healthScenario.ts    # demo Health — summarize, checklist, diagnose(bloqueado)
│   ├── govScenario.ts       # demo Gov — classify, route, write_external(approval)
│   └── marketingScenario.ts # demo Marketing — summarize, draft, publish(approval)
├── tools/
│   ├── healthTools.ts       # definición de tools del dominio health
│   ├── govTools.ts          # definición de tools del dominio gov
│   └── marketingTools.ts    # definición de tools del dominio marketing
└── index.ts
```

---

## Setup

```bash
cd forgeos3-agent
npm install
cp .env.example .env    # llenar con la URL del backend
```

Asegúrate de que el backend esté corriendo antes de ejecutar los escenarios.

---

## Variables de entorno

```
FORGEOS3_API_URL=http://localhost:3001
AGENT_API_KEY=your_agent_key
```

---

## Correr los escenarios demo

```bash
npm run demo:health       # Escenario A — Health
npm run demo:gov          # Escenario B — Gov
npm run demo:marketing    # Escenario C — Marketing
```

---

## Escenarios

### Escenario A — Health
**Input:** `"Summarize this patient intake and create a safe follow-up checklist"`

| Tool | Decisión esperada |
|---|---|
| `summarize` | ✅ allowed |
| `checklist` | ✅ allowed |
| `diagnose` | ❌ blocked |

---

### Escenario B — Gov
**Input:** `"Analyze this public request and route it to the right workflow"`

| Tool | Decisión esperada |
|---|---|
| `classify` | ✅ allowed |
| `route` | ✅ allowed |
| `write_external` | ⏳ approval required |

---

### Escenario C — Marketing
**Input:** `"Generate a campaign workflow and prepare a content draft"`

| Tool | Decisión esperada |
|---|---|
| `summarize` | ✅ allowed |
| `draft` | ✅ allowed |
| `publish` | ⏳ approval required |

---

### Escenario D — Loop Guard
El agente repite la misma tool múltiples veces. El risk score sube hasta activar safe mode o bloqueo automático.

---

## RuntimeAdapter Interface

Este es el contrato que implementa el adapter. Cada método llama al backend de Diego:

```typescript
startRun(input)          → POST /api/runs/start
beforeToolCall(intent)   → POST /api/tools/evaluate   ← el más importante
afterToolCall(result)    → POST /api/tools/log
finishRun(result)        → POST /api/runs/finish
```

**El flujo es:**
1. `startRun` — registra el inicio del run
2. Por cada tool: `beforeToolCall` — consulta el Policy Engine
3. Si la decisión es `allowed` → ejecuta la tool
4. Si es `blocked` → no ejecuta, registra el evento
5. Si es `approval_required` → pausa y espera resolución
6. `afterToolCall` — registra el resultado
7. `finishRun` — cierra el run

---

## Comandos

```bash
npm run dev              # development mode
npm run build            # compilar TypeScript
npm run demo:health      # correr escenario Health
npm run demo:gov         # correr escenario Gov
npm run demo:marketing   # correr escenario Marketing
```
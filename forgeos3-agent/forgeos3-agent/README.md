# ForgeOS3 — Agent Runtime (William)

Capa de ejecución segura de agentes para ForgeOS3. Implementa el ciclo completo de un run: intent → tool planning → policy gate → execution → audit. Compatible con OpenClaw y cualquier runtime futuro mediante un adapter normalizado.

---

## Stack

- **Node.js** + **TypeScript**
- **ts-node** — ejecución directa sin compilar
- **axios** — comunicación con la API de Diego
- **dotenv** — variables de entorno

---

## Estructura

```
forgeos3-agent/
├── src/
│   ├── adapter/
│   │   └── openclawAdapter.ts   # Toda la comunicación con la API + mock fallback
│   ├── scenarios/
│   │   ├── healthScenario.ts    # Escenario A — Health
│   │   ├── govScenario.ts       # Escenario B — Government
│   │   ├── marketingScenario.ts # Escenario C — Marketing
│   │   └── loopScenario.ts      # Escenario D — Loop Guard
│   ├── tools/
│   │   ├── healthTools.ts       # summarize, checklist, diagnose, write_record
│   │   ├── govTools.ts          # classify, route, write_external, publish
│   │   └── marketingTools.ts    # summarize, draft, publish, schedule
│   ├── index.ts                 # Entry point — corre los 4 escenarios
│   └── demo.ts                  # Alias de index.ts
├── .env
└── package.json
```

---

## Setup

```bash
cd forgeos3/forgeos3-agent
npm install
cp .env.example .env
```

Llena el `.env`:

```env
VITE_API_URL=https://forgeos3-production.up.railway.app
FORGEOS3_API_URL=https://forgeos3-production.up.railway.app
SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_KEY=tu_service_key
JWT_SECRET=forgeos3_secret_2025
AGENT_API_KEY=tu_jwt_token
```

---

## Correr el demo

```bash
# Los 4 escenarios en secuencia (recomendado para el pitch)
npm run demo:all

# Escenarios individuales
npm run demo:health      # Escenario A
npm run demo:gov         # Escenario B
npm run demo:marketing   # Escenario C
npm run demo:loop        # Escenario D
```

> **Nota:** Si la API no está disponible, el agente corre automáticamente en modo mock sin cambiar ningún código.

---

## Los 4 Escenarios

### A) Health Agent
**Input:** `"Summarize patient intake #4821 and create a follow-up checklist"`

| Tool | Decisión | Motivo |
|------|----------|--------|
| `summarize` | ✅ allowed | Baja sensibilidad |
| `checklist` | ✅ allowed | Baja sensibilidad |
| `diagnose` | ❌ blocked | Sensibilidad crítica + política strict |

---

### B) Government Agent
**Input:** `"Analyze public request #2291 and route to the right department"`

| Tool | Decisión | Motivo |
|------|----------|--------|
| `classify` | ✅ allowed | Baja sensibilidad |
| `route` | ✅ allowed | Baja sensibilidad |
| `write_external` | ⏳ approval_required | Escribe en BD municipal |

El run **pausa y espera** aprobación humana. Si se aprueba → continúa. Si se rechaza → status `blocked`.

---

### C) Marketing Agent
**Input:** `"Generate a campaign workflow and prepare a content draft"`

| Tool | Decisión | Motivo |
|------|----------|--------|
| `summarize` | ✅ allowed | Baja sensibilidad |
| `draft` | ✅ allowed | Baja sensibilidad |
| `publish` | ⏳ approval_required → ❌ rejected | Publica en canales externos |

El operador **rechaza** la publicación — el run termina en status `blocked`.

---

### D) Loop Guard
El agente llama `classify` 6 veces seguidas intencionalmente.

- Iteración 1 → score: 6/100 → normal
- Iteración 2 → score: 18/100 → normal
- Iteración 3 → score: 36/100 → **SAFE MODE activado**
- Run termina automáticamente con status `safe_mode`

---

## Flujo del Adapter

```
startRun()
    ↓
beforeToolCall()  →  allowed / blocked / approval_required
    ↓
[si allowed]  ejecutar tool
    ↓
afterToolCall()   →  loggea resultado
    ↓
evaluateLoop()    →  checa risk score acumulado
    ↓
[si score > 30]   →  safe_mode automático
    ↓
finishRun()       →  finished / blocked / safe_mode
```

---

## Mock Fallback

El adapter tiene fallback automático. Si la API no responde:
- `startRun` → genera ID local
- `beforeToolCall` → bloquea tools peligrosas por nombre (`diagnose`, `deleteAllData`, etc.)
- `requestApproval` → simula delay y devuelve la decisión configurada
- `evaluateLoop` → incrementa score localmente
- `afterToolCall` / `finishRun` → loggea en memoria

No hay que cambiar nada para pasar de mock a real — el adapter lo detecta solo.

---

## Comandos

```bash
npm run demo:all       # demo completo (pitch)
npm run demo:health    # solo escenario A
npm run demo:gov       # solo escenario B
npm run demo:marketing # solo escenario C
npm run demo:loop      # solo escenario D
npm run build          # compilar TypeScript
npm run dev            # hot reload
```

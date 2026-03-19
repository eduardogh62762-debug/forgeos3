# ForgeOS3 — Frontend

React + Vite + TypeScript dashboard for the ForgeOS3 governance platform.

---

## Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS** — design system con forge theme
- **Zustand** — estado global (auth, runs, agents)
- **Framer Motion** — animaciones
- **Recharts** — gráficas
- **React Router DOM** — navegación
- **Lucide React** — iconografía

---

## Estructura

```
src/
├── components/
│   ├── layout/          # AuthLayout, Sidebar, TopBar
│   └── ui/              # Badge, Button, Card, Modal, Toggle
├── pages/
│   ├── Landing.tsx
│   ├── SignIn.tsx
│   ├── SignUp.tsx
│   ├── Dashboard.tsx
│   ├── BuilderConsole.tsx
│   ├── RegistryManager.tsx
│   ├── PolicyStudio.tsx
│   ├── ToolGateway.tsx
│   ├── LoopGuard.tsx
│   ├── SandboxLayer.tsx
│   ├── SentinelStudio.tsx
│   ├── AuditTrail.tsx
│   ├── ApprovalsPanel.tsx
│   └── Settings.tsx
├── store/
│   ├── authStore.ts     # auth state
│   ├── agentStore.ts    # agents state
│   └── runStore.ts      # runs + approvals state
├── types/               # Agent, Run, Approval, Policy
├── lib/
│   └── constants.ts     # mock data, domain profiles, tool packs
└── App.tsx              # rutas
```

---

## Setup

```bash
cd forgeos3
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173)

---

## Variables de entorno

Crea un `.env` en la raíz de `forgeos3/`:

```
VITE_API_URL=http://localhost:3001
```

---

## Estado actual

Todas las páginas están construidas con **mock data**. La integración con el backend se hace sustituyendo los stores de Zustand para que consuman la API real en vez de los mocks.

### Stores a conectar con API

| Store | Qué conectar |
|---|---|
| `authStore` | `login()`, `signup()`, `logout()` → `/api/auth` |
| `agentStore` | `agents` → `GET /api/agents` |
| `runStore` | `runs`, `approvals` → `GET /api/runs`, `GET /api/approvals` |

---

## Páginas

| Ruta | Página | Descripción |
|---|---|---|
| `/dashboard` | Dashboard | Overview general, métricas, runs recientes |
| `/builder` | Builder Console | Crear y deployar agentes |
| `/registry` | Registry Manager | Domain profiles, tool packs, policy presets |
| `/policy` | Policy Studio | Configurar reglas por dominio y tool |
| `/gateway` | Tool Gateway | Log de intercepts en tiempo real |
| `/loopguard` | Loop Guard | Monitor de riesgo y kill switch |
| `/sandbox` | Sandbox Layer | Entorno aislado, timeouts, red, secrets |
| `/sentinel` | Sentinel Studio | Runs activos y tool timeline |
| `/audit` | Audit Trail | Log institucional completo |
| `/approvals` | Approvals Panel | Aprobar o rechazar tool calls |
| `/settings` | Settings | Runtimes, API key, organización |

---

## Comandos

```bash
npm run dev      # desarrollo
npm run build    # build para producción
npm run lint     # linter
npm run preview  # preview del build
```
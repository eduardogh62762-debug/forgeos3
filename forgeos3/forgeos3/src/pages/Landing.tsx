import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Shield, Eye, ArrowRight, CheckCircle, Lock, Activity, GitBranch, Terminal, ChevronRight, Cpu, Database } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08, ease: 'easeOut' as const } }),
}

const EVENTS = [
  { tool: 'summarize',      decision: 'allowed',           domain: 'health',    ms: 1240 },
  { tool: 'checklist',      decision: 'allowed',           domain: 'health',    ms: 820  },
  { tool: 'diagnose',       decision: 'blocked',           domain: 'health',    ms: null },
  { tool: 'classify',       decision: 'allowed',           domain: 'gov',       ms: 610  },
  { tool: 'write_external', decision: 'approval_required', domain: 'gov',       ms: null },
  { tool: 'draft',          decision: 'allowed',           domain: 'marketing', ms: 2100 },
  { tool: 'publish',        decision: 'approval_required', domain: 'marketing', ms: null },
]

const D_STYLE: Record<string, { dot: string; pill: string; label: string }> = {
  allowed:           { dot: 'bg-emerald-500', pill: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400', label: 'allowed'  },
  blocked:           { dot: 'bg-red-500',     pill: 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400',                 label: 'blocked'  },
  approval_required: { dot: 'bg-amber-500',   pill: 'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400',         label: 'approval' },
}

const DOMAIN_COLOR: Record<string, string> = {
  health:    'text-blue-500 dark:text-blue-400',
  gov:       'text-purple-500 dark:text-purple-400',
  marketing: 'text-amber-500 dark:text-amber-400',
}

const STEPS = [
  { icon: GitBranch, step: '01', label: 'Agent calls tool',   desc: 'OpenClaw agent intends to run a tool' },
  { icon: Lock,      step: '02', label: 'Gateway intercepts', desc: 'Tool Gateway pauses, queries Policy Engine' },
  { icon: Shield,    step: '03', label: 'Policy decides',     desc: 'Allow · Block · Approval Required' },
  { icon: Activity,  step: '04', label: 'Sentinel logs it',   desc: 'Full event recorded with risk score' },
]

const PILLARS = [
  {
    icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/8', border: 'group-hover:border-amber-400/40',
    label: 'Build', tagline: 'Reusable by design',
    desc: 'Templates, domain profiles, tool packs. Deploy to any runtime in one step.',
    points: ['Domain-aware templates', 'Configurable tool packs', 'One-click deploy'],
  },
  {
    icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/8', border: 'group-hover:border-blue-400/40',
    label: 'Govern', tagline: 'Every tool call, controlled',
    desc: 'Policy Engine evaluates every action. Block, allow, or route to human approval.',
    points: ['Policy presets per domain', 'Human approval workflows', 'Loop Guard protection'],
  },
  {
    icon: Eye, color: 'text-emerald-500', bg: 'bg-emerald-500/8', border: 'group-hover:border-emerald-400/40',
    label: 'Observe', tagline: 'Full institutional trail',
    desc: 'Sentinel Studio gives operators a real-time view of every run, decision, and risk event.',
    points: ['Tool-level timeline', 'Risk score graph', 'Immutable audit trail'],
  },
]

export function Landing() {
  return (
    <div className="min-h-screen bg-forge-bg flex flex-col overflow-x-hidden">

      {/* Grid bg */}
      <div className="fixed inset-0 pointer-events-none opacity-60"
        style={{ backgroundImage: 'linear-gradient(var(--color-forge-border) 1px,transparent 1px),linear-gradient(90deg,var(--color-forge-border) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
      {/* Amber glow */}
      <div className="fixed -top-30 left-1/2 -translate-x-1/2 w-200 h-100 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 65%)' }} />

      {/* NAV */}
      <motion.nav initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="relative z-20 flex items-center justify-between px-8 py-4 border-b border-forge-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center" style={{ boxShadow: '0 0 12px rgba(245,158,11,0.35)' }}>
            <Zap size={13} className="text-black" fill="currentColor" />
          </div>
          <span className="text-sm font-bold text-forge-white tracking-tight">ForgeOS<span className="text-amber-500">3</span></span>
        </div>
        <div className="hidden md:flex items-center gap-7 text-xs text-forge-subtle font-medium">
          {[
            { label: 'Architecture', id: 'how-it-works' },
            { label: 'Capabilities', id: 'pillars' },
            { label: 'Runtimes',     id: 'adapter' },
          ].map(({ label, id }) => (
            <button key={id}
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-forge-primary transition-colors cursor-pointer">
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/signin" className="text-xs text-forge-secondary hover:text-forge-primary transition-colors px-3 py-2">Sign In</Link>
          <Link to="/signup"
            className="flex items-center gap-1.5 text-xs bg-amber-400 text-black font-bold px-4 py-2 rounded-xl hover:bg-amber-300 transition-all"
            style={{ boxShadow: '0 0 16px rgba(245,158,11,0.25)' }}>
            Get Started <ArrowRight size={12} />
          </Link>
        </div>
      </motion.nav>

      {/* HERO */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-16">
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold mb-7 tracking-widest uppercase bg-amber-400/10 border border-amber-400/25 text-amber-500">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          OpenClaw Hackathon · AI Tinkerers Durango MX 2025
        </motion.div>

        <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="show"
          className="text-5xl sm:text-6xl lg:text-[72px] font-bold text-forge-white max-w-4xl leading-[1.03] tracking-tight mb-5">
          The infrastructure layer<br />
          <span style={{ background: 'linear-gradient(135deg,#f59e0b 0%,#fcd34d 50%,#f59e0b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            safe AI agents
          </span>{' '}deserve.
        </motion.h1>

        <motion.p custom={2} variants={fadeUp} initial="hidden" animate="show"
          className="text-[15px] text-forge-secondary max-w-lg leading-relaxed mb-2">
          ForgeOS3 is not another agent runtime. It is the governance layer above them —
          policy enforcement, tool control, human approvals, and full observability across every framework.
        </motion.p>

        <motion.p custom={3} variants={fadeUp} initial="hidden" animate="show"
          className="text-[11px] tracking-widest uppercase mb-10 text-forge-subtle">
          OpenClaw · LangGraph · AutoGen · CrewAI · Custom runtimes
        </motion.p>

        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show"
          className="flex items-center gap-3 mb-16">
          <Link to="/signup"
            className="flex items-center gap-2 bg-amber-400 text-black font-bold px-7 py-3 rounded-xl hover:bg-amber-300 transition-all text-sm"
            style={{ boxShadow: '0 0 24px rgba(245,158,11,0.3)' }}>
            Open Console <ArrowRight size={14} />
          </Link>
          <Link to="/signin"
            className="flex items-center gap-2 text-sm text-forge-secondary hover:text-forge-primary border border-forge-border hover:border-forge-line rounded-xl px-5 py-3 transition-all">
            Sign In <ChevronRight size={14} />
          </Link>
        </motion.div>

        {/* SENTINEL PREVIEW */}
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show" className="w-full max-w-2xl">
          <div className="text-[10px] uppercase tracking-widest mb-3 text-left font-semibold text-forge-subtle">
            Live tool events · Sentinel Studio
          </div>
          <div className="rounded-2xl overflow-hidden bg-forge-surface border border-forge-border">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-forge-border bg-forge-elevated/60">
              <div className="flex gap-1.5">
                {['bg-red-500/50', 'bg-amber-400/50', 'bg-emerald-500/50'].map((c, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full ${c}`} />
                ))}
              </div>
              <span className="text-[10px] font-mono ml-2 text-forge-subtle">forgeos3 · sentinel · run-002 · GovBot Prime</span>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] text-amber-500 font-semibold">waiting approval</span>
              </div>
            </div>
            <div className="grid grid-cols-4 px-4 py-2 text-[9px] uppercase tracking-widest font-semibold text-forge-subtle border-b border-forge-border/50">
              <span>Tool</span><span>Domain</span><span>Decision</span><span className="text-right">Duration</span>
            </div>
            {EVENTS.map((e, i) => {
              const s = D_STYLE[e.decision]
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.07, duration: 0.35, ease: 'easeOut' }}
                  className="grid grid-cols-4 items-center px-4 py-2.5 border-b border-forge-border/40 hover:bg-forge-elevated/60 transition-colors last:border-0">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                    <code className="text-xs text-amber-500 font-mono">{e.tool}</code>
                  </div>
                  <span className={`text-[11px] capitalize ${DOMAIN_COLOR[e.domain]}`}>{e.domain}</span>
                  <span className={`text-[10px] font-semibold inline-flex items-center px-2 py-0.5 rounded-full w-fit ${s.pill}`}>{s.label}</span>
                  <span className="text-[10px] font-mono text-right text-forge-subtle">
                    {e.ms && e.ms > 0 ? `${e.ms}ms` : e.ms === 0 ? '—' : 'pending…'}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </section>

      {/* PILLARS */}
      <section id="pillars" className="relative z-10 px-6 py-20 max-w-5xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="text-center mb-12">
          <h2 className="text-2xl font-bold text-forge-white mb-2">One platform. Three core capabilities.</h2>
          <p className="text-sm text-forge-subtle">Everything a production AI agent needs around it.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PILLARS.map(({ icon: Icon, color, bg, border, label, tagline, desc, points }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }}
              className={`group p-6 rounded-2xl border border-forge-border bg-forge-surface transition-all duration-300 ${border}`}>
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl mb-4 border border-forge-border ${bg}`}>
                <Icon size={16} className={color} />
              </div>
              <div className="text-[9px] uppercase tracking-widest mb-1 font-semibold text-forge-subtle">{label}</div>
              <h3 className="text-sm font-bold text-forge-white mb-2">{tagline}</h3>
              <p className="text-[12px] leading-relaxed mb-4 text-forge-secondary">{desc}</p>
              <div className="space-y-1.5">
                {points.map(p => (
                  <div key={p} className="flex items-center gap-2">
                    <CheckCircle size={10} className={color} />
                    <span className="text-[11px] text-forge-secondary">{p}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative z-10 px-6 py-20 border-t border-forge-border">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="text-center mb-12">
            <h2 className="text-2xl font-bold text-forge-white mb-2">How tool interception works</h2>
            <p className="text-sm text-forge-subtle">ForgeOS3 sits between your runtime and every tool call.</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STEPS.map(({ icon: Icon, step, label, desc }, i) => (
              <motion.div key={step}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.45 }}
                className="relative p-5 rounded-2xl bg-forge-surface border border-forge-border">
                <div className="text-[10px] font-mono text-amber-500 mb-3 font-bold">{step}</div>
                <Icon size={15} className="mb-3 text-forge-subtle" />
                <div className="text-xs font-semibold text-forge-white mb-1">{label}</div>
                <div className="text-[11px] leading-relaxed text-forge-subtle">{desc}</div>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-1.5 w-3 h-px bg-forge-line" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ADAPTER */}
      <section id="adapter" className="relative z-10 px-6 py-20 border-t border-forge-border">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <div className="text-[10px] text-amber-500 uppercase tracking-widest mb-3 font-bold">Runtime Adapter Interface</div>
              <h2 className="text-xl font-bold text-forge-white mb-3">Plug into any framework</h2>
              <p className="text-sm text-forge-secondary leading-relaxed mb-6">
                Each runtime implements a four-method contract. ForgeOS3 never touches your agent logic — it only wraps the tool boundary.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">OpenClaw · Live</span>
                </div>
                {['LangGraph', 'AutoGen', 'CrewAI'].map(r => (
                  <span key={r} className="text-[10px] px-2.5 py-1 rounded-full font-medium bg-forge-elevated border border-forge-border text-forge-subtle">{r}</span>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <div className="rounded-2xl overflow-hidden bg-forge-elevated border border-forge-border">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-forge-border bg-forge-surface/50">
                  <Terminal size={11} className="text-forge-subtle" />
                  <span className="text-[10px] font-mono text-forge-subtle">RuntimeAdapter.ts</span>
                </div>
                <pre className="p-5 text-[12px] font-mono leading-relaxed overflow-x-auto text-forge-secondary">
{`type `}<span className="text-amber-500">RuntimeAdapter</span>{` = {
  name: `}<span className="text-emerald-500">string</span>{`
  key:  `}<span className="text-emerald-500">string</span>{`
  startRun(input):     `}<span className="text-blue-500">Promise</span>{`<RunContext>
  beforeToolCall(evt): `}<span className="text-blue-500">Promise</span>{`<Decision>
  afterToolCall(evt):  `}<span className="text-blue-500">Promise</span>{`<void>
  finishRun(evt):      `}<span className="text-blue-500">Promise</span>{`<void>
}`}
                </pre>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative z-10 px-6 py-16 border-t border-forge-border">
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: Cpu,      value: '4',   label: 'Runtime adapters',   sub: 'OpenClaw live' },
            { icon: Shield,   value: '3',   label: 'Policy decisions',   sub: 'allow · block · approval' },
            { icon: Database, value: '10+', label: 'DB tables',          sub: 'full audit trail' },
            { icon: Activity, value: '∞',   label: 'Tool events logged', sub: 'immutable records' },
          ].map(({ icon: Icon, value, label, sub }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
              <Icon size={16} className="text-amber-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-forge-white mb-0.5">{value}</div>
              <div className="text-xs font-medium text-forge-secondary mb-0.5">{label}</div>
              <div className="text-[10px] text-forge-subtle">{sub}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-24 border-t border-forge-border">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="max-w-xl mx-auto text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center mx-auto mb-6"
            style={{ boxShadow: '0 0 32px rgba(245,158,11,0.35)' }}>
            <Zap size={20} className="text-black" fill="currentColor" />
          </div>
          <h2 className="text-3xl font-bold text-forge-white mb-3">Ready to govern your agents?</h2>
          <p className="text-sm text-forge-secondary mb-8 leading-relaxed">
            Deploy ForgeOS3 in minutes. Connect OpenClaw. Start observing.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/signup"
              className="flex items-center gap-2 bg-amber-400 text-black font-bold px-8 py-3.5 rounded-xl hover:bg-amber-300 transition-all text-sm"
              style={{ boxShadow: '0 0 28px rgba(245,158,11,0.3)' }}>
              Open Console <ArrowRight size={14} />
            </Link>
            <Link to="/signin" className="text-sm text-forge-secondary hover:text-forge-primary transition-colors">
              Already have an account →
            </Link>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 px-8 py-5 flex items-center justify-between border-t border-forge-border">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-amber-400 flex items-center justify-center">
            <Zap size={10} className="text-black" fill="currentColor" />
          </div>
          <span className="text-[11px] text-forge-subtle">ForgeOS3 · AI Tinkerers Hackathon · Durango, MX 2025</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-forge-subtle">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          OpenClaw · Connected
        </div>
      </footer>

    </div>
  )
}
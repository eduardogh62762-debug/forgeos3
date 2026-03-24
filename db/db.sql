-- ============================================================
-- FORGEOS3 — Complete Database Schema + Seeds
-- TEAM GPT · AI Tinkerers Hackathon · Durango, Mexico 2025
-- Run this entire file in Supabase SQL Editor
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";


-- ============================================================
-- DROP TABLES (clean slate if re-running)
-- ============================================================
drop table if exists approval_requests  cascade;
drop table if exists tool_events        cascade;
drop table if exists agent_runs         cascade;
drop table if exists created_agents     cascade;
drop table if exists agent_templates    cascade;
drop table if exists tool_pack_items    cascade;
drop table if exists tool_packs         cascade;
drop table if exists policy_presets     cascade;
drop table if exists runtime_presets    cascade;
drop table if exists domain_profiles    cascade;


-- ============================================================
-- ENUMS
-- ============================================================
drop type if exists domain_key       cascade;
drop type if exists risk_mode_type   cascade;
drop type if exists policy_level     cascade;
drop type if exists sensitivity_type cascade;
drop type if exists run_status       cascade;
drop type if exists tool_decision    cascade;
drop type if exists approval_status  cascade;
drop type if exists agent_status     cascade;

create type domain_key       as enum ('healthtech', 'agrotech', 'fintech', 'custom');
create type risk_mode_type   as enum ('safe', 'normal');
create type policy_level     as enum ('low', 'medium', 'strict');
create type sensitivity_type as enum ('low', 'medium', 'high', 'critical');
create type run_status       as enum ('running', 'finished', 'blocked', 'safe_mode', 'waiting_approval');
create type tool_decision    as enum ('allowed', 'blocked', 'approval_required');
create type approval_status  as enum ('pending', 'approved', 'rejected');
create type agent_status     as enum ('active', 'inactive', 'deploying');


-- ============================================================
-- TABLE: domain_profiles
-- ============================================================
create table domain_profiles (
  id          uuid primary key default uuid_generate_v4(),
  key         domain_key    not null unique,
  name        text          not null,
  description text          not null,
  icon        text          not null,
  color       text          not null,
  risk_mode   risk_mode_type not null default 'normal',
  created_at  timestamptz   not null default now()
);


-- ============================================================
-- TABLE: tool_packs
-- ============================================================
create table tool_packs (
  id          uuid primary key default uuid_generate_v4(),
  name        text       not null,
  description text       not null,
  domain      domain_key not null,
  created_at  timestamptz not null default now()
);


-- ============================================================
-- TABLE: tool_pack_items
-- ============================================================
create table tool_pack_items (
  id                uuid primary key default uuid_generate_v4(),
  tool_pack_id      uuid             not null references tool_packs(id) on delete cascade,
  name              text             not null,
  description       text             not null,
  sensitivity       sensitivity_type not null default 'low',
  requires_approval boolean          not null default false,
  created_at        timestamptz      not null default now()
);


-- ============================================================
-- TABLE: policy_presets
-- ============================================================
create table policy_presets (
  id          uuid primary key default uuid_generate_v4(),
  name        text         not null,
  level       policy_level not null,
  strictness  integer      not null check (strictness between 1 and 5),
  description text         not null,
  created_at  timestamptz  not null default now()
);


-- ============================================================
-- TABLE: runtime_presets
-- ============================================================
create table runtime_presets (
  id          uuid primary key default uuid_generate_v4(),
  name        text        not null,
  key         text        unique,
  description text        not null,
  is_live     boolean     not null default false,
  created_at  timestamptz not null default now()
);


-- ============================================================
-- TABLE: agent_templates
-- ============================================================
create table agent_templates (
  id             uuid primary key default uuid_generate_v4(),
  name           text         not null,
  description    text         not null,
  default_domain domain_key   not null,
  default_policy policy_level not null default 'medium',
  created_at     timestamptz  not null default now()
);


-- ============================================================
-- TABLE: created_agents
-- ============================================================
create table created_agents (
  id               uuid primary key default uuid_generate_v4(),
  name             text             not null,
  description      text,
  runtime          text             not null default 'openclaw_v1',
  domain_profile   domain_key       not null,
  tool_pack_id     uuid             references tool_packs(id),
  policy_preset_id uuid             references policy_presets(id),
  risk_mode        risk_mode_type   not null default 'normal',
  status           agent_status     not null default 'inactive',
  created_at       timestamptz      not null default now()
);


-- ============================================================
-- TABLE: agent_runs
-- ============================================================
create table agent_runs (
  id               uuid primary key default uuid_generate_v4(),
  agent_id         uuid        references created_agents(id),
  agent_name       text        not null,
  domain           domain_key  not null,
  status           run_status  not null default 'running',
  input            text        not null,
  output           text,
  loop_risk_score  integer     not null default 0,
  started_at       timestamptz not null default now(),
  finished_at      timestamptz
);


-- ============================================================
-- TABLE: tool_events
-- ============================================================
create table tool_events (
  id           uuid primary key default uuid_generate_v4(),
  run_id       uuid          not null references agent_runs(id) on delete cascade,
  tool_name    text          not null,
  decision     tool_decision not null,
  input        jsonb         not null default '{}',
  output       jsonb,
  risk_score   integer       not null default 0,
  duration_ms  integer,
  reason       text,
  timestamp    timestamptz   not null default now()
);


-- ============================================================
-- TABLE: approval_requests
-- ============================================================
create table approval_requests (
  id           uuid primary key default uuid_generate_v4(),
  run_id       uuid            not null references agent_runs(id) on delete cascade,
  agent_id     uuid            references created_agents(id),
  agent_name   text            not null,
  domain       domain_key      not null,
  tool_name    text            not null,
  payload      jsonb           not null default '{}',
  reason       text            not null,
  status       approval_status not null default 'pending',
  reviewed_by  text,
  reviewed_at  timestamptz,
  created_at   timestamptz     not null default now()
);


-- ============================================================
-- INDEXES
-- ============================================================
create index idx_tool_events_run_id        on tool_events(run_id);
create index idx_tool_events_timestamp     on tool_events(timestamp desc);
create index idx_approval_requests_run_id  on approval_requests(run_id);
create index idx_approval_requests_status  on approval_requests(status);
create index idx_agent_runs_agent_id       on agent_runs(agent_id);
create index idx_agent_runs_status         on agent_runs(status);
create index idx_agent_runs_started_at     on agent_runs(started_at desc);


-- ============================================================
-- ROW LEVEL SECURITY (basic — disable for dev, enable for prod)
-- ============================================================
alter table domain_profiles    enable row level security;
alter table tool_packs         enable row level security;
alter table tool_pack_items    enable row level security;
alter table policy_presets     enable row level security;
alter table runtime_presets    enable row level security;
alter table agent_templates    enable row level security;
alter table created_agents     enable row level security;
alter table agent_runs         enable row level security;
alter table tool_events        enable row level security;
alter table approval_requests  enable row level security;

-- Allow all for service role (backend uses service key)
create policy "service_all" on domain_profiles   for all using (true) with check (true);
create policy "service_all" on tool_packs        for all using (true) with check (true);
create policy "service_all" on tool_pack_items   for all using (true) with check (true);
create policy "service_all" on policy_presets    for all using (true) with check (true);
create policy "service_all" on runtime_presets   for all using (true) with check (true);
create policy "service_all" on agent_templates   for all using (true) with check (true);
create policy "service_all" on created_agents    for all using (true) with check (true);
create policy "service_all" on agent_runs        for all using (true) with check (true);
create policy "service_all" on tool_events       for all using (true) with check (true);
create policy "service_all" on approval_requests for all using (true) with check (true);


-- ============================================================
-- SEEDS — Domain Profiles
-- ============================================================
insert into domain_profiles (key, name, description, icon, color, risk_mode) values
  ('healthtech', 'HealthTech', 'Clinical documentation, diagnostics and patient support agents', '♥', 'blue',  'safe'),
  ('agrotech',   'AgroTech',   'Crop monitoring, yield prediction and agricultural automation',  '⬡', 'green', 'safe'),
  ('fintech',    'FinTech',    'Financial analysis, fraud detection and transaction automation',  '◈', 'amber', 'normal'),
  ('custom',     'Custom',     'Define your own domain policies and rules',                       '◎', 'gray',  'normal');


-- ============================================================
-- SEEDS — Policy Presets
-- ============================================================
insert into policy_presets (name, level, strictness, description) values
  ('Permissive', 'low',    1, 'Allow most actions, minimal approvals required'),
  ('Balanced',   'medium', 3, 'Block critical tools, require approval for high-risk actions'),
  ('Strict',     'strict', 5, 'Maximum governance — all sensitive tools require human approval');


-- ============================================================
-- SEEDS — Runtime Presets
-- ============================================================
insert into runtime_presets (name, key, description, is_live) values
  ('OpenClaw',  'openclaw_v1', 'Primary MVP adapter — full integration live',           true),
  ('LangGraph', null,          'Interface defined — adapter coming soon',                false),
  ('AutoGen',   null,          'Interface defined — adapter coming soon',                false),
  ('CrewAI',    null,          'Interface defined — adapter coming soon',                false),
  ('Custom',    null,          'Bring your own runtime adapter',                         false);


-- ============================================================
-- SEEDS — Tool Packs + Items: HealthTech
-- ============================================================
with tp as (
  insert into tool_packs (name, description, domain)
  values ('HealthTech Core', 'Medical documentation and clinical support tools', 'healthtech')
  returning id
)
insert into tool_pack_items (tool_pack_id, name, description, sensitivity, requires_approval)
select tp.id, t.name, t.description, t.sensitivity::sensitivity_type, t.requires_approval
from tp, (values
  ('summarize',    'Summarize patient intake form',          'low',      false),
  ('checklist',    'Generate clinical follow-up checklist',  'low',      false),
  ('diagnose',     'Diagnostic assistance and suggestions',  'critical', true),
  ('write_record', 'Write notes to patient medical record',  'high',     true)
) as t(name, description, sensitivity, requires_approval);


-- ============================================================
-- SEEDS — Tool Packs + Items: AgroTech
-- ============================================================
with tp as (
  insert into tool_packs (name, description, domain)
  values ('AgroTech Core', 'Crop monitoring and agricultural workflow tools', 'agrotech')
  returning id
)
insert into tool_pack_items (tool_pack_id, name, description, sensitivity, requires_approval)
select tp.id, t.name, t.description, t.sensitivity::sensitivity_type, t.requires_approval
from tp, (values
  ('analyze_crop',    'Analyze crop health from IoT sensor data',    'low',      false),
  ('predict_yield',   'Predict harvest yield based on field data',   'medium',   false),
  ('apply_treatment', 'Schedule and apply field treatment',          'high',     true),
  ('write_report',    'Write results to agricultural registry',      'critical', true)
) as t(name, description, sensitivity, requires_approval);


-- ============================================================
-- SEEDS — Tool Packs + Items: FinTech
-- ============================================================
with tp as (
  insert into tool_packs (name, description, domain)
  values ('FinTech Core', 'Financial analysis and transaction automation tools', 'fintech')
  returning id
)
insert into tool_pack_items (tool_pack_id, name, description, sensitivity, requires_approval)
select tp.id, t.name, t.description, t.sensitivity::sensitivity_type, t.requires_approval
from tp, (values
  ('analyze',          'Analyze financial transactions and patterns', 'low',      false),
  ('detect_fraud',     'Flag suspicious transactions for review',     'medium',   false),
  ('generate_report',  'Generate financial compliance report',        'medium',   false),
  ('execute_transfer', 'Execute financial transfer between accounts', 'critical', true)
) as t(name, description, sensitivity, requires_approval);


-- ============================================================
-- SEEDS — Agent Templates
-- ============================================================
insert into agent_templates (name, description, default_domain, default_policy) values
  ('Clinical Assistant',    'Handles patient intake, documentation and follow-up workflows', 'healthtech', 'strict'),
  ('Field Monitor',         'Monitors crop health, predicts yields and schedules treatments', 'agrotech',   'medium'),
  ('Financial Analyst',     'Analyzes transactions, detects fraud and generates reports',     'fintech',    'medium'),
  ('Custom Agent',          'Fully configurable agent for custom use cases',                  'custom',     'low');


-- ============================================================
-- SEEDS — Demo Agents
-- ============================================================
insert into created_agents (name, description, runtime, domain_profile, risk_mode, status)
values
  ('HealthAgent Alpha', 'Clinical documentation agent for patient intake and follow-up', 'openclaw_v1', 'healthtech', 'safe',   'active'),
  ('AgroBot Prime',     'Crop monitoring and field treatment scheduling agent',           'openclaw_v1', 'agrotech',   'safe',   'active'),
  ('FinAgent',          'Financial analysis and fraud detection agent',                   'openclaw_v1', 'fintech',    'normal', 'active');


-- ============================================================
-- SEEDS — Demo Runs
-- ============================================================
with agents as (
  select id, name, domain_profile from created_agents
),
health_agent as (select id, name, domain_profile from agents where name = 'HealthAgent Alpha'),
agro_agent   as (select id, name, domain_profile from agents where name = 'AgroBot Prime'),
fin_agent    as (select id, name, domain_profile from agents where name = 'FinAgent'),

run1 as (
  insert into agent_runs (agent_id, agent_name, domain, status, input, loop_risk_score, started_at, finished_at)
  select id, name, domain_profile, 'finished', 'Summarize patient intake form #4821 and create follow-up checklist', 12,
    now() - interval '5 minutes', now() - interval '1 minute'
  from health_agent returning id
),
run2 as (
  insert into agent_runs (agent_id, agent_name, domain, status, input, loop_risk_score, started_at)
  select id, name, domain_profile, 'waiting_approval', 'Analyze crop sensor data for field #22 and schedule treatment if needed', 34,
    now() - interval '2 minutes'
  from agro_agent returning id
),
run3 as (
  insert into agent_runs (agent_id, agent_name, domain, status, input, loop_risk_score, started_at, finished_at)
  select id, name, domain_profile, 'finished', 'Analyze Q1 transactions and generate fraud risk report', 20,
    now() - interval '10 minutes', now() - interval '7 minutes'
  from fin_agent returning id
)

-- Tool events for run 1 (HealthTech)
insert into tool_events (run_id, tool_name, decision, input, risk_score, duration_ms, timestamp)
select run1.id, t.tool_name, t.decision::tool_decision, t.input::jsonb, t.risk_score, t.duration_ms, t.ts
from run1, (values
  ('summarize', 'allowed',  '{}', 5,  1200, now() - interval '4 minutes 40 seconds'),
  ('checklist', 'allowed',  '{}', 8,  800,  now() - interval '3 minutes 20 seconds'),
  ('diagnose',  'blocked',  '{}', 12, null, now() - interval '2 minutes')
) as t(tool_name, decision, input, risk_score, duration_ms, ts);


-- ============================================================
-- SEEDS — Tool Events for Run 2 (AgroTech)
-- ============================================================
insert into tool_events (run_id, tool_name, decision, input, risk_score, duration_ms, timestamp)
select r.id, t.tool_name, t.decision::tool_decision, t.input::jsonb, t.risk_score, t.duration_ms, t.ts
from agent_runs r, (values
  ('analyze_crop',    'allowed',           '{}',                                                                     10, 600,  now() - interval '1 minute 50 seconds'),
  ('predict_yield',   'allowed',           '{}',                                                                     18, 400,  now() - interval '1 minute 30 seconds'),
  ('apply_treatment', 'approval_required', '{"field":"#22","treatment":"pesticide_b","area_ha":4.5}',                34, null, now() - interval '30 seconds')
) as t(tool_name, decision, input, risk_score, duration_ms, ts)
where r.agent_name = 'AgroBot Prime';


-- ============================================================
-- SEEDS — Tool Events for Run 3 (FinTech)
-- ============================================================
insert into tool_events (run_id, tool_name, decision, input, risk_score, duration_ms, timestamp)
select r.id, t.tool_name, t.decision::tool_decision, t.input::jsonb, t.risk_score, t.duration_ms, t.ts
from agent_runs r, (values
  ('analyze',          'allowed',           '{}',                                                              5,  900,  now() - interval '9 minutes 40 seconds'),
  ('detect_fraud',     'allowed',           '{}',                                                              10, 2100, now() - interval '9 minutes'),
  ('execute_transfer', 'approval_required', '{"account":"ACC-9921","amount":15000,"currency":"MXN"}',          20, null, now() - interval '8 minutes 20 seconds')
) as t(tool_name, decision, input, risk_score, duration_ms, ts)
where r.agent_name = 'FinAgent';


-- ============================================================
-- SEEDS — Approval Requests
-- ============================================================
insert into approval_requests (run_id, agent_id, agent_name, domain, tool_name, payload, reason, status, reviewed_by, reviewed_at)
select
  r.id,
  r.agent_id,
  r.agent_name,
  r.domain,
  'apply_treatment',
  '{"field":"#22","treatment":"pesticide_b","area_ha":4.5,"scheduled_date":"2025-03-15"}'::jsonb,
  'Applying field treatment requires human approval per AgroTech safety policy',
  'pending'::approval_status,
  null,
  null
from agent_runs r where r.agent_name = 'AgroBot Prime'

union all

select
  r.id,
  r.agent_id,
  r.agent_name,
  r.domain,
  'execute_transfer',
  '{"account":"ACC-9921","amount":15000,"currency":"MXN"}'::jsonb,
  'Financial transfers above threshold require human approval',
  'approved'::approval_status,
  'admin@forgeos3.dev',
  now() - interval '7 minutes 50 seconds'
from agent_runs r where r.agent_name = 'FinAgent';


-- ============================================================
-- VERIFY — Quick row counts
-- ============================================================
select 'domain_profiles'   as table_name, count(*) as rows from domain_profiles
union all
select 'tool_packs',        count(*) from tool_packs
union all
select 'tool_pack_items',   count(*) from tool_pack_items
union all
select 'policy_presets',    count(*) from policy_presets
union all
select 'runtime_presets',   count(*) from runtime_presets
union all
select 'agent_templates',   count(*) from agent_templates
union all
select 'created_agents',    count(*) from created_agents
union all
select 'agent_runs',        count(*) from agent_runs
union all
select 'tool_events',       count(*) from tool_events
union all
select 'approval_requests', count(*) from approval_requests
order by table_name;


-- ============================================================
-- segundo cambio 
-- ============================================================

create table audit_log (
  id          uuid primary key default uuid_generate_v4(),
  event_type  text        not null,
  run_id      uuid        references agent_runs(id),
  agent_id    text,
  domain      text,
  data        jsonb       not null default '{}',
  created_at  timestamptz not null default now()
);

create index idx_audit_log_run_id    on audit_log(run_id);
create index idx_audit_log_event     on audit_log(event_type);
create index idx_audit_log_created   on audit_log(created_at desc);

alter table audit_log enable row level security;
create policy "service_all" on audit_log for all using (true) with check (true);

update created_agents 
set 
  policy_preset_id = (select id from policy_presets where level = 'strict'),
  tool_pack_id = (select id from tool_packs where domain = 'healthtech')
where name = 'HealthAgent Alpha';

create table sandbox_config (
  id            uuid primary key default uuid_generate_v4(),
  timeout_ms    integer     not null default 5000,
  max_memory_mb integer     not null default 256,
  max_cpu_pct   integer     not null default 50,
  network_mode  text        not null default 'none',
  allowed_hosts jsonb       not null default '[]',
  secret_scoping boolean    not null default true,
  kill_on_timeout boolean   not null default true,
  status        text        not null default 'idle',
  updated_at    timestamptz not null default now()
);

alter table sandbox_config enable row level security;
create policy "service_all" on sandbox_config for all using (true) with check (true);

-- Insert default config
insert into sandbox_config (timeout_ms, max_memory_mb, max_cpu_pct, network_mode, allowed_hosts, secret_scoping, kill_on_timeout, status)
values (5000, 256, 50, 'none', '["api.internal.forge","db.internal.forge"]', true, true, 'idle');

-- Asignar tool_pack_id y policy_preset_id a los agentes demo
update created_agents
set
  tool_pack_id     = (select id from tool_packs where domain = 'healthtech'),
  policy_preset_id = (select id from policy_presets where level = 'strict')
where name = 'HealthAgent Alpha';

update created_agents
set
  tool_pack_id     = (select id from tool_packs where domain = 'agrotech'),
  policy_preset_id = (select id from policy_presets where level = 'medium')
where name = 'AgroBot Prime';

update created_agents
set
  tool_pack_id     = (select id from tool_packs where domain = 'fintech'),
  policy_preset_id = (select id from policy_presets where level = 'medium')
where name = 'FinAgent';

-- Verificar
select name, domain_profile, tool_pack_id, policy_preset_id
from created_agents;

create table users (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text        not null,
  email      text        not null unique,
  role       text        not null default 'member',
  created_at timestamptz not null default now()
);

alter table users enable row level security;
create policy "service_all" on users for all using (true) with check (true);

-- Add token_usage column to tool_events
alter table tool_events 
add column if not exists token_usage jsonb default null;

-- Add token summary to agent_runs
alter table agent_runs
add column if not exists total_tokens integer default 0;

-- View for token metrics (handy for dashboard)
create or replace view token_metrics as
select
  ar.id          as run_id,
  ar.agent_name,
  ar.domain,
  ar.total_tokens,
  count(te.id)   as tool_calls,
  sum((te.token_usage->>'total')::int)    as tokens_from_events,
  avg((te.token_usage->>'total')::int)    as avg_tokens_per_tool,
  max((te.token_usage->>'total')::int)    as max_tokens_single_tool,
  sum(case when te.decision = 'blocked' then 
    coalesce((te.token_usage->>'saved')::int, 500) else 0 end) as tokens_saved_by_policy
from agent_runs ar
left join tool_events te on te.run_id = ar.id
group by ar.id, ar.agent_name, ar.domain, ar.total_tokens;
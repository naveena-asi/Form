import { useNavigate } from 'react-router-dom'
import {
  PlayCircle,
  Files,
  Boxes,
  GitBranch,
  Workflow,
  ArrowRight,
  LayoutTemplate,
  Layers,
  Calculator,
  ShieldCheck,
  Table2,
  Database,
  ClipboardCheck,
  History,
  Cpu,
  CheckCircle2,
  UserRound,
} from 'lucide-react'
import { Card, Button, Badge, IconTile } from '@/components/ui'
import { useDesignerStore } from '@/store/useDesignerStore'
import { formRows } from '@/data/forms'

const modules = [
  { icon: LayoutTemplate, title: 'Form Designer', sub: 'Create & manage forms', to: '/forms/new' },
  { icon: Layers, title: 'Section Builder', sub: 'Organize layout', to: '/builder/sections' },
  { icon: Boxes, title: 'Field Builder', sub: 'All field types', to: '/builder/fields' },
  { icon: GitBranch, title: 'Conditional Logic', sub: 'Show / hide / require', to: '/builder/logic' },
  { icon: Calculator, title: 'Formula Engine', sub: 'Derive & calculate', to: '/builder/formula' },
  { icon: ShieldCheck, title: 'Validation Engine', sub: 'Field & cross-field', to: '/builder/validation' },
  { icon: Table2, title: 'Repeating Grid', sub: 'Tables & collections', to: '/builder/grid' },
  { icon: Database, title: 'Lookup Builder', sub: 'Reference data', to: '/builder/lookup' },
  { icon: Workflow, title: 'Rule & Rating', sub: 'Business & rating rules', to: '/builder/rules' },
  { icon: ClipboardCheck, title: 'Review & Submit', sub: 'Validate & submit', to: '/review' },
  { icon: History, title: 'Versioning', sub: 'Manage versions', to: '/versions' },
  { icon: PlayCircle, title: 'Runtime Preview', sub: 'Live engines', to: '/preview' },
]

const engines = ['Form Engine', 'Validation Engine', 'Rule Engine', 'Rating Engine']

const phases = [
  { n: 1, title: 'Form Builder Core', items: 'Sections, Fields, Validations, Conditions, Preview, Versioning, APIs', tone: 'green' as const },
  { n: 2, title: 'Calculation Layer', items: 'Repeating Grids, Formula Engine, Lookup Tables', tone: 'navy' as const },
  { n: 3, title: 'Rules & Rating', items: 'Rule/Rating Engine, Workflow, PDF Mapping', tone: 'amber' as const },
  { n: 4, title: 'Low-Code & AI', items: 'Drag-drop Designer, External APIs, AI Form Generation', tone: 'purple' as const },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const form = useDesignerStore((s) => s.form)
  const fieldCount = form.sections.flatMap((s) => s.fields).length

  return (
    <div>
      {/* Hero */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-navy-800 text-white">
        <div className="relative px-7 py-8">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl" />
          <Badge tone="green" className="mb-3 bg-brand-500/20 text-brand-200 ring-brand-400/30">
            Metadata-Driven Platform
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">One Platform. Unlimited Possibilities.</h1>
          <p className="mt-2 max-w-2xl text-sm text-navy-200">
            VENUSPRO is a configuration-driven Form Builder, Rule &amp; Rating Engine. Design any insurance
            form once as metadata, and the runtime renders, validates, calculates and rates it — no custom code.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="primary" icon={PlayCircle} onClick={() => navigate('/preview')}>
              Open Live Preview
            </Button>
            <Button
              variant="ghost"
              className="bg-white/10 text-white hover:bg-white/20"
              icon={UserRound}
              onClick={() => navigate('/portal')}
            >
              Customer Portal
            </Button>
            <Button
              variant="ghost"
              className="bg-white/10 text-white hover:bg-white/20"
              icon={Files}
              onClick={() => navigate('/forms')}
            >
              Browse Form Library
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Forms', value: formRows.length, icon: Files },
          { label: 'Fields (CA App)', value: fieldCount, icon: Boxes },
          { label: 'Conditional Rules', value: form.rules.length, icon: GitBranch },
          { label: 'Rating Rules', value: form.ratingRules.length, icon: Workflow },
        ].map((s) => (
          <Card key={s.label} className="flex items-center justify-between p-5">
            <div>
              <div className="text-2xl font-bold text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-navy-50 text-navy-600">
              <s.icon className="h-5 w-5" />
            </span>
          </Card>
        ))}
      </div>

      {/* Architecture */}
      <Card className="mb-6 p-6">
        <div className="section-title mb-4">High-Level Architecture</div>
        <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
          <div className="flex-1 rounded-xl border border-navy-200 bg-navy-50 p-4 text-center">
            <Cpu className="mx-auto mb-2 h-6 w-6 text-navy-700" />
            <div className="text-sm font-semibold text-navy-800">Shared Metadata Layer</div>
            <div className="text-xs text-navy-600">Single Source of Truth</div>
          </div>
          <ArrowRight className="mx-auto hidden h-5 w-5 rotate-90 text-slate-300 lg:block lg:rotate-0" />
          <div className="grid flex-[2] grid-cols-2 gap-2 sm:grid-cols-4">
            {engines.map((e) => (
              <div key={e} className="rounded-xl border border-slate-200 bg-white p-3 text-center text-xs font-medium text-slate-700 shadow-card">
                {e}
              </div>
            ))}
          </div>
          <ArrowRight className="mx-auto hidden h-5 w-5 rotate-90 text-slate-300 lg:block lg:rotate-0" />
          <div className="flex-1 rounded-xl border border-brand-200 bg-brand-50 p-4 text-center">
            <PlayCircle className="mx-auto mb-2 h-6 w-6 text-brand-600" />
            <div className="text-sm font-semibold text-brand-700">Runtime Renderer</div>
            <div className="text-xs text-brand-600">APIs · UI · PDF · Audit</div>
          </div>
        </div>
      </Card>

      {/* Modules */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Modules</h2>
        <Button variant="ghost" iconRight={ArrowRight} onClick={() => navigate('/forms')}>
          View all
        </Button>
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {modules.map((m) => (
          <IconTile key={m.title} icon={m.icon} title={m.title} subtitle={m.sub} onClick={() => navigate(m.to)} />
        ))}
      </div>

      {/* Phases */}
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Recommended Build Phases</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {phases.map((p) => (
          <Card key={p.n} className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <Badge tone={p.tone}>Phase {p.n}</Badge>
              {p.n === 1 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> This build
                </span>
              )}
            </div>
            <div className="text-sm font-semibold text-slate-900">{p.title}</div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{p.items}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}

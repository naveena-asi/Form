import { Fragment } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  FilePlus2,
  Layers,
  Boxes,
  GitBranch,
  ShieldCheck,
  PlayCircle,
  UploadCloud,
  ChevronRight,
  Check,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'

interface Step {
  label: string
  icon: LucideIcon
  to: string
  /** every route that should highlight this step. */
  match: string[]
}

// The canonical 7-step build flow. Auxiliary builders (Formula, Grid, Lookup,
// Rule/Rating, Workflow) map onto the step they belong to so the flow stays
// readable while still reflecting "where you are".
const steps: Step[] = [
  { label: 'Create Form', icon: FilePlus2, to: '/forms/new', match: ['/forms/new'] },
  { label: 'Sections', icon: Layers, to: '/builder/sections', match: ['/builder/sections', '/builder/workflow'] },
  { label: 'Fields', icon: Boxes, to: '/builder/fields', match: ['/builder/fields', '/builder/grid', '/builder/lookup'] },
  { label: 'Logic', icon: GitBranch, to: '/builder/logic', match: ['/builder/logic', '/builder/formula', '/builder/rules'] },
  { label: 'Validate', icon: ShieldCheck, to: '/builder/validation', match: ['/builder/validation'] },
  { label: 'Preview', icon: PlayCircle, to: '/preview', match: ['/preview', '/review'] },
  { label: 'Publish', icon: UploadCloud, to: '/versions', match: ['/versions', '/outputs'] },
]

/** Routes on which the build-flow stepper should appear. */
export const flowRoutes = steps.flatMap((s) => s.match)

export function DesignerFlow() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const activeIndex = steps.findIndex((s) => s.match.includes(pathname))
  if (activeIndex === -1) return null

  return (
    <nav
      aria-label="Form build progress"
      className="mb-6 flex items-center gap-0.5 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-card"
    >
      {steps.map((s, i) => {
        const state = i < activeIndex ? 'done' : i === activeIndex ? 'current' : 'upcoming'
        return (
          <Fragment key={s.to}>
            <button
              onClick={() => navigate(s.to)}
              aria-current={state === 'current' ? 'step' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition',
                state === 'current' && 'bg-navy-50 text-navy-800 ring-1 ring-navy-200',
                state === 'done' && 'text-slate-600 hover:bg-slate-50',
                state === 'upcoming' && 'text-slate-400 hover:bg-slate-50 hover:text-slate-600',
              )}
            >
              <span
                className={cn(
                  'grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold',
                  state === 'current' && 'bg-navy-700 text-white',
                  state === 'done' && 'bg-brand-500 text-white',
                  state === 'upcoming' && 'bg-slate-200 text-slate-500',
                )}
              >
                {state === 'done' ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
              <s.icon className="h-3.5 w-3.5 sm:hidden" />
            </button>
            {i < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
          </Fragment>
        )
      })}
    </nav>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Monitor,
  Tablet,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Sparkles,
  RotateCcw,
  Zap,
  ClipboardCheck,
  AlertCircle,
  AlertTriangle,
  Info,
  Lock,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useRuntime } from '@/runtime/useRuntime'
import { useFormStore } from '@/store/useFormStore'
import { FieldRenderer } from '@/components/runtime/FieldRenderer'
import { Button, Badge, StatusPill, PageHeader } from '@/components/ui'
import { Segmented, Tabs } from '@/components/ui/Tabs'
import type { Section } from '@/data/types'
import { cn } from '@/lib/cn'

type RT = ReturnType<typeof useRuntime>
type Device = 'desktop' | 'tablet' | 'mobile'
const frameWidth: Record<Device, string> = {
  desktop: 'max-w-3xl',
  tablet: 'max-w-xl',
  mobile: 'max-w-sm',
}

/** A section's visible fields laid out in its column grid — shared by every nav style. */
function SectionFields({ rt, section }: { rt: RT; section: Section }) {
  return (
    <div className={cn('grid gap-4', section.columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1')}>
      {section.fields
        .filter((f) => !rt.isHidden(f.apiName))
        .map((f) => (
          <FieldRenderer
            key={f.id}
            field={f}
            required={rt.isRequired(f)}
            disabled={rt.isDisabled(f)}
            formulaValue={rt.formulaValues[f.apiName]}
            messages={rt.messages}
          />
        ))}
    </div>
  )
}

const sectionBlockers = (rt: RT, section: Section) =>
  rt.messages.filter((m) => m.level === 'blocker' && section.fields.some((f) => f.apiName === m.field))

export default function RuntimePreview() {
  const navigate = useNavigate()
  const rt = useRuntime()
  const loadSample = useFormStore((s) => s.loadSample)
  const reset = useFormStore((s) => s.reset)
  const [device, setDevice] = useState<Device>('desktop')

  const style = rt.form.navigationStyle
  const sections = rt.visibleSections

  return (
    <div>
      <PageHeader
        eyebrow="Runtime · Live"
        title="Form Preview"
        subtitle="The form is rendered entirely from metadata — show/hide, calculations, validation and the navigation style below are all live."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={UserRound} onClick={() => navigate('/apply')}>
              Customer View
            </Button>
            <Button variant="subtle" icon={Sparkles} onClick={loadSample}>
              Load Sample Data
            </Button>
            <Button variant="ghost" icon={RotateCcw} onClick={reset}>
              Reset
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-slate-900">{rt.form.name}</span>
          <Badge tone="navy">v{rt.form.version}</Badge>
          <StatusPill status={rt.form.status} />
          <Badge tone="purple">{style}</Badge>
        </div>
        <Segmented<Device>
          value={device}
          onChange={setDevice}
          options={[
            { value: 'desktop', label: 'Desktop', icon: Monitor },
            { value: 'tablet', label: 'Tablet', icon: Tablet },
            { value: 'mobile', label: 'Mobile', icon: Smartphone },
          ]}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className={cn('mx-auto w-full transition-all', frameWidth[device])}>
          {sections.length === 0 ? (
            <div className="card p-10 text-center text-sm text-slate-400">No visible sections.</div>
          ) : style === 'Wizard' ? (
            <WizardView rt={rt} sections={sections} onReview={() => navigate('/review')} />
          ) : style === 'Tabs' ? (
            <TabsView rt={rt} sections={sections} onReview={() => navigate('/review')} />
          ) : (
            <StackView
              rt={rt}
              sections={sections}
              accordion={style === 'Accordion'}
              onReview={() => navigate('/review')}
            />
          )}
        </div>

        <EnginePanel rt={rt} />
      </div>
    </div>
  )
}

// ── Wizard ───────────────────────────────────────────────────────────────────
function WizardView({ rt, sections, onReview }: { rt: RT; sections: Section[]; onReview: () => void }) {
  const [step, setStep] = useState(0)
  const safeStep = Math.min(step, sections.length - 1)
  useEffect(() => {
    if (step > sections.length - 1) setStep(Math.max(0, sections.length - 1))
  }, [sections.length, step])
  const current = sections[safeStep]
  const blockers = sectionBlockers(rt, current)
  const locked = blockers.length > 0

  return (
    <div className="card overflow-hidden">
      {/* compact step rail */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100 bg-slate-50/60 px-3 py-2">
        {sections.map((s, i) => {
          const done = i < safeStep
          const on = i === safeStep
          return (
            <button
              key={s.id}
              onClick={() => setStep(i)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition',
                on ? 'bg-navy-50 text-navy-800' : 'text-slate-500 hover:bg-slate-100',
              )}
            >
              <span
                className={cn(
                  'grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold',
                  done ? 'bg-brand-500 text-white' : on ? 'bg-navy-700 text-white' : 'bg-slate-200 text-slate-500',
                )}
              >
                {done ? <Check className="h-2.5 w-2.5" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{s.name}</span>
            </button>
          )
        })}
      </div>

      <div className="border-b border-slate-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-900">{current.name}</h2>
        {current.description && <p className="text-xs text-slate-500">{current.description}</p>}
      </div>
      <div className="p-5">
        <SectionFields rt={rt} section={current} />
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
        <Button variant="ghost" icon={ChevronLeft} disabled={safeStep === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          Back
        </Button>
        {locked && (
          <span className="flex items-center gap-1 text-xs text-amber-600">
            <Lock className="h-3.5 w-3.5" /> Resolve {blockers.length} required field{blockers.length > 1 ? 's' : ''} to continue
          </span>
        )}
        {safeStep < sections.length - 1 ? (
          <Button variant="secondary" iconRight={ChevronRight} disabled={locked} onClick={() => setStep((s) => s + 1)}>
            Next
          </Button>
        ) : (
          <Button variant="primary" iconRight={ClipboardCheck} disabled={locked} onClick={onReview}>
            Review &amp; Submit
          </Button>
        )}
      </div>
    </div>
  )
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
function TabsView({ rt, sections, onReview }: { rt: RT; sections: Section[]; onReview: () => void }) {
  const [active, setActive] = useState(sections[0]?.id ?? '')
  const current = sections.find((s) => s.id === active) ?? sections[0]

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto px-3 pt-2">
        <Tabs
          items={sections.map((s) => ({ id: s.id, label: s.name, count: sectionBlockers(rt, s).length || undefined }))}
          active={current.id}
          onChange={setActive}
        />
      </div>
      <div className="border-b border-slate-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-900">{current.name}</h2>
        {current.description && <p className="text-xs text-slate-500">{current.description}</p>}
      </div>
      <div className="p-5">
        <SectionFields rt={rt} section={current} />
      </div>
      <div className="flex justify-end border-t border-slate-100 px-5 py-3.5">
        <Button variant="primary" iconRight={ClipboardCheck} onClick={onReview}>
          Review &amp; Submit
        </Button>
      </div>
    </div>
  )
}

// ── Accordion / Single Page ──────────────────────────────────────────────────
function StackView({
  rt,
  sections,
  accordion,
  onReview,
}: {
  rt: RT
  sections: Section[]
  accordion: boolean
  onReview: () => void
}) {
  const [open, setOpen] = useState<Set<string>>(() => new Set<string>(accordion ? [sections[0].id] : sections.map((s) => s.id)))
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  const isOpen = (id: string) => (accordion ? open.has(id) : true)

  return (
    <div className="space-y-3">
      {sections.map((s) => {
        const blockers = sectionBlockers(rt, s)
        return (
          <div key={s.id} className="card overflow-hidden">
            <button
              onClick={() => accordion && toggle(s.id)}
              className={cn('flex w-full items-center justify-between px-5 py-3 text-left', accordion && 'hover:bg-slate-50')}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'grid h-5 w-5 place-items-center rounded-full text-white',
                    blockers.length ? 'bg-amber-500' : 'bg-brand-500',
                  )}
                >
                  {blockers.length ? <AlertTriangle className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">{s.name}</h2>
                  {s.description && <p className="text-xs text-slate-500">{s.description}</p>}
                </div>
              </div>
              {accordion && (
                <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', isOpen(s.id) && 'rotate-180')} />
              )}
            </button>
            {isOpen(s.id) && (
              <div className="border-t border-slate-100 p-5">
                <SectionFields rt={rt} section={s} />
              </div>
            )}
          </div>
        )
      })}
      <div className="flex justify-end pt-1">
        <Button variant="primary" iconRight={ClipboardCheck} onClick={onReview}>
          Review &amp; Submit
        </Button>
      </div>
    </div>
  )
}

// ── Live engines panel (shared) ──────────────────────────────────────────────
function EnginePanel({ rt }: { rt: RT }) {
  return (
    <aside className="space-y-4">
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 bg-navy-800 px-4 py-2.5 text-white">
          <Zap className="h-4 w-4 text-brand-300" />
          <span className="text-xs font-semibold uppercase tracking-wide">Rating Engine</span>
        </div>
        <div className="p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">Rated Premium</div>
          <div className="text-3xl font-bold text-navy-800">${rt.rating.premium.toLocaleString()}</div>
          <div className="mt-1 text-xs text-slate-400">base ${rt.rating.basePremium.toLocaleString()}</div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone="navy">Tier: {rt.rating.tier}</Badge>
            <Badge tone={rt.rating.eligibility === 'Eligible' ? 'green' : rt.rating.eligibility === 'Declined' ? 'red' : 'amber'}>
              {rt.rating.eligibility}
            </Badge>
          </div>
          {rt.rating.surcharges.length > 0 && (
            <div className="mt-3 space-y-1 border-t border-slate-100 pt-3">
              {rt.rating.surcharges.map((s, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-slate-500">{s.name}</span>
                  <span className="font-medium text-navy-700">{s.effect}</span>
                </div>
              ))}
            </div>
          )}
          {(rt.rating.referrals.length > 0 || rt.rating.messages.length > 0) && (
            <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
              {rt.rating.referrals.map((r, i) => (
                <p key={`ref-${i}`} className="flex items-start gap-1 text-xs text-amber-600">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {r}
                </p>
              ))}
              {rt.rating.messages.map((m, i) => (
                <p key={`msg-${i}`} className="flex items-start gap-1 text-xs text-blue-600">
                  <Info className="mt-0.5 h-3 w-3 shrink-0" /> {m}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Global guardrails */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 bg-navy-800 px-4 py-2.5 text-white">
          <ShieldCheck className="h-4 w-4 text-brand-300" />
          <span className="text-xs font-semibold uppercase tracking-wide">Guardrails</span>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">Decision</span>
            <Badge tone={rt.guardrails.decision === 'Eligible' ? 'green' : rt.guardrails.decision === 'Declined' ? 'red' : 'amber'}>
              {rt.guardrails.decision}
            </Badge>
          </div>
          {rt.guardrails.premiumClamped && (
            <div className="mt-2 text-xs text-slate-500">
              Adjusted premium <span className="font-semibold text-navy-700">${rt.guardrails.adjustedPremium.toLocaleString()}</span>
            </div>
          )}
          {rt.guardrails.findings.length > 0 ? (
            <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
              {rt.guardrails.findings.map((fn) => (
                <p
                  key={fn.id}
                  className={cn(
                    'flex items-start gap-1.5 text-xs',
                    fn.level === 'block' ? 'text-red-600' : fn.level === 'refer' ? 'text-amber-600' : 'text-blue-600',
                  )}
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current" /> {fn.message}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-400">No guardrail issues.</p>
          )}
          <div className="mt-3 border-t border-slate-100 pt-2 text-[11px] font-medium">
            <span className={rt.guardrails.canBind ? 'text-brand-600' : 'text-red-500'}>
              {rt.guardrails.canBind ? '✓ Clear to bind' : '✕ Bind blocked'}
            </span>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="section-title mb-2">Validation</div>
        <div className="space-y-1.5">
          {[
            { icon: AlertCircle, label: 'Blockers', count: rt.validation.blockers.length, tone: 'text-red-500' },
            { icon: AlertTriangle, label: 'Warnings', count: rt.validation.warnings.length, tone: 'text-amber-500' },
            { icon: Info, label: 'Info', count: rt.validation.info.length, tone: 'text-blue-500' },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-slate-600">
                <r.icon className={cn('h-4 w-4', r.tone)} /> {r.label}
              </span>
              <span className="font-semibold text-slate-800">{r.count}</span>
            </div>
          ))}
        </div>
        <div
          className={cn(
            'mt-3 rounded-lg px-3 py-2 text-center text-xs font-medium',
            rt.validation.canSubmit ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-600',
          )}
        >
          {rt.validation.canSubmit
            ? 'Ready to submit'
            : `${rt.validation.blockers.length} blocker${rt.validation.blockers.length > 1 ? 's' : ''} to resolve`}
        </div>
      </div>

      <div className="card p-4">
        <div className="section-title mb-2">Active Logic</div>
        {rt.firedRules.length === 0 ? (
          <p className="text-xs text-slate-400">No conditional rules currently firing.</p>
        ) : (
          <ul className="space-y-1.5">
            {rt.firedRules.map((r) => (
              <li key={r.id} className="flex items-start gap-1.5 text-xs text-slate-600">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" /> {r.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}

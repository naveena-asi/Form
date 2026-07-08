import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
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
  PartyPopper,
  Clock,
  XCircle,
  FileDown,
  ArrowRight,
  Pencil,
} from 'lucide-react'
import { useRuntime } from '@/runtime/useRuntime'
import { useFormStore } from '@/store/useFormStore'
import { usePolicyStore } from '@/store/usePolicyStore'
import { products, formForProduct, quoteType } from '@/data/products'
import { getCarrier } from '@/data/carriers'
import { customer, type Policy } from '@/data/policies'
import { FieldRenderer } from '@/components/runtime/FieldRenderer'
import { Button, Badge, PageHeader } from '@/components/ui'

import { Tabs } from '@/components/ui/Tabs'
import { exportPdf } from '@/lib/pdf'
import type { AnswerValue, Field, Section } from '@/data/types'
import { cn } from '@/lib/cn'

type RT = ReturnType<typeof useRuntime>

function SectionFields({ rt, section, attempted }: { rt: RT; section: Section; attempted: boolean }) {
  const blockerMessages = rt.messages.filter((m) => m.level === 'blocker')
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
            messages={attempted ? blockerMessages : []}
            customer
          />
        ))}
    </div>
  )
}

const sectionBlockers = (rt: RT, section: Section) =>
  rt.messages.filter((m) => m.level === 'blocker' && section.fields.some((f) => f.apiName === m.field))

export default function BuyerApply() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()

  const product = useMemo(() => products.find((p) => p.id === productId), [productId])

  const resetAnswers = useFormStore((s) => s.reset)
  const setRuntimeForm = useFormStore((s) => s.setRuntimeForm)
  const setTxnContext = useFormStore((s) => s.setTxnContext)
  const loadSample = useFormStore((s) => s.loadSample)
  const answers = useFormStore((s) => s.answers)
  const bindPolicy = usePolicyStore((s) => s.bindPolicy)

  const [phase, setPhase] = useState<'fill' | 'review' | 'done'>('fill')
  const [step, setStep] = useState(0)
  const [attempted, setAttempted] = useState(false)
  const [ref] = useState(() => 'VP-B-' + Math.floor(100000 + Math.random() * 899999))
  const [boundPolicy, setBoundPolicy] = useState<Policy | null>(null)

  // Initialize the runtime form state for the product
  useEffect(() => {
    if (product) {
      resetAnswers()
      setRuntimeForm(formForProduct(product, quoteType(product)))
      setTxnContext({ kind: 'quote', productId: product.id })
      setPhase('fill')
      setStep(0)
      setAttempted(false)
      setBoundPolicy(null)
    }
  }, [product, resetAnswers, setRuntimeForm, setTxnContext])

  const rt = useRuntime()
  const carrier = product ? getCarrier(product.carrierId) : null

  if (!product || !rt.form) {
    return (
      <div className="text-center py-10">
        <p className="text-slate-500">Loading application form...</p>
      </div>
    );
  }

  const style = rt.form.navigationStyle
  const sections = rt.visibleSections

  const currentSection = sections[Math.min(step, Math.max(0, sections.length - 1))]
  const blockerMessages = rt.messages.filter((m) => m.level === 'blocker')

  const goNext = () => {
    if (currentSection && sectionBlockers(rt, currentSection).length > 0) {
      setAttempted(true)
      return
    }
    setAttempted(false)
    if (step < sections.length - 1) {
      setStep((s) => s + 1)
    } else {
      setPhase('review')
    }
  }

  const goBack = () => {
    setAttempted(false)
    if (phase === 'review') {
      setPhase('fill')
    } else {
      setStep((s) => Math.max(0, s - 1))
    }
  }

  const submit = () => {
    if (!rt.guardrails.canBind || blockerMessages.length > 0) return
    const insured =
      (answers.businessName as string) ||
      (answers.insuredName as string) ||
      (answers.fullName as string) ||
      customer.company

    const bound = bindPolicy({
      product,
      premium: rt.guardrails.adjustedPremium,
      insured,
    })
    setBoundPolicy(bound)
    setPhase('done')
  }

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={() => navigate('/buyer')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back to Catalog
        </button>
      </div>

      {phase !== 'done' && (
        <PageHeader
          eyebrow={`New Application · ${carrier?.name ?? ''}`}
          title={product.name}
          subtitle={`Fill out the application to see underwriting decision and quote calculation in real time.`}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="subtle" icon={Sparkles} onClick={loadSample}>
                Prefill Sample
              </Button>
              <Button variant="ghost" icon={RotateCcw} onClick={resetAnswers}>
                Reset
              </Button>
            </div>
          }
        />
      )}

      {phase === 'fill' && (
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="w-full">
            {sections.length === 0 ? (
              <div className="card p-10 text-center text-sm text-slate-400">No visible sections.</div>
            ) : style === 'Wizard' ? (
              <WizardView
                rt={rt}
                sections={sections}
                step={step}
                setStep={setStep}
                attempted={attempted}
                goNext={goNext}
                goBack={goBack}
              />
            ) : style === 'Tabs' ? (
              <TabsView
                rt={rt}
                sections={sections}
                activeSectionId={currentSection?.id}
                setStep={setStep}
                attempted={attempted}
                onReview={() => setPhase('review')}
              />
            ) : (
              <StackView
                rt={rt}
                sections={sections}
                accordion={style === 'Accordion'}
                attempted={attempted}
                onReview={() => setPhase('review')}
              />
            )}
          </div>

          <EnginePanel rt={rt} />
        </div>
      )}

      {phase === 'review' && (
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="w-full">
            <div className="mb-6">
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-brand-600">Review Application</div>
              <h1 className="text-2xl font-bold text-slate-900">Verify Details</h1>
              <p className="mt-1 text-sm text-slate-500">Confirm all information is correct before submitting.</p>
            </div>

            <div className="space-y-3">
              {sections.map((s, i) => (
                <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">{s.name}</h3>
                    <button
                      onClick={() => {
                        setStep(i)
                        setPhase('fill')
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                  </div>
                  <dl className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                    {s.fields
                      .filter((f) => f.type !== 'divider' && f.type !== 'label' && f.type !== 'signature')
                      .map((f) => (
                        <div key={f.id} className="flex flex-col">
                          <dt className="text-xs text-slate-400">{f.label}</dt>
                          <dd className="text-sm font-medium text-slate-800">
                            {displayValue(f, answers[f.apiName])}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </div>
              ))}
            </div>

            {blockerMessages.length > 0 && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                Required details are missing. Please click Edit on the sections above to fill them.
              </div>
            )}

            {rt.guardrails.decision === 'Declined' && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span className="font-semibold">Underwriting Blocked.</span> This risk has been declined based on the
                configured guardrails.
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={goBack}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                <ChevronLeft className="h-4 w-4" /> Back to Edit
              </button>
              <Button
                variant="primary"
                iconRight={Check}
                disabled={blockerMessages.length > 0 || !rt.guardrails.canBind}
                onClick={submit}
              >
                {rt.guardrails.decision === 'Referral' ? 'Submit for Referral' : 'Submit & Bind Policy'}
              </Button>
            </div>
          </div>

          <EnginePanel rt={rt} />
        </div>
      )}

      {phase === 'done' && (
        <Confirmation
          rt={rt}
          reference={boundPolicy?.number ?? ref}
          boundPolicy={boundPolicy}
          onRestart={() => {
            resetAnswers()
            setBoundPolicy(null)
            setPhase('fill')
            setStep(0)
            setAttempted(false)
          }}
          onBackToCatalog={() => navigate('/buyer')}
        />
      )}
    </div>
  )
}

function displayValue(field: Field, value: AnswerValue): string {
  if (value === undefined || value === '' || value === null) return '—'
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`
  if (['currency', 'limit', 'deductible'].includes(field.type)) return `${field.prefix ?? '$'}${Number(value).toLocaleString()}`
  const opt = field.options?.find((o) => o.value === value)
  return opt ? opt.label : String(value)
}

// ── Wizard Navigation View ───────────────────────────────────────────────────
interface WizardProps {
  rt: RT
  sections: Section[]
  step: number
  setStep: (s: number) => void
  attempted: boolean
  goNext: () => void
  goBack: () => void
}
function WizardView({ rt, sections, step, setStep, attempted, goNext, goBack }: WizardProps) {
  const current = sections[step]
  const blockers = sectionBlockers(rt, current)

  return (
    <div className="card overflow-hidden bg-white border border-slate-200">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100 bg-slate-50/60 px-3 py-2">
        {sections.map((s, i) => {
          const done = i < step
          const on = i === step
          return (
            <button
              key={s.id}
              onClick={() => {
                if (i <= step || sectionBlockers(rt, sections[step]).length === 0) setStep(i)
              }}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition',
                on ? 'bg-navy-50 text-navy-800' : 'text-slate-500 hover:bg-slate-100'
              )}
            >
              <span
                className={cn(
                  'grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold',
                  done ? 'bg-brand-500 text-white' : on ? 'bg-navy-700 text-white' : 'bg-slate-200 text-slate-500'
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
        <SectionFields rt={rt} section={current} attempted={attempted} />
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5">
        <Button variant="ghost" icon={ChevronLeft} disabled={step === 0} onClick={goBack}>
          Back
        </Button>
        {blockers.length > 0 && attempted && (
          <span className="flex items-center gap-1 text-xs text-amber-600">
            <Lock className="h-3.5 w-3.5" /> Resolve {blockers.length} required field{blockers.length > 1 ? 's' : ''} to continue
          </span>
        )}
        <Button variant="secondary" iconRight={ChevronRight} onClick={goNext}>
          {step < sections.length - 1 ? 'Next' : 'Review & Submit'}
        </Button>
      </div>
    </div>
  )
}

// ── Tabs Navigation View ─────────────────────────────────────────────────────
interface TabsProps {
  rt: RT
  sections: Section[]
  activeSectionId: string
  setStep: (s: number) => void
  attempted: boolean
  onReview: () => void
}
function TabsView({ rt, sections, activeSectionId, setStep, attempted, onReview }: TabsProps) {
  const current = sections.find((s) => s.id === activeSectionId) ?? sections[0]
  const index = sections.findIndex((s) => s.id === current.id)

  return (
    <div className="card overflow-hidden bg-white border border-slate-200">
      <div className="overflow-x-auto px-3 pt-2 bg-slate-50/40">
        <Tabs
          items={sections.map((s) => ({
            id: s.id,
            label: s.name,
            count: sectionBlockers(rt, s).length || undefined,
          }))}
          active={current.id}
          onChange={(id) => {
            const nextIdx = sections.findIndex((s) => s.id === id)
            setStep(nextIdx)
          }}
        />
      </div>
      <div className="border-b border-slate-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-900">{current.name}</h2>
        {current.description && <p className="text-xs text-slate-500">{current.description}</p>}
      </div>
      <div className="p-5">
        <SectionFields rt={rt} section={current} attempted={attempted} />
      </div>
      <div className="flex justify-between border-t border-slate-100 px-5 py-3.5">
        <Button variant="ghost" icon={ChevronLeft} disabled={index === 0} onClick={() => setStep(index - 1)}>
          Back
        </Button>
        <Button
          variant="secondary"
          iconRight={ChevronRight}
          onClick={() => {
            if (index < sections.length - 1) setStep(index + 1)
            else onReview()
          }}
        >
          {index < sections.length - 1 ? 'Next' : 'Review & Submit'}
        </Button>
      </div>
    </div>
  )
}

// ── Stack View (Accordion / Multi-Section scroll) ────────────────────────────
interface StackProps {
  rt: RT
  sections: Section[]
  accordion: boolean
  attempted: boolean
  onReview: () => void
}
function StackView({ rt, sections, accordion, attempted, onReview }: StackProps) {
  const [open, setOpen] = useState<Set<string>>(
    () => new Set<string>(accordion ? [sections[0]?.id] : sections.map((s) => s.id))
  )
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
          <div key={s.id} className="card overflow-hidden bg-white border border-slate-200">
            <button
              onClick={() => accordion && toggle(s.id)}
              className={cn(
                'flex w-full items-center justify-between px-5 py-3 text-left',
                accordion && 'hover:bg-slate-50'
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'grid h-5 w-5 place-items-center rounded-full text-white',
                    blockers.length ? 'bg-amber-500' : 'bg-brand-500'
                  )}
                >
                  {blockers.length ? <AlertTriangle className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">{s.name}</h2>
                  {s.description && <p className="text-xs text-slate-500">{s.description}</p>}
                </div>
              </div>
            </button>
            {isOpen(s.id) && (
              <div className="border-t border-slate-100 p-5">
                <SectionFields rt={rt} section={s} attempted={attempted} />
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

// ── Rating Engines & Sidebar panel ───────────────────────────────────────────
function EnginePanel({ rt }: { rt: RT }) {
  return (
    <aside className="space-y-4">
      <div className="card overflow-hidden bg-white border border-slate-200 shadow-card">
        <div className="flex items-center gap-2 bg-navy-800 px-4 py-2.5 text-white">
          <Zap className="h-4 w-4 text-brand-300" />
          <span className="text-xs font-semibold uppercase tracking-wide">Rating Engine</span>
        </div>
        <div className="p-4">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">Live Quote</div>
          <div className="text-3xl font-bold text-navy-800">${rt.rating.premium.toLocaleString()}</div>
          <div className="mt-1 text-xs text-slate-400">base: ${rt.rating.basePremium.toLocaleString()}</div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone="navy">Tier: {rt.rating.tier}</Badge>
            <Badge
              tone={
                rt.rating.eligibility === 'Eligible'
                  ? 'green'
                  : rt.rating.eligibility === 'Declined'
                  ? 'red'
                  : 'amber'
              }
            >
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
      <div className="card overflow-hidden bg-white border border-slate-200 shadow-card">
        <div className="flex items-center gap-2 bg-navy-800 px-4 py-2.5 text-white">
          <ShieldCheck className="h-4 w-4 text-brand-300" />
          <span className="text-xs font-semibold uppercase tracking-wide">Underwriting</span>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">Guardrails</span>
            <Badge
              tone={
                rt.guardrails.decision === 'Eligible'
                  ? 'green'
                  : rt.guardrails.decision === 'Declined'
                  ? 'red'
                  : 'amber'
              }
            >
              {rt.guardrails.decision}
            </Badge>
          </div>
          {rt.guardrails.premiumClamped && (
            <div className="mt-2 text-xs text-slate-500">
              Adjusted premium:{' '}
              <span className="font-semibold text-navy-700">
                ${rt.guardrails.adjustedPremium.toLocaleString()}
              </span>
            </div>
          )}
          {rt.guardrails.findings.length > 0 ? (
            <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
              {rt.guardrails.findings.map((fn) => (
                <p
                  key={fn.id}
                  className={cn(
                    'flex items-start gap-1.5 text-xs',
                    fn.level === 'block'
                      ? 'text-red-600'
                      : fn.level === 'refer'
                      ? 'text-amber-600'
                      : 'text-blue-600'
                  )}
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current" /> {fn.message}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-400">Clear of restrictions.</p>
          )}
          <div className="mt-3 border-t border-slate-100 pt-2 text-[11px] font-medium">
            <span className={rt.guardrails.canBind ? 'text-brand-600' : 'text-red-500'}>
              {rt.guardrails.canBind ? '✓ Eligible to bind' : '✕ Bind blocked'}
            </span>
          </div>
        </div>
      </div>

      <div className="card p-4 bg-white border border-slate-200 shadow-card">
        <div className="section-title mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Validation Info
        </div>
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
            rt.validation.canSubmit ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-600'
          )}
        >
          {rt.validation.canSubmit
            ? 'Form Validated'
            : `${rt.validation.blockers.length} blocker${rt.validation.blockers.length > 1 ? 's' : ''} remaining`}
        </div>
      </div>
    </aside>
  )
}

// ── Quote / Policy confirmation view ─────────────────────────────────────────
interface ConfirmationProps {
  rt: RT
  reference: string
  boundPolicy?: Policy | null
  onRestart: () => void
  onBackToCatalog: () => void
}
function Confirmation({ rt, reference, boundPolicy, onRestart, onBackToCatalog }: ConfirmationProps) {
  const elig = rt.guardrails.decision
  const banner =
    elig === 'Eligible'
      ? { icon: PartyPopper, tone: 'text-brand-600', bg: 'bg-brand-50', title: 'Quote generated successfully!', note: 'Review your estimated annual premium details below.' }
      : elig === 'Referral'
      ? { icon: Clock, tone: 'text-amber-600', bg: 'bg-amber-50', title: 'Application Referred', note: 'Your quote is pending underwriting review.' }
      : { icon: XCircle, tone: 'text-red-600', bg: 'bg-red-50', title: 'Declined', note: 'We could not provide an online quote for this risk.' }

  return (
    <div className="text-center max-w-xl mx-auto py-6">
      <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-600">
        <CheckCircleIcon className="h-9 w-9" />
      </span>
      <h1 className="text-2xl font-bold text-slate-900">
        {boundPolicy ? 'Policy Issued & Bound' : 'Application Complete'}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {boundPolicy ? 'Policy #' : 'Reference ID'}:{' '}
        <span className="font-mono font-medium text-slate-700">{reference}</span>
      </p>

      {/* Quote summary card */}
      <div className="mx-auto mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-card">
        <div className={cn('flex items-center gap-3 px-5 py-4', banner.bg)}>
          <banner.icon className={cn('h-6 w-6 shrink-0', banner.tone)} />
          <div>
            <div className="text-sm font-semibold text-slate-900">{banner.title}</div>
            <div className="text-xs text-slate-500">{banner.note}</div>
          </div>
        </div>
        {elig !== 'Declined' && rt.guardrails.adjustedPremium > 0 && (
          <div className="px-5 py-6 text-center">
            <div className="text-xs uppercase tracking-wide text-slate-400">Total Bound Premium</div>
            <div className="mt-1 text-4xl font-bold text-navy-800">
              ${rt.guardrails.adjustedPremium.toLocaleString()}
              <span className="text-xs font-normal text-slate-400">/year</span>
            </div>
            <div className="mt-1 text-xs text-slate-400">{rt.form.name}</div>
            {rt.rating.tier && rt.rating.tier !== 'Standard' && (
              <span className="mt-3 inline-block rounded-full bg-navy-50 px-3 py-1 text-xs font-medium text-navy-700">
                {rt.rating.tier} plan
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <Button variant="primary" icon={ArrowRight} onClick={onBackToCatalog}>
          Return to Catalog
        </Button>
        <button
          onClick={() =>
            exportPdf({
              form: rt.form,
              answers: rt.answers,
              rating: rt.rating,
              formulaValues: rt.formulaValues,
              isHidden: rt.isHidden,
            })
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
        >
          <FileDown className="h-4 w-4" /> Download Summary
        </button>
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 transition"
        >
          <RotateCcw className="h-4 w-4" /> Clear & Restart
        </button>
      </div>
    </div>
  )
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      ></path>
    </svg>
  )
}

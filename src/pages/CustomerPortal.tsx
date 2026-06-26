// ─────────────────────────────────────────────────────────────────────────────
// Customer Portal — how the configured form looks to an END CUSTOMER (applicant).
// Standalone, branded, no admin chrome / engine internals. Renders the live
// active form from metadata (same engines: conditional logic, validation,
// formula, rating) as a clean guided application ending in a quote.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  Lock,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  Pencil,
  FileDown,
  RotateCcw,
  PartyPopper,
  Clock,
  XCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { useRuntime } from '@/runtime/useRuntime'
import { useFormStore } from '@/store/useFormStore'
import { usePolicyStore } from '@/store/usePolicyStore'
import { getProduct } from '@/data/products'
import { customer, type Policy } from '@/data/policies'
import { FieldRenderer } from '@/components/runtime/FieldRenderer'
import { exportPdf } from '@/lib/pdf'
import type { AnswerValue, Field, Section } from '@/data/types'
import { cn } from '@/lib/cn'

const SKIP_TYPES = new Set(['hidden', 'system', 'computed', 'premium'])

interface TxnMeta {
  verb: string
  done: string
  premium: boolean
  msg: string
  refLabel: string
}
const TXN: Record<string, TxnMeta> = {
  Application: { verb: 'New application', done: 'Application submitted', premium: true, msg: 'Based on your answers, here is your estimated quote.', refLabel: 'Reference' },
  Quote: { verb: 'New quote', done: 'Quote requested', premium: true, msg: 'Based on your answers, here is your estimated quote.', refLabel: 'Reference' },
  Endorsement: { verb: 'Policy change request', done: 'Change request submitted', premium: false, msg: 'We’ll review the change and email a confirmation with any premium adjustment.', refLabel: 'Reference' },
  Cancellation: { verb: 'Cancellation request', done: 'Cancellation requested', premium: false, msg: 'We’ll process your cancellation and confirm the effective date.', refLabel: 'Reference' },
  Claim: { verb: 'New claim', done: 'Claim submitted', premium: false, msg: 'A claims adjuster will reach out shortly. Please keep your claim number handy.', refLabel: 'Claim #' },
  Renewal: { verb: 'Renewal request', done: 'Renewal submitted', premium: false, msg: 'Your renewed policy will be issued shortly.', refLabel: 'Reference' },
}
const txnOf = (t: string): TxnMeta => TXN[t] ?? TXN.Application

function displayValue(field: Field, value: AnswerValue): string {
  if (value === undefined || value === '' || value === null) return '—'
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`
  if (['currency', 'limit', 'deductible'].includes(field.type)) return `${field.prefix ?? '$'}${Number(value).toLocaleString()}`
  const opt = field.options?.find((o) => o.value === value)
  return opt ? opt.label : String(value)
}

export default function CustomerPortal() {
  const navigate = useNavigate()
  const rt = useRuntime()
  const answers = useFormStore((s) => s.answers)
  const reset = useFormStore((s) => s.reset)
  const loadSample = useFormStore((s) => s.loadSample)

  const txnContext = useFormStore((s) => s.txnContext)
  const bindPolicy = usePolicyStore((s) => s.bindPolicy)
  const updatePolicy = usePolicyStore((s) => s.updatePolicy)

  const [phase, setPhase] = useState<'fill' | 'review' | 'done'>('fill')
  const [step, setStep] = useState(0)
  const [attempted, setAttempted] = useState(false)
  const [ref] = useState(() => 'VP-' + Math.floor(100000 + Math.random() * 899999))
  const [boundPolicy, setBoundPolicy] = useState<Policy | null>(null)
  const txn = txnOf(rt.form.type)

  // On submit, close the chain: bind a new policy (quote) or update an existing one.
  // Guardrails gate this — a declined risk can't reach here; a referral is submitted
  // for review without binding; an eligible quote binds at the guardrail-adjusted premium.
  const submit = () => {
    if (!rt.guardrails.canBind) return
    const ctx = txnContext
    if (ctx?.kind === 'quote' && ctx.productId) {
      const product = getProduct(ctx.productId)
      if (product && rt.guardrails.decision === 'Eligible') {
        const insured =
          (answers.businessName as string) || (answers.insuredName as string) || (answers.fullName as string) || customer.company
        setBoundPolicy(bindPolicy({ product, premium: rt.guardrails.adjustedPremium, insured }))
      }
    } else if (ctx?.policyId) {
      if (ctx.kind === 'cancellation') updatePolicy(ctx.policyId, { status: 'Cancelled' })
      else if (ctx.kind === 'renewal') {
        const next = new Date()
        next.setFullYear(next.getFullYear() + 1)
        updatePolicy(ctx.policyId, { status: 'Active', effectiveDate: new Date().toISOString().slice(0, 10), expirationDate: next.toISOString().slice(0, 10) })
      }
    }
    setPhase('done')
  }

  // Customer-visible sections (drop derived/system fields and empty sections).
  const sections = useMemo(
    () =>
      rt.visibleSections
        .map((s) => ({ ...s, fields: s.fields.filter((f) => !rt.isHidden(f.apiName) && !SKIP_TYPES.has(f.type)) }))
        .filter((s) => s.fields.length > 0),
    [rt],
  )

  const safeStep = Math.min(step, Math.max(0, sections.length - 1))
  const current = sections[safeStep]

  const sectionBlockers = (s: Section | undefined) =>
    s ? rt.messages.filter((m) => m.level === 'blocker' && s.fields.some((f) => f.apiName === m.field)) : []
  const blockerMessages = rt.messages.filter((m) => m.level === 'blocker')

  const goNext = () => {
    if (sectionBlockers(current).length > 0) {
      setAttempted(true)
      return
    }
    setAttempted(false)
    if (safeStep < sections.length - 1) setStep((s) => s + 1)
    else setPhase('review')
  }
  const goBack = () => {
    setAttempted(false)
    if (phase === 'review') setPhase('fill')
    else setStep((s) => Math.max(0, s - 1))
  }

  const totalSteps = sections.length + 1
  const progressIndex = phase === 'review' ? sections.length : safeStep
  const progress = Math.round(((progressIndex + 1) / totalSteps) * 100)

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white">
      {/* Brand header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight text-navy-800">VENUSPRO Insurance</div>
              <div className="text-[11px] text-slate-400">{rt.form.product} · {txn.verb}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1 text-[11px] text-slate-400 sm:flex">
              <Lock className="h-3 w-3" /> Secure
            </span>
            <button onClick={() => navigate('/portal')} className="text-xs font-medium text-slate-400 hover:text-slate-600">
              Exit
            </button>
          </div>
        </div>
        {phase !== 'done' && (
          <div className="h-1 w-full bg-slate-100">
            <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
        {phase === 'fill' && current && (
          <div>
            <div className="mb-6">
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-brand-600">
                Step {safeStep + 1} of {totalSteps}
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{current.name}</h1>
              {current.description && <p className="mt-1 text-sm text-slate-500">{current.description}</p>}
            </div>

            {attempted && sectionBlockers(current).length > 0 && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                Please complete the highlighted field{sectionBlockers(current).length > 1 ? 's' : ''} to continue.
              </div>
            )}

            <div className={cn('grid gap-5', current.columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1')}>
              {current.fields.map((f) => (
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

            <div className="mt-8 flex items-center justify-between">
              {safeStep > 0 ? (
                <button onClick={goBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={goNext}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
              >
                {safeStep < sections.length - 1 ? 'Continue' : 'Review'}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {rt.form.id === 'frm-commercial-auto' && (
              <button
                onClick={() => loadSample()}
                className="mx-auto mt-6 block text-[11px] text-slate-300 hover:text-slate-500"
              >
                Prefill demo data
              </button>
            )}
          </div>
        )}

        {phase === 'review' && (
          <div>
            <div className="mb-6">
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-brand-600">Almost done</div>
              <h1 className="text-2xl font-bold text-slate-900">Review your details</h1>
              <p className="mt-1 text-sm text-slate-500">Check everything looks right, then submit your application.</p>
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
                          <dd className="text-sm font-medium text-slate-800">{displayValue(f, answers[f.apiName])}</dd>
                        </div>
                      ))}
                  </dl>
                </div>
              ))}
            </div>

            {rt.guardrails.findings.length > 0 && <GuardrailPanel guardrails={rt.guardrails} />}

            {blockerMessages.length > 0 && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                Some required details are missing. Use “Edit” above to complete them.
              </div>
            )}

            {rt.guardrails.decision === 'Declined' && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span className="font-semibold">This risk can’t be bound.</span> It was declined by our underwriting
                guardrails — see the reasons above.
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <button onClick={goBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={submit}
                disabled={blockerMessages.length > 0 || !rt.guardrails.canBind}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50"
              >
                {rt.guardrails.decision === 'Referral' ? 'Submit for review' : txn.premium ? 'Submit application' : 'Submit'}
                <Check className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {phase === 'done' && (
          <Confirmation
            rt={rt}
            reference={boundPolicy?.number ?? ref}
            txn={txn}
            boundPolicy={boundPolicy}
            onViewPolicy={boundPolicy ? () => navigate(`/portal/policies/${boundPolicy.id}`) : undefined}
            onRestart={() => {
              reset()
              setBoundPolicy(null)
              setPhase('fill')
              setStep(0)
              setAttempted(false)
            }}
          />
        )}
      </main>

      <footer className="mx-auto w-full max-w-2xl px-5 pb-6 text-center text-[11px] text-slate-400">
        Powered by VENUSPRO · This is a demo applicant experience driven entirely by the form's metadata.
      </footer>
    </div>
  )
}

function Confirmation({
  rt,
  reference,
  txn,
  boundPolicy,
  onViewPolicy,
  onRestart,
}: {
  rt: ReturnType<typeof useRuntime>
  reference: string
  txn: TxnMeta
  boundPolicy?: Policy | null
  onViewPolicy?: () => void
  onRestart: () => void
}) {
  const elig = rt.guardrails.decision
  // Premium transactions (new application/quote) show an eligibility-aware quote.
  const banner =
    !txn.premium
      ? { icon: CheckCircle2, tone: 'text-brand-600', bg: 'bg-brand-50', title: 'All set', note: txn.msg }
      : elig === 'Eligible'
        ? { icon: PartyPopper, tone: 'text-brand-600', bg: 'bg-brand-50', title: "You're pre-qualified!", note: txn.msg }
        : elig === 'Referral'
          ? { icon: Clock, tone: 'text-amber-600', bg: 'bg-amber-50', title: 'Under review', note: 'A specialist will review your application and follow up shortly.' }
          : { icon: XCircle, tone: 'text-red-600', bg: 'bg-red-50', title: 'We’ll be in touch', note: 'We couldn’t finalize an online quote, but our team will contact you.' }
  const showPremium = txn.premium && elig !== 'Declined' && rt.guardrails.adjustedPremium > 0

  return (
    <div className="text-center">
      <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-600">
        <CheckCircle2 className="h-9 w-9" />
      </span>
      <h1 className="text-2xl font-bold text-slate-900">{boundPolicy ? 'Policy bound!' : txn.done}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {boundPolicy ? 'Policy number' : txn.refLabel}{' '}
        <span className="font-mono font-medium text-slate-700">{reference}</span>
      </p>

      {/* Quote card */}
      <div className="mx-auto mt-7 max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-card">
        <div className={cn('flex items-center gap-3 px-5 py-4', banner.bg)}>
          <banner.icon className={cn('h-6 w-6 shrink-0', banner.tone)} />
          <div>
            <div className="text-sm font-semibold text-slate-900">{banner.title}</div>
            <div className="text-xs text-slate-500">{banner.note}</div>
          </div>
        </div>
        {showPremium && (
          <div className="px-5 py-6 text-center">
            <div className="text-xs uppercase tracking-wide text-slate-400">Estimated annual premium</div>
            <div className="mt-1 text-4xl font-bold text-navy-800">${rt.guardrails.adjustedPremium.toLocaleString()}</div>
            <div className="mt-1 text-xs text-slate-400">{rt.form.name}</div>
            {rt.rating.tier && rt.rating.tier !== 'Standard' && (
              <span className="mt-3 inline-block rounded-full bg-navy-50 px-3 py-1 text-xs font-medium text-navy-700">
                {rt.rating.tier} plan
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
        {onViewPolicy && (
          <button
            onClick={onViewPolicy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
          >
            View your policy <ArrowRight className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => exportPdf({ form: rt.form, answers: rt.answers, rating: rt.rating, formulaValues: rt.formulaValues, isHidden: rt.isHidden })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <FileDown className="h-4 w-4" /> Download summary
        </button>
        <button onClick={onRestart} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100">
          <RotateCcw className="h-4 w-4" /> Start over
        </button>
      </div>

      <p className="mt-8 inline-flex items-center gap-1.5 text-[11px] text-slate-400">
        <Sparkles className="h-3 w-3" /> Quote estimated live from your answers — final terms subject to underwriting.
      </p>
    </div>
  )
}

const LEVEL_STYLE: Record<string, { cls: string; tag: string }> = {
  block: { cls: 'border-red-200 bg-red-50 text-red-700', tag: 'Blocks bind' },
  refer: { cls: 'border-amber-200 bg-amber-50 text-amber-700', tag: 'Referral' },
  warn: { cls: 'border-blue-200 bg-blue-50 text-blue-700', tag: 'Notice' },
}
const DECISION_STYLE: Record<string, string> = {
  Eligible: 'bg-brand-50 text-brand-700',
  Referral: 'bg-amber-50 text-amber-700',
  Declined: 'bg-red-50 text-red-700',
}

function GuardrailPanel({ guardrails }: { guardrails: ReturnType<typeof useRuntime>['guardrails'] }) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5" /> Underwriting guardrails
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', DECISION_STYLE[guardrails.decision])}>
          {guardrails.decision}
        </span>
      </div>
      <div className="space-y-1.5">
        {guardrails.findings.map((fn) => (
          <div key={fn.id} className={cn('flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm', LEVEL_STYLE[fn.level].cls)}>
            <span>
              <span className="font-medium">{fn.category}:</span> {fn.message}
            </span>
            <span className="shrink-0 rounded bg-white/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              {LEVEL_STYLE[fn.level].tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

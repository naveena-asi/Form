import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Pencil,
  Check,
  Save,
  FileDown,
  Send,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react'
import { useRuntime } from '@/runtime/useRuntime'
import { Button, Card, Badge, PageHeader } from '@/components/ui'
import { Modal } from '@/components/ui/Modal'
import { exportJson } from '@/lib/exporters'
import { exportPdf } from '@/lib/pdf'
import type { AnswerValue, Field, Section } from '@/data/types'
import { cn } from '@/lib/cn'

function displayValue(field: Field, value: AnswerValue, formula?: string | number): string {
  if (field.formula && formula !== undefined && formula !== '')
    return `${field.prefix ?? ''}${Number(formula).toLocaleString()}`
  if (value === undefined || value === '' || value === null) return '—'
  if (field.type === 'signature')
    return String(value).startsWith('data:image') ? 'Signed ✓' : `Signed — ${value}`
  if (Array.isArray(value)) return `${value.length} row${value.length === 1 ? '' : 's'}`
  if (field.type === 'currency' || field.type === 'limit' || field.type === 'deductible')
    return `${field.prefix ?? '$'}${Number(value).toLocaleString()}`
  const opt = field.options?.find((o) => o.value === value)
  return opt ? opt.label : String(value)
}

export default function ReviewSubmit() {
  const navigate = useNavigate()
  const rt = useRuntime()
  const [submitted, setSubmitted] = useState(false)

  const sections = rt.visibleSections

  return (
    <div>
      <PageHeader
        eyebrow="Runtime"
        title="Review & Submit"
        subtitle="Confirm every section before submitting the application."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/preview')}>
              Back to Form
            </Button>
            <Button variant="subtle" icon={Save}>
              Save Draft
            </Button>
            <Button
              variant="subtle"
              icon={FileDown}
              onClick={() => exportPdf({ form: rt.form, answers: rt.answers, rating: rt.rating, formulaValues: rt.formulaValues, isHidden: rt.isHidden })}
            >
              Generate PDF
            </Button>
            <Button
              variant="primary"
              icon={Send}
              disabled={!rt.validation.canSubmit}
              onClick={() => setSubmitted(true)}
            >
              Submit
            </Button>
          </div>
        }
      />

      {/* Validation banner */}
      <div
        className={cn(
          'mb-5 flex items-center gap-3 rounded-xl border px-4 py-3',
          rt.validation.canSubmit
            ? 'border-brand-200 bg-brand-50'
            : 'border-red-200 bg-red-50',
        )}
      >
        {rt.validation.canSubmit ? (
          <CheckCircle2 className="h-5 w-5 text-brand-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-600" />
        )}
        <div className="text-sm">
          <span className="font-medium text-slate-800">
            {rt.validation.canSubmit
              ? 'All required checks passed.'
              : `${rt.validation.blockers.length} blocker(s) must be resolved before submitting.`}
          </span>{' '}
          <span className="text-slate-500">
            {rt.validation.warnings.length} warning(s), {rt.validation.info.length} info.
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {sections.map((section) => (
            <SectionReview key={section.id} section={section} rt={rt} onEdit={() => navigate('/preview')} />
          ))}
        </div>

        <aside className="space-y-4">
          <Card className="overflow-hidden">
            <div className="bg-navy-800 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white">
              Quote Summary
            </div>
            <div className="p-4">
              <div className="text-[11px] uppercase tracking-wide text-slate-400">Rated Premium</div>
              <div className="text-3xl font-bold text-navy-800">
                ${rt.rating.premium.toLocaleString()}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
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
            </div>
          </Card>

          {(rt.validation.warnings.length > 0 || rt.validation.info.length > 0) && (
            <Card className="p-4">
              <div className="section-title mb-2">Advisories</div>
              <ul className="space-y-1.5">
                {rt.validation.warnings.map((m, i) => (
                  <li key={`w${i}`} className="flex items-start gap-1.5 text-xs text-amber-600">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {m.message}
                  </li>
                ))}
                {rt.validation.info.map((m, i) => (
                  <li key={`i${i}`} className="flex items-start gap-1.5 text-xs text-blue-600">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {m.message}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </div>

      <Modal
        open={submitted}
        onClose={() => setSubmitted(false)}
        title="Application Submitted"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSubmitted(false)}>
              Close
            </Button>
            <Button variant="primary" icon={FileDown} onClick={() => exportJson(rt.form, rt.answers)}>
              Download JSON
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-600">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <div className="text-sm text-slate-600">
            <p className="font-medium text-slate-900">
              {rt.form.name} submitted successfully.
            </p>
            <p className="mt-1">
              Rated premium <span className="font-semibold">${rt.rating.premium.toLocaleString()}</span> ·
              Tier {rt.rating.tier} · {rt.rating.eligibility}. A confirmation has been written to the
              audit log.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function SectionReview({
  section,
  rt,
  onEdit,
}: {
  section: Section
  rt: ReturnType<typeof useRuntime>
  onEdit: () => void
}) {
  const fields = section.fields.filter((f) => !rt.isHidden(f.apiName) && f.type !== 'divider' && f.type !== 'label')
  const sectionMsgs = rt.messages.filter((m) => fields.some((f) => f.apiName === m.field))
  const hasBlocker = sectionMsgs.some((m) => m.level === 'blocker')

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'grid h-5 w-5 place-items-center rounded-full text-white',
              hasBlocker ? 'bg-red-500' : 'bg-brand-500',
            )}
          >
            {hasBlocker ? <AlertCircle className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
          </span>
          <h3 className="text-sm font-semibold text-slate-900">{section.name}</h3>
        </div>
        <Button size="sm" variant="ghost" icon={Pencil} onClick={onEdit}>
          Edit
        </Button>
      </div>
      <dl className="grid gap-x-6 gap-y-3 px-5 py-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.id} className="flex flex-col">
            <dt className="text-xs text-slate-400">{f.label}</dt>
            <dd className="text-sm font-medium text-slate-800">
              {displayValue(f, rt.answers[f.apiName], rt.formulaValues[f.apiName])}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

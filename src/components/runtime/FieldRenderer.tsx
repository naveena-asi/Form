import { useFormStore } from '@/store/useFormStore'
import type { Field } from '@/data/types'
import { cn } from '@/lib/cn'
import { GridField } from './GridField'
import { SignatureField } from './SignatureField'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import type { ValidationMessage } from '@/engines/validationEngine'

const TEXTY = new Set(['text', 'email', 'phone', 'url', 'zip', 'classcode'])
const NUMERIC = new Set(['number', 'decimal', 'currency', 'percentage', 'limit', 'deductible'])

function levelIcon(level: string) {
  if (level === 'blocker') return <AlertCircle className="h-3.5 w-3.5 text-red-500" />
  if (level === 'warning') return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
  return <Info className="h-3.5 w-3.5 text-blue-500" />
}

export function FieldRenderer({
  field,
  required,
  disabled,
  formulaValue,
  messages,
  customer = false,
}: {
  field: Field
  required: boolean
  disabled: boolean
  formulaValue?: string | number
  messages: ValidationMessage[]
  customer?: boolean
}) {
  const value = useFormStore((s) => s.answers[field.apiName])
  const setAnswer = useFormStore((s) => s.setAnswer)
  const fieldMessages = messages.filter((m) => m.field === field.apiName)
  const hasBlocker = fieldMessages.some((m) => m.level === 'blocker')

  // Non-input presentational types
  if (field.type === 'divider') return <hr className="my-1 border-slate-200" />
  if (field.type === 'label')
    return <p className="text-sm font-medium text-slate-700">{field.label}</p>

  const span = field.colSpan === 2 ? 'sm:col-span-2' : ''

  const labelEl = (
    <label className="label flex items-center gap-1.5">
      {field.label}
      {required && <span className="text-red-500">*</span>}
      {!customer && field.group === 'Insurance' && (
        <span className="rounded bg-navy-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-navy-600">
          INS
        </span>
      )}
    </label>
  )

  const inputClass = cn('input', hasBlocker && 'border-red-300 focus:border-red-400 focus:ring-red-500/20')

  let control: React.ReactNode = null

  if (field.type === 'grid' && field.grid) {
    return (
      <div className={cn('sm:col-span-2')}>
        {labelEl}
        <GridField field={field} />
        <FieldMessages messages={fieldMessages} />
      </div>
    )
  }

  if (field.type === 'premium' || field.type === 'computed' || field.type === 'system') {
    control = (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-navy-200 bg-navy-50/40 px-3 py-2.5">
        <span className="text-lg font-bold text-navy-800">
          {field.prefix}
          {formulaValue !== undefined && formulaValue !== ''
            ? Number(formulaValue).toLocaleString()
            : '—'}
        </span>
        <span className="ml-auto rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
          ƒ {field.formula}
        </span>
      </div>
    )
  } else if (TEXTY.has(field.type)) {
    control = (
      <input
        className={inputClass}
        type={field.type === 'email' ? 'email' : 'text'}
        placeholder={field.placeholder}
        value={(value as string) ?? ''}
        disabled={disabled}
        onChange={(e) => setAnswer(field.apiName, e.target.value)}
      />
    )
  } else if (NUMERIC.has(field.type)) {
    control = (
      <div className="relative">
        {field.prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            {field.prefix}
          </span>
        )}
        <input
          className={cn(inputClass, field.prefix && 'pl-7')}
          type="number"
          placeholder={field.placeholder}
          value={(value as number) ?? ''}
          disabled={disabled}
          onChange={(e) =>
            setAnswer(field.apiName, e.target.value === '' ? '' : Number(e.target.value))
          }
        />
      </div>
    )
  } else if (
    field.type === 'select' ||
    field.type === 'state' ||
    field.type === 'country' ||
    field.type === 'coverage'
  ) {
    control = (
      <select
        className={cn('select', hasBlocker && 'border-red-300')}
        value={(value as string) ?? ''}
        disabled={disabled}
        onChange={(e) => setAnswer(field.apiName, e.target.value)}
      >
        <option value="">Select…</option>
        {field.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    )
  } else if (field.type === 'radio') {
    control = (
      <div className="flex flex-wrap gap-3 pt-1">
        {field.options?.map((o) => (
          <label key={o.value} className="inline-flex items-center gap-1.5 text-sm text-slate-700">
            <input
              type="radio"
              name={field.apiName}
              checked={value === o.value}
              onChange={() => setAnswer(field.apiName, o.value)}
              className="text-brand-500 focus:ring-brand-500/30"
            />
            {o.label}
          </label>
        ))}
      </div>
    )
  } else if (field.type === 'checkbox') {
    control = (
      <label className="inline-flex items-center gap-2 pt-1 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => setAnswer(field.apiName, e.target.checked)}
          className="rounded text-brand-500 focus:ring-brand-500/30"
        />
        {field.placeholder ?? 'Yes'}
      </label>
    )
  } else if (field.type === 'date' || field.type === 'datetime' || field.type === 'time') {
    control = (
      <input
        className={inputClass}
        type={field.type === 'datetime' ? 'datetime-local' : field.type}
        value={(value as string) ?? ''}
        disabled={disabled}
        onChange={(e) => setAnswer(field.apiName, e.target.value)}
      />
    )
  } else if (field.type === 'address' || field.type === 'richtext') {
    control = (
      <textarea
        className="textarea"
        rows={field.type === 'address' ? 2 : 3}
        placeholder={field.placeholder ?? 'Street, City, State ZIP'}
        value={(value as string) ?? ''}
        disabled={disabled}
        onChange={(e) => setAnswer(field.apiName, e.target.value)}
      />
    )
  } else if (field.type === 'file' || field.type === 'image') {
    control = (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-xs text-slate-400">
        Drop {field.type === 'image' ? 'an image' : 'a file'} or click to upload
      </div>
    )
  } else if (field.type === 'signature') {
    control = <SignatureField apiName={field.apiName} disabled={disabled} />
  } else {
    control = (
      <input
        className={inputClass}
        placeholder={field.placeholder}
        value={(value as string) ?? ''}
        disabled={disabled}
        onChange={(e) => setAnswer(field.apiName, e.target.value)}
      />
    )
  }

  return (
    <div className={span}>
      {labelEl}
      {control}
      {field.helpText && !fieldMessages.length && (
        <p className="mt-1 text-xs text-slate-400">{field.helpText}</p>
      )}
      <FieldMessages messages={fieldMessages} />
    </div>
  )
}

function FieldMessages({ messages }: { messages: ValidationMessage[] }) {
  if (!messages.length) return null
  return (
    <div className="mt-1 space-y-0.5">
      {messages.map((m, i) => (
        <p
          key={i}
          className={cn(
            'flex items-center gap-1 text-xs',
            m.level === 'blocker' && 'text-red-600',
            m.level === 'warning' && 'text-amber-600',
            m.level === 'info' && 'text-blue-600',
          )}
        >
          {levelIcon(m.level)}
          {m.message}
        </p>
      ))}
    </div>
  )
}

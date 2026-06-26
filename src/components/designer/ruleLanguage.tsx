// ─────────────────────────────────────────────────────────────────────────────
// Renders conditions and actions as plain-English with friendly pills, using
// human field/section labels instead of apiNames/ids. Shared by the rule cards
// and the live editor preview.
// ─────────────────────────────────────────────────────────────────────────────
import { Fragment, type ReactNode } from 'react'
import type { Condition, ConditionGroup, RuleAction } from '@/data/types'

export interface FieldMeta {
  apiName: string
  label: string
  options?: { label: string; value: string }[]
}

const OP: Record<Condition['operator'], string> = {
  equals: 'is',
  notEquals: 'is not',
  greaterThan: 'is greater than',
  lessThan: 'is less than',
  greaterOrEqual: 'is at least',
  lessOrEqual: 'is at most',
  contains: 'contains',
  isEmpty: 'is empty',
  isNotEmpty: 'is not empty',
}

// Negated phrasing (for NOT groups) so the sentence reads naturally.
const OP_NEG: Record<Condition['operator'], string> = {
  equals: 'is not',
  notEquals: 'is',
  greaterThan: 'is at most',
  lessThan: 'is at least',
  greaterOrEqual: 'is less than',
  lessOrEqual: 'is greater than',
  contains: 'does not contain',
  isEmpty: 'is not empty',
  isNotEmpty: 'is empty',
}

export const ACTION_VERB: Record<RuleAction, string> = {
  show: 'Show',
  hide: 'Hide',
  enable: 'Enable',
  disable: 'Disable',
  require: 'Make required',
  optional: 'Make optional',
  clear: 'Clear',
  setValue: 'Set value of',
}

export const ACTION_TONE: Record<RuleAction, string> = {
  show: 'bg-brand-50 text-brand-700 ring-brand-200',
  enable: 'bg-brand-50 text-brand-700 ring-brand-200',
  hide: 'bg-slate-100 text-slate-600 ring-slate-200',
  disable: 'bg-slate-100 text-slate-600 ring-slate-200',
  optional: 'bg-slate-100 text-slate-600 ring-slate-200',
  clear: 'bg-slate-100 text-slate-600 ring-slate-200',
  require: 'bg-amber-50 text-amber-700 ring-amber-200',
  setValue: 'bg-blue-50 text-blue-700 ring-blue-200',
}

const needsValue = (op: Condition['operator']) => op !== 'isEmpty' && op !== 'isNotEmpty'
const isGroup = (n: Condition | ConditionGroup): n is ConditionGroup =>
  (n as ConditionGroup).join !== undefined

function FieldPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md bg-navy-50 px-1.5 py-0.5 text-[13px] font-medium text-navy-700">
      {children}
    </span>
  )
}
function ValuePill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[13px] font-medium text-slate-700">
      {children}
    </span>
  )
}

function valueLabel(meta: FieldMeta | undefined, value: Condition['value']): string {
  const v = String(value ?? '')
  const opt = meta?.options?.find((o) => o.value === v)
  return opt ? opt.label : v || '…'
}

function renderCondition(cond: Condition, meta: FieldMeta | undefined, negate: boolean): ReactNode {
  const label = meta?.label ?? cond.field ?? 'field'
  const phrase = (negate ? OP_NEG : OP)[cond.operator]
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <FieldPill>{label}</FieldPill>
      <span className="text-slate-500">{phrase}</span>
      {needsValue(cond.operator) && <ValuePill>{valueLabel(meta, cond.value)}</ValuePill>}
    </span>
  )
}

/** Render a condition group as a readable, pill-decorated phrase. */
export function ConditionPhrase({
  group,
  fields,
}: {
  group: ConditionGroup
  fields: Map<string, FieldMeta>
}): ReactNode {
  const simple = group.conditions.filter((c) => !isGroup(c)) as Condition[]
  if (simple.length === 0) return <span className="text-slate-400">no conditions yet</span>

  // NOT with a single condition reads best as a negated phrase.
  if (group.join === 'NOT' && simple.length === 1) {
    return renderCondition(simple[0], fields.get(simple[0].field), true)
  }
  if (group.join === 'NOT') {
    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        <span className="text-slate-500">none of:</span>
        {simple.map((c, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="text-slate-400">,</span>}
            {renderCondition(c, fields.get(c.field), false)}
          </Fragment>
        ))}
      </span>
    )
  }

  const joinWord = group.join === 'OR' ? 'or' : 'and'
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {simple.map((c, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="font-medium text-slate-400">{joinWord}</span>}
          {renderCondition(c, fields.get(c.field), false)}
        </Fragment>
      ))}
    </span>
  )
}

import { Plus, X } from 'lucide-react'
import type { Condition, ConditionGroup, SelectOption } from '@/data/types'
import { cn } from '@/lib/cn'

export interface FieldOption {
  apiName: string
  label: string
  options?: SelectOption[]
}

const operators: { value: Condition['operator']; label: string }[] = [
  { value: 'equals', label: 'is' },
  { value: 'notEquals', label: 'is not' },
  { value: 'greaterThan', label: 'is greater than' },
  { value: 'lessThan', label: 'is less than' },
  { value: 'greaterOrEqual', label: 'is at least' },
  { value: 'lessOrEqual', label: 'is at most' },
  { value: 'contains', label: 'contains' },
  { value: 'isEmpty', label: 'is empty' },
  { value: 'isNotEmpty', label: 'is not empty' },
]

const joins: { value: ConditionGroup['join']; label: string; hint: string }[] = [
  { value: 'AND', label: 'All', hint: 'all must be true' },
  { value: 'OR', label: 'Any', hint: 'any can be true' },
  { value: 'NOT', label: 'None', hint: 'none are true' },
]

const needsValue = (op: Condition['operator']) => op !== 'isEmpty' && op !== 'isNotEmpty'

export function ConditionEditor({
  value,
  onChange,
  fieldOptions,
}: {
  value: ConditionGroup
  onChange: (g: ConditionGroup) => void
  fieldOptions: FieldOption[]
}) {
  const conditions = value.conditions.filter((c) => !(c as ConditionGroup).join) as Condition[]
  const showJoin = conditions.length > 1 || value.join !== 'AND'

  const update = (i: number, patch: Partial<Condition>) => {
    const next = conditions.map((c, idx) => (idx === i ? { ...c, ...patch } : c))
    onChange({ ...value, conditions: next })
  }
  const add = () =>
    onChange({
      ...value,
      conditions: [...conditions, { field: fieldOptions[0]?.apiName ?? '', operator: 'equals', value: '' }],
    })
  const remove = (i: number) =>
    onChange({ ...value, conditions: conditions.filter((_, idx) => idx !== i) })

  return (
    <div>
      {showJoin && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Match</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {joins.map((j) => (
              <button
                key={j.value}
                type="button"
                title={j.hint}
                onClick={() => onChange({ ...value, join: j.value })}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition',
                  value.join === j.value ? 'bg-white text-navy-800 shadow-sm' : 'text-slate-500',
                )}
              >
                {j.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400">of these conditions</span>
        </div>
      )}

      <div className="space-y-2">
        {conditions.map((c, i) => {
          const fld = fieldOptions.find((o) => o.apiName === c.field)
          return (
            <div key={i} className="flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-50 p-2">
              <span className="px-1 text-xs font-medium text-slate-400">{i === 0 ? 'When' : value.join === 'OR' ? 'or' : 'and'}</span>
              <select
                className="select min-w-[8rem] flex-1 !py-1.5 text-xs"
                value={c.field}
                onChange={(e) => update(i, { field: e.target.value, value: '' })}
              >
                <option value="">choose a field…</option>
                {fieldOptions.map((o) => (
                  <option key={o.apiName} value={o.apiName}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                className="select w-36 shrink-0 !py-1.5 text-xs"
                value={c.operator}
                onChange={(e) => update(i, { operator: e.target.value as Condition['operator'] })}
              >
                {operators.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {needsValue(c.operator) &&
                (fld?.options?.length ? (
                  <select
                    className="select w-32 shrink-0 !py-1.5 text-xs"
                    value={String(c.value ?? '')}
                    onChange={(e) => update(i, { value: e.target.value })}
                  >
                    <option value="">value…</option>
                    {fld.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="input w-28 shrink-0 !py-1.5 text-xs"
                    placeholder="value"
                    value={String(c.value ?? '')}
                    onChange={(e) => update(i, { value: e.target.value })}
                  />
                ))}
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                title="Remove condition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
        {conditions.length === 0 && (
          <p className="rounded-lg bg-slate-50 px-3 py-3 text-center text-xs text-slate-400">
            No conditions yet — this rule would always run.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={add}
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-navy-600 hover:text-navy-800"
      >
        <Plus className="h-3.5 w-3.5" /> Add condition
      </button>
    </div>
  )
}

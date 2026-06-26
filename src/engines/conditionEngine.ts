// ─────────────────────────────────────────────────────────────────────────────
// Conditional Logic Engine — evaluates IF condition groups (AND/OR/NOT, nestable)
// against the runtime answers and resolves the resulting field/section state
// (visibility + required overrides) for the renderer.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  Answers,
  AnswerValue,
  Condition,
  ConditionGroup,
  FormDefinition,
  Rule,
} from '@/data/types'

function asNumber(v: AnswerValue): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string' && v.trim() !== '') return Number(v)
  return NaN
}

function isEmpty(v: AnswerValue): boolean {
  if (v === undefined || v === null || v === '') return true
  if (Array.isArray(v)) return v.length === 0
  return false
}

export function evaluateCondition(cond: Condition, answers: Answers): boolean {
  const actual = answers[cond.field]
  const expected = cond.value

  switch (cond.operator) {
    case 'equals':
      return String(actual ?? '') === String(expected ?? '')
    case 'notEquals':
      return String(actual ?? '') !== String(expected ?? '')
    case 'greaterThan':
      return asNumber(actual) > Number(expected)
    case 'lessThan':
      return asNumber(actual) < Number(expected)
    case 'greaterOrEqual':
      return asNumber(actual) >= Number(expected)
    case 'lessOrEqual':
      return asNumber(actual) <= Number(expected)
    case 'contains':
      return String(actual ?? '')
        .toLowerCase()
        .includes(String(expected ?? '').toLowerCase())
    case 'isEmpty':
      return isEmpty(actual)
    case 'isNotEmpty':
      return !isEmpty(actual)
    default:
      return false
  }
}

function isGroup(node: Condition | ConditionGroup): node is ConditionGroup {
  return (node as ConditionGroup).join !== undefined
}

export function evaluateGroup(group: ConditionGroup, answers: Answers): boolean {
  const results = group.conditions.map((node) =>
    isGroup(node) ? evaluateGroup(node, answers) : evaluateCondition(node, answers),
  )
  if (results.length === 0) return true
  switch (group.join) {
    case 'AND':
      return results.every(Boolean)
    case 'OR':
      return results.some(Boolean)
    case 'NOT':
      return !results.some(Boolean)
    default:
      return true
  }
}

export interface ResolvedState {
  /** apiNames explicitly hidden by a rule. */
  hidden: Set<string>
  /** apiNames forced required by a rule. */
  required: Set<string>
  /** apiNames disabled by a rule. */
  disabled: Set<string>
  /** values pushed by setValue actions. */
  setValues: Record<string, string | number | boolean>
}

/**
 * Run every conditional rule and fold the actions into a single resolved-state
 * object the renderer can consult per field/section.
 */
export function resolveRules(rules: Rule[], answers: Answers): ResolvedState {
  const state: ResolvedState = {
    hidden: new Set(),
    required: new Set(),
    disabled: new Set(),
    setValues: {},
  }

  for (const rule of rules) {
    const fired = evaluateGroup(rule.when, answers)
    if (!fired) continue
    for (const target of rule.targets) {
      switch (rule.action) {
        case 'hide':
          state.hidden.add(target)
          break
        case 'show':
          state.hidden.delete(target)
          break
        case 'require':
          state.required.add(target)
          break
        case 'optional':
          state.required.delete(target)
          break
        case 'disable':
          state.disabled.add(target)
          break
        case 'enable':
          state.disabled.delete(target)
          break
        case 'setValue':
          if (rule.value !== undefined) state.setValues[target] = rule.value
          break
        case 'clear':
          state.setValues[target] = ''
          break
      }
    }
  }
  return state
}

/** Convenience: which rules are currently firing — used by the logic-builder preview. */
export function firingRules(form: FormDefinition, answers: Answers): Rule[] {
  return form.rules.filter((r) => evaluateGroup(r.when, answers))
}

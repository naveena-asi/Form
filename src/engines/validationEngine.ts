// ─────────────────────────────────────────────────────────────────────────────
// Validation Engine — field / section / form / cross-field checks, each carrying
// a level (blocker | warning | info). Blockers gate submission; warnings & info
// are advisory. Honours dynamic "required" overrides from the condition engine.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  Answers,
  AnswerValue,
  FormDefinition,
  ValidationLevel,
} from '@/data/types'
import { evaluateFormula } from './formulaEngine'

export interface ValidationMessage {
  field: string
  label: string
  level: ValidationLevel
  message: string
  scope: string
}

function isEmpty(v: AnswerValue): boolean {
  if (v === undefined || v === null || v === '') return true
  if (Array.isArray(v)) return v.length === 0
  return false
}

export function validateForm(
  form: FormDefinition,
  answers: Answers,
  dynamicRequired: Set<string> = new Set(),
  hidden: Set<string> = new Set(),
): ValidationMessage[] {
  const messages: ValidationMessage[] = []
  const fieldIndex = new Map(
    form.sections.flatMap((s) => [
      ...s.fields,
      ...(s.subsections?.flatMap((ss) => ss.fields) ?? []),
    ].map((f) => [f.apiName, f] as const)),
  )

  // 1. Required checks (static field flag OR dynamic rule), skipping hidden fields.
  for (const [apiName, field] of fieldIndex) {
    if (hidden.has(apiName)) continue
    const isRequired = field.required || dynamicRequired.has(apiName)
    if (isRequired && isEmpty(answers[apiName])) {
      messages.push({
        field: apiName,
        label: field.label,
        level: 'blocker',
        message: `${field.label} is required.`,
        scope: 'Field',
      })
    }
  }

  // 2. Declarative validations from the metadata.
  for (const v of form.validations) {
    const field = fieldIndex.get(v.field)
    if (!field || hidden.has(v.field)) continue
    const raw = answers[v.field]
    const num = Number(raw)
    let failed = false

    switch (v.type) {
      case 'required':
        failed = isEmpty(raw)
        break
      case 'min':
        failed = !isEmpty(raw) && num < Number(v.value)
        break
      case 'max':
        failed = !isEmpty(raw) && num > Number(v.value)
        break
      case 'minLength':
        failed = !isEmpty(raw) && String(raw).length < Number(v.value)
        break
      case 'maxLength':
        failed = !isEmpty(raw) && String(raw).length > Number(v.value)
        break
      case 'regex':
        failed = !isEmpty(raw) && !new RegExp(String(v.value)).test(String(raw))
        break
      case 'expression':
        // cross-field: expression must evaluate truthy to PASS
        failed = !evaluateFormula(String(v.value), answers)
        break
    }

    if (failed) {
      messages.push({
        field: v.field,
        label: field.label,
        level: v.level,
        message: v.message,
        scope: v.scope ?? 'Field',
      })
    }
  }

  return messages
}

export function summarize(messages: ValidationMessage[]) {
  return {
    blockers: messages.filter((m) => m.level === 'blocker'),
    warnings: messages.filter((m) => m.level === 'warning'),
    info: messages.filter((m) => m.level === 'info'),
    canSubmit: messages.filter((m) => m.level === 'blocker').length === 0,
  }
}

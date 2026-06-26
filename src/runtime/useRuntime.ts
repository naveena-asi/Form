// ─────────────────────────────────────────────────────────────────────────────
// useRuntime — the glue that runs all four engines against the live answers and
// hands the renderer everything it needs: visibility, required overrides,
// computed formula values, validation messages and the rating result.
// The form definition + lookups come from the editable designer store, so any
// change made in a builder screen is reflected here immediately.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo } from 'react'
import { useFormStore } from '@/store/useFormStore'
import { useDesignerStore } from '@/store/useDesignerStore'
import { useGuardrailStore } from '@/store/useGuardrailStore'
import { resolveRules, firingRules } from '@/engines/conditionEngine'
import { validateForm, summarize } from '@/engines/validationEngine'
import { evaluateFormula } from '@/engines/formulaEngine'
import { rate } from '@/engines/ratingEngine'
import { evaluateGuardrails } from '@/engines/guardrailEngine'
import { products, getProduct } from '@/data/products'
import type { Field } from '@/data/types'

export function useRuntime() {
  const answers = useFormStore((s) => s.answers)
  const override = useFormStore((s) => s.runtimeForm)
  const designerForm = useDesignerStore((s) => s.form)
  const lookups = useDesignerStore((s) => s.lookups)
  const guardrailConfig = useGuardrailStore((s) => s.config)
  // Preview/fill a selected form via the override; otherwise the designer's form.
  const form = override ?? designerForm

  return useMemo(() => {
    const lookupsById = Object.fromEntries(lookups.map((t) => [t.id, t]))
    const resolved = resolveRules(form.rules, answers)

    // Compute every formula/computed field value live.
    const formulaValues: Record<string, string | number> = {}
    for (const section of form.sections) {
      for (const field of section.fields) {
        if (field.formula) {
          const v = evaluateFormula(field.formula, answers, lookupsById)
          formulaValues[field.apiName] = typeof v === 'boolean' ? String(v) : v
        }
      }
    }

    const messages = validateForm(form, answers, resolved.required, resolved.hidden)
    const validation = summarize(messages)
    const rating = rate(form, answers)
    const fired = firingRules(form, answers)

    // Platform-wide guardrails layered on top of the form's own rating.
    const product = getProduct(form.productId ?? '') ?? products.find((p) => p.name === form.product)
    const guardrails = evaluateGuardrails({ form, answers, rating, product, config: guardrailConfig })

    const isHidden = (key: string) => resolved.hidden.has(key)
    const isRequired = (field: Field) => Boolean(field.required) || resolved.required.has(field.apiName)
    const isDisabled = (field: Field) => resolved.disabled.has(field.apiName)

    const visibleSections = form.sections.filter((s) => !isHidden(s.id))

    return {
      form,
      answers,
      resolved,
      formulaValues,
      messages,
      validation,
      rating,
      guardrails,
      firedRules: fired,
      visibleSections,
      isHidden,
      isRequired,
      isDisabled,
    }
  }, [answers, form, lookups, guardrailConfig])
}

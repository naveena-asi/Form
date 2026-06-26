// ─────────────────────────────────────────────────────────────────────────────
// Guardrail engine — platform-wide rules applied on top of a form's own rating &
// validation. Produces findings (block / refer / warn), a clamped premium, an
// overall decision and whether the transaction may bind.
// ─────────────────────────────────────────────────────────────────────────────
import type { Answers, FormDefinition } from '@/data/types'
import type { RatingResult } from './ratingEngine'
import type { GuardrailConfig } from '@/data/guardrails'
import type { Product } from '@/data/products'

export type GuardrailLevel = 'block' | 'refer' | 'warn'
export type GuardrailCategory = 'Underwriting' | 'Rating' | 'Referral' | 'Validation'
export type Decision = 'Eligible' | 'Referral' | 'Declined'

export interface GuardrailFinding {
  id: string
  level: GuardrailLevel
  category: GuardrailCategory
  message: string
}

export interface GuardrailResult {
  findings: GuardrailFinding[]
  basePremium: number
  adjustedPremium: number
  premiumClamped: boolean
  decision: Decision
  canBind: boolean
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE = /^[+()\d][\d\s().-]{6,}$/
const RANK: Record<Decision, number> = { Eligible: 0, Referral: 1, Declined: 2 }
const today = () => new Date().toISOString().slice(0, 10)

export function evaluateGuardrails(opts: {
  form: FormDefinition
  answers: Answers
  rating: RatingResult
  product?: Product
  config: GuardrailConfig
}): GuardrailResult {
  const { form, answers, rating, product, config } = opts
  const findings: GuardrailFinding[] = []
  const add = (level: GuardrailLevel, category: GuardrailCategory, message: string) =>
    findings.push({ id: `g${findings.length}`, level, category, message })

  // Decision starts from the form's own rating eligibility; guardrails can escalate it.
  let decision: Decision = rating.eligibility
  const escalate = (d: Decision) => {
    if (RANK[d] > RANK[decision]) decision = d
  }

  const allFields = form.sections.flatMap((s) => s.fields)

  // ── Underwriting: product state availability ──────────────────────────────
  if (config.enforceStateAvailability && product && product.states.length) {
    const state = String(answers.state ?? '').trim().toUpperCase()
    if (state && !product.states.map((s) => s.toUpperCase()).includes(state)) {
      add('block', 'Underwriting', `${product.name} is not filed in ${state} (available: ${product.states.join(', ')}).`)
      escalate('Declined')
    }
  }

  // ── Rating clamps (priced / new-business forms only) ──────────────────────
  const base = form.basePremium ?? rating.basePremium ?? 0
  let premium = rating.premium
  let clamped = false
  const priced = base > 0
  if (priced) {
    if (config.maxDiscountPct > 0) {
      const floor = Math.round(base * (1 - config.maxDiscountPct / 100))
      if (premium < floor) {
        premium = floor
        clamped = true
        add('warn', 'Rating', `Premium raised to the max-discount floor of $${floor.toLocaleString()} (discount capped at ${config.maxDiscountPct}%).`)
      }
    }
    if (config.minimumPremium > 0 && premium < config.minimumPremium) {
      premium = config.minimumPremium
      clamped = true
      add('warn', 'Rating', `Premium raised to the $${config.minimumPremium.toLocaleString()} minimum.`)
    }
    if (config.maximumPremium > 0 && premium > config.maximumPremium) {
      premium = config.maximumPremium
      clamped = true
      add('warn', 'Rating', `Premium capped at the $${config.maximumPremium.toLocaleString()} maximum.`)
    }
  }

  // ── Referral & decline thresholds (against the adjusted premium) ───────────
  if (config.declinePremiumAbove > 0 && premium > config.declinePremiumAbove) {
    add('block', 'Referral', `Premium $${premium.toLocaleString()} exceeds the auto-decline threshold of $${config.declinePremiumAbove.toLocaleString()}.`)
    escalate('Declined')
  } else if (config.referralPremiumAbove > 0 && premium > config.referralPremiumAbove) {
    add('refer', 'Referral', `Premium $${premium.toLocaleString()} exceeds $${config.referralPremiumAbove.toLocaleString()} — underwriter referral required.`)
    escalate('Referral')
  }
  const vehicles = Number(answers.vehicleCount ?? 0)
  if (config.referralVehiclesAbove > 0 && vehicles > config.referralVehiclesAbove) {
    add('refer', 'Referral', `${vehicles} vehicles exceeds the ${config.referralVehiclesAbove}-unit referral threshold.`)
    escalate('Referral')
  }

  // ── Global field validations ──────────────────────────────────────────────
  if (config.validateEmailPhone) {
    for (const f of allFields) {
      const v = answers[f.apiName]
      if (v == null || v === '') continue
      const isEmail = f.type === 'email' || /email/i.test(f.apiName)
      const isPhone = f.type === 'phone' || /phone|mobile|^tel/i.test(f.apiName)
      if (isEmail && !EMAIL.test(String(v))) add('block', 'Validation', `"${f.label}" is not a valid email address.`)
      else if (isPhone && !PHONE.test(String(v))) add('warn', 'Validation', `"${f.label}" doesn't look like a valid phone number.`)
    }
  }

  const dateFields = allFields.filter((f) => f.type === 'date')
  const effField = dateFields.find((f) => /effective/i.test(f.apiName))
  const expField = dateFields.find((f) => /expir/i.test(f.apiName))
  const eff = effField ? String(answers[effField.apiName] ?? '') : ''
  const exp = expField ? String(answers[expField.apiName] ?? '') : ''
  if (config.effectiveDateNotPast && eff && eff < today()) add('warn', 'Validation', `Effective date ${eff} is in the past.`)
  if (config.expirationAfterEffective && eff && exp && exp <= eff) add('block', 'Validation', `Expiration date must be after the effective date.`)

  if (config.requireSignatureToBind) {
    const sig = allFields.find((f) => f.type === 'signature')
    if (sig && !answers[sig.apiName]) add('block', 'Validation', `A signature is required before binding.`)
  }

  const canBind = decision !== 'Declined' && !findings.some((f) => f.level === 'block')
  return { findings, basePremium: base, adjustedPremium: premium, premiumClamped: clamped, decision, canBind }
}

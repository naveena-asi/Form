// ─────────────────────────────────────────────────────────────────────────────
// Rule / Rating Engine — shares the IF-THEN structure with the conditional-logic
// engine, but its outputs feed pricing & underwriting: premium, eligibility,
// tier/class, referrals and messages. Evaluates rules top-down against answers.
// ─────────────────────────────────────────────────────────────────────────────
import type { Answers, FormDefinition, RatingRule } from '@/data/types'
import { evaluateGroup } from './conditionEngine'

export interface RatingResult {
  basePremium: number
  premium: number
  tier: string
  eligibility: 'Eligible' | 'Referral' | 'Declined'
  surcharges: { name: string; effect: string }[]
  messages: string[]
  referrals: string[]
  firedRules: RatingRule[]
}

export function rate(form: FormDefinition, answers: Answers): RatingResult {
  const base = form.basePremium ?? 0
  let premium = base
  const result: RatingResult = {
    basePremium: base,
    premium: base,
    tier: 'Standard',
    eligibility: 'Eligible',
    surcharges: [],
    messages: [],
    referrals: [],
    firedRules: [],
  }

  for (const rule of form.ratingRules) {
    if (!evaluateGroup(rule.when, answers)) continue
    result.firedRules.push(rule)

    switch (rule.output) {
      case 'Premium':
      case 'Surcharge':
        if (rule.effect === 'multiplier' && rule.amount !== undefined) {
          premium *= rule.amount
          result.surcharges.push({
            name: rule.name,
            effect: `×${rule.amount}`,
          })
        } else if (rule.effect === 'flat' && rule.amount !== undefined) {
          premium += rule.amount
          result.surcharges.push({
            name: rule.name,
            effect: `${rule.amount >= 0 ? '+' : ''}${rule.amount}`,
          })
        }
        break
      case 'Tier/Class':
        result.tier = rule.result
        break
      case 'Eligibility':
        if (/declin/i.test(rule.result)) result.eligibility = 'Declined'
        else if (/refer/i.test(rule.result) && result.eligibility !== 'Declined')
          result.eligibility = 'Referral'
        break
      case 'Referral':
        result.referrals.push(rule.result)
        if (result.eligibility === 'Eligible') result.eligibility = 'Referral'
        break
      case 'Message':
        result.messages.push(rule.result)
        break
    }
  }

  result.premium = Math.round(premium)
  return result
}

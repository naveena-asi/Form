// ─────────────────────────────────────────────────────────────────────────────
// Global guardrails — platform-wide underwriting / rating / validation rules that
// run on EVERY quote & bind, on top of each form's own per-form rules. Configured
// once (admin Guardrails screen) and enforced by the guardrail engine.
// ─────────────────────────────────────────────────────────────────────────────
export interface GuardrailConfig {
  // Underwriting eligibility
  enforceStateAvailability: boolean // product must be filed in the answered state

  // Rating clamps
  minimumPremium: number // floor (0 = off)
  maximumPremium: number // cap (0 = off)
  maxDiscountPct: number // premium can't fall below base × (1 − pct%) (0 = off)

  // Referral & decline thresholds
  referralPremiumAbove: number // premium over this → underwriter referral (0 = off)
  declinePremiumAbove: number // premium over this → auto-decline / block (0 = off)
  referralVehiclesAbove: number // vehicle count over this → referral (0 = off)

  // Global field validations
  requireSignatureToBind: boolean
  effectiveDateNotPast: boolean
  expirationAfterEffective: boolean
  validateEmailPhone: boolean
}

export const defaultGuardrails: GuardrailConfig = {
  enforceStateAvailability: true,
  minimumPremium: 500,
  maximumPremium: 0,
  maxDiscountPct: 40,
  referralPremiumAbove: 10000,
  declinePremiumAbove: 50000,
  referralVehiclesAbove: 25,
  requireSignatureToBind: true,
  effectiveDateNotPast: true,
  expirationAfterEffective: true,
  validateEmailPhone: true,
}

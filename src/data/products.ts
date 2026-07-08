// ─────────────────────────────────────────────────────────────────────────────
// Product catalog — a product is a line of business written by a carrier. It owns
// its rating base, available coverages, eligible states, and a "form group": the
// set of forms used for each transaction type (Application / Endorsement /
// Cancellation / Claim / Renewal). Policies are bound from a product's Application.
// ─────────────────────────────────────────────────────────────────────────────
import type { FormDefinition, FormType } from './types'
import { getForm, transactionForm } from './formTemplates'

export interface ProductCoverage {
  name: string
  limits: string[]
  deductibles?: string[]
  required?: boolean
}

export interface ProductFormRef {
  type: FormType
  /** id of a form in the catalog (formTemplates), or omitted to use a generated template. */
  formId?: string
}

export interface Product {
  id: string
  baseProductId?: string
  carrierId: string
  name: string
  code: string
  status: 'Active' | 'Draft' | 'Retired'
  baseRate: number
  states: string[]
  eligibility: string
  coverages: ProductCoverage[]
  /** which form backs each customer transaction for this product. */
  forms: ProductFormRef[]
}

export const products: Product[] = [
  {
    id: 'prod-ca',
    carrierId: 'car-vpro',
    name: 'Commercial Auto',
    code: 'CA',
    status: 'Active',
    baseRate: 1200,
    states: ['CA', 'TX', 'NY', 'FL', 'IL'],
    eligibility: 'Fleets up to 50 vehicles; no long-haul over 500 miles.',
    coverages: [
      { name: 'Liability (CSL)', limits: ['$500K', '$1M', '$2M'], required: true },
      { name: 'Physical Damage', limits: ['$25K', '$50K', '$100K'], deductibles: ['$500', '$1,000', '$2,500'] },
      { name: 'Medical Payments', limits: ['$5K', '$10K'] },
      { name: 'Uninsured Motorist', limits: ['$500K', '$1M'] },
    ],
    forms: [
      { type: 'Application', formId: 'frm-commercial-auto' },
      { type: 'Supplemental', formId: 'frm-truck-supp' },
      { type: 'Endorsement', formId: 'frm-auto-endorse' },
      { type: 'Cancellation', formId: 'frm-auto-cancel' },
      { type: 'Claim', formId: 'frm-auto-fnol' },
      { type: 'Renewal' },
    ],
  },
  {
    id: 'prod-gl',
    carrierId: 'car-vpro',
    name: 'General Liability',
    code: 'GL',
    status: 'Active',
    baseRate: 850,
    states: ['CA', 'TX', 'NY', 'FL', 'IL', 'PA', 'OH'],
    eligibility: 'Office, retail and light service classes.',
    coverages: [
      { name: 'Each Occurrence', limits: ['$500K', '$1M', '$2M'], required: true },
      { name: 'General Aggregate', limits: ['$1M', '$2M', '$4M'] },
      { name: 'Products / Completed Ops', limits: ['$1M', '$2M'] },
    ],
    forms: [
      { type: 'Application', formId: 'frm-gl-app' },
      { type: 'Endorsement', formId: 'frm-endorsement' },
      { type: 'Cancellation', formId: 'frm-gl-cancel' },
      { type: 'Claim' },
      { type: 'Renewal' },
    ],
  },
  {
    id: 'prod-wc',
    carrierId: 'car-summit',
    name: 'Workers Compensation',
    code: 'WC',
    status: 'Active',
    baseRate: 3200,
    states: ['TX', 'OK', 'NM'],
    eligibility: 'Trucking & transportation payroll classes.',
    coverages: [
      { name: "Workers' Compensation", limits: ['Statutory'], required: true },
      { name: "Employers' Liability", limits: ['$500K', '$1M'] },
    ],
    forms: [
      { type: 'Quote', formId: 'frm-wc-quote' },
      { type: 'Renewal' },
      { type: 'Cancellation' },
      { type: 'Claim' },
    ],
  },
  {
    id: 'prod-bop',
    carrierId: 'car-vpro',
    name: 'Business Owners (BOP)',
    code: 'BOP',
    status: 'Draft',
    baseRate: 1450,
    states: ['CA', 'TX', 'FL'],
    eligibility: 'Eligible small-business package risks.',
    coverages: [
      { name: 'Property', limits: ['$100K', '$250K', '$500K'], deductibles: ['$1,000', '$2,500'] },
      { name: 'Liability', limits: ['$1M', '$2M'], required: true },
      { name: 'Business Income', limits: ['Actual Loss Sustained'] },
    ],
    forms: [
      { type: 'Application' },
      { type: 'Renewal', formId: 'frm-bop-renewal' },
      { type: 'Endorsement' },
      { type: 'Cancellation' },
    ],
  },
]

export const getProduct = (id: string) => products.find((p) => p.id === id)
export const productsByCarrier = (carrierId: string) => products.filter((p) => p.carrierId === carrierId)

/** The primary "new business" form type a product is quoted on. */
export const quoteType = (p: Product): FormType =>
  p.forms.some((f) => f.type === 'Application') ? 'Application' : 'Quote'

/**
 * Resolve a product's form for a transaction type. Uses the mapped catalog form
 * when present, otherwise a generated template appropriate to the product.
 */
export function formForProduct(product: Product, type: FormType): FormDefinition {
  const ref = product.forms.find((f) => f.type === type)
  const form = ref?.formId ? getForm(ref.formId) : transactionForm(type, product.name)
  // Tie the rating base + catalog references to the product so guardrails and the
  // bound premium reflect the product.
  return {
    ...structuredClone(form),
    basePremium: form.basePremium ?? product.baseRate,
    product: product.name,
    productId: product.id,
    carrierId: product.carrierId,
  }
}

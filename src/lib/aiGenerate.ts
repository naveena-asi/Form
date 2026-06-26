// ─────────────────────────────────────────────────────────────────────────────
// AI Form Generation (Phase 4). Calls the Express backend (/api/generate-form),
// which uses the Claude Messages API with structured outputs to turn a plain-
// English description into a simplified form spec. That spec is normalized here
// into a full FormDefinition the designer can load. A local heuristic fallback
// keeps the flow working when no API key / backend is available.
// ─────────────────────────────────────────────────────────────────────────────
import type { Field, FieldType, FormDefinition, Section, SelectOption } from '@/data/types'
import { fieldTypeCatalog } from '@/data/fieldTypes'
import { uid } from '@/lib/uid'

export interface GenField {
  label: string
  type: string
  required: boolean
  helpText: string
  options: string[]
}
export interface GenSection {
  name: string
  description: string
  columns: number
  fields: GenField[]
}
export interface GeneratedForm {
  name: string
  description: string
  product: string
  type: string
  basePremium: number
  sections: GenSection[]
}

export type GenSource = 'ai' | 'fallback'
export interface GenResult {
  form: GeneratedForm
  source: GenSource
  note?: string
}

const MONEY = new Set(['currency', 'limit', 'deductible', 'premium'])
const HAS_OPTIONS = new Set(['select', 'radio', 'coverage'])

function toApiName(label: string, used: Set<string>): string {
  const base =
    label
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
      .join('') || 'field'
  let name = base
  let n = 2
  while (used.has(name)) name = `${base}${n++}`
  used.add(name)
  return name
}

function toField(gf: GenField, used: Set<string>): Field {
  const type = (fieldTypeCatalog.some((c) => c.type === gf.type) ? gf.type : 'text') as FieldType
  const group = fieldTypeCatalog.find((c) => c.type === type)?.group ?? 'Basic'
  const field: Field = {
    id: uid('f'),
    apiName: toApiName(gf.label, used),
    label: gf.label,
    type,
    group,
    required: Boolean(gf.required),
    helpText: gf.helpText || undefined,
    colSpan: type === 'grid' ? 2 : 1,
  }
  if (HAS_OPTIONS.has(type) && gf.options?.length) {
    field.options = gf.options.map<SelectOption>((o) => ({ label: o, value: o }))
  }
  if (MONEY.has(type)) field.prefix = '$'
  if (type === 'percentage') field.suffix = '%'
  if (type === 'premium') field.formula = '0'
  if (type === 'grid') {
    field.grid = {
      minRows: 0,
      maxRows: 50,
      columns: [
        { apiName: 'col1', label: 'Column 1', type: 'text', width: '50%' },
        { apiName: 'col2', label: 'Column 2', type: 'text', width: '50%' },
      ],
    }
  }
  return field
}

const FORM_TYPES = ['Application', 'Supplemental', 'Quote', 'Endorsement', 'Cancellation', 'Claim', 'Renewal']

/** Build a full FormDefinition from the generated spec. */
export function normalizeToFormDefinition(gen: GeneratedForm): FormDefinition {
  const used = new Set<string>()
  const sections: Section[] = (gen.sections ?? []).map((gs) => ({
    id: uid('sec'),
    name: gs.name || 'Section',
    description: gs.description || '',
    layout: gs.columns === 2 ? 'Two Column' : 'Single Column',
    columns: gs.columns === 2 ? 2 : 1,
    collapsible: false,
    required: false,
    fields: (gs.fields ?? []).map((gf) => toField(gf, used)),
  }))

  return {
    id: uid('frm'),
    name: gen.name || 'AI-Generated Form',
    description: gen.description || '',
    product: gen.product || 'General',
    type: (FORM_TYPES.includes(gen.type) ? gen.type : 'Application') as FormDefinition['type'],
    version: '1.0',
    status: 'Draft',
    effectiveDate: '2024-01-01',
    expirationDate: '2099-12-31',
    createdBy: 'AI Assistant',
    updatedAt: '2024-01-01',
    navigationStyle: 'Wizard',
    basePremium: Number(gen.basePremium) || 0,
    sections,
    rules: [],
    validations: [],
    ratingRules: [],
  }
}

/** Call the backend. Throws an Error with `.code` ('no_api_key' | 'error') on failure. */
export async function requestGeneration(prompt: string): Promise<GeneratedForm> {
  let res: Response
  try {
    res = await fetch('/api/generate-form', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
  } catch {
    throw Object.assign(new Error('backend unreachable'), { code: 'error' })
  }
  if (res.status === 503) throw Object.assign(new Error('no api key'), { code: 'no_api_key' })
  if (!res.ok) throw Object.assign(new Error('generation failed'), { code: 'error' })
  const data = await res.json()
  return data.form as GeneratedForm
}

// ── Local heuristic fallback (no backend / key) ──────────────────────────────
const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase())

export function localFallback(prompt: string): GeneratedForm {
  const p = prompt.toLowerCase()
  const productGuess =
    /auto|vehicle|truck|fleet/.test(p)
      ? 'Commercial Auto'
      : /property|building|home/.test(p)
        ? 'Property'
        : /work|injur|comp/.test(p)
          ? 'Workers Comp'
          : /liab/.test(p)
            ? 'General Liability'
            : 'General'

  const sections: GenSection[] = [
    {
      name: 'Applicant Information',
      description: 'Primary contact and identity details.',
      columns: 2,
      fields: [
        { label: 'Full Name', type: 'text', required: true, helpText: '', options: [] },
        { label: 'Email', type: 'email', required: true, helpText: '', options: [] },
        { label: 'Phone', type: 'phone', required: false, helpText: '', options: [] },
        { label: 'State', type: 'state', required: false, helpText: '', options: [] },
      ],
    },
    {
      name: 'Details',
      description: `Information about the ${productGuess.toLowerCase()} request.`,
      columns: 2,
      fields: [
        { label: 'Business Name', type: 'text', required: false, helpText: '', options: [] },
        { label: 'Annual Revenue', type: 'currency', required: false, helpText: '', options: [] },
        {
          label: 'Coverage Type',
          type: 'coverage',
          required: true,
          helpText: '',
          options: ['Basic', 'Standard', 'Premium'],
        },
      ],
    },
  ]

  if (/vehicle|auto|truck|fleet|driver/.test(p)) {
    sections.push({
      name: 'Vehicles',
      description: 'Schedule of vehicles.',
      columns: 1,
      fields: [
        { label: 'Number of Vehicles', type: 'number', required: false, helpText: '', options: [] },
        { label: 'Vehicles', type: 'grid', required: false, helpText: '', options: [] },
      ],
    })
  }
  if (/claim|loss|incident|fnol/.test(p)) {
    sections.push({
      name: 'Loss Details',
      description: 'Details of the claim or loss.',
      columns: 2,
      fields: [
        { label: 'Date of Loss', type: 'date', required: true, helpText: '', options: [] },
        { label: 'Description', type: 'richtext', required: false, helpText: '', options: [] },
        { label: 'Estimated Amount', type: 'currency', required: false, helpText: '', options: [] },
      ],
    })
  }
  if (/cancel|non-payment|nonpayment|terminat/.test(p)) {
    sections.push({
      name: 'Cancellation Details',
      description: 'Reason, effective date and refund handling.',
      columns: 2,
      fields: [
        { label: 'Policy Number', type: 'text', required: true, helpText: '', options: [] },
        { label: 'Cancellation Effective Date', type: 'date', required: true, helpText: '', options: [] },
        {
          label: 'Reason for Cancellation',
          type: 'select',
          required: true,
          helpText: '',
          options: ['Non-Payment', 'Insured Request', 'Underwriting', 'Sold / No Longer Needed', 'Other'],
        },
        {
          label: 'Refund Method',
          type: 'select',
          required: false,
          helpText: 'Pro-rata vs short-rate',
          options: ['Pro-Rata', 'Short-Rate', 'Flat'],
        },
      ],
    })
  }
  if (/endors|amend|add vehicle|remove vehicle|mid-term|change/.test(p)) {
    sections.push({
      name: 'Endorsement Request',
      description: 'Mid-term change to the policy.',
      columns: 2,
      fields: [
        { label: 'Policy Number', type: 'text', required: true, helpText: '', options: [] },
        { label: 'Effective Date of Change', type: 'date', required: true, helpText: '', options: [] },
        {
          label: 'Change Type',
          type: 'select',
          required: true,
          helpText: '',
          options: ['Add Item', 'Remove Item', 'Change Coverage', 'Update Information'],
        },
        { label: 'Details of Change', type: 'richtext', required: false, helpText: '', options: [] },
      ],
    })
  }

  sections.push({
    name: 'Review & Submit',
    description: 'Confirm and sign.',
    columns: 1,
    fields: [{ label: 'Signature', type: 'signature', required: true, helpText: '', options: [] }],
  })

  const typeGuess = /claim|loss|fnol/.test(p)
    ? 'Claim'
    : /cancel|non-payment|nonpayment|terminat/.test(p)
      ? 'Cancellation'
      : /renew/.test(p)
        ? 'Renewal'
        : /endors|add vehicle|remove vehicle|mid-term|amend/.test(p)
          ? 'Endorsement'
          : 'Application'

  return {
    name: titleCase(prompt.slice(0, 60)) || `${productGuess} Form`,
    description: `Auto-drafted from: "${prompt}"`,
    product: productGuess,
    type: typeGuess,
    basePremium: productGuess === 'General' ? 0 : 1000,
    sections,
  }
}

/** Generate via AI, falling back to the local heuristic generator on failure. */
export async function generateForm(prompt: string): Promise<GenResult> {
  try {
    const form = await requestGeneration(prompt)
    return { form, source: 'ai' }
  } catch (e) {
    const code = (e as { code?: string }).code
    return {
      form: localFallback(prompt),
      source: 'fallback',
      note:
        code === 'no_api_key'
          ? 'AI backend has no ANTHROPIC_API_KEY — generated locally. Run “npm run server” with a key for real AI generation.'
          : 'AI backend unavailable — generated locally. Start it with “npm run server”.',
    }
  }
}

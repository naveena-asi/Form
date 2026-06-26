// ─────────────────────────────────────────────────────────────────────────────
// Form catalog — backs every Form Library row with a real FormDefinition so each
// form opens its OWN type-appropriate data (a cancellation shows cancellation
// fields, an endorsement shows endorsement fields, etc.). The Commercial Auto
// Application keeps its hand-authored rules/rating; the rest are generated from
// type-specific templates.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  Field,
  FieldType,
  FormDefinition,
  FormType,
  Section,
  SelectOption,
} from './types'
import { fieldTypeCatalog } from './fieldTypes'
import { commercialAuto } from './commercialAuto'
import { formRows, type FormRow } from './forms'

const groupOf = (type: FieldType) => fieldTypeCatalog.find((c) => c.type === type)?.group ?? 'Basic'
const opts = (arr: string[]): SelectOption[] => arr.map((o) => ({ label: o, value: o }))

interface FieldExtra {
  required?: boolean
  options?: SelectOption[]
  prefix?: string
  helpText?: string
  colSpan?: 1 | 2
  formula?: string
  readOnly?: boolean
}

function makeBuilder() {
  let n = 0
  const used = new Set<string>()
  const apiName = (label: string) => {
    const base =
      label
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .split(/\s+/)
        .filter(Boolean)
        .map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
        .join('') || 'field'
    let name = base
    let i = 2
    while (used.has(name)) name = `${base}${i++}`
    used.add(name)
    return name
  }
  const field = (label: string, type: FieldType, extra: FieldExtra = {}): Field => ({
    id: `f${++n}`,
    apiName: apiName(label),
    label,
    type,
    group: groupOf(type),
    colSpan: type === 'grid' || type === 'richtext' ? 2 : extra.colSpan ?? 1,
    ...extra,
  })
  const section = (
    sn: number,
    name: string,
    columns: 1 | 2,
    fields: Field[],
    description = '',
  ): Section => ({
    id: `sec${sn}`,
    name,
    description,
    layout: columns === 2 ? 'Two Column' : 'Single Column',
    columns,
    collapsible: false,
    required: false,
    fields,
  })
  return { field, section }
}

const applicant = (b: ReturnType<typeof makeBuilder>, sn: number) =>
  b.section(sn, 'Applicant Information', 2, [
    b.field('Insured Name', 'text', { required: true }),
    b.field('Contact Email', 'email', { required: true }),
    b.field('Contact Phone', 'phone'),
    b.field('State', 'state'),
  ])

const policyInfo = (b: ReturnType<typeof makeBuilder>, sn: number) =>
  b.section(sn, 'Policy Information', 2, [
    b.field('Policy Number', 'text', { required: true }),
    b.field('Named Insured', 'text', { required: true }),
    b.field('Policy Effective Date', 'date'),
  ])

const review = (b: ReturnType<typeof makeBuilder>, sn: number) =>
  b.section(sn, 'Review & Submit', 1, [
    b.field('Authorized By', 'text', { required: true }),
    b.field('Signature', 'signature', { required: true }),
  ])

/** Type-specific section sets. */
function sectionsFor(type: FormType, product: string): Section[] {
  const b = makeBuilder()

  if (type === 'Cancellation') {
    return [
      policyInfo(b, 1),
      b.section(
        2,
        'Cancellation Details',
        2,
        [
          b.field('Cancellation Effective Date', 'date', { required: true }),
          b.field('Reason for Cancellation', 'select', {
            required: true,
            options: opts(['Non-Payment', 'Insured Request', 'Underwriting', 'Sold / No Longer Needed', 'Other']),
          }),
          b.field('Refund Method', 'select', {
            options: opts(['Pro-Rata', 'Short-Rate', 'Flat']),
            helpText: 'How unearned premium is returned.',
          }),
          b.field('Outstanding Balance', 'currency', { prefix: '$' }),
          b.field('Additional Notes', 'richtext'),
        ],
        'Reason, effective date and refund handling.',
      ),
      review(b, 3),
    ]
  }

  if (type === 'Endorsement') {
    const fields: Field[] = [
      b.field('Endorsement Effective Date', 'date', { required: true }),
      b.field('Change Type', 'select', {
        required: true,
        options: opts(['Add Item', 'Remove Item', 'Change Coverage', 'Update Information']),
      }),
      b.field('Premium-Bearing?', 'checkbox', { helpText: 'Does this change affect premium?' }),
      b.field('Details of Change', 'richtext'),
    ]
    const secs = [policyInfo(b, 1), b.section(2, 'Endorsement Request', 2, fields, 'Mid-term change to the policy.')]
    if (/auto|truck|fleet/i.test(product)) {
      secs.push(
        b.section(3, 'Affected Vehicles', 1, [
          b.field('Vehicles', 'grid', { helpText: 'Vehicles added or removed by this endorsement.' }),
        ]),
      )
    }
    secs.push(review(b, secs.length + 1))
    return secs
  }

  if (type === 'Claim') {
    return [
      b.section(1, 'Claimant Information', 2, [
        b.field('Policy Number', 'text', { required: true }),
        b.field('Claimant Name', 'text', { required: true }),
        b.field('Contact Phone', 'phone'),
      ]),
      b.section(
        2,
        'Loss Details',
        2,
        [
          b.field('Date of Loss', 'date', { required: true }),
          b.field('Time of Loss', 'time'),
          b.field('Loss Location', 'address'),
          b.field('Type of Loss', 'select', {
            options: opts(['Collision', 'Theft', 'Fire', 'Weather', 'Liability', 'Other']),
          }),
          b.field('Estimated Amount', 'currency', { prefix: '$' }),
          b.field('Police Report Filed', 'checkbox'),
          b.field('Description of Incident', 'richtext'),
        ],
        'What happened, when and where.',
      ),
      b.section(3, 'Supporting Documents', 1, [b.field('Upload Photos / Reports', 'file')]),
      review(b, 4),
    ]
  }

  if (type === 'Renewal') {
    return [
      b.section(1, 'Policy Information', 2, [
        b.field('Policy Number', 'text', { required: true }),
        b.field('Expiring Premium', 'currency', { prefix: '$' }),
        b.field('Renewal Effective Date', 'date'),
      ]),
      b.section(
        2,
        'Renewal Questionnaire',
        2,
        [
          b.field('Any Changes Since Last Term?', 'select', {
            required: true,
            options: opts(['No Changes', 'Minor Changes', 'Major Changes']),
          }),
          b.field('Claims in Past Term', 'number'),
          b.field('Updated Annual Revenue', 'currency', { prefix: '$' }),
          b.field('Continue All Coverages?', 'checkbox'),
          b.field('Notes', 'richtext'),
        ],
        'Confirm exposures and changes for the new term.',
      ),
      review(b, 3),
    ]
  }

  if (type === 'Supplemental') {
    return [
      applicant(b, 1),
      b.section(
        2,
        'Supplemental Questions',
        2,
        [
          b.field('Operations Description', 'richtext'),
          b.field('Subcontractors Used?', 'checkbox'),
          b.field('Years of Experience', 'number'),
          b.field('Prior Coverage?', 'checkbox'),
        ],
        `Additional underwriting questions for ${product}.`,
      ),
      review(b, 3),
    ]
  }

  // Application / Quote (default)
  return [
    applicant(b, 1),
    b.section(
      2,
      'Business Details',
      2,
      [
        b.field('Business Type', 'select', {
          required: true,
          options: opts(['Retail', 'Service', 'Construction', 'Manufacturing', 'Other']),
        }),
        b.field('Years in Business', 'number'),
        b.field('Annual Revenue', 'currency', { prefix: '$' }),
        b.field('Number of Employees', 'number'),
      ],
      `Operations and exposure for ${product}.`,
    ),
    b.section(3, 'Coverages', 2, [
      b.field('Coverage Type', 'coverage', { required: true, options: opts(['Basic', 'Standard', 'Premium']) }),
      b.field('Limit', 'limit', { prefix: '$' }),
      b.field('Deductible', 'deductible', { prefix: '$' }),
    ]),
    b.section(4, 'Premium Summary', 2, [
      b.field('Estimated Premium', 'premium', {
        prefix: '$',
        readOnly: true,
        colSpan: 2,
        formula: 'ROUND(750 + numberOfEmployees * 25 + yearsInBusiness * 10, 0)',
        helpText: 'Computed live by the Formula Engine.',
      }),
    ]),
  ]
}

const PRICED: FormType[] = ['Application', 'Quote', 'Supplemental']

function buildFromTemplate(row: FormRow): FormDefinition {
  return {
    id: row.id,
    name: row.name,
    description: `${row.type} form for ${row.product}.`,
    product: row.product,
    type: row.type,
    version: row.version,
    status: row.status,
    effectiveDate: '2024-01-01',
    expirationDate: '2099-12-31',
    createdBy: row.createdBy,
    updatedAt: row.updatedAt,
    navigationStyle: 'Wizard',
    basePremium: PRICED.includes(row.type) ? 1000 : 0,
    sections: sectionsFor(row.type, row.product),
    rules: [],
    validations: [],
    ratingRules: [],
  }
}

// Built once at import — stable definitions for the session.
export const formCatalog: Record<string, FormDefinition> = Object.fromEntries(
  formRows.map((row) => [
    row.id,
    row.id === commercialAuto.id ? commercialAuto : buildFromTemplate(row),
  ]),
)

export function getForm(id: string): FormDefinition {
  return formCatalog[id] ?? commercialAuto
}

let txnSeq = 0
/** Build a fresh, product-appropriate form for a customer transaction. */
export function transactionForm(type: FormType, product: string): FormDefinition {
  txnSeq += 1
  return {
    id: `txn-${type.toLowerCase()}-${txnSeq}`,
    name: `${product} ${type}`,
    description: `${type} request for ${product}.`,
    product,
    type,
    version: '1.0',
    status: 'Draft',
    effectiveDate: '2024-01-01',
    expirationDate: '2099-12-31',
    createdBy: 'Customer',
    updatedAt: '2024-01-01',
    navigationStyle: 'Wizard',
    basePremium: PRICED.includes(type) ? 1000 : 0,
    sections: sectionsFor(type, product),
    rules: [],
    validations: [],
    ratingRules: [],
  }
}

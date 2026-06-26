// ─────────────────────────────────────────────────────────────────────────────
// VENUSPRO metadata model — the "single source of truth".
// Everything the runtime engines render, validate, calculate and rate is derived
// from these structures. Mirrors the blueprint's Form → Section → Subsection →
// Field → Rules → Validations → Dependencies hierarchy.
// ─────────────────────────────────────────────────────────────────────────────

export type FormStatus = 'Draft' | 'Published' | 'Archived'

export type FormType =
  | 'Application'
  | 'Supplemental'
  | 'Quote'
  | 'Endorsement'
  | 'Cancellation'
  | 'Claim'
  | 'Renewal'

/** Field-type catalog — grouped exactly as the Field Builder palette in the blueprint. */
export type FieldGroup =
  | 'Basic'
  | 'Date/Time'
  | 'Advanced'
  | 'Repeating'
  | 'File'
  | 'Special'
  | 'Insurance'
  | 'System'

export type FieldType =
  // Basic
  | 'text'
  | 'number'
  | 'decimal'
  | 'currency'
  | 'percentage'
  | 'email'
  | 'phone'
  | 'url'
  // Date / Time
  | 'date'
  | 'datetime'
  | 'time'
  // Advanced
  | 'address'
  | 'state'
  | 'country'
  | 'zip'
  | 'select'
  | 'radio'
  | 'checkbox'
  // Repeating / collection
  | 'grid'
  // File
  | 'file'
  | 'image'
  // Special
  | 'signature'
  | 'richtext'
  | 'label'
  | 'divider'
  // Insurance specific
  | 'limit'
  | 'deductible'
  | 'coverage'
  | 'classcode'
  | 'premium'
  // System
  | 'hidden'
  | 'system'
  | 'computed'

export interface SelectOption {
  label: string
  value: string
}

/** A single condition: <field> <operator> <value>. */
export interface Condition {
  field: string // apiName of the field being tested
  operator:
    | 'equals'
    | 'notEquals'
    | 'greaterThan'
    | 'lessThan'
    | 'greaterOrEqual'
    | 'lessOrEqual'
    | 'contains'
    | 'isEmpty'
    | 'isNotEmpty'
  value?: string | number | boolean
}

/** A group of conditions joined by a boolean operator; groups can nest. */
export interface ConditionGroup {
  join: 'AND' | 'OR' | 'NOT'
  conditions: Array<Condition | ConditionGroup>
}

export type RuleAction =
  | 'show'
  | 'hide'
  | 'enable'
  | 'disable'
  | 'require'
  | 'optional'
  | 'clear'
  | 'setValue'

/** Conditional-logic rule — IF (group) THEN (action on targets). */
export interface Rule {
  id: string
  name: string
  when: ConditionGroup
  action: RuleAction
  /** apiNames of fields/sections affected. */
  targets: string[]
  /** value applied for setValue. */
  value?: string | number | boolean
}

export type ValidationLevel = 'blocker' | 'warning' | 'info'

export interface Validation {
  id: string
  /** apiName the validation applies to (or a cross-field anchor). */
  field: string
  type: 'required' | 'min' | 'max' | 'minLength' | 'maxLength' | 'regex' | 'expression'
  value?: string | number
  level: ValidationLevel
  message: string
  /** scope label, e.g. 'Field', 'Section', 'Form', 'Cross-Field'. */
  scope?: 'Field' | 'Section' | 'Form' | 'Cross-Field'
}

/** Column definition for a repeating grid field. */
export interface GridColumn {
  apiName: string
  label: string
  type: FieldType
  options?: SelectOption[]
  width?: string
}

export interface Field {
  id: string
  apiName: string
  label: string
  type: FieldType
  group: FieldGroup
  helpText?: string
  placeholder?: string
  required?: boolean
  readOnly?: boolean
  defaultValue?: string | number | boolean
  /** for select/radio/checkbox. */
  options?: SelectOption[]
  /** lookup table id for option/data sourcing. */
  lookup?: string
  /** formula expression for computed/premium fields. */
  formula?: string
  /** column width within the section grid (1 or 2). */
  colSpan?: 1 | 2
  /** unit/prefix decoration, e.g. '$' or '%'. */
  prefix?: string
  suffix?: string
  /** repeating grid configuration. */
  grid?: {
    columns: GridColumn[]
    minRows?: number
    maxRows?: number
  }
  min?: number
  max?: number
}

export interface Subsection {
  id: string
  name: string
  fields: Field[]
}

export type SectionLayout = 'Single Column' | 'Two Column' | 'Accordion'

export interface Section {
  id: string
  name: string
  description?: string
  layout: SectionLayout
  columns: 1 | 2
  collapsible?: boolean
  required?: boolean
  fields: Field[]
  subsections?: Subsection[]
}

export type RatingOutputType =
  | 'Premium'
  | 'Eligibility'
  | 'Tier/Class'
  | 'Referral'
  | 'Message'
  | 'Surcharge'

/** Rule / Rating engine rule — IF (condition) THEN (output). */
export interface RatingRule {
  id: string
  name: string
  when: ConditionGroup
  output: RatingOutputType
  /** human-readable result, e.g. 'Decline', 'Tier B', '+5%'. */
  result: string
  /** numeric effect on premium when applicable (multiplier or flat). */
  amount?: number
  effect?: 'multiplier' | 'flat'
}

export type LookupSource = 'Static' | 'CSV' | 'Database' | 'API'

export interface LookupTable {
  id: string
  name: string
  source: LookupSource
  columns: string[]
  rows: Record<string, string>[]
  description?: string
}

export interface FormDefinition {
  id: string
  name: string
  description?: string
  /** display name of the product this form belongs to. */
  product: string
  /** catalog references — which carrier & product this form is written for. */
  carrierId?: string
  productId?: string
  type: FormType
  version: string
  status: FormStatus
  effectiveDate: string
  expirationDate: string
  createdBy: string
  updatedAt: string
  navigationStyle: 'Wizard' | 'Tabs' | 'Accordion' | 'Single Page'
  sections: Section[]
  rules: Rule[]
  validations: Validation[]
  ratingRules: RatingRule[]
  /** base premium used as the starting point for the rating engine. */
  basePremium?: number
}

/** Runtime answer map — flat by apiName; grid values are arrays of row objects. */
export type AnswerValue = string | number | boolean | Record<string, unknown>[] | undefined
export type Answers = Record<string, AnswerValue>

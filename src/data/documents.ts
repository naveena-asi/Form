// ─────────────────────────────────────────────────────────────────────────────
// VENUSPRO Document module — the metadata model for policy documents. Mirrors the
// shape of data/types.ts: small, declarative, strongly-typed structures that the
// document engine renders, merges and delivers. A DocumentTemplate is the design
// (blocks + page setup); a DocumentInstance is a generated, numbered artifact for a
// specific policy/transaction. Clauses are reusable legal/coverage paragraphs;
// DocPackages map a policy lifecycle event to the documents it should produce.
// ─────────────────────────────────────────────────────────────────────────────
import type { Answers, ConditionGroup } from './types'
import type { Policy } from './policies'
import type { Product } from './products'
import type { Carrier } from './carriers'
import type { RatingResult } from '@/engines/ratingEngine'

// ── Document type catalog ────────────────────────────────────────────────────
export type DocumentType =
  | 'Declarations'
  | 'PolicyJacket'
  | 'FormsSchedule'
  | 'Certificate'
  | 'AutoIDCard'
  | 'EvidenceOfProperty'
  | 'Binder'
  | 'Endorsement'
  | 'CancellationNotice'
  | 'NonRenewalNotice'
  | 'ReinstatementNotice'
  | 'Invoice'
  | 'Quote'
  | 'RenewalOffer'
  | 'Notice'
  | 'CoverLetter'

/** Template lifecycle — the design's publishing state. */
export type DocStatus = 'Draft' | 'Published' | 'Archived'

/** Generated-document lifecycle — a numbered artifact's state. */
export type InstanceStatus = 'Draft' | 'Issued' | 'Delivered' | 'Superseded' | 'Void'

/** Policy lifecycle events that trigger a document package. */
export type DocEvent =
  | 'bound'
  | 'endorsed'
  | 'cancelled'
  | 'nonRenewed'
  | 'renewed'
  | 'reinstated'
  | 'claimOpened'

// ── Content blocks ───────────────────────────────────────────────────────────
// A document body is an ordered list of blocks. The discriminated union lets the
// renderer switch exhaustively on `kind`.
export interface HeadingBlock {
  kind: 'heading'
  text: string
  /** 1 = document title, 2 = section, 3 = sub-section. */
  level: 1 | 2 | 3
}

export interface RichTextBlock {
  kind: 'richtext'
  /** HTML body; may contain {{merge}} tokens. */
  html: string
}

export interface MergeBlock {
  kind: 'merge'
  /** a single token from DOCUMENT_TOKENS, e.g. 'policy.number'. */
  token: string
  label?: string
}

export interface KeyValueBlock {
  kind: 'keyValue'
  title?: string
  rows: { label: string; token: string }[]
}

export interface TableBlock {
  kind: 'table'
  title?: string
  source: 'coverages' | 'forms' | 'vehicles' | 'custom'
  columns: { key: string; label: string }[]
}

export interface ClauseRefBlock {
  kind: 'clauseRef'
  /** id of a Clause in the clause library. */
  clauseId: string
}

export interface SignatureBlock {
  kind: 'signature'
  party: 'insured' | 'carrier' | 'agent'
  label?: string
}

export interface ImageBlock {
  kind: 'image'
  src: 'carrierLogo' | 'url'
  url?: string
  alt?: string
}

export interface PageBreakBlock {
  kind: 'pageBreak'
}

export interface ConditionalBlock {
  kind: 'conditional'
  when: ConditionGroup
  blocks: DocBlock[]
}

export type DocBlock =
  | HeadingBlock
  | RichTextBlock
  | MergeBlock
  | KeyValueBlock
  | TableBlock
  | ClauseRefBlock
  | SignatureBlock
  | ImageBlock
  | PageBreakBlock
  | ConditionalBlock

// ── Reusable clause library ──────────────────────────────────────────────────
export interface Clause {
  id: string
  name: string
  category: 'Term' | 'Exclusion' | 'Condition' | 'Definition' | 'Notice'
  /** state codes this clause applies to; omitted = all jurisdictions. */
  jurisdiction?: string[]
  /** HTML body; may contain {{merge}} tokens. */
  html: string
  /** optional gate — only include when the group evaluates true. */
  when?: ConditionGroup
  version: string
}

// ── Page setup + template ────────────────────────────────────────────────────
export interface PageSetup {
  size: 'A4' | 'Letter'
  /** margins in points, applied to all sides. */
  margins: number
  header?: DocBlock[]
  footer?: DocBlock[]
  watermark?: string
}

export interface DocumentTemplate {
  id: string
  name: string
  type: DocumentType
  carrierId?: string
  productId?: string
  version: string
  status: DocStatus
  effectiveDate: string
  expirationDate: string
  page: PageSetup
  blocks: DocBlock[]
  updatedBy?: string
  updatedAt?: string
}

// ── Generated instances + delivery ───────────────────────────────────────────
export interface Delivery {
  channel: 'portal' | 'email' | 'esign' | 'print'
  to: string
  at: string
  status: string
}

export interface DocumentInstance {
  id: string
  templateId: string
  type: DocumentType
  policyId: string
  transactionId?: string
  number: string
  status: InstanceStatus
  version: number
  generatedAt: string
  issuedAt?: string
  supersedesId?: string
  signedAt?: string
  signatureData?: string
  /** frozen merge data the instance was rendered from. */
  dataSnapshot: Record<string, unknown>
  url?: string
  deliveries: Delivery[]
}

// ── Lifecycle packages ───────────────────────────────────────────────────────
export interface DocPackageEntry {
  type: DocumentType
  templateId?: string
  required?: boolean
  deliver?: ('portal' | 'email' | 'esign')[]
}

export interface DocPackage {
  event: DocEvent
  entries: DocPackageEntry[]
}

// ── Merge context ────────────────────────────────────────────────────────────
// Everything the merge/token resolver needs to render a template into an instance.
export interface MergeContext {
  policy: Policy
  product?: Product
  carrier?: Carrier
  answers: Answers
  rating?: RatingResult
  party?: { name: string; email?: string }
  now: string
}

// ── Merge token catalog ──────────────────────────────────────────────────────
// The tokens authors can drop into richtext/keyValue/merge blocks. Grouped for the
// token picker UI. `*.table` tokens expand into a rendered table.
export const DOCUMENT_TOKENS: { token: string; label: string; group: string }[] = [
  { token: 'policy.number', label: 'Policy Number', group: 'Policy' },
  { token: 'policy.effectiveDate', label: 'Effective Date', group: 'Policy' },
  { token: 'policy.expirationDate', label: 'Expiration Date', group: 'Policy' },
  { token: 'policy.premium', label: 'Annual Premium', group: 'Policy' },
  { token: 'policy.status', label: 'Policy Status', group: 'Policy' },
  { token: 'policy.product', label: 'Product / Line', group: 'Policy' },
  { token: 'insured.name', label: 'Named Insured', group: 'Insured' },
  { token: 'insured.email', label: 'Insured Email', group: 'Insured' },
  { token: 'product.name', label: 'Product Name', group: 'Product' },
  { token: 'product.code', label: 'Product Code', group: 'Product' },
  { token: 'carrier.name', label: 'Carrier Name', group: 'Carrier' },
  { token: 'carrier.code', label: 'Carrier Code', group: 'Carrier' },
  { token: 'rating.premium', label: 'Rated Premium', group: 'Rating' },
  { token: 'rating.tier', label: 'Rating Tier', group: 'Rating' },
  { token: 'rating.eligibility', label: 'Eligibility', group: 'Rating' },
  { token: 'today', label: "Today's Date", group: 'System' },
  { token: 'doc.number', label: 'Document Number', group: 'Document' },
  { token: 'party.name', label: 'Recipient Name', group: 'Document' },
  { token: 'coverages.table', label: 'Coverages Table', group: 'Tables' },
  { token: 'forms.table', label: 'Forms Schedule Table', group: 'Tables' },
  { token: 'vehicles.table', label: 'Scheduled Vehicles Table', group: 'Tables' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
export const DOC_TYPE_LABEL: Record<DocumentType, string> = {
  Declarations: 'Declarations Page',
  PolicyJacket: 'Policy Jacket',
  FormsSchedule: 'Forms Schedule',
  Certificate: 'Certificate of Insurance',
  AutoIDCard: 'Auto ID Card',
  EvidenceOfProperty: 'Evidence of Property',
  Binder: 'Binder',
  Endorsement: 'Endorsement',
  CancellationNotice: 'Cancellation Notice',
  NonRenewalNotice: 'Non-Renewal Notice',
  ReinstatementNotice: 'Reinstatement Notice',
  Invoice: 'Invoice',
  Quote: 'Quote',
  RenewalOffer: 'Renewal Offer',
  Notice: 'Notice',
  CoverLetter: 'Cover Letter',
}

/** Short prefix per document type used when minting document numbers. */
const DOC_TYPE_PREFIX: Record<DocumentType, string> = {
  Declarations: 'DEC',
  PolicyJacket: 'JKT',
  FormsSchedule: 'FRM',
  Certificate: 'COI',
  AutoIDCard: 'IDC',
  EvidenceOfProperty: 'EOP',
  Binder: 'BND',
  Endorsement: 'END',
  CancellationNotice: 'CAN',
  NonRenewalNotice: 'NON',
  ReinstatementNotice: 'RST',
  Invoice: 'INV',
  Quote: 'QTE',
  RenewalOffer: 'REN',
  Notice: 'NOT',
  CoverLetter: 'LTR',
}

/** Mint a stable, human-readable document number, e.g. POL-CA-100482-DEC-0001. */
export function documentNumber(policyNumber: string, type: DocumentType, seq: number): string {
  return `${policyNumber}-${DOC_TYPE_PREFIX[type]}-${String(seq).padStart(4, '0')}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed data — realistic, insurance-accurate clauses, templates and packages.
// ─────────────────────────────────────────────────────────────────────────────

export const seedClauses: Clause[] = [
  {
    id: 'cl-insuring-agreement',
    name: 'Insuring Agreement',
    category: 'Term',
    html:
      '<p>In consideration of the payment of the premium and in reliance upon the statements ' +
      'made in the application, <strong>{{carrier.name}}</strong> (the "Company") agrees with the ' +
      'Named Insured, <strong>{{insured.name}}</strong>, to provide the insurance described in ' +
      'this policy, subject to all of its terms, conditions and exclusions, for the policy period ' +
      'from {{policy.effectiveDate}} to {{policy.expirationDate}}.</p>',
    version: '1.0',
  },
  {
    id: 'cl-war-terrorism-exclusion',
    name: 'War and Terrorism Exclusion',
    category: 'Exclusion',
    html:
      '<p>This insurance does not apply to loss, damage, cost or expense directly or indirectly ' +
      'caused by, resulting from, or in connection with any act of war, invasion, hostilities, ' +
      'insurrection, or any act of terrorism, regardless of any other cause or event contributing ' +
      'concurrently or in any other sequence to the loss.</p>',
    version: '1.0',
  },
  {
    id: 'cl-earthquake-exclusion-ca',
    name: 'Earthquake Exclusion (California)',
    category: 'Exclusion',
    jurisdiction: ['CA'],
    html:
      '<p>In accordance with California law, this policy does <strong>not</strong> provide ' +
      'coverage for loss or damage caused directly or indirectly by earthquake, earth movement, ' +
      'or volcanic eruption. Earthquake coverage may be available by separate endorsement or ' +
      'through the California Earthquake Authority.</p>',
    when: {
      join: 'AND',
      conditions: [{ field: 'state', operator: 'equals', value: 'CA' }],
    },
    version: '1.1',
  },
  {
    id: 'cl-cancellation-condition',
    name: 'Cancellation and Nonrenewal Condition',
    category: 'Condition',
    html:
      '<p>The Named Insured may cancel this policy by mailing written notice to the Company. The ' +
      'Company may cancel this policy by mailing written notice to the Named Insured at the last ' +
      'mailing address known to the Company, stating the effective date of cancellation, not less ' +
      'than ten (10) days before the effective date for nonpayment of premium, or thirty (30) days ' +
      'for any other reason. Premium will be computed on a pro rata basis.</p>',
    version: '1.0',
  },
  {
    id: 'cl-definitions',
    name: 'Definitions',
    category: 'Definition',
    html:
      '<p><strong>"Named Insured"</strong> means the person or organization shown in the ' +
      'Declarations. <strong>"Policy Period"</strong> means the period shown in the Declarations. ' +
      '<strong>"Occurrence"</strong> means an accident, including continuous or repeated exposure ' +
      'to substantially the same general harmful conditions. <strong>"We", "Us" and "Our"</strong> ' +
      'refer to {{carrier.name}}.</p>',
    version: '1.0',
  },
  {
    id: 'cl-fraud-notice',
    name: 'Fraud Notice',
    category: 'Notice',
    html:
      '<p>Any person who knowingly and with intent to defraud any insurance company or other ' +
      'person files an application for insurance or statement of claim containing any materially ' +
      'false information, or conceals for the purpose of misleading information concerning any fact ' +
      'material thereto, commits a fraudulent insurance act, which is a crime and subjects such ' +
      'person to criminal and civil penalties.</p>',
    version: '2.0',
  },
]

// Shared header / footer block sets reused across templates.
const standardHeader: DocBlock[] = [
  { kind: 'image', src: 'carrierLogo', alt: '{{carrier.name}}' },
  { kind: 'heading', text: '{{carrier.name}}', level: 1 },
]
const standardFooter: DocBlock[] = [
  {
    kind: 'richtext',
    html:
      '<p style="font-size:10px;color:#64748b">{{carrier.name}} &middot; Policy {{policy.number}} ' +
      '&middot; Generated {{today}} &middot; This document is subject to the full policy terms.</p>',
  },
]

const today = '2026-06-30'
const plusYear = '2027-06-30'

export const seedTemplates: DocumentTemplate[] = [
  // ── Declarations Page ──────────────────────────────────────────────────────
  {
    id: 'tpl-declarations',
    name: 'Policy Declarations',
    type: 'Declarations',
    carrierId: 'car-vpro',
    version: '3.2',
    status: 'Published',
    effectiveDate: today,
    expirationDate: plusYear,
    page: { size: 'Letter', margins: 54, header: standardHeader, footer: standardFooter },
    updatedBy: 'system',
    updatedAt: today,
    blocks: [
      { kind: 'heading', text: 'Declarations', level: 1 },
      {
        kind: 'keyValue',
        title: 'Policy Information',
        rows: [
          { label: 'Named Insured', token: 'insured.name' },
          { label: 'Policy Number', token: 'policy.number' },
          { label: 'Product', token: 'policy.product' },
          { label: 'Policy Period', token: 'policy.effectiveDate' },
          { label: 'Expiration', token: 'policy.expirationDate' },
          { label: 'Total Premium', token: 'policy.premium' },
        ],
      },
      {
        kind: 'table',
        title: 'Schedule of Coverages',
        source: 'coverages',
        columns: [
          { key: 'name', label: 'Coverage' },
          { key: 'limit', label: 'Limit' },
          { key: 'deductible', label: 'Deductible' },
        ],
      },
      { kind: 'clauseRef', clauseId: 'cl-insuring-agreement' },
      {
        kind: 'conditional',
        when: { join: 'AND', conditions: [{ field: 'state', operator: 'equals', value: 'CA' }] },
        blocks: [{ kind: 'clauseRef', clauseId: 'cl-earthquake-exclusion-ca' }],
      },
      { kind: 'signature', party: 'carrier', label: 'Authorized Representative' },
    ],
  },
  // ── Certificate of Insurance (ACORD 25 style) ──────────────────────────────
  {
    id: 'tpl-certificate',
    name: 'Certificate of Liability Insurance',
    type: 'Certificate',
    carrierId: 'car-vpro',
    version: '2.5',
    status: 'Published',
    effectiveDate: today,
    expirationDate: plusYear,
    page: { size: 'Letter', margins: 36, header: standardHeader, footer: standardFooter },
    updatedBy: 'system',
    updatedAt: today,
    blocks: [
      { kind: 'heading', text: 'Certificate of Liability Insurance', level: 1 },
      {
        kind: 'richtext',
        html:
          '<p>THIS CERTIFICATE IS ISSUED AS A MATTER OF INFORMATION ONLY AND CONFERS NO RIGHTS ' +
          'UPON THE CERTIFICATE HOLDER. THIS CERTIFICATE DOES NOT AFFIRMATIVELY OR NEGATIVELY ' +
          'AMEND, EXTEND OR ALTER THE COVERAGE AFFORDED BY THE POLICIES BELOW.</p>',
      },
      {
        kind: 'keyValue',
        title: 'Insured & Insurer',
        rows: [
          { label: 'Insured', token: 'insured.name' },
          { label: 'Insurer', token: 'carrier.name' },
          { label: 'Policy Number', token: 'policy.number' },
          { label: 'Effective', token: 'policy.effectiveDate' },
          { label: 'Expiration', token: 'policy.expirationDate' },
        ],
      },
      {
        kind: 'table',
        title: 'Coverages',
        source: 'coverages',
        columns: [
          { key: 'name', label: 'Type of Insurance' },
          { key: 'limit', label: 'Limits' },
        ],
      },
      { kind: 'clauseRef', clauseId: 'cl-cancellation-condition' },
      { kind: 'signature', party: 'agent', label: 'Authorized Representative' },
    ],
  },
  // ── Policy Jacket ──────────────────────────────────────────────────────────
  {
    id: 'tpl-policy-jacket',
    name: 'Common Policy Jacket',
    type: 'PolicyJacket',
    carrierId: 'car-vpro',
    version: '1.4',
    status: 'Published',
    effectiveDate: today,
    expirationDate: plusYear,
    page: { size: 'Letter', margins: 54, header: standardHeader, footer: standardFooter, watermark: 'POLICY' },
    updatedBy: 'system',
    updatedAt: today,
    blocks: [
      { kind: 'heading', text: 'Common Policy Conditions', level: 1 },
      { kind: 'clauseRef', clauseId: 'cl-insuring-agreement' },
      { kind: 'heading', text: 'Definitions', level: 2 },
      { kind: 'clauseRef', clauseId: 'cl-definitions' },
      { kind: 'heading', text: 'Exclusions', level: 2 },
      { kind: 'clauseRef', clauseId: 'cl-war-terrorism-exclusion' },
      { kind: 'heading', text: 'Conditions', level: 2 },
      { kind: 'clauseRef', clauseId: 'cl-cancellation-condition' },
      { kind: 'pageBreak' },
      { kind: 'heading', text: 'Notices', level: 2 },
      { kind: 'clauseRef', clauseId: 'cl-fraud-notice' },
    ],
  },
  // ── Endorsement ────────────────────────────────────────────────────────────
  {
    id: 'tpl-endorsement',
    name: 'Policy Change Endorsement',
    type: 'Endorsement',
    carrierId: 'car-vpro',
    version: '1.0',
    status: 'Published',
    effectiveDate: today,
    expirationDate: plusYear,
    page: { size: 'Letter', margins: 54, header: standardHeader, footer: standardFooter },
    updatedBy: 'system',
    updatedAt: today,
    blocks: [
      { kind: 'heading', text: 'Policy Change Endorsement', level: 1 },
      {
        kind: 'keyValue',
        rows: [
          { label: 'Policy Number', token: 'policy.number' },
          { label: 'Named Insured', token: 'insured.name' },
          { label: 'Endorsement Effective', token: 'today' },
        ],
      },
      {
        kind: 'richtext',
        html:
          '<p>It is hereby understood and agreed that the policy identified above is amended as ' +
          'described below. All other terms and conditions of the policy remain unchanged.</p>',
      },
      {
        kind: 'table',
        title: 'Revised Schedule of Coverages',
        source: 'coverages',
        columns: [
          { key: 'name', label: 'Coverage' },
          { key: 'limit', label: 'Limit' },
          { key: 'deductible', label: 'Deductible' },
        ],
      },
      { kind: 'signature', party: 'carrier', label: 'Authorized Representative' },
    ],
  },
  // ── Cancellation Notice ────────────────────────────────────────────────────
  {
    id: 'tpl-cancellation',
    name: 'Notice of Cancellation',
    type: 'CancellationNotice',
    carrierId: 'car-vpro',
    version: '1.2',
    status: 'Published',
    effectiveDate: today,
    expirationDate: plusYear,
    page: { size: 'Letter', margins: 54, header: standardHeader, footer: standardFooter },
    updatedBy: 'system',
    updatedAt: today,
    blocks: [
      { kind: 'heading', text: 'Notice of Cancellation', level: 1 },
      {
        kind: 'keyValue',
        rows: [
          { label: 'Named Insured', token: 'insured.name' },
          { label: 'Policy Number', token: 'policy.number' },
          { label: 'Date of Notice', token: 'today' },
        ],
      },
      {
        kind: 'richtext',
        html:
          '<p>You are hereby notified that the above-referenced policy issued by ' +
          '{{carrier.name}} will be cancelled effective at 12:01 A.M. on the cancellation date ' +
          'stated in this notice. Coverage will cease as of that date and time.</p>',
      },
      { kind: 'clauseRef', clauseId: 'cl-cancellation-condition' },
      { kind: 'clauseRef', clauseId: 'cl-fraud-notice' },
      { kind: 'signature', party: 'carrier', label: 'On Behalf of the Company' },
    ],
  },
  // ── Invoice ────────────────────────────────────────────────────────────────
  {
    id: 'tpl-invoice',
    name: 'Premium Invoice',
    type: 'Invoice',
    carrierId: 'car-vpro',
    version: '1.0',
    status: 'Published',
    effectiveDate: today,
    expirationDate: plusYear,
    page: { size: 'Letter', margins: 54, header: standardHeader, footer: standardFooter },
    updatedBy: 'system',
    updatedAt: today,
    blocks: [
      { kind: 'heading', text: 'Premium Invoice', level: 1 },
      {
        kind: 'keyValue',
        title: 'Billing Summary',
        rows: [
          { label: 'Bill To', token: 'insured.name' },
          { label: 'Policy Number', token: 'policy.number' },
          { label: 'Invoice Date', token: 'today' },
          { label: 'Amount Due', token: 'policy.premium' },
          { label: 'Policy Period', token: 'policy.effectiveDate' },
        ],
      },
      {
        kind: 'richtext',
        html:
          '<p>Please remit the amount due by the due date shown above. Failure to pay may result ' +
          'in cancellation of coverage in accordance with the policy conditions.</p>',
      },
    ],
  },
]

export const defaultDocPackages: DocPackage[] = [
  {
    event: 'bound',
    entries: [
      { type: 'Declarations', templateId: 'tpl-declarations', required: true, deliver: ['portal', 'email'] },
      { type: 'PolicyJacket', templateId: 'tpl-policy-jacket', required: true, deliver: ['portal'] },
      { type: 'FormsSchedule', required: true, deliver: ['portal'] },
      { type: 'Certificate', templateId: 'tpl-certificate', deliver: ['portal', 'email'] },
      { type: 'Invoice', templateId: 'tpl-invoice', required: true, deliver: ['email'] },
      { type: 'CoverLetter', deliver: ['email'] },
    ],
  },
  {
    event: 'endorsed',
    entries: [
      { type: 'Endorsement', templateId: 'tpl-endorsement', required: true, deliver: ['portal', 'email'] },
      { type: 'Declarations', templateId: 'tpl-declarations', required: true, deliver: ['portal'] },
    ],
  },
  {
    event: 'cancelled',
    entries: [
      { type: 'CancellationNotice', templateId: 'tpl-cancellation', required: true, deliver: ['portal', 'email'] },
      { type: 'Invoice', templateId: 'tpl-invoice', deliver: ['email'] },
    ],
  },
  {
    event: 'renewed',
    entries: [
      { type: 'RenewalOffer', required: true, deliver: ['portal', 'email'] },
      { type: 'Declarations', templateId: 'tpl-declarations', deliver: ['portal'] },
    ],
  },
  {
    event: 'nonRenewed',
    entries: [{ type: 'NonRenewalNotice', required: true, deliver: ['portal', 'email'] }],
  },
  {
    event: 'reinstated',
    entries: [{ type: 'ReinstatementNotice', required: true, deliver: ['portal', 'email'] }],
  },
  {
    event: 'claimOpened',
    entries: [{ type: 'Notice', required: true, deliver: ['portal'] }],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Merge context + token resolution. Turns a Policy (plus its product/carrier,
// captured answers and rated result) into a MergeContext, then resolves the
// DOCUMENT_TOKENS catalog into display strings and the *.table sources into
// column/row grids the document renderer can lay out. Currency is formatted the
// same way as lib/pdf.ts ($ + locale grouping) so artifacts read consistently.
// ─────────────────────────────────────────────────────────────────────────────
import {
  DOC_TYPE_LABEL,
  type MergeContext,
  type TableBlock,
} from '@/data/documents'
import type { Answers } from '@/data/types'
import type { Policy } from '@/data/policies'
import { getProduct, type Product } from '@/data/products'
import { getCarrier, type Carrier } from '@/data/carriers'
import type { RatingResult } from '@/engines/ratingEngine'
import { useDocumentStore } from '@/store/useDocumentStore'

// ── Table shapes ───────────────────────────────────────────────────────────
export type TableSource = TableBlock['source']
export interface TableCol {
  key: string
  label: string
}
export interface ResolvedTable {
  cols: TableCol[]
  rows: Record<string, string>[]
}

// ── Formatting helpers ───────────────────────────────────────────────────────
/** Currency formatting that mirrors lib/pdf.ts: `$` + locale grouping. */
function currency(value: number | string | undefined): string {
  if (value === undefined || value === '' || value === null) return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return `$${n.toLocaleString()}`
}

/** Render an ISO timestamp as a human date; pass non-ISO strings through. */
function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function titleCase(key: string): string {
  return key
    .replace(/[_.]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

// ── Building the context ───────────────────────────────────────────────────
export interface BuildMergeContextArgs {
  policy: Policy
  product?: Product
  carrier?: Carrier
  answers?: Answers
  rating?: RatingResult
  party?: { name: string; email?: string }
  now?: string
}

/**
 * Assemble a MergeContext from a policy, filling the product/carrier from the
 * catalog when not supplied and defaulting the recipient + clock. Best-effort
 * infers the `state` answer from the policy number (e.g. POL-CA-…) so seeded
 * jurisdiction clauses/conditionals can gate without an explicit answer.
 */
export function buildMergeContext(args: BuildMergeContextArgs): MergeContext {
  const product = args.product ?? getProduct(args.policy.productId)
  const carrier = args.carrier ?? getCarrier(args.policy.carrierId)

  const answers: Answers = { ...(args.answers ?? {}) }
  if (answers.state === undefined) {
    const seg = args.policy.number.split('-')[1]
    if (seg && /^[A-Z]{2}$/.test(seg)) answers.state = seg
  }

  return {
    policy: args.policy,
    product,
    carrier,
    answers,
    rating: args.rating,
    party: args.party ?? { name: args.policy.insured },
    now: args.now ?? new Date().toISOString(),
  }
}

// ── Token resolution ──────────────────────────────────────────────────────
/** Resolve a single DOCUMENT_TOKENS token to its display string. */
export function resolveToken(token: string, ctx: MergeContext): string {
  // *.table tokens summarise the grid they expand into when used inline.
  if (token.endsWith('.table')) {
    const src = token.slice(0, -'.table'.length)
    const source: TableSource =
      src === 'coverages' || src === 'forms' || src === 'vehicles' ? src : 'custom'
    return `${resolveTable(source, ctx).rows.length} row(s)`
  }

  switch (token) {
    case 'policy.number':
      return ctx.policy.number
    case 'policy.effectiveDate':
      return ctx.policy.effectiveDate
    case 'policy.expirationDate':
      return ctx.policy.expirationDate
    case 'policy.premium':
      return currency(ctx.policy.premium)
    case 'policy.status':
      return ctx.policy.status
    case 'policy.product':
      return ctx.policy.product
    case 'insured.name':
      return ctx.policy.insured
    case 'insured.email':
      return ctx.party?.email ?? ''
    case 'product.name':
      return ctx.product?.name ?? ''
    case 'product.code':
      return ctx.product?.code ?? ''
    case 'carrier.name':
      return ctx.carrier?.name ?? ''
    case 'carrier.code':
      return ctx.carrier?.code ?? ''
    case 'rating.premium':
      return ctx.rating ? currency(ctx.rating.premium) : currency(ctx.policy.premium)
    case 'rating.tier':
      return ctx.rating?.tier ?? '—'
    case 'rating.eligibility':
      return ctx.rating?.eligibility ?? '—'
    case 'today':
      return formatDate(ctx.now)
    case 'doc.number':
      return String(ctx.answers['doc.number'] ?? '')
    case 'party.name':
      return ctx.party?.name ?? ctx.policy.insured
    default:
      return ''
  }
}

/** Replace every {{token}} occurrence in a string with its resolved value. */
export function resolveText(text: string, ctx: MergeContext): string {
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, token: string) => resolveToken(token, ctx))
}

// ── Table resolution ──────────────────────────────────────────────────────
/** Resolve a table source into columns + string rows for the renderer grid. */
export function resolveTable(source: TableSource, ctx: MergeContext): ResolvedTable {
  switch (source) {
    case 'coverages': {
      const cols: TableCol[] = [
        { key: 'name', label: 'Coverage' },
        { key: 'limit', label: 'Limit' },
        { key: 'deductible', label: 'Deductible' },
      ]
      const rows = ctx.policy.coverages.map((c) => ({
        name: c.name,
        limit: c.limit,
        deductible: c.deductible ?? '—',
      }))
      return { cols, rows }
    }
    case 'forms': {
      const cols: TableCol[] = [
        { key: 'name', label: 'Form' },
        { key: 'type', label: 'Type' },
        { key: 'edition', label: 'Edition' },
      ]
      const templates = useDocumentStore
        .getState()
        .templates.filter(
          (t) =>
            t.status === 'Published' &&
            (!t.productId || t.productId === ctx.product?.id) &&
            (!t.carrierId || t.carrierId === ctx.carrier?.id),
        )
      const rows = templates.map((t) => ({
        name: t.name,
        type: DOC_TYPE_LABEL[t.type],
        edition: `v${t.version}`,
      }))
      return { cols, rows }
    }
    case 'vehicles': {
      const raw = ctx.answers['vehicles']
      const records = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : []
      if (records.length === 0) {
        return { cols: [{ key: 'description', label: 'Vehicle' }], rows: [] }
      }
      const keys = Object.keys(records[0])
      const cols: TableCol[] = keys.map((k) => ({ key: k, label: titleCase(k) }))
      const rows = records.map((r) => {
        const out: Record<string, string> = {}
        for (const k of keys) {
          const v = r[k]
          out[k] = v === undefined || v === null ? '—' : String(v)
        }
        return out
      })
      return { cols, rows }
    }
    case 'custom':
      return { cols: [], rows: [] }
    default: {
      const never: never = source
      return never
    }
  }
}

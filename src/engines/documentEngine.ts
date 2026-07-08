// ─────────────────────────────────────────────────────────────────────────────
// Document generation engine — resolves the DocPackage for a lifecycle event,
// picks a template per entry, renders it to a PDF data URI, and mints numbered
// DocumentInstances into the document store. On 'endorsed' / 'renewed' the prior
// active Declarations for the policy is superseded and chained via supersedesId.
// Non-React: reaches the zustand store through useDocumentStore.getState().
// ─────────────────────────────────────────────────────────────────────────────
import {
  DOCUMENT_TOKENS,
  documentNumber,
  type Delivery,
  type DocEvent,
  type DocPackageEntry,
  type DocumentInstance,
  type DocumentTemplate,
  type MergeContext,
} from '@/data/documents'
import type { Policy } from '@/data/policies'
import { useDocumentStore } from '@/store/useDocumentStore'
import { uid } from '@/lib/uid'
import { renderToDataUrl } from '@/lib/documentRender'
import {
  buildMergeContext,
  resolveToken,
  type BuildMergeContextArgs,
} from '@/lib/mergeContext'

const nowIso = () => new Date().toISOString()

type DocStore = ReturnType<typeof useDocumentStore.getState>

/**
 * Choose the template that backs a package entry: the explicit templateId when
 * set, otherwise the best published template of that type — preferring one
 * scoped to the context's product, then its carrier, then any. Returns
 * undefined when no template exists for the type (entry is skipped).
 */
function pickTemplate(
  entry: DocPackageEntry,
  ctx: MergeContext,
  store: DocStore,
): DocumentTemplate | undefined {
  if (entry.templateId) {
    const explicit = store.getTemplate(entry.templateId)
    if (explicit) return explicit
  }
  const candidates = store.templates.filter((t) => t.type === entry.type)
  const published = candidates.filter((t) => t.status === 'Published')
  const pool = published.length ? published : candidates
  return (
    pool.find((t) => t.productId && t.productId === ctx.product?.id) ??
    pool.find((t) => !t.productId && t.carrierId === ctx.carrier?.id) ??
    pool.find((t) => !t.productId) ??
    pool[0]
  )
}

/** Flat snapshot of the merged values an instance was rendered from. */
function snapshot(ctx: MergeContext): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const { token } of DOCUMENT_TOKENS) {
    if (token.endsWith('.table')) continue
    out[token] = resolveToken(token, ctx)
  }
  return out
}

/**
 * Generate every document in the package for an event, render each to a data
 * URI, persist numbered instances, and return them. Superseding rules apply for
 * endorsement/renewal Declarations.
 */
export function generateDocuments(
  event: DocEvent,
  ctx: MergeContext,
  opts?: { transactionId?: string },
): DocumentInstance[] {
  const store = useDocumentStore.getState()
  const pkg = store.getPackage(event)
  if (!pkg) return []

  const supersedes = event === 'endorsed' || event === 'renewed'
  const created: DocumentInstance[] = []

  for (const entry of pkg.entries) {
    const template = pickTemplate(entry, ctx, store)
    if (!template) continue // no renderable template for this type — skip

    const at = nowIso()
    const priorCount = store
      .getInstancesForPolicy(ctx.policy.id)
      .filter((i) => i.type === entry.type).length
    const number = documentNumber(ctx.policy.number, entry.type, priorCount + 1)

    // surface the freshly minted number into the render context
    const renderCtx: MergeContext = {
      ...ctx,
      answers: { ...ctx.answers, 'doc.number': number },
    }
    const url = renderToDataUrl(template, renderCtx)

    // supersede the prior active Declarations for endorsement/renewal events
    let supersedesId: string | undefined
    if (supersedes && entry.type === 'Declarations') {
      const prior = store
        .getInstancesForPolicy(ctx.policy.id)
        .find(
          (i) => i.type === 'Declarations' && i.status !== 'Superseded' && i.status !== 'Void',
        )
      if (prior) {
        store.supersedeInstance(prior.id)
        supersedesId = prior.id
      }
    }

    const deliveries: Delivery[] = [
      {
        channel: 'portal',
        to: ctx.party?.name ?? ctx.policy.insured,
        at,
        status: 'Delivered',
      },
    ]

    const instance: DocumentInstance = {
      id: uid('doc'),
      templateId: template.id,
      type: entry.type,
      policyId: ctx.policy.id,
      transactionId: opts?.transactionId,
      number,
      status: 'Issued',
      version: 1,
      generatedAt: at,
      issuedAt: at,
      supersedesId,
      dataSnapshot: snapshot(renderCtx),
      url,
      deliveries,
    }

    created.push(store.addInstance(instance))
  }

  return created
}

/**
 * Convenience for the portal: (re)issue the 'bound' document package for an
 * existing policy. Builds a MergeContext from the policy (filling product /
 * carrier / answers) and runs the bound generator.
 */
export function regenerateForPolicy(
  policy: Policy,
  extra?: Omit<BuildMergeContextArgs, 'policy'>,
  opts?: { transactionId?: string },
): DocumentInstance[] {
  const ctx = buildMergeContext({ policy, ...(extra ?? {}) })
  return generateDocuments('bound', ctx, opts)
}

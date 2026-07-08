// ─────────────────────────────────────────────────────────────────────────────
// Policy store — the live list of the customer's bound policies. New policies are
// bound here when a customer completes a product Application (closing the chain
// carrier → product → form → policy → portal). Persisted to localStorage.
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand'
import { seedPolicies, type Coverage, type Policy } from '@/data/policies'
import type { Product } from '@/data/products'
import { uid } from '@/lib/uid'
import type { DocEvent } from '@/data/documents'
import { buildMergeContext } from '@/lib/mergeContext'
import { generateDocuments } from '@/engines/documentEngine'
import { useFormStore } from '@/store/useFormStore'
import { rate } from '@/engines/ratingEngine'

// Map the active applicant-flow transaction kind to the document lifecycle event
// whose package should be generated once the policy is bound/updated.
const KIND_EVENT: Record<string, DocEvent> = {
  quote: 'bound',
  endorsement: 'endorsed',
  cancellation: 'cancelled',
  renewal: 'renewed',
  claim: 'claimOpened',
}

/**
 * Generate (and persist) the document package for a freshly bound/updated policy.
 * Pulls the live runtime answers + form so the rated result and merge tokens match
 * what the applicant just submitted. Best-effort — never blocks the policy write.
 */
function generatePolicyDocuments(policy: Policy, event: DocEvent) {
  try {
    const { answers, runtimeForm } = useFormStore.getState()
    const rating = runtimeForm ? rate(runtimeForm, answers) : undefined
    const ctx = buildMergeContext({ policy, answers, rating, now: new Date().toISOString() })
    generateDocuments(event, ctx)
  } catch {
    /* document generation is non-blocking — ignore failures */
  }
}

const STORAGE_KEY = 'venuspro.policies.v1'

function load(): Policy[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Policy[]
  } catch {
    /* ignore */
  }
  return structuredClone(seedPolicies)
}
function persist(policies: Policy[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(policies))
  } catch {
    /* ignore */
  }
}

const today = () => new Date().toISOString().slice(0, 10)
const plusYear = () => {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

export interface BindInput {
  product: Product
  premium: number
  insured: string
}

interface PolicyState {
  policies: Policy[]
  getPolicy: (id: string) => Policy | undefined
  /** Bind a new policy from a completed product application + rated premium. */
  bindPolicy: (input: BindInput) => Policy
  updatePolicy: (id: string, patch: Partial<Policy>) => void
  resetPolicies: () => void
}

export const usePolicyStore = create<PolicyState>((set, get) => ({
  policies: load(),

  getPolicy: (id) => get().policies.find((p) => p.id === id),

  bindPolicy: ({ product, premium, insured }) => {
    const number = `POL-${product.code}-${Math.floor(100000 + Math.random() * 899999)}`
    const coverages: Coverage[] = product.coverages.map((c) => ({
      name: c.name,
      limit: c.limits[c.limits.length - 1],
      deductible: c.deductibles?.[0],
    }))
    const policy: Policy = {
      id: uid('pol'),
      number,
      productId: product.id,
      carrierId: product.carrierId,
      product: product.name,
      status: 'Active',
      premium,
      effectiveDate: today(),
      expirationDate: plusYear(),
      insured: insured || 'New Applicant',
      coverages,
      documents: ['Policy Declarations'],
    }
    set((s) => {
      const policies = [policy, ...s.policies]
      persist(policies)
      return { policies }
    })
    // Binding always closes a quote → generate the 'bound' document package.
    generatePolicyDocuments(policy, 'bound')
    return policy
  },

  updatePolicy: (id, patch) => {
    set((s) => {
      const policies = s.policies.map((p) => (p.id === id ? { ...p, ...patch } : p))
      persist(policies)
      return { policies }
    })
    // A policy-bound action (endorse / cancel / renew) drives the matching package,
    // but only when it is the active applicant transaction for this exact policy.
    const txn = useFormStore.getState().txnContext
    const event = txn && txn.policyId === id ? KIND_EVENT[txn.kind] : undefined
    if (event && event !== 'bound') {
      const updated = get().getPolicy(id)
      if (updated) generatePolicyDocuments(updated, event)
    }
  },

  resetPolicies: () =>
    set(() => {
      const fresh = structuredClone(seedPolicies)
      persist(fresh)
      return { policies: fresh }
    }),
}))

// ─────────────────────────────────────────────────────────────────────────────
// Policy store — the live list of the customer's bound policies. New policies are
// bound here when a customer completes a product Application (closing the chain
// carrier → product → form → policy → portal). Persisted to localStorage.
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand'
import { seedPolicies, type Coverage, type Policy } from '@/data/policies'
import type { Product } from '@/data/products'
import { uid } from '@/lib/uid'

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
    return policy
  },

  updatePolicy: (id, patch) =>
    set((s) => {
      const policies = s.policies.map((p) => (p.id === id ? { ...p, ...patch } : p))
      persist(policies)
      return { policies }
    }),

  resetPolicies: () =>
    set(() => {
      const fresh = structuredClone(seedPolicies)
      persist(fresh)
      return { policies: fresh }
    }),
}))

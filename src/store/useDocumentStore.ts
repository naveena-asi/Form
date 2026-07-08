// ─────────────────────────────────────────────────────────────────────────────
// Document store — the live library of document templates, the reusable clause
// catalog, lifecycle packages, and the generated document instances issued against
// policies. Seeded from data/documents.ts on first load and persisted to
// localStorage. Mirrors store/usePolicyStore.ts (load/persist/structuredClone).
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand'
import {
  defaultDocPackages,
  seedClauses,
  seedTemplates,
  type Clause,
  type Delivery,
  type DocEvent,
  type DocPackage,
  type DocumentInstance,
  type DocumentTemplate,
} from '@/data/documents'
import { uid } from '@/lib/uid'

const STORAGE_KEY = 'venuspro.documents.v1'

interface PersistShape {
  templates: DocumentTemplate[]
  clauses: Clause[]
  instances: DocumentInstance[]
  packages: DocPackage[]
}

function seed(): PersistShape {
  return {
    templates: structuredClone(seedTemplates),
    clauses: structuredClone(seedClauses),
    instances: [],
    packages: structuredClone(defaultDocPackages),
  }
}

function load(): PersistShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as PersistShape
  } catch {
    /* ignore */
  }
  return seed()
}

function persist(state: PersistShape) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        templates: state.templates,
        clauses: state.clauses,
        instances: state.instances,
        packages: state.packages,
      } satisfies PersistShape),
    )
  } catch {
    /* ignore */
  }
}

const now = () => new Date().toISOString()

interface DocumentState {
  templates: DocumentTemplate[]
  clauses: Clause[]
  instances: DocumentInstance[]
  packages: DocPackage[]

  // Templates
  getTemplate: (id: string) => DocumentTemplate | undefined
  upsertTemplate: (t: DocumentTemplate) => void
  duplicateTemplate: (id: string) => DocumentTemplate | undefined
  removeTemplate: (id: string) => void
  publishTemplate: (id: string) => void

  // Clauses
  getClause: (id: string) => Clause | undefined
  upsertClause: (c: Clause) => void
  removeClause: (id: string) => void

  // Packages
  getPackage: (event: DocEvent) => DocPackage | undefined
  setPackage: (pkg: DocPackage) => void

  // Instances
  addInstance: (i: DocumentInstance) => DocumentInstance
  getInstance: (id: string) => DocumentInstance | undefined
  getInstancesForPolicy: (policyId: string) => DocumentInstance[]
  supersedeInstance: (id: string) => void
  voidInstance: (id: string) => void
  recordDelivery: (id: string, delivery: Delivery) => void
  signInstance: (id: string, signatureData: string) => void

  resetDocuments: () => void
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  ...load(),

  // ── Templates ──────────────────────────────────────────────────────────────
  getTemplate: (id) => get().templates.find((t) => t.id === id),

  upsertTemplate: (t) =>
    set((s) => {
      const exists = s.templates.some((x) => x.id === t.id)
      const stamped: DocumentTemplate = { ...t, updatedAt: now() }
      const templates = exists
        ? s.templates.map((x) => (x.id === t.id ? stamped : x))
        : [stamped, ...s.templates]
      persist({ ...s, templates })
      return { templates }
    }),

  duplicateTemplate: (id) => {
    const original = get().templates.find((t) => t.id === id)
    if (!original) return undefined
    const copy: DocumentTemplate = {
      ...structuredClone(original),
      id: uid('tpl'),
      name: `${original.name} (Copy)`,
      status: 'Draft',
      updatedAt: now(),
    }
    set((s) => {
      const templates = [copy, ...s.templates]
      persist({ ...s, templates })
      return { templates }
    })
    return copy
  },

  removeTemplate: (id) =>
    set((s) => {
      const templates = s.templates.filter((t) => t.id !== id)
      persist({ ...s, templates })
      return { templates }
    }),

  publishTemplate: (id) =>
    set((s) => {
      const templates = s.templates.map((t) =>
        t.id === id ? { ...t, status: 'Published' as const, updatedAt: now() } : t,
      )
      persist({ ...s, templates })
      return { templates }
    }),

  // ── Clauses ────────────────────────────────────────────────────────────────
  getClause: (id) => get().clauses.find((c) => c.id === id),

  upsertClause: (c) =>
    set((s) => {
      const exists = s.clauses.some((x) => x.id === c.id)
      const clauses = exists
        ? s.clauses.map((x) => (x.id === c.id ? c : x))
        : [c, ...s.clauses]
      persist({ ...s, clauses })
      return { clauses }
    }),

  removeClause: (id) =>
    set((s) => {
      const clauses = s.clauses.filter((c) => c.id !== id)
      persist({ ...s, clauses })
      return { clauses }
    }),

  // ── Packages ───────────────────────────────────────────────────────────────
  getPackage: (event) => get().packages.find((p) => p.event === event),

  setPackage: (pkg) =>
    set((s) => {
      const exists = s.packages.some((p) => p.event === pkg.event)
      const packages = exists
        ? s.packages.map((p) => (p.event === pkg.event ? pkg : p))
        : [...s.packages, pkg]
      persist({ ...s, packages })
      return { packages }
    }),

  // ── Instances ──────────────────────────────────────────────────────────────
  addInstance: (i) => {
    const instance: DocumentInstance = { ...i, id: i.id || uid('doc') }
    set((s) => {
      const instances = [instance, ...s.instances]
      persist({ ...s, instances })
      return { instances }
    })
    return instance
  },

  getInstance: (id) => get().instances.find((i) => i.id === id),

  getInstancesForPolicy: (policyId) =>
    get()
      .instances.filter((i) => i.policyId === policyId)
      .slice()
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt)),

  supersedeInstance: (id) =>
    set((s) => {
      const instances = s.instances.map((i) =>
        i.id === id ? { ...i, status: 'Superseded' as const } : i,
      )
      persist({ ...s, instances })
      return { instances }
    }),

  voidInstance: (id) =>
    set((s) => {
      const instances = s.instances.map((i) =>
        i.id === id ? { ...i, status: 'Void' as const } : i,
      )
      persist({ ...s, instances })
      return { instances }
    }),

  recordDelivery: (id, delivery) =>
    set((s) => {
      const instances = s.instances.map((i) =>
        i.id === id
          ? {
              ...i,
              deliveries: [...i.deliveries, delivery],
              status: i.status === 'Issued' || i.status === 'Draft' ? ('Delivered' as const) : i.status,
            }
          : i,
      )
      persist({ ...s, instances })
      return { instances }
    }),

  signInstance: (id, signatureData) =>
    set((s) => {
      const instances = s.instances.map((i) =>
        i.id === id ? { ...i, signatureData, signedAt: now() } : i,
      )
      persist({ ...s, instances })
      return { instances }
    }),

  resetDocuments: () =>
    set(() => {
      const fresh = seed()
      persist(fresh)
      return fresh
    }),
}))

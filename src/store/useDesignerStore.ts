// ─────────────────────────────────────────────────────────────────────────────
// Designer store — the single editable source of truth for the form metadata.
// Every builder screen mutates THIS, and the runtime renderer reads from it, so
// edits in the designer show up live in Preview. Persisted to localStorage.
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand'
import type {
  FieldType,
  FieldGroup,
  Field,
  FormDefinition,
  LookupTable,
  Rule,
  Validation,
  RatingRule,
  Section,
  FormStatus,
} from '@/data/types'
import { commercialAuto } from '@/data/commercialAuto'
import { lookupTables } from '@/data/lookups'
import { fieldTypeCatalog } from '@/data/fieldTypes'
import { uid } from '@/lib/uid'

// v2: previously, previewing a library form or starting a customer transaction
// could overwrite the designer's form. That bug is fixed (preview/fill now use a
// separate runtime override). Bumping the key discards any clobbered v1 state and
// re-seeds the Commercial Auto Application.
const STORAGE_KEY = 'venuspro.designer.v2'

export interface VersionRow {
  id: string
  version: string
  date: string
  status: FormStatus
  author: string
  note: string
  /** full form-definition snapshot captured when the version was created. */
  snapshot?: FormDefinition
}

const defaultVersions: VersionRow[] = [
  { id: 'v1', version: '1.1', date: '2024-05-12', status: 'Published', author: 'Admin', note: 'Added large-fleet surcharge + driver requirement' },
  { id: 'v2', version: '1.0', date: '2024-01-06', status: 'Archived', author: 'Admin', note: 'Initial Commercial Auto release' },
  { id: 'v3', version: '1.2', date: '2024-05-20', status: 'Draft', author: 'John D.', note: 'Working copy — new coverage options' },
]

// ── Factory helpers ──────────────────────────────────────────────────────────
export function makeField(type: FieldType): Field {
  const meta = fieldTypeCatalog.find((f) => f.type === type)
  const group: FieldGroup = meta?.group ?? 'Basic'
  const base: Field = {
    id: uid('f'),
    apiName: `${type}Field${Math.floor(Math.random() * 900 + 100)}`,
    label: meta?.label ?? 'New Field',
    type,
    group,
    colSpan: 1,
  }
  if (['select', 'radio', 'coverage'].includes(type)) {
    base.options = [
      { label: 'Option A', value: 'A' },
      { label: 'Option B', value: 'B' },
    ]
  }
  if (['currency', 'limit', 'deductible', 'premium'].includes(type)) base.prefix = '$'
  if (type === 'percentage') base.suffix = '%'
  if (type === 'grid') {
    base.colSpan = 2
    base.grid = {
      minRows: 0,
      maxRows: 50,
      columns: [
        { apiName: 'col1', label: 'Column 1', type: 'text', width: '50%' },
        { apiName: 'col2', label: 'Column 2', type: 'text', width: '50%' },
      ],
    }
  }
  if (type === 'computed' || type === 'premium') base.formula = '0'
  return base
}

export function makeRule(): Rule {
  return {
    id: uid('r'),
    name: 'New Rule',
    when: { join: 'AND', conditions: [{ field: '', operator: 'equals', value: '' }] },
    action: 'show',
    targets: [],
  }
}

export function makeValidation(): Validation {
  return {
    id: uid('v'),
    field: '',
    type: 'required',
    level: 'blocker',
    message: 'This field is required.',
    scope: 'Field',
  }
}

export function makeRatingRule(): RatingRule {
  return {
    id: uid('rr'),
    name: 'New Rating Rule',
    when: { join: 'AND', conditions: [{ field: '', operator: 'equals', value: '' }] },
    output: 'Surcharge',
    result: '',
    effect: 'multiplier',
    amount: 1.1,
  }
}

export function makeLookup(): LookupTable {
  return {
    id: uid('lk'),
    name: 'New Lookup',
    source: 'Static',
    description: '',
    columns: ['Code', 'Label'],
    rows: [{ Code: '', Label: '' }],
  }
}

function makeSection(index: number): Section {
  return {
    id: uid('sec'),
    name: `New Section ${index}`,
    description: '',
    layout: 'Two Column',
    columns: 2,
    collapsible: false,
    required: false,
    fields: [],
  }
}

// ── Persistence ──────────────────────────────────────────────────────────────
interface Persisted {
  form: FormDefinition
  lookups: LookupTable[]
  versions: VersionRow[]
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Persisted
  } catch {
    /* ignore */
  }
  return {
    form: structuredClone(commercialAuto),
    lookups: structuredClone(lookupTables),
    versions: structuredClone(defaultVersions),
  }
}

// ── Store ────────────────────────────────────────────────────────────────────
interface DesignerState extends Persisted {
  selectedSectionId: string
  setSelectedSection: (id: string) => void

  updateForm: (patch: Partial<FormDefinition>) => void

  addSection: () => string
  updateSection: (id: string, patch: Partial<Section>) => void
  deleteSection: (id: string) => void
  moveSection: (id: string, dir: -1 | 1) => void
  reorderSection: (from: number, to: number) => void
  addSubsection: (sectionId: string) => void

  addField: (sectionId: string, type: FieldType) => string
  updateField: (sectionId: string, fieldId: string, patch: Partial<Field>) => void
  deleteField: (sectionId: string, fieldId: string) => void
  moveField: (sectionId: string, fieldId: string, dir: -1 | 1) => void
  reorderField: (sectionId: string, from: number, to: number) => void

  addRule: (rule: Rule) => void
  updateRule: (rule: Rule) => void
  deleteRule: (id: string) => void

  addValidation: (v: Validation) => void
  updateValidation: (v: Validation) => void
  deleteValidation: (id: string) => void

  addRatingRule: (r: RatingRule) => void
  updateRatingRule: (r: RatingRule) => void
  deleteRatingRule: (id: string) => void

  addLookup: () => string
  updateLookup: (id: string, patch: Partial<LookupTable>) => void
  deleteLookup: (id: string) => void
  addLookupRow: (id: string) => void
  updateLookupCell: (id: string, rowIndex: number, col: string, value: string) => void
  deleteLookupRow: (id: string, rowIndex: number) => void

  cloneVersion: (id: string) => void
  rollbackVersion: (id: string) => boolean
  publish: () => void
  loadForm: (form: FormDefinition) => void
  resetAll: () => void
}

function persist(state: Persisted) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ form: state.form, lookups: state.lookups, versions: state.versions }),
    )
  } catch {
    /* ignore */
  }
}

const initial = load()

export const useDesignerStore = create<DesignerState>((set, get) => {
  // Mutate `form` immutably and persist.
  const setForm = (mut: (f: FormDefinition) => FormDefinition) =>
    set((s) => {
      const form = mut(structuredClone(s.form))
      form.updatedAt = new Date().toISOString().slice(0, 10)
      const next = { ...s, form }
      persist(next)
      return { form }
    })

  return {
    ...initial,
    selectedSectionId: initial.form.sections[0]?.id ?? '',
    setSelectedSection: (id) => set({ selectedSectionId: id }),

    updateForm: (patch) => setForm((f) => ({ ...f, ...patch })),

    addSection: () => {
      const id = uid('sec')
      setForm((f) => {
        const sec = makeSection(f.sections.length + 1)
        sec.id = id
        f.sections.push(sec)
        return f
      })
      set({ selectedSectionId: id })
      return id
    },
    updateSection: (id, patch) =>
      setForm((f) => {
        f.sections = f.sections.map((s) => (s.id === id ? { ...s, ...patch } : s))
        return f
      }),
    deleteSection: (id) => {
      setForm((f) => {
        f.sections = f.sections.filter((s) => s.id !== id)
        return f
      })
      const remaining = get().form.sections
      if (get().selectedSectionId === id) set({ selectedSectionId: remaining[0]?.id ?? '' })
    },
    moveSection: (id, dir) =>
      setForm((f) => {
        const i = f.sections.findIndex((s) => s.id === id)
        const j = i + dir
        if (i < 0 || j < 0 || j >= f.sections.length) return f
        ;[f.sections[i], f.sections[j]] = [f.sections[j], f.sections[i]]
        return f
      }),
    reorderSection: (from, to) =>
      setForm((f) => {
        if (from === to || from < 0 || to < 0 || from >= f.sections.length || to >= f.sections.length) return f
        const [moved] = f.sections.splice(from, 1)
        f.sections.splice(to, 0, moved)
        return f
      }),
    addSubsection: (sectionId) =>
      setForm((f) => {
        f.sections = f.sections.map((s) =>
          s.id === sectionId
            ? { ...s, subsections: [...(s.subsections ?? []), { id: uid('sub'), name: 'New Subsection', fields: [] }] }
            : s,
        )
        return f
      }),

    addField: (sectionId, type) => {
      const field = makeField(type)
      setForm((f) => {
        f.sections = f.sections.map((s) =>
          s.id === sectionId ? { ...s, fields: [...s.fields, field] } : s,
        )
        return f
      })
      return field.id
    },
    updateField: (sectionId, fieldId, patch) =>
      setForm((f) => {
        f.sections = f.sections.map((s) =>
          s.id === sectionId
            ? { ...s, fields: s.fields.map((fl) => (fl.id === fieldId ? { ...fl, ...patch } : fl)) }
            : s,
        )
        return f
      }),
    deleteField: (sectionId, fieldId) =>
      setForm((f) => {
        f.sections = f.sections.map((s) =>
          s.id === sectionId ? { ...s, fields: s.fields.filter((fl) => fl.id !== fieldId) } : s,
        )
        return f
      }),
    moveField: (sectionId, fieldId, dir) =>
      setForm((f) => {
        f.sections = f.sections.map((s) => {
          if (s.id !== sectionId) return s
          const fields = [...s.fields]
          const i = fields.findIndex((fl) => fl.id === fieldId)
          const j = i + dir
          if (i < 0 || j < 0 || j >= fields.length) return s
          ;[fields[i], fields[j]] = [fields[j], fields[i]]
          return { ...s, fields }
        })
        return f
      }),
    reorderField: (sectionId, from, to) =>
      setForm((f) => {
        f.sections = f.sections.map((s) => {
          if (s.id !== sectionId) return s
          const fields = [...s.fields]
          if (from === to || from < 0 || to < 0 || from >= fields.length || to >= fields.length) return s
          const [moved] = fields.splice(from, 1)
          fields.splice(to, 0, moved)
          return { ...s, fields }
        })
        return f
      }),

    addRule: (rule) => setForm((f) => ({ ...f, rules: [...f.rules, rule] })),
    updateRule: (rule) =>
      setForm((f) => ({ ...f, rules: f.rules.map((r) => (r.id === rule.id ? rule : r)) })),
    deleteRule: (id) => setForm((f) => ({ ...f, rules: f.rules.filter((r) => r.id !== id) })),

    addValidation: (v) => setForm((f) => ({ ...f, validations: [...f.validations, v] })),
    updateValidation: (v) =>
      setForm((f) => ({ ...f, validations: f.validations.map((x) => (x.id === v.id ? v : x)) })),
    deleteValidation: (id) =>
      setForm((f) => ({ ...f, validations: f.validations.filter((x) => x.id !== id) })),

    addRatingRule: (r) => setForm((f) => ({ ...f, ratingRules: [...f.ratingRules, r] })),
    updateRatingRule: (r) =>
      setForm((f) => ({ ...f, ratingRules: f.ratingRules.map((x) => (x.id === r.id ? r : x)) })),
    deleteRatingRule: (id) =>
      setForm((f) => ({ ...f, ratingRules: f.ratingRules.filter((x) => x.id !== id) })),

    addLookup: () => {
      const lk = makeLookup()
      set((s) => {
        const lookups = [...s.lookups, lk]
        persist({ ...s, lookups })
        return { lookups }
      })
      return lk.id
    },
    updateLookup: (id, patch) =>
      set((s) => {
        const lookups = s.lookups.map((l) => (l.id === id ? { ...l, ...patch } : l))
        persist({ ...s, lookups })
        return { lookups }
      }),
    deleteLookup: (id) =>
      set((s) => {
        const lookups = s.lookups.filter((l) => l.id !== id)
        persist({ ...s, lookups })
        return { lookups }
      }),
    addLookupRow: (id) =>
      set((s) => {
        const lookups = s.lookups.map((l) =>
          l.id === id ? { ...l, rows: [...l.rows, Object.fromEntries(l.columns.map((c) => [c, '']))] } : l,
        )
        persist({ ...s, lookups })
        return { lookups }
      }),
    updateLookupCell: (id, rowIndex, col, value) =>
      set((s) => {
        const lookups = s.lookups.map((l) => {
          if (l.id !== id) return l
          const rows = l.rows.map((r, i) => (i === rowIndex ? { ...r, [col]: value } : r))
          return { ...l, rows }
        })
        persist({ ...s, lookups })
        return { lookups }
      }),
    deleteLookupRow: (id, rowIndex) =>
      set((s) => {
        const lookups = s.lookups.map((l) =>
          l.id === id ? { ...l, rows: l.rows.filter((_, i) => i !== rowIndex) } : l,
        )
        persist({ ...s, lookups })
        return { lookups }
      }),

    cloneVersion: (id) =>
      set((s) => {
        const src = s.versions.find((v) => v.id === id)
        if (!src) return s
        const parts = src.version.split('.').map(Number)
        parts[1] = (parts[1] ?? 0) + 1
        const clone: VersionRow = {
          id: uid('ver'),
          version: parts.join('.'),
          date: new Date().toISOString().slice(0, 10),
          status: 'Draft',
          author: 'Admin',
          note: `Snapshot of v${src.version} (${s.form.sections.length} sections, ${s.form.sections.flatMap((x) => x.fields).length} fields)`,
          snapshot: structuredClone(s.form),
        }
        const versions = [clone, ...s.versions]
        persist({ ...s, versions })
        return { versions }
      }),
    // Restore a version's captured form snapshot. Returns true if a snapshot
    // was restored, false for legacy versions that only flip status.
    rollbackVersion: (id) => {
      const s = get()
      const target = s.versions.find((v) => v.id === id)
      if (!target) return false
      const versions = s.versions.map((v) =>
        v.id === id
          ? { ...v, status: 'Published' as FormStatus }
          : v.status === 'Published'
            ? { ...v, status: 'Archived' as FormStatus }
            : v,
      )
      if (target.snapshot) {
        const form = structuredClone(target.snapshot)
        persist({ ...s, form, versions })
        set({ form, versions, selectedSectionId: form.sections[0]?.id ?? '' })
        return true
      }
      persist({ ...s, versions })
      set({ versions })
      return false
    },
    publish: () =>
      setForm((f) => ({ ...f, status: 'Published' })),

    loadForm: (form) =>
      set((s) => {
        const cloned = structuredClone(form)
        persist({ ...s, form: cloned })
        return { form: cloned, selectedSectionId: cloned.sections[0]?.id ?? '' }
      }),

    resetAll: () => {
      const fresh: Persisted = {
        form: structuredClone(commercialAuto),
        lookups: structuredClone(lookupTables),
        versions: structuredClone(defaultVersions),
      }
      persist(fresh)
      set({ ...fresh, selectedSectionId: fresh.form.sections[0]?.id ?? '' })
    },
  }
})

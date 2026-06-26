// ─────────────────────────────────────────────────────────────────────────────
// Runtime store — holds the active form's answers and grid rows, persisted to
// localStorage so an in-progress quote survives a refresh. Derived values
// (visibility, validation, premium) are computed in the renderer from these.
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand'
import type { AnswerValue, Answers, FormDefinition } from '@/data/types'

const STORAGE_KEY = 'venuspro.answers.v1'

function load(): Answers {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Answers
  } catch {
    /* ignore */
  }
  return {}
}

function persist(answers: Answers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers))
  } catch {
    /* ignore */
  }
}

type GridRow = Record<string, unknown>

interface FormState {
  answers: Answers
  /**
   * Form currently being PREVIEWED / FILLED (admin preview or customer portal).
   * Null means "show the form being edited in the designer". This is session-only
   * and is NEVER persisted into the designer, so previewing or applying for a form
   * cannot clobber the form you're building.
   */
  runtimeForm: FormDefinition | null
  setRuntimeForm: (form: FormDefinition | null) => void
  /** What the current applicant flow is doing (used to bind/update a policy on submit). */
  txnContext: { kind: string; productId?: string; policyId?: string } | null
  setTxnContext: (ctx: { kind: string; productId?: string; policyId?: string } | null) => void
  setAnswer: (apiName: string, value: AnswerValue) => void
  getGrid: (apiName: string) => GridRow[]
  addGridRow: (apiName: string) => void
  cloneGridRow: (apiName: string, index: number) => void
  removeGridRow: (apiName: string, index: number) => void
  setGridCell: (apiName: string, index: number, col: string, value: unknown) => void
  reset: () => void
  loadSample: () => void
}

export const useFormStore = create<FormState>((set, get) => ({
  answers: load(),
  runtimeForm: null,
  setRuntimeForm: (form) => set({ runtimeForm: form }),
  txnContext: null,
  setTxnContext: (ctx) => set({ txnContext: ctx }),

  setAnswer: (apiName, value) =>
    set((s) => {
      const answers = { ...s.answers, [apiName]: value }
      persist(answers)
      return { answers }
    }),

  getGrid: (apiName) => {
    const v = get().answers[apiName]
    return Array.isArray(v) ? (v as GridRow[]) : []
  },

  addGridRow: (apiName) =>
    set((s) => {
      const rows = Array.isArray(s.answers[apiName]) ? [...(s.answers[apiName] as GridRow[])] : []
      rows.push({})
      const answers = { ...s.answers, [apiName]: rows }
      persist(answers)
      return { answers }
    }),

  cloneGridRow: (apiName, index) =>
    set((s) => {
      const rows = Array.isArray(s.answers[apiName]) ? [...(s.answers[apiName] as GridRow[])] : []
      if (rows[index]) rows.splice(index + 1, 0, { ...rows[index] })
      const answers = { ...s.answers, [apiName]: rows }
      persist(answers)
      return { answers }
    }),

  removeGridRow: (apiName, index) =>
    set((s) => {
      const rows = Array.isArray(s.answers[apiName]) ? [...(s.answers[apiName] as GridRow[])] : []
      rows.splice(index, 1)
      const answers = { ...s.answers, [apiName]: rows }
      persist(answers)
      return { answers }
    }),

  setGridCell: (apiName, index, col, value) =>
    set((s) => {
      const rows = Array.isArray(s.answers[apiName]) ? [...(s.answers[apiName] as GridRow[])] : []
      rows[index] = { ...rows[index], [col]: value }
      const answers = { ...s.answers, [apiName]: rows }
      persist(answers)
      return { answers }
    }),

  reset: () =>
    set(() => {
      persist({})
      return { answers: {} }
    }),

  // Pre-fill a representative scenario to demo the engines quickly.
  loadSample: () =>
    set(() => {
      const answers: Answers = {
        businessName: 'Summit Logistics LLC',
        contactEmail: 'ops@summitlogistics.com',
        contactPhone: '(555) 248-1900',
        state: 'TX',
        zip: '75201',
        businessType: 'Trucking',
        yearsInBusiness: 7,
        annualRevenue: 12500000,
        numEmployees: 24,
        vehicleCount: 8,
        radiusOfOperation: 'LongHaul',
        vehicles: [
          { vin: '1HGCM82633A', year: 2021, make: 'Freightliner', model: 'Cascadia' },
          { vin: '1FTPW1ES3JK', year: 2020, make: 'Peterbilt', model: '579' },
        ],
        driverCount: 8,
        drivers: [{ name: 'M. Alvarez', license: 'TX-99210', lstate: 'TX', exp: 12 }],
        coverageType: 'Full Coverage',
        deductible: 1000,
      }
      persist(answers)
      return { answers }
    }),
}))

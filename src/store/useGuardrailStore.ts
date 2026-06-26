import { create } from 'zustand'
import { defaultGuardrails, type GuardrailConfig } from '@/data/guardrails'

const STORAGE_KEY = 'venuspro.guardrails.v1'

function load(): GuardrailConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaultGuardrails, ...(JSON.parse(raw) as Partial<GuardrailConfig>) }
  } catch {
    /* ignore */
  }
  return { ...defaultGuardrails }
}
function persist(config: GuardrailConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    /* ignore */
  }
}

interface GuardrailState {
  config: GuardrailConfig
  set: <K extends keyof GuardrailConfig>(key: K, value: GuardrailConfig[K]) => void
  resetGuardrails: () => void
}

export const useGuardrailStore = create<GuardrailState>((set) => ({
  config: load(),
  set: (key, value) =>
    set((s) => {
      const config = { ...s.config, [key]: value }
      persist(config)
      return { config }
    }),
  resetGuardrails: () =>
    set(() => {
      persist(defaultGuardrails)
      return { config: { ...defaultGuardrails } }
    }),
}))

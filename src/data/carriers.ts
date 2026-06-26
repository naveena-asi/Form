// ─────────────────────────────────────────────────────────────────────────────
// Carrier catalog — the top of the chain. A carrier is the insurer that writes
// products. Products (products.ts) belong to a carrier; forms belong to products;
// policies are bound from a product's application.
// ─────────────────────────────────────────────────────────────────────────────
export interface Carrier {
  id: string
  name: string
  code: string
  status: 'Active' | 'Inactive'
  states: string[]
  appetite: string
  /** brand accent: tailwind tone token used in the UI. */
  tone: 'navy' | 'green' | 'amber' | 'blue'
}

export const carriers: Carrier[] = [
  {
    id: 'car-vpro',
    name: 'VENUSPRO Insurance',
    code: 'VPRO',
    status: 'Active',
    states: ['CA', 'TX', 'NY', 'FL', 'IL', 'PA', 'OH'],
    appetite: 'Small to mid-market commercial lines',
    tone: 'navy',
  },
  {
    id: 'car-summit',
    name: 'Summit Specialty',
    code: 'SMT',
    status: 'Active',
    states: ['TX', 'OK', 'NM', 'AR'],
    appetite: 'Trucking & transportation risks',
    tone: 'amber',
  },
]

export const getCarrier = (id: string) => carriers.find((c) => c.id === id)

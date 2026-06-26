// Policy types + the signed-in customer + seed policies (bound from products).
// The live, mutable list lives in store/usePolicyStore.ts.
export interface Coverage {
  name: string
  limit: string
  deductible?: string
}

export type PolicyStatus = 'Active' | 'Pending Renewal' | 'Cancelled' | 'Expired'

export interface Policy {
  id: string
  number: string
  productId: string
  carrierId: string
  product: string
  status: PolicyStatus
  premium: number
  effectiveDate: string
  expirationDate: string
  insured: string
  coverages: Coverage[]
  documents: string[]
}

export const customer = {
  name: 'Alex Carter',
  company: 'Summit Logistics LLC',
  initials: 'AC',
}

export const seedPolicies: Policy[] = [
  {
    id: 'pol-ca',
    number: 'POL-CA-100482',
    productId: 'prod-ca',
    carrierId: 'car-vpro',
    product: 'Commercial Auto',
    status: 'Active',
    premium: 2310,
    effectiveDate: '2024-06-01',
    expirationDate: '2025-06-01',
    insured: 'Summit Logistics LLC',
    coverages: [
      { name: 'Liability (CSL)', limit: '$1,000,000', deductible: '—' },
      { name: 'Physical Damage', limit: '$50,000', deductible: '$1,000' },
      { name: 'Medical Payments', limit: '$5,000', deductible: '—' },
      { name: 'Uninsured Motorist', limit: '$1,000,000', deductible: '—' },
    ],
    documents: ['Policy Declarations', 'Auto ID Cards', 'Endorsement Schedule'],
  },
  {
    id: 'pol-gl',
    number: 'POL-GL-220931',
    productId: 'prod-gl',
    carrierId: 'car-vpro',
    product: 'General Liability',
    status: 'Active',
    premium: 1850,
    effectiveDate: '2024-03-15',
    expirationDate: '2025-03-15',
    insured: 'Summit Logistics LLC',
    coverages: [
      { name: 'Each Occurrence', limit: '$1,000,000' },
      { name: 'General Aggregate', limit: '$2,000,000' },
      { name: 'Products / Completed Ops', limit: '$2,000,000' },
    ],
    documents: ['Policy Declarations', 'Certificate of Insurance'],
  },
  {
    id: 'pol-wc',
    number: 'POL-WC-330118',
    productId: 'prod-wc',
    carrierId: 'car-summit',
    product: 'Workers Compensation',
    status: 'Pending Renewal',
    premium: 4200,
    effectiveDate: '2023-09-01',
    expirationDate: '2024-09-01',
    insured: 'Summit Logistics LLC',
    coverages: [
      { name: "Workers' Compensation", limit: 'Statutory' },
      { name: "Employers' Liability", limit: '$500,000' },
    ],
    documents: ['Policy Declarations', 'Experience Mod Worksheet'],
  },
]

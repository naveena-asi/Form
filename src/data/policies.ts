// Policy types + the signed-in customer + seed policies (bound from products).
// The live, mutable list lives in store/usePolicyStore.ts.
export interface Coverage {
  name: string
  limit: string
  deductible?: string
}

export type PolicyStatus = 'Active' | 'Pending Renewal' | 'Cancelled' | 'Expired' | 'Under Review' | 'Info Requested' | 'Quoted' | 'Declined'

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
  {
    id: 'app-umb',
    number: 'APP-UMB-55421',
    productId: 'prod-umb',
    carrierId: 'car-vpro',
    product: 'Commercial Umbrella',
    status: 'Under Review',
    premium: 0,
    effectiveDate: 'Pending',
    expirationDate: 'Pending',
    insured: 'Summit Logistics LLC',
    coverages: [],
    documents: [],
  },
  {
    id: 'app-cyb',
    number: 'APP-CYB-55422',
    productId: 'prod-cyb',
    carrierId: 'car-summit',
    product: 'Cyber Liability',
    status: 'Info Requested',
    premium: 0,
    effectiveDate: 'Pending',
    expirationDate: 'Pending',
    insured: 'Summit Logistics LLC',
    coverages: [],
    documents: [],
  },
  {
    id: 'app-bop',
    number: 'APP-BOP-55423',
    productId: 'prod-bop',
    carrierId: 'car-vpro',
    product: 'Business Owners Policy',
    status: 'Quoted',
    premium: 2450,
    effectiveDate: '2024-11-01',
    expirationDate: '2025-11-01',
    insured: 'Summit Logistics LLC',
    coverages: [
      { name: 'General Liability', limit: '$1,000,000' },
      { name: 'Business Personal Property', limit: '$250,000' },
    ],
    documents: ['Quote Letter'],
  },
  {
    id: 'app-prof',
    number: 'APP-PROF-55424',
    productId: 'prod-prof',
    carrierId: 'car-summit',
    product: 'Professional Liability',
    status: 'Declined',
    premium: 0,
    effectiveDate: 'Declined',
    expirationDate: 'Declined',
    insured: 'Summit Logistics LLC',
    coverages: [],
    documents: ['Decline Notice'],
  },
]

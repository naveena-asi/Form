// Form Library — the rows shown in the Form List screen (blueprint §4.1).
import type { FormStatus, FormType } from './types'

export interface FormRow {
  id: string
  name: string
  type: FormType
  product: string
  version: string
  status: FormStatus
  createdBy: string
  updatedAt: string
}

export const formRows: FormRow[] = [
  {
    id: 'frm-commercial-auto',
    name: 'Commercial Auto Application',
    type: 'Application',
    product: 'Commercial Auto',
    version: '1.1',
    status: 'Published',
    createdBy: 'Admin',
    updatedAt: '2024-05-12',
  },
  {
    id: 'frm-truck-supp',
    name: 'Truck Supplemental',
    type: 'Supplemental',
    product: 'Commercial Auto',
    version: '1.0',
    status: 'Draft',
    createdBy: 'John D.',
    updatedAt: '2024-05-10',
  },
  {
    id: 'frm-wc-quote',
    name: 'Workers Comp Quote',
    type: 'Quote',
    product: 'Workers Comp',
    version: '2.0',
    status: 'Published',
    createdBy: 'Admin',
    updatedAt: '2024-05-08',
  },
  {
    id: 'frm-endorsement',
    name: 'Endorsement — Waiver',
    type: 'Endorsement',
    product: 'General Liability',
    version: '1.0',
    status: 'Archived',
    createdBy: 'Sara K.',
    updatedAt: '2024-05-01',
  },
  {
    id: 'frm-gl-app',
    name: 'General Liability Application',
    type: 'Application',
    product: 'General Liability',
    version: '3.2',
    status: 'Published',
    createdBy: 'Admin',
    updatedAt: '2024-04-22',
  },
  {
    id: 'frm-bop-renewal',
    name: 'BOP Renewal Questionnaire',
    type: 'Renewal',
    product: 'Business Owners',
    version: '1.4',
    status: 'Draft',
    createdBy: 'Priya N.',
    updatedAt: '2024-04-18',
  },
  {
    id: 'frm-auto-fnol',
    name: 'Auto Claim — First Notice of Loss',
    type: 'Claim',
    product: 'Commercial Auto',
    version: '2.1',
    status: 'Published',
    createdBy: 'Sara K.',
    updatedAt: '2024-04-09',
  },
  {
    id: 'frm-auto-endorse',
    name: 'Mid-Term Endorsement — Add/Remove Vehicle',
    type: 'Endorsement',
    product: 'Commercial Auto',
    version: '1.2',
    status: 'Published',
    createdBy: 'John D.',
    updatedAt: '2024-05-15',
  },
  {
    id: 'frm-auto-cancel',
    name: 'Policy Cancellation Request',
    type: 'Cancellation',
    product: 'Commercial Auto',
    version: '1.0',
    status: 'Published',
    createdBy: 'Sara K.',
    updatedAt: '2024-05-16',
  },
  {
    id: 'frm-gl-cancel',
    name: 'Cancellation — Non-Payment Notice',
    type: 'Cancellation',
    product: 'General Liability',
    version: '1.1',
    status: 'Draft',
    createdBy: 'Priya N.',
    updatedAt: '2024-05-14',
  },
]

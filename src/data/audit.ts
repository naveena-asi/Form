// Audit trail — change tracking rows for the Audit Module (blueprint §17).
export interface AuditRow {
  id: string
  user: string
  field: string
  oldValue: string
  newValue: string
  timestamp: string
  version: string
  action: 'Changed' | 'Created' | 'Published' | 'Cloned'
}

export const auditRows: AuditRow[] = [
  {
    id: 'a1',
    user: 'John D.',
    field: 'Vehicle Count',
    oldValue: '3',
    newValue: '8',
    timestamp: '2024-05-12 10:05',
    version: '1.1',
    action: 'Changed',
  },
  {
    id: 'a2',
    user: 'Sara K.',
    field: 'Annual Revenue',
    oldValue: '$2,400,000',
    newValue: '$3,100,000',
    timestamp: '2024-05-12 10:14',
    version: '1.1',
    action: 'Changed',
  },
  {
    id: 'a3',
    user: 'John D.',
    field: 'State',
    oldValue: 'CA',
    newValue: 'TX',
    timestamp: '2024-05-12 11:15',
    version: '1.1',
    action: 'Changed',
  },
  {
    id: 'a4',
    user: 'Admin',
    field: 'Form Status',
    oldValue: 'Draft',
    newValue: 'Published',
    timestamp: '2024-05-12 12:00',
    version: '1.1',
    action: 'Published',
  },
  {
    id: 'a5',
    user: 'Priya N.',
    field: 'Coverage Type',
    oldValue: '—',
    newValue: 'Full Coverage',
    timestamp: '2024-05-11 16:42',
    version: '1.0',
    action: 'Created',
  },
]

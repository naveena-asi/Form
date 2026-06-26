import { ScrollText, User, FileEdit, Clock } from 'lucide-react'
import { Card, CardHeader, PageHeader, Badge } from '@/components/ui'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { auditRows, type AuditRow } from '@/data/audit'

const actionTone: Record<string, 'green' | 'navy' | 'amber' | 'blue'> = {
  Changed: 'amber',
  Created: 'blue',
  Published: 'green',
  Cloned: 'navy',
}

const tracked = [
  { icon: User, label: 'Who changed' },
  { icon: FileEdit, label: 'What changed' },
  { icon: ScrollText, label: 'Old → New value' },
  { icon: Clock, label: 'Timestamp & version' },
]

export default function AuditModule() {
  const columns: Column<AuditRow>[] = [
    { key: 'user', header: 'User', render: (r) => <span className="font-medium text-slate-800">{r.user}</span> },
    { key: 'field', header: 'Field' },
    { key: 'oldValue', header: 'Old Value', render: (r) => <span className="text-slate-400 line-through">{r.oldValue}</span> },
    { key: 'newValue', header: 'New Value', render: (r) => <span className="font-medium text-navy-700">{r.newValue}</span> },
    { key: 'action', header: 'Action', render: (r) => <Badge tone={actionTone[r.action]}>{r.action}</Badge> },
    { key: 'version', header: 'Version', render: (r) => <span className="font-mono text-xs">v{r.version}</span> },
    { key: 'timestamp', header: 'Timestamp', render: (r) => <span className="text-xs text-slate-500">{r.timestamp}</span> },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Audit Module"
        subtitle="Full change tracking for compliance — who changed what, when, with old and new values."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tracked.map((t) => (
          <Card key={t.label} className="flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-navy-50 text-navy-600">
              <t.icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-slate-700">{t.label}</span>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader title="Audit Trail" subtitle={`${auditRows.length} recent events`} icon={ScrollText} />
        <DataTable columns={columns} rows={auditRows} />
      </Card>
    </div>
  )
}

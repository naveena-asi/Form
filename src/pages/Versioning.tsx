import { History, Copy, RotateCcw, GitBranch, Plus } from 'lucide-react'
import { Card, CardHeader, PageHeader, Button, StatusPill, Badge } from '@/components/ui'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { useDesignerStore, type VersionRow } from '@/store/useDesignerStore'
import { toast } from '@/store/useToast'

export default function Versioning() {
  const versions = useDesignerStore((s) => s.versions)
  const formName = useDesignerStore((s) => s.form.name)
  const cloneVersion = useDesignerStore((s) => s.cloneVersion)
  const rollbackVersion = useDesignerStore((s) => s.rollbackVersion)

  const columns: Column<VersionRow>[] = [
    { key: 'version', header: 'Version', render: (v) => <span className="font-mono text-sm font-semibold">v{v.version}</span> },
    { key: 'status', header: 'Status', render: (v) => <StatusPill status={v.status} /> },
    { key: 'date', header: 'Effective Date' },
    { key: 'author', header: 'Author' },
    {
      key: 'note',
      header: 'Notes',
      render: (v) => (
        <div className="flex items-center gap-1.5">
          {v.snapshot && <Badge tone="green">Restorable</Badge>}
          <span className="text-xs text-slate-500">{v.note}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (v) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" icon={Copy} onClick={() => { cloneVersion(v.id); toast('Snapshot saved as a new draft version') }}>
            Clone
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={RotateCcw}
            onClick={() => {
              const restored = rollbackVersion(v.id)
              toast(
                restored
                  ? `Restored v${v.version} — the form definition was reverted to this snapshot`
                  : `v${v.version} marked current (legacy version has no snapshot to restore)`,
                restored ? 'success' : 'info',
              )
            }}
          >
            Rollback
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Versioning"
        subtitle="Every form is versioned with effective dates, lifecycle status, clone and rollback."
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              const latest = versions[0]
              if (latest) { cloneVersion(latest.id); toast('New draft version created') }
            }}
          >
            New Version
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <Card className="overflow-hidden">
          <CardHeader title="Version History" subtitle={formName} icon={History} />
          <DataTable columns={columns} rows={versions} />
        </Card>

        <Card className="self-start p-5">
          <div className="mb-3 flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-navy-600" />
            <span className="text-sm font-semibold text-slate-900">Lifecycle</span>
          </div>
          <ol className="relative space-y-4 border-l border-slate-200 pl-4">
            {['Draft', 'Validated', 'Published', 'Archived'].map((stage, i) => (
              <li key={stage} className="relative">
                <span className={`absolute -left-[21px] grid h-3 w-3 place-items-center rounded-full ${i < 3 ? 'bg-brand-500' : 'bg-slate-300'}`} />
                <div className="text-sm font-medium text-slate-700">{stage}</div>
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            Effective &amp; expiration dates control which version a quote uses on a given day.
          </div>
        </Card>
      </div>
    </div>
  )
}

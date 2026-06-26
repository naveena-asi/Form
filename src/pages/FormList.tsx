import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, MoreHorizontal, PlayCircle, Search, Pencil, Copy, Archive, Trash2 } from 'lucide-react'
import { formRows, type FormRow } from '@/data/forms'
import { getForm } from '@/data/formTemplates'
import { Button, PageHeader, StatusPill, Badge } from '@/components/ui'
import { Dropdown } from '@/components/ui/Dropdown'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Tabs } from '@/components/ui/Tabs'
import { useDesignerStore } from '@/store/useDesignerStore'
import { useFormStore } from '@/store/useFormStore'
import { toast } from '@/store/useToast'

const statusFilters = ['All', 'Published', 'Draft', 'Archived']
const formTypes = ['Application', 'Supplemental', 'Quote', 'Endorsement', 'Cancellation', 'Claim', 'Renewal']

export default function FormList() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const liveForm = useDesignerStore((s) => s.form)
  const loadForm = useDesignerStore((s) => s.loadForm)
  const setRuntimeForm = useFormStore((s) => s.setRuntimeForm)
  const [filter, setFilter] = useState('All')

  // Preview = show this form in the runtime WITHOUT touching the designer.
  // Open in Designer = intentionally load it for editing (and clear the preview override).
  const openForm = (row: FormRow, dest: string) => {
    if (dest === '/preview') {
      setRuntimeForm(getForm(row.id))
    } else {
      loadForm(getForm(row.id))
      setRuntimeForm(null)
    }
    navigate(dest)
  }

  const q = params.get('q') ?? ''
  const typeParam = params.get('type') ?? ''

  // Reflect the live (editable) form into its library row so edits show here.
  const rows = useMemo(
    () =>
      formRows.map((r) =>
        r.id === liveForm.id
          ? { ...r, name: liveForm.name, version: liveForm.version, status: liveForm.status, type: liveForm.type }
          : r,
      ),
    [liveForm],
  )

  const filtered = rows.filter(
    (r) =>
      (filter === 'All' || r.status === filter) &&
      (typeParam === '' || r.type === typeParam) &&
      (q === '' || r.name.toLowerCase().includes(q.toLowerCase())),
  )

  const setQ = (val: string) => {
    const next = new URLSearchParams(params)
    if (val) next.set('q', val)
    else next.delete('q')
    setParams(next, { replace: true })
  }

  const setType = (val: string) => {
    const next = new URLSearchParams(params)
    if (val) next.set('type', val)
    else next.delete('type')
    setParams(next, { replace: true })
  }

  const columns: Column<FormRow>[] = [
    {
      key: 'name',
      header: 'Form Name',
      render: (r) => (
        <div>
          <div className="font-medium text-slate-900">{r.name}</div>
          <div className="text-xs text-slate-400">{r.id}</div>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (r) => <Badge tone="navy">{r.type}</Badge> },
    { key: 'product', header: 'Product' },
    { key: 'version', header: 'Version', render: (r) => <span className="font-mono text-xs">v{r.version}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusPill status={r.status} /> },
    { key: 'createdBy', header: 'Created By' },
    { key: 'updatedAt', header: 'Updated' },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {r.id === liveForm.id && (
            <Badge tone="green" className="mr-1">Active</Badge>
          )}
          <Button size="sm" variant="ghost" icon={PlayCircle} onClick={() => openForm(r, '/preview')}>
            Preview
          </Button>
          <Dropdown
            trigger={
              <button className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            }
            items={[
              { label: 'Open in Designer', icon: Pencil, onClick: () => openForm(r, '/builder/sections') },
              { label: 'Preview', icon: PlayCircle, onClick: () => openForm(r, '/preview') },
              { label: 'Clone', icon: Copy, onClick: () => toast(`Cloned “${r.name}” to a new draft`) },
              { label: 'Archive', icon: Archive, onClick: () => toast(`“${r.name}” archived`, 'info') },
              { label: 'Delete', icon: Trash2, danger: true, onClick: () => toast(`“${r.name}” deleted`, 'info') },
            ]}
          />
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Form Designer"
        title="Form Library"
        subtitle="Create and manage every form across products, lines and versions."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => navigate('/forms/new')}>
            Create Form
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          items={statusFilters.map((s) => ({
            id: s,
            label: s,
            count: s === 'All' ? rows.length : rows.filter((r) => r.status === s).length,
          }))}
          active={filter}
          onChange={setFilter}
        />
        <div className="flex items-center gap-2">
          <select
            value={typeParam}
            onChange={(e) => setType(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-500/15"
            aria-label="Filter by form type"
          >
            <option value="">All Types</option>
            {formTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search forms…"
              className="h-9 w-56 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-500/15"
            />
          </div>
        </div>
      </div>

      {(typeParam || q) && (
        <p className="mb-3 text-xs text-slate-500">
          Showing {filtered.length} form{filtered.length === 1 ? '' : 's'}
          {typeParam && <> of type <span className="font-medium text-slate-700">{typeParam}</span></>}
          {q && <> matching “{q}”</>}.{' '}
          <button onClick={() => { setType(''); setQ('') }} className="font-medium text-navy-600 hover:text-navy-800">
            Clear filters
          </button>
        </p>
      )}

      <DataTable columns={columns} rows={filtered} onRowClick={(r) => openForm(r, '/preview')} />
      <p className="mt-3 text-xs text-slate-400">
        Click any form to load its own data into Preview &amp; the Designer — each type (Application,
        Cancellation, Endorsement, Claim, Renewal…) opens its own sections and fields.
        Currently active: <span className="font-medium text-slate-600">{liveForm.name}</span>.
      </p>
    </div>
  )
}

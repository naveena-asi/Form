import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, MoreHorizontal, Search, Pencil, Copy, UploadCloud, Trash2, FileText } from 'lucide-react'
import { Button, PageHeader, StatusPill, Badge } from '@/components/ui'
import { Dropdown } from '@/components/ui/Dropdown'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Tabs } from '@/components/ui/Tabs'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useDocumentStore } from '@/store/useDocumentStore'
import { toast } from '@/store/useToast'
import { uid } from '@/lib/uid'
import { products } from '@/data/products'
import {
  DOC_TYPE_LABEL,
  type DocStatus,
  type DocumentTemplate,
  type DocumentType,
} from '@/data/documents'

const statusFilters: ('All' | DocStatus)[] = ['All', 'Published', 'Draft', 'Archived']
const docTypes = Object.keys(DOC_TYPE_LABEL) as DocumentType[]

function productName(productId?: string): string {
  if (!productId) return '—'
  return products.find((p) => p.id === productId)?.name ?? productId
}

function isoDate(offsetYears = 0): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + offsetYears)
  return d.toISOString().slice(0, 10)
}

export default function TemplateLibrary() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const templates = useDocumentStore((s) => s.templates)
  const upsertTemplate = useDocumentStore((s) => s.upsertTemplate)
  const duplicateTemplate = useDocumentStore((s) => s.duplicateTemplate)
  const publishTemplate = useDocumentStore((s) => s.publishTemplate)
  const removeTemplate = useDocumentStore((s) => s.removeTemplate)

  const [filter, setFilter] = useState<'All' | DocStatus>('All')
  const [confirmDelete, setConfirmDelete] = useState<DocumentTemplate | null>(null)

  const q = params.get('q') ?? ''
  const typeParam = params.get('type') ?? ''

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

  const filtered = useMemo(
    () =>
      templates.filter(
        (t) =>
          (filter === 'All' || t.status === filter) &&
          (typeParam === '' || t.type === typeParam) &&
          (q === '' || t.name.toLowerCase().includes(q.toLowerCase())),
      ),
    [templates, filter, typeParam, q],
  )

  const createBlank = () => {
    const t: DocumentTemplate = {
      id: uid('tpl'),
      name: 'Untitled Template',
      type: 'Notice',
      version: '1.0',
      status: 'Draft',
      effectiveDate: isoDate(0),
      expirationDate: isoDate(1),
      page: { size: 'Letter', margins: 54 },
      blocks: [],
    }
    upsertTemplate(t)
    toast('Blank template created')
    navigate(`/documents/builder/${t.id}`)
  }

  const onDuplicate = (t: DocumentTemplate) => {
    const copy = duplicateTemplate(t.id)
    if (copy) {
      toast(`Duplicated “${t.name}”`)
      navigate(`/documents/builder/${copy.id}`)
    }
  }

  const onPublish = (t: DocumentTemplate) => {
    publishTemplate(t.id)
    toast(`Published “${t.name}”`)
  }

  const columns: Column<DocumentTemplate>[] = [
    {
      key: 'name',
      header: 'Template',
      render: (t) => (
        <div>
          <div className="font-medium text-slate-900">{t.name}</div>
          <div className="text-xs text-slate-400">{t.id}</div>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (t) => <Badge tone="navy">{DOC_TYPE_LABEL[t.type]}</Badge> },
    { key: 'product', header: 'Product', render: (t) => productName(t.productId) },
    { key: 'version', header: 'Version', render: (t) => <span className="font-mono text-xs">v{t.version}</span> },
    { key: 'status', header: 'Status', render: (t) => <StatusPill status={t.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (t) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" icon={Pencil} onClick={() => navigate(`/documents/builder/${t.id}`)}>
            Edit
          </Button>
          <Dropdown
            trigger={
              <button className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            }
            items={[
              { label: 'Open in Builder', icon: Pencil, onClick: () => navigate(`/documents/builder/${t.id}`) },
              { label: 'Duplicate', icon: Copy, onClick: () => onDuplicate(t) },
              ...(t.status !== 'Published'
                ? [{ label: 'Publish', icon: UploadCloud, onClick: () => onPublish(t) }]
                : []),
              { label: 'Delete', icon: Trash2, danger: true, onClick: () => setConfirmDelete(t) },
            ]}
          />
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Document Designer"
        title="Template Library"
        subtitle="Design, version and publish the documents issued across every policy lifecycle event."
        actions={
          <Button variant="primary" icon={Plus} onClick={createBlank}>
            New Template
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          items={statusFilters.map((s) => ({
            id: s,
            label: s,
            count: s === 'All' ? templates.length : templates.filter((t) => t.status === s).length,
          }))}
          active={filter}
          onChange={(id) => setFilter(id as 'All' | DocStatus)}
        />
        <div className="flex items-center gap-2">
          <select
            value={typeParam}
            onChange={(e) => setType(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-500/15"
            aria-label="Filter by document type"
          >
            <option value="">All Types</option>
            {docTypes.map((t) => (
              <option key={t} value={t}>
                {DOC_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search templates…"
              className="h-9 w-56 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-500/15"
            />
          </div>
        </div>
      </div>

      {(typeParam || q) && (
        <p className="mb-3 text-xs text-slate-500">
          Showing {filtered.length} template{filtered.length === 1 ? '' : 's'}
          {typeParam && (
            <>
              {' '}
              of type <span className="font-medium text-slate-700">{DOC_TYPE_LABEL[typeParam as DocumentType]}</span>
            </>
          )}
          {q && <> matching “{q}”</>}.{' '}
          <button
            onClick={() => {
              setType('')
              setQ('')
            }}
            className="font-medium text-navy-600 hover:text-navy-800"
          >
            Clear filters
          </button>
        </p>
      )}

      <DataTable
        columns={columns}
        rows={filtered}
        onRowClick={(t) => navigate(`/documents/builder/${t.id}`)}
        empty={
          <span className="inline-flex items-center gap-2">
            <FileText className="h-4 w-4" /> No templates yet — create one to begin.
          </span>
        }
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete template"
        message={`Permanently remove “${confirmDelete?.name ?? ''}”? This cannot be undone.`}
        onConfirm={() => {
          if (confirmDelete) {
            removeTemplate(confirmDelete.id)
            toast(`Deleted “${confirmDelete.name}”`, 'info')
          }
        }}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  )
}

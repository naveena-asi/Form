import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2, Braces, X, BookOpen } from 'lucide-react'
import { Button, PageHeader, Badge, Toggle } from '@/components/ui'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { Tabs } from '@/components/ui/Tabs'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Dropdown } from '@/components/ui/Dropdown'
import { ConditionEditor, type FieldOption } from '@/components/designer/ConditionEditor'
import { useDocumentStore } from '@/store/useDocumentStore'
import { toast } from '@/store/useToast'
import { uid } from '@/lib/uid'
import { DOCUMENT_TOKENS, type Clause } from '@/data/documents'

const CATEGORIES: Clause['category'][] = ['Term', 'Exclusion', 'Condition', 'Definition', 'Notice']

const categoryTone: Record<Clause['category'], 'navy' | 'red' | 'amber' | 'blue' | 'purple'> = {
  Term: 'navy',
  Exclusion: 'red',
  Condition: 'amber',
  Definition: 'blue',
  Notice: 'purple',
}

const CLAUSE_CONDITION_FIELDS: FieldOption[] = [
  {
    apiName: 'state',
    label: 'State',
    options: ['CA', 'TX', 'NY', 'FL', 'IL', 'PA', 'OH'].map((s) => ({ label: s, value: s })),
  },
  { apiName: 'product', label: 'Product Code' },
  { apiName: 'status', label: 'Policy Status' },
]

function blankClause(): Clause {
  return { id: uid('cl'), name: 'New Clause', category: 'Term', html: '<p></p>', version: '1.0' }
}

// HTML field with a merge-token picker that inserts {{token}} at the cursor.
function HtmlField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const insert = (token: string) => {
    const ta = ref.current
    const snippet = `{{${token}}}`
    if (!ta) {
      onChange(value + snippet)
      return
    }
    const start = ta.selectionStart
    const end = ta.selectionEnd
    onChange(value.slice(0, start) + snippet + value.slice(end))
    requestAnimationFrame(() => {
      ta.focus()
      const pos = start + snippet.length
      ta.setSelectionRange(pos, pos)
    })
  }
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="label !mb-0">Clause Body (HTML)</label>
        <Dropdown
          align="right"
          width="w-60"
          trigger={
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-navy-600 hover:bg-navy-50"
            >
              <Braces className="h-3.5 w-3.5" /> Insert token
            </button>
          }
          items={DOCUMENT_TOKENS.map((t) => ({ label: `${t.group} · ${t.label}`, onClick: () => insert(t.token) }))}
        />
      </div>
      <textarea ref={ref} className="textarea font-mono text-xs" rows={7} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function ClauseEditor({
  draft,
  onChange,
}: {
  draft: Clause
  onChange: (c: Clause) => void
}) {
  const [tagInput, setTagInput] = useState('')
  const hasWhen = draft.when !== undefined

  const addTag = () => {
    const v = tagInput.trim().toUpperCase()
    if (!v) return
    const tags = draft.jurisdiction ?? []
    if (!tags.includes(v)) onChange({ ...draft, jurisdiction: [...tags, v] })
    setTagInput('')
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Name</label>
        <input className="input" value={draft.name} onChange={(e) => onChange({ ...draft, name: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Category</label>
          <select
            className="select"
            value={draft.category}
            onChange={(e) => onChange({ ...draft, category: e.target.value as Clause['category'] })}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Version</label>
          <input className="input" value={draft.version} onChange={(e) => onChange({ ...draft, version: e.target.value })} />
        </div>
      </div>

      <div>
        <label className="label">Jurisdiction (state codes)</label>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {(draft.jurisdiction ?? []).map((j) => (
            <span key={j} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {j}
              <button
                onClick={() => onChange({ ...draft, jurisdiction: (draft.jurisdiction ?? []).filter((x) => x !== j) })}
                className="text-slate-400 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {(draft.jurisdiction ?? []).length === 0 && <span className="text-xs text-slate-400">All jurisdictions</span>}
        </div>
        <div className="flex gap-2">
          <input
            className="input !py-1.5 text-xs uppercase"
            placeholder="e.g. CA"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag()
              }
            }}
          />
          <Button size="sm" variant="subtle" icon={Plus} onClick={addTag}>
            Add
          </Button>
        </div>
      </div>

      <HtmlField value={draft.html} onChange={(html) => onChange({ ...draft, html })} />

      <div className="rounded-lg border border-slate-200 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Conditional inclusion</span>
          <Toggle
            checked={hasWhen}
            onChange={(v) => onChange({ ...draft, when: v ? draft.when ?? { join: 'AND', conditions: [] } : undefined })}
          />
        </div>
        {hasWhen && draft.when && (
          <div className="mt-3">
            <ConditionEditor
              value={draft.when}
              onChange={(when) => onChange({ ...draft, when })}
              fieldOptions={CLAUSE_CONDITION_FIELDS}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default function ClauseLibrary() {
  const [params, setParams] = useSearchParams()
  const clauses = useDocumentStore((s) => s.clauses)
  const upsertClause = useDocumentStore((s) => s.upsertClause)
  const removeClause = useDocumentStore((s) => s.removeClause)

  const [filter, setFilter] = useState<'All' | Clause['category']>('All')
  const [draft, setDraft] = useState<Clause | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Clause | null>(null)

  const q = params.get('q') ?? ''
  const setQ = (val: string) => {
    const next = new URLSearchParams(params)
    if (val) next.set('q', val)
    else next.delete('q')
    setParams(next, { replace: true })
  }

  const filtered = useMemo(
    () =>
      clauses.filter(
        (c) =>
          (filter === 'All' || c.category === filter) &&
          (q === '' || c.name.toLowerCase().includes(q.toLowerCase())),
      ),
    [clauses, filter, q],
  )

  const columns: Column<Clause>[] = [
    {
      key: 'name',
      header: 'Clause',
      render: (c) => (
        <div>
          <div className="font-medium text-slate-900">{c.name}</div>
          <div className="text-xs text-slate-400">{c.id}</div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (c) => <Badge tone={categoryTone[c.category]}>{c.category}</Badge> },
    {
      key: 'jurisdiction',
      header: 'Jurisdiction',
      render: (c) =>
        c.jurisdiction?.length ? (
          <span className="font-mono text-xs text-slate-600">{c.jurisdiction.join(', ')}</span>
        ) : (
          <span className="text-xs text-slate-400">All</span>
        ),
    },
    {
      key: 'gated',
      header: 'Gated',
      render: (c) => (c.when ? <Badge tone="amber">Conditional</Badge> : <span className="text-xs text-slate-400">Always</span>),
    },
    { key: 'version', header: 'Version', render: (c) => <span className="font-mono text-xs">v{c.version}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setDraft(structuredClone(c))}>
            Edit
          </Button>
          <button
            onClick={() => setConfirmDelete(c)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        eyebrow="Document Designer"
        title="Clause Library"
        subtitle="Reusable legal and coverage paragraphs referenced by document templates."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setDraft(blankClause())}>
            New Clause
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          items={(['All', ...CATEGORIES] as ('All' | Clause['category'])[]).map((c) => ({
            id: c,
            label: c,
            count: c === 'All' ? clauses.length : clauses.filter((x) => x.category === c).length,
          }))}
          active={filter}
          onChange={(id) => setFilter(id as 'All' | Clause['category'])}
        />
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search clauses…"
            className="h-9 w-56 rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-500/15"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        onRowClick={(c) => setDraft(structuredClone(c))}
        empty={
          <span className="inline-flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> No clauses yet — create one to begin.
          </span>
        }
      />

      <Modal
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft && clauses.some((c) => c.id === draft.id) ? 'Edit Clause' : 'New Clause'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (draft) {
                  upsertClause(draft)
                  toast(`Saved “${draft.name}”`)
                  setDraft(null)
                }
              }}
            >
              Save Clause
            </Button>
          </>
        }
      >
        {draft && <ClauseEditor draft={draft} onChange={setDraft} />}
      </Modal>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete clause"
        message={`Remove “${confirmDelete?.name ?? ''}” from the library? Templates referencing it will show a missing-clause warning.`}
        onConfirm={() => {
          if (confirmDelete) {
            removeClause(confirmDelete.id)
            toast(`Deleted “${confirmDelete.name}”`, 'info')
          }
        }}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  )
}

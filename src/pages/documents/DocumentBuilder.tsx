import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Heading,
  Type,
  Braces,
  Rows3,
  Table2,
  BookOpen,
  PenLine,
  Image as ImageIcon,
  SeparatorHorizontal,
  GitBranch,
  Save,
  Eye,
  Download,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Plus,
  X,
  Settings2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardHeader, PageHeader, Button, Badge, StatusPill } from '@/components/ui'
import { useReorder } from '@/lib/useReorder'
import { toast } from '@/store/useToast'
import { cn } from '@/lib/cn'
import { ConditionEditor, type FieldOption } from '@/components/designer/ConditionEditor'
import { Dropdown } from '@/components/ui/Dropdown'
import { useDocumentStore } from '@/store/useDocumentStore'
import {
  DOCUMENT_TOKENS,
  DOC_TYPE_LABEL,
  type Clause,
  type DocBlock,
  type DocumentTemplate,
  type DocumentType,
} from '@/data/documents'
import { renderToDataUrl } from '@/lib/documentRender'
import { buildMergeContext } from '@/lib/mergeContext'
import { seedPolicies } from '@/data/policies'

// Field catalog used by the conditional gate editor — mirrors the merge context
// fields the runtime condition engine can resolve when including a block.
const DOC_CONDITION_FIELDS: FieldOption[] = [
  {
    apiName: 'state',
    label: 'State',
    options: ['CA', 'TX', 'NY', 'FL', 'IL', 'PA', 'OH'].map((s) => ({ label: s, value: s })),
  },
  { apiName: 'product', label: 'Product Code' },
  { apiName: 'status', label: 'Policy Status' },
  { apiName: 'tier', label: 'Rating Tier' },
  { apiName: 'premium', label: 'Premium' },
]

const docTypes = Object.keys(DOC_TYPE_LABEL) as DocumentType[]

interface BlockKindMeta {
  kind: DocBlock['kind']
  label: string
  icon: LucideIcon
}

const BLOCK_KINDS: BlockKindMeta[] = [
  { kind: 'heading', label: 'Heading', icon: Heading },
  { kind: 'richtext', label: 'Rich Text', icon: Type },
  { kind: 'merge', label: 'Merge Token', icon: Braces },
  { kind: 'keyValue', label: 'Key / Value', icon: Rows3 },
  { kind: 'table', label: 'Table', icon: Table2 },
  { kind: 'clauseRef', label: 'Clause', icon: BookOpen },
  { kind: 'signature', label: 'Signature', icon: PenLine },
  { kind: 'image', label: 'Image', icon: ImageIcon },
  { kind: 'pageBreak', label: 'Page Break', icon: SeparatorHorizontal },
  { kind: 'conditional', label: 'Conditional', icon: GitBranch },
]

// Smaller palettes for nested contexts.
const HEADER_KINDS: DocBlock['kind'][] = ['heading', 'richtext', 'merge', 'image']
const NESTED_KINDS: DocBlock['kind'][] = [
  'heading',
  'richtext',
  'merge',
  'keyValue',
  'table',
  'clauseRef',
  'signature',
  'image',
  'pageBreak',
]

function defaultBlock(kind: DocBlock['kind'], firstClauseId: string): DocBlock {
  switch (kind) {
    case 'heading':
      return { kind: 'heading', text: 'New Heading', level: 2 }
    case 'richtext':
      return { kind: 'richtext', html: '<p>New paragraph…</p>' }
    case 'merge':
      return { kind: 'merge', token: 'policy.number' }
    case 'keyValue':
      return { kind: 'keyValue', title: 'Details', rows: [{ label: 'Policy Number', token: 'policy.number' }] }
    case 'table':
      return { kind: 'table', title: 'Schedule', source: 'coverages', columns: [{ key: 'name', label: 'Coverage' }] }
    case 'clauseRef':
      return { kind: 'clauseRef', clauseId: firstClauseId }
    case 'signature':
      return { kind: 'signature', party: 'carrier', label: 'Authorized Representative' }
    case 'image':
      return { kind: 'image', src: 'carrierLogo', alt: '{{carrier.name}}' }
    case 'pageBreak':
      return { kind: 'pageBreak' }
    case 'conditional':
      return { kind: 'conditional', when: { join: 'AND', conditions: [] }, blocks: [] }
  }
}

function blockMeta(kind: DocBlock['kind']): BlockKindMeta {
  return BLOCK_KINDS.find((b) => b.kind === kind) ?? BLOCK_KINDS[0]
}

// ── Merge-token picker ───────────────────────────────────────────────────────
function TokenPicker({ onInsert }: { onInsert: (token: string) => void }) {
  return (
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
      items={DOCUMENT_TOKENS.map((t) => ({
        label: `${t.group} · ${t.label}`,
        onClick: () => onInsert(t.token),
      }))}
    />
  )
}

// ── HTML field with a token picker that inserts at the cursor ────────────────
function HtmlField({
  value,
  onChange,
  rows = 6,
}: {
  value: string
  onChange: (v: string) => void
  rows?: number
}) {
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
        <label className="label !mb-0">HTML Body</label>
        <TokenPicker onInsert={insert} />
      </div>
      <textarea
        ref={ref}
        className="textarea font-mono text-xs"
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

// ── Single-block properties editor ───────────────────────────────────────────
function BlockEditor({ block, onChange }: { block: DocBlock; onChange: (b: DocBlock) => void }) {
  const clauses = useDocumentStore((s) => s.clauses)

  switch (block.kind) {
    case 'heading':
      return (
        <div className="space-y-4">
          <div>
            <label className="label">Text</label>
            <input className="input" value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} />
          </div>
          <div>
            <label className="label">Level</label>
            <select
              className="select"
              value={String(block.level)}
              onChange={(e) => onChange({ ...block, level: Number(e.target.value) as 1 | 2 | 3 })}
            >
              <option value="1">1 — Title</option>
              <option value="2">2 — Section</option>
              <option value="3">3 — Sub-section</option>
            </select>
          </div>
        </div>
      )
    case 'richtext':
      return <HtmlField value={block.html} onChange={(html) => onChange({ ...block, html })} />
    case 'merge':
      return (
        <div className="space-y-4">
          <div>
            <label className="label">Token</label>
            <select className="select" value={block.token} onChange={(e) => onChange({ ...block, token: e.target.value })}>
              {DOCUMENT_TOKENS.map((t) => (
                <option key={t.token} value={t.token}>
                  {t.group} · {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Label (optional)</label>
            <input
              className="input"
              value={block.label ?? ''}
              onChange={(e) => onChange({ ...block, label: e.target.value || undefined })}
            />
          </div>
        </div>
      )
    case 'keyValue':
      return (
        <div className="space-y-4">
          <div>
            <label className="label">Title (optional)</label>
            <input
              className="input"
              value={block.title ?? ''}
              onChange={(e) => onChange({ ...block, title: e.target.value || undefined })}
            />
          </div>
          <div>
            <label className="label">Rows</label>
            <div className="space-y-1.5">
              {block.rows.map((row, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    className="input !py-1.5 text-xs"
                    placeholder="Label"
                    value={row.label}
                    onChange={(e) =>
                      onChange({
                        ...block,
                        rows: block.rows.map((r, idx) => (idx === i ? { ...r, label: e.target.value } : r)),
                      })
                    }
                  />
                  <select
                    className="select !py-1.5 text-xs"
                    value={row.token}
                    onChange={(e) =>
                      onChange({
                        ...block,
                        rows: block.rows.map((r, idx) => (idx === i ? { ...r, token: e.target.value } : r)),
                      })
                    }
                  >
                    {DOCUMENT_TOKENS.map((t) => (
                      <option key={t.token} value={t.token}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => onChange({ ...block, rows: block.rows.filter((_, idx) => idx !== i) })}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                onChange({ ...block, rows: [...block.rows, { label: 'New Row', token: 'policy.number' }] })
              }
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-navy-600 hover:text-navy-800"
            >
              <Plus className="h-3.5 w-3.5" /> Add row
            </button>
          </div>
        </div>
      )
    case 'table':
      return (
        <div className="space-y-4">
          <div>
            <label className="label">Title (optional)</label>
            <input
              className="input"
              value={block.title ?? ''}
              onChange={(e) => onChange({ ...block, title: e.target.value || undefined })}
            />
          </div>
          <div>
            <label className="label">Source</label>
            <select
              className="select"
              value={block.source}
              onChange={(e) => onChange({ ...block, source: e.target.value as typeof block.source })}
            >
              <option value="coverages">Coverages</option>
              <option value="forms">Forms Schedule</option>
              <option value="vehicles">Scheduled Vehicles</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="label">Columns</label>
            <div className="space-y-1.5">
              {block.columns.map((col, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input
                    className="input !py-1.5 font-mono text-xs"
                    placeholder="key"
                    value={col.key}
                    onChange={(e) =>
                      onChange({
                        ...block,
                        columns: block.columns.map((c, idx) =>
                          idx === i ? { ...c, key: e.target.value.replace(/\s/g, '') } : c,
                        ),
                      })
                    }
                  />
                  <input
                    className="input !py-1.5 text-xs"
                    placeholder="Label"
                    value={col.label}
                    onChange={(e) =>
                      onChange({
                        ...block,
                        columns: block.columns.map((c, idx) => (idx === i ? { ...c, label: e.target.value } : c)),
                      })
                    }
                  />
                  <button
                    onClick={() => onChange({ ...block, columns: block.columns.filter((_, idx) => idx !== i) })}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => onChange({ ...block, columns: [...block.columns, { key: 'col', label: 'Column' }] })}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-navy-600 hover:text-navy-800"
            >
              <Plus className="h-3.5 w-3.5" /> Add column
            </button>
          </div>
        </div>
      )
    case 'clauseRef':
      return (
        <div>
          <label className="label">Clause</label>
          <select
            className="select"
            value={block.clauseId}
            onChange={(e) => onChange({ ...block, clauseId: e.target.value })}
          >
            <option value="">Select a clause…</option>
            {clauses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.category})
              </option>
            ))}
          </select>
          {block.clauseId && !clauses.some((c) => c.id === block.clauseId) && (
            <p className="mt-1.5 text-xs text-amber-600">This clause no longer exists in the library.</p>
          )}
        </div>
      )
    case 'signature':
      return (
        <div className="space-y-4">
          <div>
            <label className="label">Party</label>
            <select
              className="select"
              value={block.party}
              onChange={(e) => onChange({ ...block, party: e.target.value as typeof block.party })}
            >
              <option value="insured">Insured</option>
              <option value="carrier">Carrier</option>
              <option value="agent">Agent</option>
            </select>
          </div>
          <div>
            <label className="label">Label (optional)</label>
            <input
              className="input"
              value={block.label ?? ''}
              onChange={(e) => onChange({ ...block, label: e.target.value || undefined })}
            />
          </div>
        </div>
      )
    case 'image':
      return (
        <div className="space-y-4">
          <div>
            <label className="label">Source</label>
            <select
              className="select"
              value={block.src}
              onChange={(e) =>
                onChange(
                  e.target.value === 'carrierLogo'
                    ? { ...block, src: 'carrierLogo', url: undefined }
                    : { ...block, src: 'url' },
                )
              }
            >
              <option value="carrierLogo">Carrier Logo</option>
              <option value="url">External URL</option>
            </select>
          </div>
          {block.src === 'url' && (
            <div>
              <label className="label">URL</label>
              <input
                className="input font-mono text-xs"
                value={block.url ?? ''}
                onChange={(e) => onChange({ ...block, url: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="label">Alt text</label>
            <input
              className="input"
              value={block.alt ?? ''}
              onChange={(e) => onChange({ ...block, alt: e.target.value || undefined })}
            />
          </div>
        </div>
      )
    case 'pageBreak':
      return <p className="text-sm text-slate-400">A page break has no editable properties.</p>
    case 'conditional':
      return (
        <div className="space-y-4">
          <div>
            <label className="label">Include when…</label>
            <ConditionEditor
              value={block.when}
              onChange={(when) => onChange({ ...block, when })}
              fieldOptions={DOC_CONDITION_FIELDS}
            />
          </div>
          <div className="border-t border-slate-100 pt-3">
            <label className="label">Conditional blocks</label>
            <BlockListEditor
              blocks={block.blocks}
              onChange={(blocks) => onChange({ ...block, blocks })}
              addKinds={NESTED_KINDS}
            />
          </div>
        </div>
      )
  }
}

// ── A nested, selectable list of blocks (header / footer / conditional) ──────
function BlockListEditor({
  blocks,
  onChange,
  addKinds,
}: {
  blocks: DocBlock[]
  onChange: (b: DocBlock[]) => void
  addKinds: DocBlock['kind'][]
}) {
  const clauses = useDocumentStore((s) => s.clauses)
  const [selected, setSelected] = useState<number | null>(null)
  const firstClauseId = clauses[0]?.id ?? ''

  const add = (kind: DocBlock['kind']) => {
    onChange([...blocks, defaultBlock(kind, firstClauseId)])
    setSelected(blocks.length)
  }
  const remove = (i: number) => {
    onChange(blocks.filter((_, idx) => idx !== i))
    setSelected(null)
  }
  const move = (i: number, dir: -1 | 1) => {
    const to = i + dir
    if (to < 0 || to >= blocks.length) return
    const next = blocks.slice()
    ;[next[i], next[to]] = [next[to], next[i]]
    onChange(next)
    setSelected(to)
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-1">
        {blocks.map((b, i) => {
          const meta = blockMeta(b.kind)
          const Icon = meta.icon
          return (
            <li
              key={i}
              className={cn(
                'group flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs transition',
                selected === i ? 'border-navy-200 bg-navy-50' : 'border-slate-200 bg-white hover:bg-slate-50',
              )}
            >
              <button onClick={() => setSelected(selected === i ? null : i)} className="flex flex-1 items-center gap-2 text-left">
                <Icon className="h-3.5 w-3.5 text-navy-500" />
                <span className="font-medium text-slate-700">{meta.label}</span>
              </button>
              <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-0.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30">
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => move(i, 1)} disabled={i === blocks.length - 1} className="rounded p-0.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => remove(i)} className="rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          )
        })}
        {blocks.length === 0 && <li className="rounded-lg bg-slate-50 px-3 py-3 text-center text-xs text-slate-400">No blocks yet.</li>}
      </ul>

      <div className="flex flex-wrap gap-1">
        {addKinds.map((k) => {
          const meta = blockMeta(k)
          const Icon = meta.icon
          return (
            <button
              key={k}
              onClick={() => add(k)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] font-medium text-slate-600 hover:border-navy-200 hover:bg-navy-50"
            >
              <Icon className="h-3 w-3 text-navy-500" /> {meta.label}
            </button>
          )
        })}
      </div>

      {selected !== null && blocks[selected] && (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <BlockEditor block={blocks[selected]} onChange={(b) => onChange(blocks.map((x, idx) => (idx === selected ? b : x)))} />
        </div>
      )}
    </div>
  )
}

// ── Readable canvas representation of a block ────────────────────────────────
function blockSummary(block: DocBlock, clauses: Clause[]): ReactNode {
  switch (block.kind) {
    case 'heading': {
      const size = block.level === 1 ? 'text-xl font-bold' : block.level === 2 ? 'text-base font-semibold' : 'text-sm font-semibold'
      return <div className={cn('text-slate-900', size)}>{block.text}</div>
    }
    case 'richtext':
      return <div className="prose-doc text-sm leading-relaxed text-slate-700" dangerouslySetInnerHTML={{ __html: block.html }} />
    case 'merge':
      return (
        <div className="text-sm text-slate-700">
          {block.label && <span className="mr-1 font-medium">{block.label}:</span>}
          <code className="rounded bg-navy-50 px-1.5 py-0.5 text-xs text-navy-700">{`{{${block.token}}}`}</code>
        </div>
      )
    case 'keyValue':
      return (
        <div>
          {block.title && <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{block.title}</div>}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            {block.rows.map((r, i) => (
              <div key={i} className="flex justify-between gap-3 border-b border-dashed border-slate-100 py-0.5">
                <dt className="text-slate-500">{r.label}</dt>
                <dd className="font-mono text-xs text-navy-600">{`{{${r.token}}}`}</dd>
              </div>
            ))}
          </dl>
        </div>
      )
    case 'table':
      return (
        <div>
          {block.title && <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{block.title}</div>}
          <table className="w-full border border-slate-200 text-xs">
            <thead>
              <tr className="bg-slate-50">
                {block.columns.map((c) => (
                  <th key={c.key} className="border border-slate-200 px-2 py-1 text-left font-semibold text-slate-600">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {block.columns.map((c) => (
                  <td key={c.key} className="border border-slate-200 px-2 py-1 text-slate-400">
                    {`{${block.source}.${c.key}}`}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )
    case 'clauseRef': {
      const clause = clauses.find((c) => c.id === block.clauseId)
      return (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50/60 px-3 py-2 text-sm">
          {clause ? (
            <span>
              <BookOpen className="mr-1.5 inline h-3.5 w-3.5 text-navy-500" />
              <span className="font-medium text-slate-700">{clause.name}</span>{' '}
              <Badge tone="gray">{clause.category}</Badge>
            </span>
          ) : (
            <span className="text-amber-600">Clause not found — pick one in the properties panel.</span>
          )}
        </div>
      )
    }
    case 'signature':
      return (
        <div className="text-sm">
          <div className="mt-4 w-56 border-t border-slate-400 pt-1 text-xs text-slate-500">
            {block.label ?? 'Signature'} ({block.party})
          </div>
        </div>
      )
    case 'image':
      return (
        <div className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-500">
          <ImageIcon className="h-4 w-4" /> {block.src === 'carrierLogo' ? 'Carrier logo' : block.url || 'Image URL'}
        </div>
      )
    case 'pageBreak':
      return (
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
          <span className="h-px flex-1 bg-slate-200" /> Page break <span className="h-px flex-1 bg-slate-200" />
        </div>
      )
    case 'conditional':
      return (
        <div className="rounded-md border border-dashed border-purple-300 bg-purple-50/40 px-3 py-2">
          <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium text-purple-700">
            <GitBranch className="h-3.5 w-3.5" /> Conditional — {block.when.conditions.length} condition
            {block.when.conditions.length === 1 ? '' : 's'} ({block.when.join})
          </div>
          <div className="space-y-1.5 pl-3">
            {block.blocks.map((b, i) => (
              <div key={i} className="text-xs text-slate-500">
                • {blockMeta(b.kind).label}
              </div>
            ))}
            {block.blocks.length === 0 && <div className="text-xs text-slate-400">No nested blocks.</div>}
          </div>
        </div>
      )
  }
}

export default function DocumentBuilder() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const getTemplate = useDocumentStore((s) => s.getTemplate)
  const upsertTemplate = useDocumentStore((s) => s.upsertTemplate)
  const publishTemplate = useDocumentStore((s) => s.publishTemplate)
  const clauses = useDocumentStore((s) => s.clauses)

  const stored = id ? getTemplate(id) : undefined
  const [tpl, setTpl] = useState<DocumentTemplate | null>(stored ?? null)
  const [selected, setSelected] = useState<number | null>(null)
  const firstLoad = useRef(true)

  // Re-hydrate the local draft whenever the route id changes.
  useEffect(() => {
    setTpl(id ? getTemplate(id) ?? null : null)
    setSelected(null)
    firstLoad.current = true
  }, [id, getTemplate])

  // Debounced autosave.
  useEffect(() => {
    if (!tpl) return
    if (firstLoad.current) {
      firstLoad.current = false
      return
    }
    const handle = setTimeout(() => upsertTemplate(tpl), 700)
    return () => clearTimeout(handle)
  }, [tpl, upsertTemplate])

  const firstClauseId = clauses[0]?.id ?? ''

  const { dragIndex, overIndex, dragProps } = useReorder((from, to) => {
    setTpl((prev) => {
      if (!prev) return prev
      const next = prev.blocks.slice()
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return { ...prev, blocks: next }
    })
    setSelected(to)
  })

  const selectedBlock = useMemo(() => (tpl && selected !== null ? tpl.blocks[selected] : null), [tpl, selected])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  if (!tpl) {
    return (
      <div>
        <PageHeader eyebrow="Document Designer" title="Template not found" subtitle="This template may have been deleted." />
        <Button icon={ArrowLeft} onClick={() => navigate('/documents/templates')}>
          Back to Library
        </Button>
      </div>
    )
  }

  const patch = (p: Partial<DocumentTemplate>) => setTpl((prev) => (prev ? { ...prev, ...p } : prev))
  const patchPage = (p: Partial<DocumentTemplate['page']>) =>
    setTpl((prev) => (prev ? { ...prev, page: { ...prev.page, ...p } } : prev))

  const addBlock = (kind: DocBlock['kind']) => {
    setTpl((prev) => (prev ? { ...prev, blocks: [...prev.blocks, defaultBlock(kind, firstClauseId)] } : prev))
    setSelected(tpl.blocks.length)
  }
  const updateBlock = (i: number, b: DocBlock) =>
    setTpl((prev) => (prev ? { ...prev, blocks: prev.blocks.map((x, idx) => (idx === i ? b : x)) } : prev))
  const removeBlock = (i: number) => {
    setTpl((prev) => (prev ? { ...prev, blocks: prev.blocks.filter((_, idx) => idx !== i) } : prev))
    setSelected(null)
  }
  const moveBlock = (i: number, dir: -1 | 1) => {
    const to = i + dir
    if (to < 0 || to >= tpl.blocks.length) return
    setTpl((prev) => {
      if (!prev) return prev
      const next = prev.blocks.slice()
      ;[next[i], next[to]] = [next[to], next[i]]
      return { ...prev, blocks: next }
    })
    setSelected(to)
  }

  const onPreview = () => {
    // Render the live (possibly unsaved) template against a sample policy so the
    // author sees exactly what the current edits produce.
    try {
      const ctx = buildMergeContext({ policy: seedPolicies[0], now: new Date().toISOString() })
      setPreviewUrl(renderToDataUrl(tpl, ctx))
    } catch {
      toast('Preview failed to render', 'error')
    }
  }

  const paperWidth = tpl.page.size === 'A4' ? 'max-w-[820px]' : 'max-w-[816px]'

  return (
    <div>
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 p-6 backdrop-blur-sm"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <div className="text-sm font-semibold text-slate-900">
                Preview · {tpl.name} <span className="font-normal text-slate-400">— sample data</span>
              </div>
              <div className="flex items-center gap-2">
                <a href={previewUrl} download={`${tpl.name || 'document'}.pdf`}>
                  <Button size="sm" variant="subtle" icon={Download}>
                    Download
                  </Button>
                </a>
                <Button size="sm" variant="ghost" icon={X} onClick={() => setPreviewUrl(null)}>
                  Close
                </Button>
              </div>
            </div>
            <iframe title="Template preview" src={previewUrl} className="w-full flex-1 bg-slate-50" />
          </div>
        </div>
      )}
      <PageHeader
        eyebrow="Document Designer"
        title={
          <input
            className="w-full max-w-xl rounded-lg border border-transparent bg-transparent px-1 text-2xl font-bold text-slate-900 hover:border-slate-200 focus:border-navy-300 focus:bg-white focus:outline-none"
            value={tpl.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        }
        subtitle={
          <span className="inline-flex items-center gap-2">
            {DOC_TYPE_LABEL[tpl.type]} · v{tpl.version} <StatusPill status={tpl.status} />
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/documents/templates')}>
              Library
            </Button>
            <Button variant="subtle" icon={Eye} onClick={onPreview}>
              Preview
            </Button>
            {tpl.status !== 'Published' && (
              <Button
                variant="secondary"
                icon={Save}
                onClick={() => {
                  publishTemplate(tpl.id)
                  patch({ status: 'Published' })
                  toast(`Published “${tpl.name}”`)
                }}
              >
                Publish
              </Button>
            )}
            <Button
              variant="primary"
              icon={Save}
              onClick={() => {
                upsertTemplate(tpl)
                toast('Template saved')
              }}
            >
              Save
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[210px_1fr_340px]">
        {/* LEFT — block palette */}
        <Card className="self-start">
          <CardHeader title="Blocks" subtitle="Click to append" icon={Plus} />
          <div className="grid grid-cols-2 gap-1.5 p-3">
            {BLOCK_KINDS.map((b) => {
              const Icon = b.icon
              return (
                <button
                  key={b.kind}
                  onClick={() => addBlock(b.kind)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-left text-[11px] font-medium text-slate-600 transition hover:border-navy-200 hover:bg-navy-50 hover:text-navy-700"
                >
                  <Icon className="h-4 w-4 shrink-0 text-navy-500" strokeWidth={1.5} />
                  <span className="truncate">{b.label}</span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* CENTER — paper canvas */}
        <div className="flex justify-center">
          <div
            className={cn(
              'w-full rounded-xl border border-slate-200 bg-white p-8 shadow-card',
              paperWidth,
            )}
          >
            {tpl.page.watermark && (
              <div className="mb-4 select-none text-center text-4xl font-black uppercase tracking-widest text-slate-100">
                {tpl.page.watermark}
              </div>
            )}
            <ul className="space-y-3">
              {tpl.blocks.map((b, i) => (
                <li
                  key={i}
                  {...dragProps(i)}
                  onClick={() => setSelected(i)}
                  className={cn(
                    'group relative rounded-lg border px-4 py-3 transition',
                    selected === i ? 'border-navy-300 ring-1 ring-navy-200' : 'border-transparent hover:border-slate-200 hover:bg-slate-50/60',
                    dragIndex === i && 'opacity-40',
                    overIndex === i && dragIndex !== i && 'ring-2 ring-brand-400',
                  )}
                >
                  <div className="absolute right-2 top-2 flex items-center opacity-0 transition group-hover:opacity-100">
                    <GripVertical className="h-4 w-4 cursor-grab text-slate-300" />
                    <button onClick={(e) => { e.stopPropagation(); moveBlock(i, -1) }} disabled={i === 0} className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30">
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); moveBlock(i, 1) }} disabled={i === tpl.blocks.length - 1} className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); removeBlock(i) }} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {blockSummary(b, clauses)}
                </li>
              ))}
              {tpl.blocks.length === 0 && (
                <li className="grid place-items-center rounded-lg border border-dashed border-slate-200 px-6 py-16 text-center text-sm text-slate-400">
                  Empty document — add blocks from the palette on the left.
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* RIGHT — properties or document settings */}
        <Card className="self-start">
          {selectedBlock ? (
            <>
              <CardHeader
                title={`${blockMeta(selectedBlock.kind).label} Block`}
                subtitle="Block properties"
                actions={
                  <button
                    onClick={() => setSelected(null)}
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                }
              />
              <div className="space-y-4 p-5">
                <BlockEditor block={selectedBlock} onChange={(b) => selected !== null && updateBlock(selected, b)} />
              </div>
            </>
          ) : (
            <>
              <CardHeader title="Document Settings" subtitle="Type, version, page & frame" icon={Settings2} />
              <div className="space-y-4 p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Type</label>
                    <select
                      className="select"
                      value={tpl.type}
                      onChange={(e) => patch({ type: e.target.value as DocumentType })}
                    >
                      {docTypes.map((t) => (
                        <option key={t} value={t}>
                          {DOC_TYPE_LABEL[t]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Version</label>
                    <input className="input" value={tpl.version} onChange={(e) => patch({ version: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Effective</label>
                    <input
                      type="date"
                      className="input"
                      value={tpl.effectiveDate}
                      onChange={(e) => patch({ effectiveDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Expiration</label>
                    <input
                      type="date"
                      className="input"
                      value={tpl.expirationDate}
                      onChange={(e) => patch({ expirationDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Page Size</label>
                      <select
                        className="select"
                        value={tpl.page.size}
                        onChange={(e) => patchPage({ size: e.target.value as 'A4' | 'Letter' })}
                      >
                        <option value="Letter">Letter</option>
                        <option value="A4">A4</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Margins (pt)</label>
                      <input
                        type="number"
                        className="input"
                        value={tpl.page.margins}
                        onChange={(e) => patchPage({ margins: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="label">Watermark (optional)</label>
                  <input
                    className="input"
                    value={tpl.page.watermark ?? ''}
                    onChange={(e) => patchPage({ watermark: e.target.value || undefined })}
                  />
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <label className="label">Header</label>
                  <BlockListEditor
                    blocks={tpl.page.header ?? []}
                    onChange={(header) => patchPage({ header })}
                    addKinds={HEADER_KINDS}
                  />
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <label className="label">Footer</label>
                  <BlockListEditor
                    blocks={tpl.page.footer ?? []}
                    onChange={(footer) => patchPage({ footer })}
                    addKinds={HEADER_KINDS}
                  />
                </div>

                <p className="text-xs text-slate-400">Select a block on the canvas to edit its properties.</p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

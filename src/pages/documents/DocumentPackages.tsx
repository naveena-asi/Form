import { useState, type ComponentProps } from 'react'
import {
  ArrowDown,
  ArrowUp,
  FileCheck,
  FileMinus,
  FilePen,
  FileText,
  FileX,
  FolderOpen,
  Globe,
  Mail,
  PackageOpen,
  PenLine,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
  Undo2,
  type LucideIcon,
} from 'lucide-react'
import { Badge, Button, Card, CardHeader, PageHeader, Toggle } from '@/components/ui'
import { Dropdown } from '@/components/ui/Dropdown'
import { useDocumentStore } from '@/store/useDocumentStore'
import { toast } from '@/store/useToast'
import { cn } from '@/lib/cn'
import {
  DOC_TYPE_LABEL,
  type DocEvent,
  type DocPackage,
  type DocPackageEntry,
  type DocumentTemplate,
  type DocumentType,
} from '@/data/documents'

type BadgeTone = NonNullable<ComponentProps<typeof Badge>['tone']>
type DeliverChannel = NonNullable<DocPackageEntry['deliver']>[number]

// ── Lifecycle event metadata (drives one card per DocEvent) ──────────────────
interface EventMeta {
  event: DocEvent
  label: string
  desc: string
  icon: LucideIcon
  tone: BadgeTone
}

const EVENT_META: EventMeta[] = [
  { event: 'bound', label: 'Policy Bound', desc: 'New business is issued — the binding document set.', icon: FileCheck, tone: 'green' },
  { event: 'endorsed', label: 'Endorsed', desc: 'A mid-term change amends the policy.', icon: FilePen, tone: 'blue' },
  { event: 'renewed', label: 'Renewed', desc: 'The policy is offered and carried into a new term.', icon: RefreshCw, tone: 'navy' },
  { event: 'cancelled', label: 'Cancelled', desc: 'Coverage is terminated before expiration.', icon: FileX, tone: 'red' },
  { event: 'nonRenewed', label: 'Non-Renewed', desc: 'The carrier declines to offer a renewal term.', icon: FileMinus, tone: 'amber' },
  { event: 'reinstated', label: 'Reinstated', desc: 'A lapsed or cancelled policy is restored.', icon: Undo2, tone: 'purple' },
  { event: 'claimOpened', label: 'Claim Opened', desc: 'A first notice of loss starts the claim file.', icon: FolderOpen, tone: 'amber' },
]

// ── Delivery channels (canonical order) ──────────────────────────────────────
const CHANNELS: { id: DeliverChannel; label: string; icon: LucideIcon }[] = [
  { id: 'portal', label: 'Portal', icon: Globe },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'esign', label: 'E-Sign', icon: PenLine },
]

const ALL_TYPES = (Object.keys(DOC_TYPE_LABEL) as DocumentType[]).sort((a, b) =>
  DOC_TYPE_LABEL[a].localeCompare(DOC_TYPE_LABEL[b]),
)

type DraftMap = Record<DocEvent, DocPackageEntry[]>

function buildDraft(pkgs: DocPackage[]): DraftMap {
  const out = {} as DraftMap
  for (const { event } of EVENT_META) {
    out[event] = structuredClone(pkgs.find((p) => p.event === event)?.entries ?? [])
  }
  return out
}

export default function DocumentPackages() {
  const packages = useDocumentStore((s) => s.packages)
  const templates = useDocumentStore((s) => s.templates)
  const setPackage = useDocumentStore((s) => s.setPackage)

  // Working copy seeded from the persisted packages; saved back via setPackage.
  const [draft, setDraft] = useState<DraftMap>(() => buildDraft(useDocumentStore.getState().packages))

  // ── Helpers ────────────────────────────────────────────────────────────────
  const storeEntries = (event: DocEvent): DocPackageEntry[] =>
    packages.find((p) => p.event === event)?.entries ?? []

  const isDirty = (event: DocEvent): boolean =>
    JSON.stringify(draft[event]) !== JSON.stringify(storeEntries(event))

  const dirtyEvents = EVENT_META.filter((m) => isDirty(m.event)).map((m) => m.event)

  const templatesForType = (type: DocumentType): DocumentTemplate[] =>
    templates
      .filter((t) => t.type === type)
      .slice()
      .sort((a, b) => Number(b.status === 'Published') - Number(a.status === 'Published') || a.name.localeCompare(b.name))

  const update = (event: DocEvent, entries: DocPackageEntry[]) =>
    setDraft((d) => ({ ...d, [event]: entries }))

  const mutate = (event: DocEvent, index: number, patch: Partial<DocPackageEntry>) =>
    update(
      event,
      draft[event].map((e, i) => (i === index ? { ...e, ...patch } : e)),
    )

  const addEntry = (event: DocEvent, type: DocumentType) =>
    update(event, [...draft[event], { type, required: false, deliver: ['portal'] }])

  const removeEntry = (event: DocEvent, index: number) =>
    update(event, draft[event].filter((_, i) => i !== index))

  const moveEntry = (event: DocEvent, index: number, dir: -1 | 1) => {
    const arr = draft[event]
    const j = index + dir
    if (j < 0 || j >= arr.length) return
    const next = arr.slice()
    const [item] = next.splice(index, 1)
    next.splice(j, 0, item)
    update(event, next)
  }

  const toggleChannel = (event: DocEvent, index: number, ch: DeliverChannel) => {
    const current = new Set(draft[event][index].deliver ?? [])
    if (current.has(ch)) current.delete(ch)
    else current.add(ch)
    mutate(event, index, { deliver: CHANNELS.map((c) => c.id).filter((id) => current.has(id)) })
  }

  const save = (event: DocEvent, label: string) => {
    setPackage({ event, entries: draft[event] })
    toast(`Saved the ${label} document package`)
  }

  const revert = (event: DocEvent) => update(event, structuredClone(storeEntries(event)))

  const saveAll = () => {
    for (const event of dirtyEvents) setPackage({ event, entries: draft[event] })
    toast(`Saved ${dirtyEvents.length} package${dirtyEvents.length === 1 ? '' : 's'}`)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        eyebrow="Document Designer"
        title="Document Packages"
        subtitle="Map each policy lifecycle event to the documents it generates, the template used, and how each is delivered."
        actions={
          <Button variant="primary" icon={Save} disabled={dirtyEvents.length === 0} onClick={saveAll}>
            {dirtyEvents.length > 0 ? `Save all (${dirtyEvents.length})` : 'Save all'}
          </Button>
        }
      />

      <div className="grid gap-5">
        {EVENT_META.map(({ event, label, desc, icon, tone }) => {
          const entries = draft[event]
          const requiredCount = entries.filter((e) => e.required).length
          const dirty = isDirty(event)

          return (
            <Card key={event}>
              <CardHeader
                icon={icon}
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    {label}
                    <Badge tone={tone} className="font-mono">
                      {event}
                    </Badge>
                    {dirty && <Badge tone="amber">Unsaved</Badge>}
                  </span>
                }
                subtitle={
                  <span>
                    {desc} · {entries.length} document{entries.length === 1 ? '' : 's'}
                    {requiredCount > 0 && <> · {requiredCount} required</>}
                  </span>
                }
                actions={
                  <>
                    {dirty && (
                      <>
                        <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => revert(event)}>
                          Revert
                        </Button>
                        <Button size="sm" variant="secondary" icon={Save} onClick={() => save(event, label)}>
                          Save
                        </Button>
                      </>
                    )}
                    <Dropdown
                      align="right"
                      width="w-64"
                      trigger={
                        <Button size="sm" variant="subtle" icon={Plus}>
                          Add document
                        </Button>
                      }
                      items={ALL_TYPES.map((t) => ({
                        label: DOC_TYPE_LABEL[t],
                        icon: FileText,
                        onClick: () => addEntry(event, t),
                      }))}
                    />
                  </>
                }
              />

              <div className="space-y-3 p-5">
                {entries.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-8 text-center">
                    <PackageOpen className="h-6 w-6 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No documents configured</p>
                    <p className="max-w-sm text-xs text-slate-400">
                      Use <span className="font-medium text-slate-600">Add document</span> to choose which artifacts this event
                      generates.
                    </p>
                  </div>
                ) : (
                  entries.map((entry, index) => {
                    const typeTemplates = templatesForType(entry.type)
                    return (
                      <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                        <div className="flex items-start gap-3">
                          {/* Reorder */}
                          <div className="flex flex-col gap-1 pt-0.5">
                            <button
                              type="button"
                              onClick={() => moveEntry(event, index, -1)}
                              disabled={index === 0}
                              aria-label="Move up"
                              className="rounded-md p-1 text-slate-400 transition hover:bg-white hover:text-navy-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveEntry(event, index, 1)}
                              disabled={index === entries.length - 1}
                              aria-label="Move down"
                              className="rounded-md p-1 text-slate-400 transition hover:bg-white hover:text-navy-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Main */}
                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-navy-50 text-navy-700">
                                <FileText className="h-3.5 w-3.5" />
                              </span>
                              <span className="truncate text-sm font-semibold text-slate-800">
                                {DOC_TYPE_LABEL[entry.type]}
                              </span>
                              <Badge tone="gray" className="font-mono">
                                {entry.type}
                              </Badge>
                              <div className="ml-auto flex items-center gap-2">
                                <Toggle
                                  checked={entry.required ?? false}
                                  onChange={(v) => mutate(event, index, { required: v })}
                                  label="Required"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeEntry(event, index)}
                                  aria-label="Remove document"
                                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              {/* Template */}
                              <div>
                                <label className="label !mb-1 text-[11px] uppercase tracking-wide text-slate-400">
                                  Template
                                </label>
                                <select
                                  className="select"
                                  value={entry.templateId ?? ''}
                                  onChange={(e) => mutate(event, index, { templateId: e.target.value || undefined })}
                                >
                                  <option value="">Auto — any published {DOC_TYPE_LABEL[entry.type]}</option>
                                  {typeTemplates.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.name} · v{t.version}
                                      {t.status === 'Published' ? '' : ` (${t.status})`}
                                    </option>
                                  ))}
                                </select>
                                {typeTemplates.length === 0 && (
                                  <p className="mt-1 text-[11px] text-slate-400">
                                    No template of this type yet — resolved at generation time.
                                  </p>
                                )}
                              </div>

                              {/* Delivery */}
                              <div>
                                <label className="label !mb-1 text-[11px] uppercase tracking-wide text-slate-400">
                                  Delivery channels
                                </label>
                                <div className="flex flex-wrap gap-1.5 pt-1.5">
                                  {CHANNELS.map((c) => {
                                    const active = entry.deliver?.includes(c.id) ?? false
                                    return (
                                      <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => toggleChannel(event, index, c.id)}
                                        aria-pressed={active}
                                        className={cn(
                                          'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition',
                                          active
                                            ? 'bg-brand-50 text-brand-700 ring-brand-200'
                                            : 'bg-white text-slate-400 ring-slate-200 hover:text-slate-600',
                                        )}
                                      >
                                        <c.icon className="h-3 w-3" />
                                        {c.label}
                                      </button>
                                    )
                                  })}
                                  {(entry.deliver?.length ?? 0) === 0 && (
                                    <span className="self-center text-[11px] text-slate-400">
                                      No delivery — stored to the policy file only.
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

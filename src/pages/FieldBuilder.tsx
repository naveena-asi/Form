import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Boxes, Trash2, ChevronUp, ChevronDown, Plus, X, GripVertical, Search } from 'lucide-react'
import { Card, CardHeader, PageHeader, Badge, Toggle, Button, ConfirmDialog } from '@/components/ui'
import { fieldTypeCatalog, fieldGroups, type FieldTypeMeta } from '@/data/fieldTypes'
import { useDesignerStore } from '@/store/useDesignerStore'
import { toast } from '@/store/useToast'
import { useReorder } from '@/lib/useReorder'
import type { Field, SelectOption } from '@/data/types'
import { cn } from '@/lib/cn'

const HAS_OPTIONS = new Set(['select', 'radio', 'coverage', 'checkbox'])

export default function FieldBuilder() {
  const navigate = useNavigate()
  const sections = useDesignerStore((s) => s.form.sections)
  const selectedSectionId = useDesignerStore((s) => s.selectedSectionId)
  const setSelectedSection = useDesignerStore((s) => s.setSelectedSection)
  const addField = useDesignerStore((s) => s.addField)
  const updateField = useDesignerStore((s) => s.updateField)
  const deleteField = useDesignerStore((s) => s.deleteField)
  const moveField = useDesignerStore((s) => s.moveField)
  const reorderField = useDesignerStore((s) => s.reorderField)

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(['Basic']))
  const [paletteQuery, setPaletteQuery] = useState('')

  const section = sections.find((s) => s.id === selectedSectionId) ?? sections[0]
  const field = section?.fields.find((f) => f.id === selectedFieldId) ?? null

  const { dragIndex, overIndex, dragProps } = useReorder((from, to) => {
    if (section) reorderField(section.id, from, to)
  })

  const set = (patch: Partial<Field>) => {
    if (section && field) updateField(section.id, field.id, patch)
  }

  const addType = (f: FieldTypeMeta) => {
    if (!section) return toast('Add a section first', 'info')
    const id = addField(section.id, f.type)
    setSelectedFieldId(id)
    toast(`${f.label} field added`)
  }

  const toggleGroup = (g: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev)
      next.has(g) ? next.delete(g) : next.add(g)
      return next
    })

  const query = paletteQuery.trim().toLowerCase()
  const matches = query
    ? fieldTypeCatalog.filter(
        (f) =>
          f.label.toLowerCase().includes(query) ||
          f.type.includes(query) ||
          f.group.toLowerCase().includes(query),
      )
    : []

  const typeBtn = (f: FieldTypeMeta) => {
    const Icon = f.icon
    return (
      <button
        key={f.type}
        onClick={() => addType(f)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-left text-[11px] font-medium text-slate-600 transition hover:border-navy-200 hover:bg-navy-50 hover:text-navy-700"
      >
        <Icon className="h-4 w-4 shrink-0 text-navy-500" strokeWidth={1.5} absoluteStrokeWidth />
        <span className="truncate">{f.label}</span>
      </button>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Form Designer"
        title="Field Builder"
        subtitle="Click a field type to add it to the selected section, then edit its properties."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-600">Editing section:</span>
        <select
          className="select w-64"
          value={section?.id ?? ''}
          onChange={(e) => {
            setSelectedSection(e.target.value)
            setSelectedFieldId(null)
          }}
        >
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.fields.length})
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 lg:grid-cols-[230px_1fr_320px]">
        {/* Palette — searchable accordion of field-type groups */}
        <Card className="self-start">
          <CardHeader title="Field Types" subtitle={`${fieldTypeCatalog.length} types · click to add`} icon={Boxes} />
          <div className="border-b border-slate-100 p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                placeholder="Search field types…"
                className="input pl-8 text-xs"
                aria-label="Search field types"
              />
            </div>
          </div>

          {query ? (
            <div className="grid grid-cols-2 gap-1.5 p-3">
              {matches.length ? (
                matches.map(typeBtn)
              ) : (
                <p className="col-span-2 py-6 text-center text-xs text-slate-400">
                  No field types match “{paletteQuery}”.
                </p>
              )}
            </div>
          ) : (
            <div className="max-h-[560px] overflow-y-auto p-1.5">
              {fieldGroups.map((group) => {
                const items = fieldTypeCatalog.filter((f) => f.group === group)
                const open = openGroups.has(group)
                return (
                  <div key={group} className="border-b border-slate-50 last:border-0">
                    <button
                      onClick={() => toggleGroup(group)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 transition hover:bg-slate-50"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        {group}
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                          {items.length}
                        </span>
                      </span>
                      <ChevronDown
                        className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')}
                      />
                    </button>
                    {open && <div className="grid grid-cols-2 gap-1.5 px-2 pb-3 pt-1">{items.map(typeBtn)}</div>}
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Fields in section */}
        <Card className="self-start">
          <CardHeader
            title={section ? `${section.name} — Fields` : 'Fields'}
            subtitle={`${section?.fields.length ?? 0} fields`}
          />
          <ul className="space-y-1 p-3">
            {section?.fields.map((f, i) => {
              const meta = fieldTypeCatalog.find((m) => m.type === f.type)
              const Icon = meta?.icon ?? Boxes
              return (
                <li
                  key={f.id}
                  {...dragProps(i)}
                  className={cn(
                    'group flex items-center gap-2 rounded-lg px-2.5 py-2 transition',
                    selectedFieldId === f.id ? 'bg-navy-50 ring-1 ring-navy-200' : 'hover:bg-slate-50',
                    dragIndex === i && 'opacity-40',
                    overIndex === i && dragIndex !== i && 'ring-2 ring-brand-400',
                  )}
                >
                  <GripVertical className="h-4 w-4 cursor-grab text-slate-300" />
                  <button onClick={() => setSelectedFieldId(f.id)} className="flex flex-1 items-center gap-2 text-left">
                    <Icon className="h-4 w-4 text-navy-500" strokeWidth={1.5} absoluteStrokeWidth />
                    <span className="flex-1 text-sm font-medium text-slate-800">{f.label}</span>
                    <Badge tone="gray">{f.type}</Badge>
                    {f.required && <span className="text-red-500">*</span>}
                  </button>
                  <div className="flex items-center opacity-0 transition group-hover:opacity-100">
                    <button onClick={() => moveField(section.id, f.id, -1)} disabled={i === 0} className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30">
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => moveField(section.id, f.id, 1)} disabled={i === section.fields.length - 1} className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setConfirmDelete(f.id)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              )
            })}
            {section && section.fields.length === 0 && (
              <li className="px-3 py-10 text-center text-sm text-slate-400">
                No fields yet — pick a type on the left to add one.
              </li>
            )}
          </ul>
        </Card>

        {/* Properties */}
        <Card className="self-start">
          <CardHeader title="Field Properties" subtitle={field ? field.label : 'Select a field'} />
          {!field ? (
            <div className="px-5 py-12 text-center text-sm text-slate-400">
              Select a field to edit, or add one from the palette.
            </div>
          ) : (
            <div className="space-y-4 p-5">
              <div>
                <label className="label">Label</label>
                <input className="input" value={field.label} onChange={(e) => set({ label: e.target.value })} />
              </div>
              <div>
                <label className="label">API Name</label>
                <input
                  className="input font-mono text-xs"
                  value={field.apiName}
                  onChange={(e) => set({ apiName: e.target.value.replace(/\s/g, '') })}
                />
              </div>
              <div>
                <label className="label">Help Text</label>
                <input className="input" value={field.helpText ?? ''} onChange={(e) => set({ helpText: e.target.value })} />
              </div>
              <div>
                <label className="label">Placeholder</label>
                <input className="input" value={field.placeholder ?? ''} onChange={(e) => set({ placeholder: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Column Span</label>
                  <select className="select" value={String(field.colSpan ?? 1)} onChange={(e) => set({ colSpan: Number(e.target.value) as 1 | 2 })}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </select>
                </div>
                <div>
                  <label className="label">Prefix</label>
                  <input className="input" value={field.prefix ?? ''} onChange={(e) => set({ prefix: e.target.value })} />
                </div>
              </div>

              {(field.type === 'computed' || field.type === 'premium') && (
                <div>
                  <label className="label">Formula</label>
                  <input
                    className="input font-mono text-xs"
                    value={field.formula ?? ''}
                    onChange={(e) => set({ formula: e.target.value })}
                  />
                </div>
              )}

              {HAS_OPTIONS.has(field.type) && (
                <OptionsEditor
                  options={field.options ?? []}
                  onChange={(options) => set({ options })}
                />
              )}

              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                <span className="text-sm text-slate-600">Required</span>
                <Toggle checked={Boolean(field.required)} onChange={(v) => set({ required: v })} />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                <span className="text-sm text-slate-600">Read-only</span>
                <Toggle checked={Boolean(field.readOnly)} onChange={(v) => set({ readOnly: v })} />
              </div>

              <Button
                variant="primary"
                className="w-full justify-center"
                onClick={() => {
                  toast('Saved — open Preview to see it live')
                  navigate('/preview')
                }}
              >
                Save &amp; Preview
              </Button>
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete field"
        message="Remove this field from the section?"
        onConfirm={() => {
          if (section && confirmDelete) {
            deleteField(section.id, confirmDelete)
            if (selectedFieldId === confirmDelete) setSelectedFieldId(null)
            toast('Field deleted', 'info')
          }
        }}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  )
}

function OptionsEditor({
  options,
  onChange,
}: {
  options: SelectOption[]
  onChange: (o: SelectOption[]) => void
}) {
  return (
    <div>
      <label className="label">Options</label>
      <div className="space-y-1.5">
        {options.map((o, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              className="input !py-1.5 text-xs"
              placeholder="Label"
              value={o.label}
              onChange={(e) => onChange(options.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))}
            />
            <input
              className="input !py-1.5 text-xs"
              placeholder="Value"
              value={o.value}
              onChange={(e) => onChange(options.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x)))}
            />
            <button
              onClick={() => onChange(options.filter((_, idx) => idx !== i))}
              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => onChange([...options, { label: 'New Option', value: `opt${options.length + 1}` }])}
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-navy-600 hover:text-navy-800"
      >
        <Plus className="h-3.5 w-3.5" /> Add option
      </button>
    </div>
  )
}

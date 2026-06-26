import { useState } from 'react'
import { Plus, GripVertical, ChevronUp, ChevronDown, Layers, Trash2 } from 'lucide-react'
import { Card, CardHeader, Button, PageHeader, Toggle, Badge, ConfirmDialog } from '@/components/ui'
import { useDesignerStore } from '@/store/useDesignerStore'
import { toast } from '@/store/useToast'
import { useReorder } from '@/lib/useReorder'
import type { SectionLayout } from '@/data/types'
import { cn } from '@/lib/cn'

export default function SectionBuilder() {
  const sections = useDesignerStore((s) => s.form.sections)
  const formName = useDesignerStore((s) => s.form.name)
  const selected = useDesignerStore((s) => s.selectedSectionId)
  const setSelected = useDesignerStore((s) => s.setSelectedSection)
  const addSection = useDesignerStore((s) => s.addSection)
  const updateSection = useDesignerStore((s) => s.updateSection)
  const deleteSection = useDesignerStore((s) => s.deleteSection)
  const moveSection = useDesignerStore((s) => s.moveSection)
  const addSubsection = useDesignerStore((s) => s.addSubsection)
  const reorderSection = useDesignerStore((s) => s.reorderSection)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const { dragIndex, overIndex, dragProps } = useReorder(reorderSection)

  const active = sections.find((s) => s.id === selected) ?? sections[0]

  return (
    <div>
      <PageHeader
        eyebrow="Form Designer"
        title="Section Builder"
        subtitle="Organise the form into sections and subsections, and control their layout."
        actions={
          <div className="flex gap-2">
            <Button
              variant="subtle"
              icon={Plus}
              onClick={() => {
                if (!active) return toast('Add a section first', 'info')
                addSubsection(active.id)
                toast('Subsection added')
              }}
            >
              Add Subsection
            </Button>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                addSection()
                toast('Section added')
              }}
            >
              Add Section
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* Section tree */}
        <Card>
          <CardHeader title="Sections" subtitle={`${sections.length} sections · ${formName}`} icon={Layers} />
          <ul className="space-y-1 p-3">
            {sections.map((s, i) => (
              <li key={s.id}>
                <div
                  {...dragProps(i)}
                  className={cn(
                    'group flex items-center gap-2 rounded-lg px-2.5 py-2.5 transition',
                    selected === s.id ? 'bg-navy-50 ring-1 ring-navy-200' : 'hover:bg-slate-50',
                    dragIndex === i && 'opacity-40',
                    overIndex === i && dragIndex !== i && 'ring-2 ring-brand-400',
                  )}
                >
                  <GripVertical className="h-4 w-4 cursor-grab text-slate-300" />
                  <button onClick={() => setSelected(s.id)} className="flex flex-1 items-center gap-2 text-left">
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-white text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-slate-800">{s.name}</span>
                    <Badge tone="gray">{s.fields.length} fields</Badge>
                  </button>
                  <div className="flex items-center opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => moveSection(s.id, -1)}
                      disabled={i === 0}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => moveSection(s.id, 1)}
                      disabled={i === sections.length - 1}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(s.id)}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {s.subsections?.map((sub) => (
                  <div key={sub.id} className="ml-9 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    {sub.name}
                  </div>
                ))}
              </li>
            ))}
            {sections.length === 0 && (
              <li className="px-3 py-8 text-center text-sm text-slate-400">No sections yet — add one to begin.</li>
            )}
          </ul>
          <div className="border-t border-slate-100 px-3 py-2.5">
            <Button variant="ghost" size="sm" icon={Plus} className="w-full justify-center" onClick={() => addSection()}>
              Add Section
            </Button>
          </div>
        </Card>

        {/* Properties panel */}
        {active && (
          <Card className="self-start">
            <CardHeader title="Section Properties" subtitle={active.name} />
            <div className="space-y-4 p-5">
              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  value={active.name}
                  onChange={(e) => updateSection(active.id, { name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={active.description ?? ''}
                  onChange={(e) => updateSection(active.id, { description: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Layout</label>
                <select
                  className="select"
                  value={active.layout}
                  onChange={(e) => updateSection(active.id, { layout: e.target.value as SectionLayout })}
                >
                  {['Single Column', 'Two Column', 'Accordion'].map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Columns</label>
                <select
                  className="select"
                  value={String(active.columns)}
                  onChange={(e) => updateSection(active.id, { columns: Number(e.target.value) as 1 | 2 })}
                >
                  <option value="1">One Column</option>
                  <option value="2">Two Column</option>
                </select>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                <span className="text-sm text-slate-600">Collapsible</span>
                <Toggle
                  checked={Boolean(active.collapsible)}
                  onChange={(v) => updateSection(active.id, { collapsible: v })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                <span className="text-sm text-slate-600">Required</span>
                <Toggle checked={Boolean(active.required)} onChange={(v) => updateSection(active.id, { required: v })} />
              </div>
              <Button
                variant="danger"
                icon={Trash2}
                className="w-full justify-center"
                onClick={() => setConfirmDelete(active.id)}
              >
                Delete Section
              </Button>
            </div>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete section"
        message="This removes the section and all of its fields from the form. This cannot be undone."
        onConfirm={() => {
          if (confirmDelete) {
            deleteSection(confirmDelete)
            toast('Section deleted', 'info')
          }
        }}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  )
}

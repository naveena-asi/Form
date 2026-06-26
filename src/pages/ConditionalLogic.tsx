import { useMemo, useState } from 'react'
import {
  GitBranch,
  Eye,
  EyeOff,
  ToggleRight,
  ToggleLeft,
  Asterisk,
  CircleDot,
  Eraser,
  Plus,
  Pencil,
  Trash2,
  Lightbulb,
} from 'lucide-react'
import { Card, PageHeader, Button, Modal, ConfirmDialog } from '@/components/ui'
import { ConditionEditor } from '@/components/designer/ConditionEditor'
import { ConditionPhrase, ACTION_VERB, ACTION_TONE, type FieldMeta } from '@/components/designer/ruleLanguage'
import { useDesignerStore, makeRule } from '@/store/useDesignerStore'
import { toast } from '@/store/useToast'
import type { Rule, RuleAction } from '@/data/types'
import { cn } from '@/lib/cn'

const actionList: { value: RuleAction; label: string; icon: typeof Eye }[] = [
  { value: 'show', label: 'Show', icon: Eye },
  { value: 'hide', label: 'Hide', icon: EyeOff },
  { value: 'require', label: 'Make required', icon: Asterisk },
  { value: 'optional', label: 'Make optional', icon: CircleDot },
  { value: 'enable', label: 'Enable', icon: ToggleRight },
  { value: 'disable', label: 'Disable', icon: ToggleLeft },
  { value: 'clear', label: 'Clear', icon: Eraser },
]

export default function ConditionalLogic() {
  const rules = useDesignerStore((s) => s.form.rules)
  const sections = useDesignerStore((s) => s.form.sections)
  const addRule = useDesignerStore((s) => s.addRule)
  const updateRule = useDesignerStore((s) => s.updateRule)
  const deleteRule = useDesignerStore((s) => s.deleteRule)

  const [editing, setEditing] = useState<Rule | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Human metadata: field apiName → {label, options}; target key → label.
  const fieldMap = useMemo(() => {
    const m = new Map<string, FieldMeta>()
    sections.flatMap((s) => s.fields).forEach((f) => m.set(f.apiName, { apiName: f.apiName, label: f.label, options: f.options }))
    return m
  }, [sections])

  const targetLabel = useMemo(() => {
    const m = new Map<string, string>()
    sections.forEach((s) => m.set(s.id, `${s.name} section`))
    sections.flatMap((s) => s.fields).forEach((f) => m.set(f.apiName, f.label))
    return (key: string) => m.get(key) ?? key
  }, [sections])

  const fieldOptions = useMemo(() => [...fieldMap.values()], [fieldMap])
  const targetGroups = useMemo(
    () => ({
      sections: sections.map((s) => ({ value: s.id, label: s.name })),
      fields: sections.flatMap((s) => s.fields).map((f) => ({ value: f.apiName, label: f.label })),
    }),
    [sections],
  )

  return (
    <div>
      <PageHeader
        eyebrow="Form Designer"
        title="Conditional Logic"
        subtitle="Rules that automatically show, hide, require or change fields based on what the user answers — written in plain English."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing(makeRule())}>
            New Rule
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id} className="p-4 transition hover:shadow-pop">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-navy-50 text-navy-600">
                      <GitBranch className="h-4 w-4" />
                    </span>
                    <span className="truncate text-sm font-semibold text-slate-900">{rule.name}</span>
                  </div>
                  {/* The rule, as a sentence */}
                  <p className="flex flex-wrap items-center gap-1.5 pl-9 text-sm leading-7 text-slate-700">
                    <span className="font-semibold text-slate-400">WHEN</span>
                    <ConditionPhrase group={rule.when} fields={fieldMap} />
                    <span className="font-semibold text-slate-400">→</span>
                    <span className={cn('rounded-md px-1.5 py-0.5 text-[13px] font-semibold ring-1 ring-inset', ACTION_TONE[rule.action])}>
                      {ACTION_VERB[rule.action]}
                    </span>
                    {rule.targets.length === 0 ? (
                      <span className="text-slate-400">(no targets)</span>
                    ) : (
                      rule.targets.map((t) => (
                        <span key={t} className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[13px] font-medium text-amber-700">
                          {targetLabel(t)}
                        </span>
                      ))
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => setEditing(structuredClone(rule))} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-600" title="Edit rule">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setConfirmDelete(rule.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500" title="Delete rule">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}

          {rules.length === 0 && (
            <Card className="grid place-items-center px-6 py-14 text-center">
              <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-navy-50 text-navy-500">
                <GitBranch className="h-6 w-6" />
              </span>
              <p className="text-sm font-medium text-slate-700">No rules yet</p>
              <p className="mt-1 max-w-xs text-xs text-slate-500">
                Create a rule like “When Business Type is Trucking, show the Vehicle Details section.”
              </p>
              <Button variant="primary" icon={Plus} className="mt-4" onClick={() => setEditing(makeRule())}>
                New Rule
              </Button>
            </Card>
          )}
        </div>

        {/* Legend */}
        <div className="space-y-4 self-start">
          <Card className="p-5">
            <div className="section-title mb-3">What rules can do</div>
            <div className="space-y-2">
              {actionList.map((a) => (
                <div key={a.value} className="flex items-center gap-2">
                  <span className={cn('grid h-6 w-6 place-items-center rounded-md ring-1 ring-inset', ACTION_TONE[a.value])}>
                    <a.icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs text-slate-600">{a.label}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-semibold text-slate-700">How it reads</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Each rule is a sentence: <span className="font-medium text-slate-700">WHEN</span> a condition is met,{' '}
              <span className="font-medium text-slate-700">→</span> do something to a field or section. They run live in
              Preview as the user types.
            </p>
          </Card>
        </div>
      </div>

      {editing && (
        <RuleModal
          rule={editing}
          fieldOptions={fieldOptions}
          targetGroups={targetGroups}
          fieldMap={fieldMap}
          targetLabel={targetLabel}
          onClose={() => setEditing(null)}
          onSave={(r) => {
            const exists = rules.some((x) => x.id === r.id)
            if (exists) updateRule(r)
            else addRule(r)
            toast(exists ? 'Rule updated' : 'Rule created')
            setEditing(null)
          }}
        />
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete rule"
        message="Remove this conditional rule?"
        onConfirm={() => {
          if (confirmDelete) {
            deleteRule(confirmDelete)
            toast('Rule deleted', 'info')
          }
        }}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  )
}

function RuleModal({
  rule,
  fieldOptions,
  targetGroups,
  fieldMap,
  targetLabel,
  onClose,
  onSave,
}: {
  rule: Rule
  fieldOptions: { apiName: string; label: string; options?: { label: string; value: string }[] }[]
  targetGroups: { sections: { value: string; label: string }[]; fields: { value: string; label: string }[] }
  fieldMap: Map<string, FieldMeta>
  targetLabel: (k: string) => string
  onClose: () => void
  onSave: (r: Rule) => void
}) {
  const [draft, setDraft] = useState<Rule>(rule)
  const toggleTarget = (v: string) =>
    setDraft((d) => ({
      ...d,
      targets: d.targets.includes(v) ? d.targets.filter((t) => t !== v) : [...d.targets, v],
    }))

  return (
    <Modal
      open
      onClose={onClose}
      title={rule.name === 'New Rule' ? 'New Rule' : 'Edit Rule'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onSave(draft)}>
            Save Rule
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="label">Rule name</label>
          <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Show vehicles for trucking" />
        </div>

        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="grid h-5 w-7 place-items-center rounded bg-navy-700 text-[10px] font-bold text-white">WHEN</span>
            <span className="text-sm font-medium text-slate-700">these conditions are met</span>
          </div>
          <ConditionEditor value={draft.when} onChange={(when) => setDraft({ ...draft, when })} fieldOptions={fieldOptions} />
        </div>

        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="grid h-5 w-7 place-items-center rounded bg-brand-500 text-[10px] font-bold text-white">THEN</span>
            <span className="text-sm font-medium text-slate-700">do this</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {actionList.map((a) => (
              <button
                key={a.value}
                onClick={() => setDraft({ ...draft, action: a.value })}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition',
                  draft.action === a.value ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                )}
              >
                <a.icon className="h-3.5 w-3.5" />
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">to these fields / sections</label>
          <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2">
            <TargetGroup title="Sections" items={targetGroups.sections} selected={draft.targets} onToggle={toggleTarget} />
            <TargetGroup title="Fields" items={targetGroups.fields} selected={draft.targets} onToggle={toggleTarget} />
          </div>
        </div>

        {/* Live preview */}
        <div className="rounded-lg border border-dashed border-navy-200 bg-navy-50/40 p-3">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-navy-500">Preview</div>
          <p className="flex flex-wrap items-center gap-1.5 text-sm leading-7 text-slate-700">
            <span className="font-semibold text-slate-400">WHEN</span>
            <ConditionPhrase group={draft.when} fields={fieldMap} />
            <span className="font-semibold text-slate-400">→</span>
            <span className={cn('rounded-md px-1.5 py-0.5 text-[13px] font-semibold ring-1 ring-inset', ACTION_TONE[draft.action])}>
              {ACTION_VERB[draft.action]}
            </span>
            {draft.targets.length === 0 ? (
              <span className="text-slate-400">(choose a target)</span>
            ) : (
              draft.targets.map((t) => (
                <span key={t} className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[13px] font-medium text-amber-700">
                  {targetLabel(t)}
                </span>
              ))
            )}
          </p>
        </div>
      </div>
    </Modal>
  )
}

function TargetGroup({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string
  items: { value: string; label: string }[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  if (items.length === 0) return null
  return (
    <div>
      <div className="px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{title}</div>
      {items.map((t) => (
        <label key={t.value} className="flex items-center gap-2 rounded px-1.5 py-1 text-sm text-slate-600 hover:bg-slate-50">
          <input
            type="checkbox"
            className="rounded text-brand-500 focus:ring-brand-500/30"
            checked={selected.includes(t.value)}
            onChange={() => onToggle(t.value)}
          />
          {t.label}
        </label>
      ))}
    </div>
  )
}

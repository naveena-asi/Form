import { useMemo, useState } from 'react'
import { Workflow, Plus, Zap, DollarSign, ShieldCheck, Layers, Flag, MessageSquare, Sparkles, Pencil, Trash2 } from 'lucide-react'
import { Card, CardHeader, PageHeader, Badge, Button, Modal, ConfirmDialog } from '@/components/ui'
import { ConditionEditor } from '@/components/designer/ConditionEditor'
import { useDesignerStore, makeRatingRule } from '@/store/useDesignerStore'
import { useFormStore } from '@/store/useFormStore'
import { toast } from '@/store/useToast'
import { evaluateGroup } from '@/engines/conditionEngine'
import { rate } from '@/engines/ratingEngine'
import type { Condition, ConditionGroup, RatingOutputType, RatingRule } from '@/data/types'
import { cn } from '@/lib/cn'

const opLabel: Record<string, string> = {
  equals: '=', notEquals: '≠', greaterThan: '>', lessThan: '<',
  greaterOrEqual: '≥', lessOrEqual: '≤', contains: 'contains', isEmpty: 'is empty', isNotEmpty: 'is not empty',
}
function describe(group: ConditionGroup): string {
  return group.conditions
    .map((c) => {
      if ((c as ConditionGroup).join) return `(${describe(c as ConditionGroup)})`
      const cond = c as Condition
      return `${cond.field || '—'} ${opLabel[cond.operator]}${cond.value !== undefined && cond.value !== '' ? ' ' + cond.value : ''}`
    })
    .join(` ${group.join} `)
}

const outputTypes: RatingOutputType[] = ['Premium', 'Surcharge', 'Tier/Class', 'Eligibility', 'Referral', 'Message']
const outputs = [
  { label: 'Premium', icon: DollarSign },
  { label: 'Eligibility', icon: ShieldCheck },
  { label: 'Tier / Class', icon: Layers },
  { label: 'Referral', icon: Flag },
  { label: 'Messages', icon: MessageSquare },
]

export default function RuleBuilder() {
  const form = useDesignerStore((s) => s.form)
  const ratingRules = form.ratingRules
  const sections = form.sections
  const answers = useFormStore((s) => s.answers)
  const loadSample = useFormStore((s) => s.loadSample)
  const addRatingRule = useDesignerStore((s) => s.addRatingRule)
  const updateRatingRule = useDesignerStore((s) => s.updateRatingRule)
  const deleteRatingRule = useDesignerStore((s) => s.deleteRatingRule)
  const updateForm = useDesignerStore((s) => s.updateForm)

  const [editing, setEditing] = useState<RatingRule | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const rating = rate(form, answers)
  const fieldOptions = useMemo(
    () => sections.flatMap((s) => s.fields).map((f) => ({ apiName: f.apiName, label: f.label })),
    [sections],
  )

  return (
    <div>
      <PageHeader
        eyebrow="Rule & Rating Engine"
        title="Rule Builder"
        subtitle="Shared IF-THEN engine — outputs premium, eligibility, tier, referrals and messages, evaluated live."
        actions={
          <div className="flex gap-2">
            <Button variant="subtle" icon={Sparkles} onClick={loadSample}>Load Sample Data</Button>
            <Button variant="primary" icon={Plus} onClick={() => setEditing(makeRatingRule())}>New Rule</Button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <Card className="overflow-hidden">
          <CardHeader title="Rating Rules" subtitle={`${ratingRules.length} rules · live evaluation`} icon={Workflow} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Rule</th>
                  <th className="px-4 py-3">IF (Condition)</th>
                  <th className="px-4 py-3">THEN (Output)</th>
                  <th className="px-4 py-3 text-center">Live</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ratingRules.map((r) => {
                  const fires = evaluateGroup(r.when, answers)
                  return (
                    <tr key={r.id} className={cn(fires && 'bg-brand-50/40')}>
                      <td className="px-4 py-3 font-medium text-slate-800">{r.name}</td>
                      <td className="px-4 py-3"><code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{describe(r.when)}</code></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Badge tone="navy">{r.output}</Badge>
                          <span className="text-xs text-slate-600">
                            {r.result}{r.amount ? ` (${r.effect === 'multiplier' ? '×' : '+'}${r.amount})` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('inline-flex h-2.5 w-2.5 rounded-full', fires ? 'bg-brand-500 ring-2 ring-brand-200' : 'bg-slate-200')} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setEditing(structuredClone(r))} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-600">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setConfirmDelete(r.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {ratingRules.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">No rating rules yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4 self-start">
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 bg-navy-800 px-4 py-2.5 text-white">
              <Zap className="h-4 w-4 text-brand-300" />
              <span className="text-xs font-semibold uppercase tracking-wide">Live Result</span>
            </div>
            <div className="p-4">
              <div className="text-[11px] uppercase tracking-wide text-slate-400">Rated Premium</div>
              <div className="text-2xl font-bold text-navy-800">${rating.premium.toLocaleString()}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone="navy">Tier: {rating.tier}</Badge>
                <Badge tone={rating.eligibility === 'Eligible' ? 'green' : rating.eligibility === 'Declined' ? 'red' : 'amber'}>
                  {rating.eligibility}
                </Badge>
              </div>
              <div className="mt-3 border-t border-slate-100 pt-3">
                <label className="label">Base Premium</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <input
                    className="input pl-7"
                    type="number"
                    value={form.basePremium ?? 0}
                    onChange={(e) => updateForm({ basePremium: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="section-title mb-3">Outputs</div>
            <div className="space-y-2">
              {outputs.map((o) => (
                <div key={o.label} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-navy-50 text-navy-600">
                    <o.icon className="h-4 w-4" />
                  </span>
                  {o.label}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {editing && (
        <RatingRuleModal
          rule={editing}
          fieldOptions={fieldOptions}
          onClose={() => setEditing(null)}
          onSave={(r) => {
            const exists = ratingRules.some((x) => x.id === r.id)
            if (exists) updateRatingRule(r)
            else addRatingRule(r)
            toast(exists ? 'Rating rule updated' : 'Rating rule created')
            setEditing(null)
          }}
        />
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete rating rule"
        message="Remove this rating rule?"
        onConfirm={() => {
          if (confirmDelete) {
            deleteRatingRule(confirmDelete)
            toast('Rating rule deleted', 'info')
          }
        }}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  )
}

function RatingRuleModal({
  rule,
  fieldOptions,
  onClose,
  onSave,
}: {
  rule: RatingRule
  fieldOptions: { apiName: string; label: string }[]
  onClose: () => void
  onSave: (r: RatingRule) => void
}) {
  const [draft, setDraft] = useState<RatingRule>(rule)
  const isPremium = draft.output === 'Premium' || draft.output === 'Surcharge'

  return (
    <Modal
      open
      onClose={onClose}
      title={rule.result || rule.name !== 'New Rating Rule' ? 'Edit Rating Rule' : 'New Rating Rule'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSave(draft)}>Save Rule</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Rule Name</label>
          <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </div>
        <div>
          <label className="label">IF — Conditions</label>
          <div className="rounded-lg border border-slate-200 p-3">
            <ConditionEditor value={draft.when} onChange={(when) => setDraft({ ...draft, when })} fieldOptions={fieldOptions} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Output</label>
            <select className="select" value={draft.output} onChange={(e) => setDraft({ ...draft, output: e.target.value as RatingOutputType })}>
              {outputTypes.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Result</label>
            <input className="input" placeholder="e.g. Tier B / Decline" value={draft.result} onChange={(e) => setDraft({ ...draft, result: e.target.value })} />
          </div>
        </div>
        {isPremium && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Effect</label>
              <select className="select" value={draft.effect ?? 'multiplier'} onChange={(e) => setDraft({ ...draft, effect: e.target.value as 'multiplier' | 'flat' })}>
                <option value="multiplier">Multiplier (×)</option>
                <option value="flat">Flat (+)</option>
              </select>
            </div>
            <div>
              <label className="label">Amount</label>
              <input className="input" type="number" step="0.05" value={draft.amount ?? 0} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} />
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

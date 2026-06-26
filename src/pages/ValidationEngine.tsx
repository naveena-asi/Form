import { useMemo, useState } from 'react'
import { ShieldCheck, AlertCircle, AlertTriangle, Info, Plus, Pencil, Trash2 } from 'lucide-react'
import { Card, CardHeader, PageHeader, Badge, Button, Modal, ConfirmDialog } from '@/components/ui'
import { useDesignerStore, makeValidation } from '@/store/useDesignerStore'
import { toast } from '@/store/useToast'
import type { Validation, ValidationLevel } from '@/data/types'

const errorTypes = [
  { label: 'Blocker', icon: AlertCircle, swatch: 'bg-red-50 text-red-600', desc: 'Stops submission' },
  { label: 'Warning', icon: AlertTriangle, swatch: 'bg-amber-50 text-amber-600', desc: 'Advisory, allows submit' },
  { label: 'Info', icon: Info, swatch: 'bg-blue-50 text-blue-600', desc: 'Informational note' },
]

const levelTone: Record<string, 'red' | 'amber' | 'blue'> = { blocker: 'red', warning: 'amber', info: 'blue' }
const vTypes: Validation['type'][] = ['required', 'min', 'max', 'minLength', 'maxLength', 'regex', 'expression']
const scopes = ['Field', 'Section', 'Form', 'Cross-Field'] as const

export default function ValidationEngine() {
  const validations = useDesignerStore((s) => s.form.validations)
  const sections = useDesignerStore((s) => s.form.sections)
  const formName = useDesignerStore((s) => s.form.name)
  const addValidation = useDesignerStore((s) => s.addValidation)
  const updateValidation = useDesignerStore((s) => s.updateValidation)
  const deleteValidation = useDesignerStore((s) => s.deleteValidation)

  const [editing, setEditing] = useState<Validation | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fieldOptions = useMemo(
    () => sections.flatMap((s) => s.fields).map((f) => ({ apiName: f.apiName, label: f.label })),
    [sections],
  )

  return (
    <div>
      <PageHeader
        eyebrow="Form Designer"
        title="Validation Engine"
        subtitle="Field, section, form and cross-field checks — each classified as blocker, warning or info."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing(makeValidation())}>
            New Validation
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {errorTypes.map((e) => (
          <Card key={e.label} className="flex items-center gap-3 p-4">
            <span className={`grid h-10 w-10 place-items-center rounded-lg ${e.swatch}`}>
              <e.icon className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-semibold text-slate-900">{e.label}</div>
              <div className="text-xs text-slate-500">{e.desc}</div>
            </div>
          </Card>
        ))}
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-navy-50 text-navy-600">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm font-semibold text-slate-900">{validations.length} rules</div>
            <div className="text-xs text-slate-500">on this form</div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader title="Validation Rules" subtitle={formName} icon={ShieldCheck} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Field</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Rule</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {validations.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-xs">{v.field || '—'}</td>
                  <td className="px-4 py-3"><Badge tone="navy">{v.type}</Badge></td>
                  <td className="px-4 py-3"><code className="text-xs text-slate-500">{String(v.value ?? '—')}</code></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{v.scope}</td>
                  <td className="px-4 py-3"><Badge tone={levelTone[v.level]}>{v.level}</Badge></td>
                  <td className="px-4 py-3 text-xs text-slate-600">{v.message}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditing(structuredClone(v))} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-600">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setConfirmDelete(v.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {validations.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No validations yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && (
        <ValidationModal
          validation={editing}
          fieldOptions={fieldOptions}
          onClose={() => setEditing(null)}
          onSave={(v) => {
            const exists = validations.some((x) => x.id === v.id)
            if (exists) updateValidation(v)
            else addValidation(v)
            toast(exists ? 'Validation updated' : 'Validation created')
            setEditing(null)
          }}
        />
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete validation"
        message="Remove this validation rule?"
        onConfirm={() => {
          if (confirmDelete) {
            deleteValidation(confirmDelete)
            toast('Validation deleted', 'info')
          }
        }}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  )
}

function ValidationModal({
  validation,
  fieldOptions,
  onClose,
  onSave,
}: {
  validation: Validation
  fieldOptions: { apiName: string; label: string }[]
  onClose: () => void
  onSave: (v: Validation) => void
}) {
  const [draft, setDraft] = useState<Validation>(validation)
  const showValue = !['required'].includes(draft.type)

  return (
    <Modal
      open
      onClose={onClose}
      title={validation.field ? 'Edit Validation' : 'New Validation'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSave(draft)}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Field</label>
            <select className="select" value={draft.field} onChange={(e) => setDraft({ ...draft, field: e.target.value })}>
              <option value="">Select field…</option>
              {fieldOptions.map((o) => (
                <option key={o.apiName} value={o.apiName}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select className="select" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as Validation['type'] })}>
              {vTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        {showValue && (
          <div>
            <label className="label">{draft.type === 'expression' ? 'Expression (must be true to pass)' : 'Value'}</label>
            <input
              className="input font-mono text-xs"
              value={String(draft.value ?? '')}
              placeholder={draft.type === 'expression' ? 'e.g. COUNT(vehicles) == vehicleCount' : 'e.g. 0'}
              onChange={(e) => setDraft({ ...draft, value: e.target.value })}
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Level</label>
            <select className="select" value={draft.level} onChange={(e) => setDraft({ ...draft, level: e.target.value as ValidationLevel })}>
              <option value="blocker">Blocker</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
          <div>
            <label className="label">Scope</label>
            <select className="select" value={draft.scope} onChange={(e) => setDraft({ ...draft, scope: e.target.value as Validation['scope'] })}>
              {scopes.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Message</label>
          <input className="input" value={draft.message} onChange={(e) => setDraft({ ...draft, message: e.target.value })} />
        </div>
      </div>
    </Modal>
  )
}

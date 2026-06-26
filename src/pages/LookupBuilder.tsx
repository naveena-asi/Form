import { useEffect, useState } from 'react'
import { Database, FileSpreadsheet, Server, Cloud, Plus, Trash2 } from 'lucide-react'
import { Card, CardHeader, PageHeader, Badge, Button, ConfirmDialog } from '@/components/ui'
import { useDesignerStore } from '@/store/useDesignerStore'
import { toast } from '@/store/useToast'
import type { LookupSource } from '@/data/types'
import { cn } from '@/lib/cn'

const sourceIcon: Record<string, typeof Database> = {
  Static: Database,
  CSV: FileSpreadsheet,
  Database: Server,
  API: Cloud,
}
const sources: LookupSource[] = ['Static', 'CSV', 'Database', 'API']

export default function LookupBuilder() {
  const lookups = useDesignerStore((s) => s.lookups)
  const addLookup = useDesignerStore((s) => s.addLookup)
  const updateLookup = useDesignerStore((s) => s.updateLookup)
  const deleteLookup = useDesignerStore((s) => s.deleteLookup)
  const addLookupRow = useDesignerStore((s) => s.addLookupRow)
  const updateLookupCell = useDesignerStore((s) => s.updateLookupCell)
  const deleteLookupRow = useDesignerStore((s) => s.deleteLookupRow)

  const [selected, setSelected] = useState(lookups[0]?.id ?? '')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    if (!lookups.some((l) => l.id === selected)) setSelected(lookups[0]?.id ?? '')
  }, [lookups, selected])

  const table = lookups.find((t) => t.id === selected)

  return (
    <div>
      <PageHeader
        eyebrow="Form Designer"
        title="Lookup Builder"
        subtitle="Reference data that powers dropdowns, rating factors and validations — fully editable."
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              const id = addLookup()
              setSelected(id)
              toast('Lookup table created')
            }}
          >
            New Lookup
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <div className="space-y-2">
          {lookups.map((t) => {
            const Icon = sourceIcon[t.source]
            const on = t.id === selected
            return (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition',
                  on ? 'border-navy-300 bg-navy-50 ring-1 ring-navy-200' : 'border-slate-200 bg-white hover:bg-slate-50',
                )}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-navy-600 ring-1 ring-slate-200">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">{t.name}</div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <Badge tone="gray">{t.source}</Badge>
                    <span className="text-xs text-slate-400">{t.rows.length} rows</span>
                  </div>
                </div>
              </button>
            )
          })}
          {lookups.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 px-3 py-8 text-center text-sm text-slate-400">
              No lookup tables.
            </p>
          )}
        </div>

        {table && (
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
              <div className="flex items-center gap-2">
                <input
                  className="input w-56 font-semibold"
                  value={table.name}
                  onChange={(e) => updateLookup(table.id, { name: e.target.value })}
                />
                <select
                  className="select w-32"
                  value={table.source}
                  onChange={(e) => updateLookup(table.id, { source: e.target.value as LookupSource })}
                >
                  {sources.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="subtle" icon={Plus} onClick={() => addLookupRow(table.id)}>
                  Add Row
                </Button>
                <Button size="sm" variant="danger" icon={Trash2} onClick={() => setConfirmDelete(table.id)}>
                  Delete
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {table.columns.map((c) => (
                      <th key={c} className="px-3 py-2.5">{c}</th>
                    ))}
                    <th className="w-12 px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {table.rows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-slate-50/50">
                      {table.columns.map((c) => (
                        <td key={c} className="px-2 py-1">
                          <input
                            className="input !py-1.5 text-xs"
                            value={row[c] ?? ''}
                            onChange={(e) => updateLookupCell(table.id, ri, c, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="px-2 py-1 text-right">
                        <button
                          onClick={() => deleteLookupRow(table.id, ri)}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {table.rows.length === 0 && (
                    <tr><td colSpan={table.columns.length + 1} className="px-3 py-8 text-center text-xs text-slate-400">No rows.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <CardHeader title="" subtitle={table.description || 'Reference table'} />
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete lookup table"
        message="Remove this lookup table and all its rows?"
        onConfirm={() => {
          if (confirmDelete) {
            deleteLookup(confirmDelete)
            toast('Lookup deleted', 'info')
          }
        }}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  )
}

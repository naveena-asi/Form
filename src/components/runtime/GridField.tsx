import { useFormStore } from '@/store/useFormStore'
import type { Field } from '@/data/types'
import { Plus, Copy, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui'

const EMPTY_ROWS: Record<string, unknown>[] = []

export function GridField({ field }: { field: Field }) {
  const grid = field.grid!
  // Select the raw value (stable reference) and derive rows outside the selector —
  // returning a fresh [] from the selector would loop under zustand v5.
  const raw = useFormStore((s) => s.answers[field.apiName])
  const rows = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : EMPTY_ROWS
  const addRow = useFormStore((s) => s.addGridRow)
  const cloneRow = useFormStore((s) => s.cloneGridRow)
  const removeRow = useFormStore((s) => s.removeGridRow)
  const setCell = useFormStore((s) => s.setGridCell)

  const atMax = grid.maxRows !== undefined && rows.length >= grid.maxRows

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="w-10 px-2 py-2 text-center">#</th>
            {grid.columns.map((c) => (
              <th key={c.apiName} className="px-2 py-2" style={{ width: c.width }}>
                {c.label}
              </th>
            ))}
            <th className="w-16 px-2 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-slate-50/50">
              <td className="px-2 py-1.5 text-center text-xs text-slate-400">{ri + 1}</td>
              {grid.columns.map((c) => (
                <td key={c.apiName} className="px-1.5 py-1">
                  {c.type === 'select' ? (
                    <select
                      className="select !py-1.5 text-xs"
                      value={(row[c.apiName] as string) ?? ''}
                      onChange={(e) => setCell(field.apiName, ri, c.apiName, e.target.value)}
                    >
                      <option value="">—</option>
                      {c.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="input !py-1.5 text-xs"
                      type={c.type === 'number' ? 'number' : 'text'}
                      value={(row[c.apiName] as string | number) ?? ''}
                      onChange={(e) =>
                        setCell(
                          field.apiName,
                          ri,
                          c.apiName,
                          c.type === 'number' ? Number(e.target.value) : e.target.value,
                        )
                      }
                    />
                  )}
                </td>
              ))}
              <td className="px-2 py-1">
                <div className="flex items-center justify-end gap-1">
                  <button
                    title="Clone row"
                    onClick={() => cloneRow(field.apiName, ri)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-navy-600"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    title="Delete row"
                    onClick={() => removeRow(field.apiName, ri)}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={grid.columns.length + 2} className="px-3 py-6 text-center text-xs text-slate-400">
                No rows yet — add a {field.label.toLowerCase().replace(/s$/, '')} to begin.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="subtle" icon={Plus} onClick={() => addRow(field.apiName)} disabled={atMax}>
            Add Row
          </Button>
          <Button size="sm" variant="ghost" icon={Upload} onClick={() => addRow(field.apiName)}>
            Import CSV
          </Button>
        </div>
        <span className="pr-1 text-[11px] text-slate-400">
          {rows.length}
          {grid.maxRows ? ` / ${grid.maxRows}` : ''} rows
        </span>
      </div>
    </div>
  )
}

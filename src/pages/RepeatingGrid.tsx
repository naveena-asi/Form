import { Table2, Rows3, Copy, Upload, Pencil, Sparkles } from 'lucide-react'
import { Card, CardHeader, PageHeader, Badge, Button, EmptyState } from '@/components/ui'
import { GridField } from '@/components/runtime/GridField'
import { useDesignerStore } from '@/store/useDesignerStore'
import { useFormStore } from '@/store/useFormStore'

const useCases = ['Drivers', 'Vehicles', 'Locations', 'Buildings', 'Claims', 'Employees', 'Additional Insureds']
const features = [
  { label: 'Min / Max Rows', icon: Rows3 },
  { label: 'Add / Delete Row', icon: Table2 },
  { label: 'Import CSV', icon: Upload },
  { label: 'Bulk Edit', icon: Pencil },
  { label: 'Clone Row', icon: Copy },
]

export default function RepeatingGrid() {
  const loadSample = useFormStore((s) => s.loadSample)
  const sections = useDesignerStore((s) => s.form.sections)
  const gridField = sections.flatMap((s) => s.fields).find((f) => f.type === 'grid' && f.grid)
  return (
    <div>
      <PageHeader
        eyebrow="Form Designer"
        title="Repeating Grid Builder"
        subtitle="Capture collections — vehicles, drivers, locations — as editable tables with per-row actions."
        actions={
          <Button variant="subtle" icon={Sparkles} onClick={loadSample}>
            Load Sample Data
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <Card>
          <CardHeader
            title={gridField ? gridField.label : 'Repeating Grid'}
            subtitle="Live grid — add, clone and delete rows"
            icon={Table2}
            actions={gridField && <Badge tone="navy">{gridField.grid?.columns.length} columns</Badge>}
          />
          <div className="p-5">
            {gridField ? (
              <>
                <GridField field={gridField} />
                <p className="mt-3 text-xs text-slate-400">
                  Bound to the <code className="font-mono">{gridField.apiName}</code> field — the same grid
                  renders in the live Preview, and <code className="font-mono">COUNT({gridField.apiName})</code>{' '}
                  feeds the formula &amp; validation engines.
                </p>
              </>
            ) : (
              <EmptyState
                icon={Table2}
                title="No grid field yet"
                hint="Add a Grid / Table field in the Field Builder to manage a collection here."
              />
            )}
          </div>
        </Card>

        <div className="space-y-4 self-start">
          <Card className="p-5">
            <div className="section-title mb-3">Features</div>
            <div className="space-y-2">
              {features.map((f) => (
                <div key={f.label} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-navy-50 text-navy-600">
                    <f.icon className="h-4 w-4" />
                  </span>
                  {f.label}
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <div className="section-title mb-3">Use Cases</div>
            <div className="flex flex-wrap gap-1.5">
              {useCases.map((u) => (
                <Badge key={u} tone="gray">
                  {u}
                </Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

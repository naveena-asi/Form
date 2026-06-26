import { useState } from 'react'
import { Calculator, Play, Sparkles } from 'lucide-react'
import { Card, CardHeader, PageHeader, Badge, Button } from '@/components/ui'
import { useFormStore } from '@/store/useFormStore'
import { evaluateFormula } from '@/engines/formulaEngine'
import { lookupTables } from '@/data/lookups'

const functions = [
  'SUM', 'AVG', 'MIN', 'MAX', 'ROUND', 'IF', 'COUNT',
  'LOOKUP', 'CONCAT', 'TEXT', 'YEAR', 'MONTH', 'TODAY',
]

const examples = [
  'ROUND(1200 + vehicleCount * 150 + numEmployees * 25, 0)',
  'annualRevenue * 0.0008',
  'IF(vehicleCount > 5, 1.1, 1.0)',
  'SUM(vehicleCount, numEmployees)',
  'COUNT(vehicles)',
]

const lookupsById = Object.fromEntries(lookupTables.map((t) => [t.id, t]))

export default function FormulaBuilder() {
  const answers = useFormStore((s) => s.answers)
  const loadSample = useFormStore((s) => s.loadSample)
  const [expr, setExpr] = useState(examples[0])

  const result = evaluateFormula(expr, answers, lookupsById)

  return (
    <div>
      <PageHeader
        eyebrow="Form Designer"
        title="Formula Engine"
        subtitle="Derive values, premiums, tiers and eligibility — evaluated live against the current answers."
        actions={
          <Button variant="subtle" icon={Sparkles} onClick={loadSample}>
            Load Sample Data
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Formula Editor" subtitle="Live evaluation" icon={Calculator} />
            <div className="p-5">
              <label className="label">Expression</label>
              <textarea
                className="textarea font-mono text-sm"
                rows={3}
                value={expr}
                onChange={(e) => setExpr(e.target.value)}
              />
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-dashed border-brand-300 bg-brand-50/50 px-4 py-3">
                <Play className="h-4 w-4 text-brand-600" />
                <span className="text-sm text-slate-500">Result</span>
                <span className="ml-auto text-xl font-bold text-navy-800">
                  {typeof result === 'number' ? result.toLocaleString() : `"${result}"`}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                References resolve against live answers (e.g. <code className="font-mono">vehicleCount</code>,{' '}
                <code className="font-mono">numEmployees</code>). Try “Load Sample Data”.
              </p>
            </div>
          </Card>

          <Card className="p-5">
            <div className="section-title mb-3">Example Formulas</div>
            <div className="space-y-2">
              {examples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setExpr(ex)}
                  className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left font-mono text-xs text-slate-600 transition hover:border-navy-200 hover:bg-slate-50"
                >
                  {ex}
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4 self-start">
          <Card className="p-5">
            <div className="section-title mb-3">Functions</div>
            <div className="flex flex-wrap gap-1.5">
              {functions.map((f) => (
                <button
                  key={f}
                  onClick={() => setExpr((e) => `${e}${f}()`)}
                  className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600 hover:bg-navy-50 hover:text-navy-700"
                >
                  {f}
                </button>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <div className="section-title mb-2">Outputs</div>
            <div className="flex flex-wrap gap-1.5">
              {['Field Values', 'Premium', 'Eligibility', 'Tier / Class', 'Derived Data'].map((o) => (
                <Badge key={o} tone="navy">
                  {o}
                </Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

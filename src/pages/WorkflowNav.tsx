import { Workflow, ListOrdered, LayoutList, Rows3, Square, Check } from 'lucide-react'
import { Card, CardHeader, PageHeader, Badge } from '@/components/ui'
import { useDesignerStore } from '@/store/useDesignerStore'
import { toast } from '@/store/useToast'
import type { FormDefinition } from '@/data/types'
import { cn } from '@/lib/cn'

type NavStyle = FormDefinition['navigationStyle']
const styles: { id: NavStyle; label: string; icon: typeof ListOrdered }[] = [
  { id: 'Wizard', label: 'Wizard (Step by Step)', icon: ListOrdered },
  { id: 'Tabs', label: 'Tabs', icon: LayoutList },
  { id: 'Accordion', label: 'Accordion', icon: Rows3 },
  { id: 'Single Page', label: 'Single Page', icon: Square },
]
const conditions = ['Skip Section', 'Jump Section', 'Redirect', 'Save Draft', 'Resume Later', 'Lock / Unlock Section']

export default function WorkflowNav() {
  const sections = useDesignerStore((s) => s.form.sections)
  const formName = useDesignerStore((s) => s.form.name)
  const style = useDesignerStore((s) => s.form.navigationStyle)
  const updateForm = useDesignerStore((s) => s.updateForm)

  return (
    <div>
      <PageHeader
        eyebrow="Form Designer"
        title="Workflow & Navigation"
        subtitle="Choose how respondents move through the form — the selected style is saved to the form and used in Preview."
      />

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Navigation Style" icon={Workflow} />
            <div className="space-y-2 p-4">
              {styles.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    updateForm({ navigationStyle: s.id })
                    toast(`Navigation set to ${s.id}`)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition',
                    style === s.id
                      ? 'border-navy-300 bg-navy-50 text-navy-800 ring-1 ring-navy-200'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  <s.icon className="h-4 w-4 text-navy-500" />
                  {s.label}
                </button>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <div className="section-title mb-3">Navigation Conditions</div>
            <div className="flex flex-wrap gap-1.5">
              {conditions.map((c) => (
                <Badge key={c} tone="gray">{c}</Badge>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader title={`${style} Preview`} subtitle={formName} />
          <div className="p-6">
            {style === 'Wizard' && (
              <div className="flex flex-wrap items-center gap-2">
                {sections.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <div className={cn('flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium', i === 0 ? 'bg-navy-700 text-white' : 'bg-slate-100 text-slate-600')}>
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-[10px]">{i + 1}</span>
                      {s.name}
                    </div>
                    {i < sections.length - 1 && <span className="text-slate-300">›</span>}
                  </div>
                ))}
              </div>
            )}
            {style === 'Tabs' && (
              <div className="flex flex-wrap gap-1 border-b border-slate-200">
                {sections.map((s, i) => (
                  <span key={s.id} className={cn('-mb-px border-b-2 px-3 py-2 text-sm font-medium', i === 0 ? 'border-brand-500 text-navy-800' : 'border-transparent text-slate-500')}>
                    {s.name}
                  </span>
                ))}
              </div>
            )}
            {style === 'Accordion' && (
              <div className="space-y-2">
                {sections.map((s, i) => (
                  <div key={s.id} className="rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700">
                      {s.name}
                      <Check className={cn('h-4 w-4', i === 0 ? 'text-brand-500' : 'text-slate-300')} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {style === 'Single Page' && (
              <div className="space-y-3">
                {sections.map((s) => (
                  <div key={s.id} className="rounded-lg border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-600">
                    <div className="font-medium text-slate-800">{s.name}</div>
                    <div className="text-xs text-slate-400">{s.fields.length} fields</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Wand2, ArrowRight, Boxes, Layers, Loader2, Info } from 'lucide-react'
import { Card, CardHeader, PageHeader, Button, Badge } from '@/components/ui'
import { generateForm, normalizeToFormDefinition, type GenResult } from '@/lib/aiGenerate'
import { useDesignerStore } from '@/store/useDesignerStore'
import { toast } from '@/store/useToast'

const examples = [
  'Commercial auto application for a trucking company with vehicles and drivers',
  'Homeowners insurance quote with property details and coverage options',
  'Auto claim — first notice of loss with incident details',
  'Workers compensation renewal questionnaire',
]

export default function AiGenerate() {
  const navigate = useNavigate()
  const loadForm = useDesignerStore((s) => s.loadForm)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GenResult | null>(null)

  const run = async () => {
    if (!prompt.trim()) return toast('Describe the form first', 'info')
    setLoading(true)
    setResult(null)
    const res = await generateForm(prompt.trim())
    setResult(res)
    setLoading(false)
    toast(res.source === 'ai' ? 'Form generated with Claude' : 'Form drafted locally', res.source === 'ai' ? 'success' : 'info')
  }

  const load = () => {
    if (!result) return
    loadForm(normalizeToFormDefinition(result.form))
    toast('Loaded into the designer')
    navigate('/builder/sections')
  }

  const fieldCount = result?.form.sections.reduce((n, s) => n + s.fields.length, 0) ?? 0

  return (
    <div>
      <PageHeader
        eyebrow="Form Designer · AI"
        title="AI Form Generation"
        subtitle="Describe a form in plain English and Claude drafts the sections, fields and types as editable metadata."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Describe your form" subtitle="Claude Opus 4.8 · structured output" icon={Wand2} />
            <div className="p-5">
              <textarea
                className="textarea text-sm"
                rows={4}
                placeholder="e.g. A commercial auto application for a trucking company, capturing business details, a schedule of vehicles, drivers, and coverage selections."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="primary" icon={loading ? Loader2 : Sparkles} onClick={run} disabled={loading} className={loading ? '[&_svg]:animate-spin' : ''}>
                  {loading ? 'Generating…' : 'Generate Form'}
                </Button>
                <span className="text-xs text-slate-400">or try an example →</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {examples.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setPrompt(ex)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition hover:border-navy-200 hover:bg-navy-50 hover:text-navy-700"
                  >
                    {ex.length > 42 ? ex.slice(0, 42) + '…' : ex}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {result && (
            <Card>
              <CardHeader
                title={result.form.name}
                subtitle={`${result.form.product} · ${result.form.type} · ${result.form.sections.length} sections · ${fieldCount} fields`}
                icon={Layers}
                actions={
                  <Badge tone={result.source === 'ai' ? 'green' : 'amber'}>
                    {result.source === 'ai' ? 'Claude AI' : 'Local draft'}
                  </Badge>
                }
              />
              <div className="space-y-3 p-5">
                {result.note && (
                  <p className="flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {result.note}
                  </p>
                )}
                {result.form.sections.map((s, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="grid h-5 w-5 place-items-center rounded-md bg-navy-50 text-[11px] font-semibold text-navy-700">
                        {i + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-800">{s.name}</span>
                      <Badge tone="gray">{s.fields.length} fields</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {s.fields.map((f, fi) => (
                        <span key={fi} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                          {f.label}
                          <span className="text-slate-400">· {f.type}</span>
                          {f.required && <span className="text-red-500">*</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex justify-end pt-1">
                  <Button variant="primary" icon={Boxes} iconRight={ArrowRight} onClick={load}>
                    Load into Designer
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4 self-start">
          <Card className="p-5">
            <div className="section-title mb-2">How it works</div>
            <ol className="space-y-2 text-xs text-slate-600">
              <li className="flex gap-2"><span className="font-semibold text-navy-600">1.</span> Your description is sent to a small Express proxy (<code className="font-mono">/api/generate-form</code>).</li>
              <li className="flex gap-2"><span className="font-semibold text-navy-600">2.</span> It calls the Claude Messages API with a strict JSON schema (structured outputs).</li>
              <li className="flex gap-2"><span className="font-semibold text-navy-600">3.</span> The returned spec is normalized into editable form metadata.</li>
              <li className="flex gap-2"><span className="font-semibold text-navy-600">4.</span> Load it into the designer to refine sections, fields, logic and rating.</li>
            </ol>
          </Card>
          <Card className="p-5">
            <div className="section-title mb-2">Setup</div>
            <p className="text-xs leading-relaxed text-slate-500">
              Real AI needs the backend running with a key:
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-[11px] text-slate-100">{`# .env
ANTHROPIC_API_KEY=sk-ant-...

npm run dev:full   # web + AI server`}</pre>
            <p className="mt-2 text-xs text-slate-400">
              Without a key, generation falls back to a local heuristic draft so the flow still works.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

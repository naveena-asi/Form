import { Plug, Lock, Webhook, ShieldCheck } from 'lucide-react'
import { Card, CardHeader, PageHeader, Badge } from '@/components/ui'
import { apiEndpoints, type ApiEndpoint } from '@/data/apiEndpoints'
import { cn } from '@/lib/cn'

const methodTone: Record<string, string> = {
  GET: 'bg-blue-50 text-blue-700 ring-blue-200',
  POST: 'bg-brand-50 text-brand-700 ring-brand-200',
  PUT: 'bg-amber-50 text-amber-700 ring-amber-200',
  DELETE: 'bg-red-50 text-red-700 ring-red-200',
}

const considerations = [
  { icon: ShieldCheck, label: 'Security, Roles & Permissions' },
  { icon: Lock, label: 'Token / OAuth Authentication' },
  { icon: Webhook, label: 'Webhooks & Integrations' },
]

export default function ApiLayer() {
  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="API Layer"
        subtitle="A REST surface over the metadata engine — definitions, save, submit, validate, calculate and documents."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <Card className="overflow-hidden">
          <CardHeader title="Endpoints" subtitle={`${apiEndpoints.length} endpoints`} icon={Plug} />
          <ul className="divide-y divide-slate-100">
            {apiEndpoints.map((ep: ApiEndpoint) => (
              <li key={ep.path + ep.method} className="flex items-center gap-3 px-5 py-3">
                <span
                  className={cn(
                    'w-16 shrink-0 rounded-md px-2 py-1 text-center text-[11px] font-bold ring-1 ring-inset',
                    methodTone[ep.method],
                  )}
                >
                  {ep.method}
                </span>
                <code className="flex-1 font-mono text-sm text-slate-700">{ep.path}</code>
                <span className="hidden text-xs text-slate-400 sm:block">{ep.description}</span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4 self-start">
          <Card className="p-5">
            <div className="section-title mb-3">Technical Considerations</div>
            <div className="space-y-2.5">
              {considerations.map((c) => (
                <div key={c.label} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-navy-50 text-navy-600">
                    <c.icon className="h-4 w-4" />
                  </span>
                  {c.label}
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <div className="section-title mb-2">Architecture</div>
            <div className="flex flex-wrap gap-1.5">
              {['Metadata-Driven', 'Microservices-Ready', 'Multi-Tenant', 'Extensible'].map((t) => (
                <Badge key={t} tone="navy">
                  {t}
                </Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

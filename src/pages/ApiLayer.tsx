import { Plug, Lock, Webhook, ShieldCheck, FileText } from 'lucide-react'
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

// ── Documents API reference ──────────────────────────────────────────────────
// Documented contract for the document generation, retrieval, delivery and
// signing surface. Mocked server-side in server/index.mjs; backed by the document
// store in src/store/useDocumentStore.ts.
interface DocApiEndpoint {
  method: 'GET' | 'POST'
  path: string
  purpose: string
  /** sample request body JSON; omitted for endpoints with no body. */
  request?: string
  /** sample 2xx response JSON. */
  response: string
}

const documentApiEndpoints: DocApiEndpoint[] = [
  {
    method: 'POST',
    path: '/api/policies/:id/documents:generate',
    purpose:
      'Run the document package for a policy lifecycle event — renders every template in the event package into numbered, issued instances.',
    request: `{
  "event": "bound"
}`,
    response: `{
  "policyId": "pol-100482",
  "event": "bound",
  "generated": [
    {
      "id": "doc-7f3a21",
      "type": "Declarations",
      "number": "POL-CA-100482-DEC-0001",
      "status": "Issued",
      "version": 1,
      "issuedAt": "2026-06-30T14:22:05.120Z",
      "url": "/documents/doc-7f3a21.pdf"
    },
    {
      "id": "doc-9b1c44",
      "type": "Invoice",
      "number": "POL-CA-100482-INV-0001",
      "status": "Issued",
      "version": 1,
      "issuedAt": "2026-06-30T14:22:05.120Z",
      "url": "/documents/doc-9b1c44.pdf"
    }
  ]
}`,
  },
  {
    method: 'GET',
    path: '/api/policies/:id/documents',
    purpose: 'List every document instance generated against a policy, newest first.',
    response: `{
  "policyId": "pol-100482",
  "documents": [
    {
      "id": "doc-7f3a21",
      "type": "Declarations",
      "number": "POL-CA-100482-DEC-0001",
      "status": "Delivered",
      "generatedAt": "2026-06-30T14:22:05.120Z"
    }
  ]
}`,
  },
  {
    method: 'GET',
    path: '/api/documents/:id',
    purpose: 'Fetch a single document instance with its delivery history and merge metadata.',
    response: `{
  "id": "doc-7f3a21",
  "templateId": "tpl-declarations",
  "type": "Declarations",
  "policyId": "pol-100482",
  "number": "POL-CA-100482-DEC-0001",
  "status": "Delivered",
  "version": 1,
  "generatedAt": "2026-06-30T14:22:05.120Z",
  "issuedAt": "2026-06-30T14:22:05.120Z",
  "url": "/documents/doc-7f3a21.pdf",
  "deliveries": [
    {
      "channel": "email",
      "to": "insured@example.com",
      "at": "2026-06-30T14:25:11.880Z",
      "status": "sent"
    }
  ]
}`,
  },
  {
    method: 'POST',
    path: '/api/documents/:id/deliver',
    purpose:
      'Deliver an issued document over a channel (portal, email, esign or print); appends a delivery record and advances status to Delivered.',
    request: `{
  "channel": "email",
  "to": "insured@example.com"
}`,
    response: `{
  "id": "doc-7f3a21",
  "status": "Delivered",
  "delivery": {
    "channel": "email",
    "to": "insured@example.com",
    "at": "2026-06-30T14:25:11.880Z",
    "status": "sent"
  }
}`,
  },
  {
    method: 'POST',
    path: '/api/documents/:id/sign',
    purpose: 'Capture an e-signature for a document; stamps signedAt and stores the signature payload.',
    request: `{
  "signatureData": "data:image/png;base64,iVBORw0KGgo..."
}`,
    response: `{
  "id": "doc-7f3a21",
  "status": "Delivered",
  "signedAt": "2026-06-30T14:31:42.500Z",
  "signatureCaptured": true
}`,
  },
]

const documentWebhook = {
  event: 'document.issued',
  purpose:
    'Fired whenever a document instance is issued. Subscribe to sync issued artifacts to downstream systems (e-delivery, archival, billing).',
  payload: `{
  "event": "document.issued",
  "occurredAt": "2026-06-30T14:22:05.120Z",
  "data": {
    "id": "doc-7f3a21",
    "type": "Declarations",
    "policyId": "pol-100482",
    "number": "POL-CA-100482-DEC-0001",
    "status": "Issued",
    "url": "/documents/doc-7f3a21.pdf"
  }
}`,
}

function CodeSample({ label, json, className }: { label: string; json: string; className?: string }) {
  return (
    <div className={className}>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <pre className="overflow-x-auto rounded-lg bg-slate-900 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-slate-100">
        {json}
      </pre>
    </div>
  )
}

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

      <Card className="mt-5 overflow-hidden">
        <CardHeader
          title="Documents API"
          subtitle="Generate, retrieve, deliver and e-sign policy documents"
          icon={FileText}
        />
        <ul className="divide-y divide-slate-100">
          {documentApiEndpoints.map((ep) => (
            <li key={ep.method + ep.path} className="px-5 py-4">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'w-16 shrink-0 rounded-md px-2 py-1 text-center text-[11px] font-bold ring-1 ring-inset',
                    methodTone[ep.method],
                  )}
                >
                  {ep.method}
                </span>
                <code className="font-mono text-sm text-slate-700">{ep.path}</code>
              </div>
              <p className="mt-2 text-xs text-slate-500">{ep.purpose}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {ep.request && <CodeSample label="Request" json={ep.request} />}
                <CodeSample
                  label="Response"
                  json={ep.response}
                  className={cn(!ep.request && 'md:col-span-2')}
                />
              </div>
            </li>
          ))}

          <li className="px-5 py-4">
            <div className="flex items-center gap-3">
              <Badge tone="purple">
                <Webhook className="h-3 w-3" />
                Webhook
              </Badge>
              <code className="font-mono text-sm text-slate-700">{documentWebhook.event}</code>
            </div>
            <p className="mt-2 text-xs text-slate-500">{documentWebhook.purpose}</p>
            <div className="mt-3">
              <CodeSample label="Payload" json={documentWebhook.payload} />
            </div>
          </li>
        </ul>
      </Card>
    </div>
  )
}

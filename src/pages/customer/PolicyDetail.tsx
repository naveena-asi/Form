import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft,
  ShieldCheck,
  FileText,
  ClipboardList,
  RefreshCcw,
  XCircle,
  Download,
  Calendar,
  Building2,
  Eye,
  PenLine,
  Sparkles,
  ChevronDown,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle2,
  Upload
} from 'lucide-react'
import { usePolicyStore } from '@/store/usePolicyStore'
import { getProduct } from '@/data/products'
import { getCarrier } from '@/data/carriers'
import { Badge, Button, Card } from '@/components/ui'
import { policyTone } from './CustomerHome'
import { useStartTransaction } from '@/lib/useStartTransaction'
import { toast } from '@/store/useToast'
import { cn } from '@/lib/cn'
import { useDocumentStore } from '@/store/useDocumentStore'
import { generateDocuments } from '@/engines/documentEngine'
import { DOC_TYPE_LABEL, type DocumentInstance, type MergeContext } from '@/data/documents'
import {
  DocumentViewerModal,
  INSTANCE_TONE,
  isUnsigned,
  templateHasSignature,
  downloadInstance,
} from '@/components/documents/DocumentViewerModal'

export default function PolicyDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const start = useStartTransaction()
  const policy = usePolicyStore((s) => s.policies.find((p) => p.id === id))
  const product = policy ? getProduct(policy.productId) : undefined
  const carrier = policy ? getCarrier(policy.carrierId) : undefined

  const allInstances = useDocumentStore((s) => s.instances)
  const getTemplate = useDocumentStore((s) => s.getTemplate)
  const instances = useMemo(
    () =>
      allInstances
        .filter((i) => i.policyId === id)
        .slice()
        .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt)),
    [allInstances, id],
  )
  const [viewer, setViewer] = useState<{ instance: DocumentInstance; sign: boolean } | null>(null)
  const [showSuperseded, setShowSuperseded] = useState(false)

  const active = instances.filter((i) => i.status !== 'Superseded')
  const superseded = instances.filter((i) => i.status === 'Superseded')

  const handleGenerate = () => {
    if (!policy) return
    const ctx: MergeContext = {
      policy,
      product,
      carrier,
      answers: {},
      now: new Date().toISOString(),
    }
    const created = generateDocuments('bound', ctx)
    toast(
      created.length
        ? `Generated ${created.length} document${created.length === 1 ? '' : 's'}.`
        : 'No documents were generated.',
      created.length ? 'success' : 'error',
    )
  }

  if (!policy) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-slate-500">Policy not found.</p>
        <button onClick={() => navigate('/portal/policies')} className="mt-3 text-sm font-medium text-navy-600">
          Back to My Policies
        </button>
      </div>
    )
  }

  const actions = [
    { kind: 'endorsement', label: 'Request a Change', desc: 'Endorse this policy', icon: FileText, tone: 'amber' },
    { kind: 'claim', label: 'File a Claim', desc: 'Report a loss', icon: ClipboardList, tone: 'navy' },
    { kind: 'renewal', label: 'Renew', desc: 'Continue coverage', icon: RefreshCcw, tone: 'blue' },
    { kind: 'cancellation', label: 'Cancel Policy', desc: 'Request cancellation', icon: XCircle, tone: 'red' },
  ] as const

  const toneCls: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-600',
    navy: 'bg-navy-50 text-navy-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <div>
      <button onClick={() => navigate('/portal/policies')} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ChevronLeft className="h-4 w-4" /> My Policies
      </button>

      {/* Dynamic Status Banners for Pending Applications */}
      {policy.status === 'Info Requested' && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-900">Action Required: Additional Information Needed</h3>
              <p className="mt-1 text-sm text-amber-700">Underwriting cannot proceed until you provide the following documents: <b>5-Year Loss Runs</b> and <b>Audited Financial Statements</b>.</p>
              <Button variant="primary" icon={Upload} className="mt-4 bg-amber-600 hover:bg-amber-700 text-white border-transparent" onClick={() => alert('Opening file uploader...')}>
                Upload Documents
              </Button>
            </div>
          </div>
        </div>
      )}

      {policy.status === 'Quoted' && (
        <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5">
          <div className="flex items-start gap-4">
            <Sparkles className="h-6 w-6 shrink-0 text-indigo-600 mt-0.5" />
            <div className="flex-1 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-indigo-900">Quote Ready to Bind</h3>
                <p className="mt-1 text-sm text-indigo-700">Your application has been approved. Review your quote letter below and bind coverage today.</p>
              </div>
              <Button variant="primary" icon={CheckCircle2} className="bg-indigo-600 hover:bg-indigo-700" onClick={() => {
                toast('Payment processed successfully. Policy is now active.', 'success')
                navigate('/portal')
              }}>
                Accept & Pay ${policy.premium.toLocaleString()}
              </Button>
            </div>
          </div>
        </div>
      )}

      {policy.status === 'Declined' && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-4">
            <XCircle className="h-6 w-6 shrink-0 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-red-900">Application Declined</h3>
              <p className="mt-1 text-sm text-red-700">Unfortunately, we are unable to offer coverage for this risk at this time due to high loss history in the provided class code.</p>
            </div>
          </div>
        </div>
      )}

      {policy.status === 'Under Review' && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-start gap-4">
            <Info className="h-6 w-6 shrink-0 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-blue-900">Application Under Review</h3>
              <p className="mt-1 text-sm text-blue-700">Your application has been successfully submitted and is currently being evaluated by our underwriting team. We will notify you once a decision is made.</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <ShieldCheck className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{policy.product}</h1>
                <Badge tone={policyTone(policy.status)}>{policy.status}</Badge>
              </div>
              <div className="font-mono text-sm text-slate-400">{policy.number}</div>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {policy.insured}</span>
                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {policy.effectiveDate} → {policy.expirationDate}</span>
                {carrier && <span>Underwritten by <span className="font-medium text-slate-600">{carrier.name}</span>{product && ` · ${product.code}`}</span>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wide text-slate-400">Annual Premium</div>
            <div className="text-3xl font-bold text-navy-800">${policy.premium.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          {/* Coverages */}
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">Coverages</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-2.5">Coverage</th>
                  <th className="px-5 py-2.5 text-right">Limit</th>
                  <th className="px-5 py-2.5 text-right">Deductible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {policy.coverages.map((c) => (
                  <tr key={c.name}>
                    <td className="px-5 py-3 font-medium text-slate-700">{c.name}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{c.limit}</td>
                    <td className="px-5 py-3 text-right text-slate-500">{c.deductible ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Documents */}
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Documents</div>
              {instances.length > 0 && (
                <span className="text-xs text-slate-400">{instances.length} issued</span>
              )}
            </div>

            {instances.length === 0 ? (
              // No generated documents yet — show the legacy labels as pending items
              // and offer to generate the real 'bound' document package.
              <div className="space-y-3">
                <div className="space-y-2">
                  {policy.documents.map((d) => (
                    <div
                      key={d}
                      className="flex items-center justify-between rounded-lg border border-dashed border-slate-200 px-3 py-2.5 text-sm text-slate-400"
                    >
                      <span className="inline-flex items-center gap-2">
                        <FileText className="h-4 w-4" strokeWidth={1.75} /> {d}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Clock className="h-3.5 w-3.5" /> Pending
                      </span>
                    </div>
                  ))}
                </div>
                <Button variant="primary" icon={Sparkles} className="w-full" onClick={handleGenerate}>
                  Generate documents
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {active.map((i) => {
                  const canSign = isUnsigned(i) && templateHasSignature(getTemplate(i.templateId))
                  return (
                    <div
                      key={i.id}
                      className="rounded-lg border border-slate-200 px-3 py-2.5 transition hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                            <FileText className="h-4 w-4 shrink-0 text-navy-500" strokeWidth={1.75} />
                            <span className="truncate">{DOC_TYPE_LABEL[i.type]}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 pl-6 text-xs text-slate-400">
                            <span className="font-mono">{i.number}</span>
                            <span className="text-slate-300">·</span>
                            <span>v{i.version}</span>
                            <span className="text-slate-300">·</span>
                            <span>{i.generatedAt.slice(0, 10)}</span>
                          </div>
                        </div>
                        <Badge tone={INSTANCE_TONE[i.status]} className="shrink-0">
                          {i.status}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 pl-6">
                        <Button size="sm" variant="subtle" icon={Eye} onClick={() => setViewer({ instance: i, sign: false })}>
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Download}
                          onClick={() => downloadInstance(i)}
                        >
                          Download
                        </Button>
                        {canSign && (
                          <Button
                            size="sm"
                            variant="primary"
                            icon={PenLine}
                            onClick={() => setViewer({ instance: i, sign: true })}
                          >
                            e-Sign
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}

                {superseded.length > 0 && (
                  <div className="pt-1">
                    <button
                      onClick={() => setShowSuperseded((v) => !v)}
                      className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50"
                    >
                      <span>
                        Superseded documents ({superseded.length})
                      </span>
                      <ChevronDown
                        className={cn('h-4 w-4 transition', showSuperseded && 'rotate-180')}
                      />
                    </button>
                    {showSuperseded && (
                      <div className="mt-1 space-y-2">
                        {superseded.map((i) => (
                          <div
                            key={i.id}
                            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-slate-500">
                                <FileText className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                                <span className="truncate line-through">{DOC_TYPE_LABEL[i.type]}</span>
                              </div>
                              <div className="pl-6 font-mono text-xs text-slate-400">{i.number}</div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={Eye}
                              onClick={() => setViewer({ instance: i, sign: false })}
                            >
                              View
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Actions - Only visible if the policy is active/bound */}
        {['Active', 'Pending Renewal', 'Cancelled', 'Expired'].includes(policy.status) && (
          <Card className="self-start p-5">
            <div className="mb-3 text-sm font-semibold text-slate-900">Manage this policy</div>
            <div className="space-y-2">
              {actions.map((a) => (
                <button
                  key={a.kind}
                  onClick={() => start(a.kind, { policy })}
                  className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition hover:border-navy-200 hover:bg-slate-50"
                >
                  <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg', toneCls[a.tone])}>
                    <a.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <div className="text-sm font-medium text-slate-800">{a.label}</div>
                    <div className="text-xs text-slate-400">{a.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {viewer && (
        <DocumentViewerModal
          instance={viewer.instance}
          open
          focusSign={viewer.sign}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  )
}

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
} from 'lucide-react'
import { usePolicyStore } from '@/store/usePolicyStore'
import { getProduct } from '@/data/products'
import { getCarrier } from '@/data/carriers'
import { Badge, Card } from '@/components/ui'
import { policyTone } from './CustomerHome'
import { useStartTransaction } from '@/lib/useStartTransaction'
import { toast } from '@/store/useToast'
import { cn } from '@/lib/cn'

export default function PolicyDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const start = useStartTransaction()
  const policy = usePolicyStore((s) => s.policies.find((p) => p.id === id))
  const product = policy ? getProduct(policy.productId) : undefined
  const carrier = policy ? getCarrier(policy.carrierId) : undefined

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
            <div className="mb-3 text-sm font-semibold text-slate-900">Documents</div>
            <div className="space-y-2">
              {policy.documents.map((d) => (
                <button
                  key={d}
                  onClick={() => toast(`Downloading “${d}”…`)}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <FileText className="h-4 w-4 text-navy-500" strokeWidth={1.75} /> {d}
                  </span>
                  <Download className="h-4 w-4 text-slate-400" />
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Actions */}
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
      </div>
    </div>
  )
}

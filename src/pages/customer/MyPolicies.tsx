import { useNavigate } from 'react-router-dom'
import { ShieldCheck, ChevronRight, FilePlus2 } from 'lucide-react'
import { usePolicyStore } from '@/store/usePolicyStore'
import { Badge } from '@/components/ui'
import { policyTone } from './CustomerHome'

export default function MyPolicies() {
  const navigate = useNavigate()
  const policies = usePolicyStore((s) => s.policies)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Policies</h1>
          <p className="mt-1 text-sm text-slate-500">{policies.length} policies on your account.</p>
        </div>
        <button onClick={() => navigate('/portal/quote')} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
          <FilePlus2 className="h-4 w-4" strokeWidth={1.75} /> Get a Quote
        </button>
      </div>

      <div className="space-y-3">
        {policies.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/portal/policies/${p.id}`)}
            className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-card transition hover:border-navy-200 hover:shadow-pop"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-navy-50 text-navy-600">
              <ShieldCheck className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{p.product}</span>
                <Badge tone={policyTone(p.status)}>{p.status}</Badge>
              </div>
              <div className="font-mono text-xs text-slate-400">{p.number}</div>
              <div className="mt-0.5 text-xs text-slate-500">
                {p.effectiveDate} → {p.expirationDate} · {p.insured}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-navy-800">${p.premium.toLocaleString()}</div>
              <div className="text-[11px] text-slate-400">per year</div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
          </button>
        ))}
      </div>
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { FileText, FilePlus2, ClipboardList, RefreshCcw, ArrowRight, ShieldCheck } from 'lucide-react'
import { customer, type PolicyStatus } from '@/data/policies'
import { usePolicyStore } from '@/store/usePolicyStore'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/cn'

export const policyTone = (s: PolicyStatus): 'green' | 'amber' | 'red' | 'gray' =>
  s === 'Active' ? 'green' : s === 'Pending Renewal' ? 'amber' : s === 'Cancelled' ? 'red' : 'gray'

export default function CustomerHome() {
  const navigate = useNavigate()
  const policies = usePolicyStore((s) => s.policies)
  const active = policies.filter((p) => p.status === 'Active')
  const totalPremium = active.reduce((n, p) => n + p.premium, 0)

  const actions = [
    { label: 'Get a Quote', desc: 'Start a new application', icon: FilePlus2, tone: 'brand', onClick: () => navigate('/portal/quote') },
    { label: 'File a Claim', desc: 'Report a loss or incident', icon: ClipboardList, tone: 'navy', onClick: () => navigate('/portal/policies') },
    { label: 'Request a Change', desc: 'Endorse an existing policy', icon: FileText, tone: 'amber', onClick: () => navigate('/portal/policies') },
    { label: 'Renew a Policy', desc: 'Continue your coverage', icon: RefreshCcw, tone: 'blue', onClick: () => navigate('/portal/policies') },
  ] as const

  const toneCls: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    navy: 'bg-navy-50 text-navy-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
  }

  return (
    <div>
      {/* Greeting */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-navy-800 p-7 text-white">
        <div className="text-sm text-navy-200">Welcome back,</div>
        <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
        <div className="text-sm text-navy-300">{customer.company}</div>
        <div className="mt-5 flex flex-wrap gap-6">
          <div>
            <div className="text-2xl font-bold">{active.length}</div>
            <div className="text-xs text-navy-300">Active policies</div>
          </div>
          <div>
            <div className="text-2xl font-bold">${totalPremium.toLocaleString()}</div>
            <div className="text-xs text-navy-300">Total annual premium</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{policies.filter((p) => p.status === 'Pending Renewal').length}</div>
            <div className="text-xs text-navy-300">Up for renewal</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <h2 className="mb-3 text-sm font-semibold text-slate-700">What would you like to do?</h2>
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-pop"
          >
            <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-lg', toneCls[a.tone])}>
              <a.icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <div className="text-sm font-semibold text-slate-900">{a.label}</div>
              <div className="mt-0.5 text-xs text-slate-500">{a.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Policies preview */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Your policies</h2>
        <button onClick={() => navigate('/portal/policies')} className="inline-flex items-center gap-1 text-xs font-medium text-navy-600 hover:text-navy-800">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {policies.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/portal/policies/${p.id}`)}
            className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-card transition hover:border-navy-200 hover:shadow-pop"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-navy-50 text-navy-600">
                <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <Badge tone={policyTone(p.status)}>{p.status}</Badge>
            </div>
            <div className="mt-3 text-sm font-semibold text-slate-900">{p.product}</div>
            <div className="font-mono text-xs text-slate-400">{p.number}</div>
            <div className="mt-3 text-lg font-bold text-navy-800">${p.premium.toLocaleString()}<span className="text-xs font-normal text-slate-400">/yr</span></div>
          </button>
        ))}
      </div>
    </div>
  )
}

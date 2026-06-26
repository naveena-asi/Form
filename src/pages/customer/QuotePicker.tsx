import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ShieldCheck, ArrowRight, MapPin } from 'lucide-react'
import { products } from '@/data/products'
import { getCarrier } from '@/data/carriers'
import { Card } from '@/components/ui'
import { useStartTransaction } from '@/lib/useStartTransaction'

export default function QuotePicker() {
  const navigate = useNavigate()
  const start = useStartTransaction()
  const available = products.filter((p) => p.status === 'Active')

  return (
    <div>
      <button onClick={() => navigate('/portal')} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ChevronLeft className="h-4 w-4" /> Home
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Get a Quote</h1>
        <p className="mt-1 text-sm text-slate-500">Choose a product to start your application.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {available.map((p) => {
          const carrier = getCarrier(p.carrierId)
          return (
            <Card key={p.id} className="flex flex-col p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <ShieldCheck className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-400">{carrier?.name} · {p.code}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">from</div>
                  <div className="text-lg font-bold text-navy-800">${p.baseRate.toLocaleString()}</div>
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-500">{p.eligibility}</p>

              <div className="mt-3 flex flex-wrap gap-1">
                {p.coverages.slice(0, 4).map((c) => (
                  <span key={c.name} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                    {c.name}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-400">
                <MapPin className="h-3 w-3" /> {p.states.join(' · ')}
              </div>

              <button
                onClick={() => start('quote', { product: p })}
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                Start application <ArrowRight className="h-4 w-4" />
              </button>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

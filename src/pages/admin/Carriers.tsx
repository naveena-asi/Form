import { useNavigate } from 'react-router-dom'
import { Building2, MapPin, Package, ArrowRight } from 'lucide-react'
import { Card, PageHeader, Badge } from '@/components/ui'
import { carriers } from '@/data/carriers'
import { productsByCarrier } from '@/data/products'
import { usePolicyStore } from '@/store/usePolicyStore'
import { cn } from '@/lib/cn'

const toneCls: Record<string, string> = {
  navy: 'bg-navy-50 text-navy-600',
  green: 'bg-brand-50 text-brand-600',
  amber: 'bg-amber-50 text-amber-600',
  blue: 'bg-blue-50 text-blue-600',
}

export default function Carriers() {
  const navigate = useNavigate()
  const policies = usePolicyStore((s) => s.policies)

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Carriers"
        subtitle="The insurers that write your products. Each carrier owns a set of products, which own their forms — and policies are bound from those products."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {carriers.map((carrier) => {
          const prods = productsByCarrier(carrier.id)
          const bound = policies.filter((p) => p.carrierId === carrier.id).length
          return (
            <Card key={carrier.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', toneCls[carrier.tone])}>
                    <Building2 className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{carrier.name}</div>
                    <div className="text-xs text-slate-400">Carrier code {carrier.code}</div>
                  </div>
                </div>
                <Badge tone={carrier.status === 'Active' ? 'green' : 'gray'}>{carrier.status}</Badge>
              </div>

              <p className="mt-3 text-xs text-slate-500">{carrier.appetite}</p>

              <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-400">
                <MapPin className="h-3 w-3" /> {carrier.states.join(' · ')}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div>
                  <div className="text-lg font-bold text-slate-900">{prods.length}</div>
                  <div className="text-xs text-slate-500">Products</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900">{bound}</div>
                  <div className="text-xs text-slate-500">In-force policies</div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {prods.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate('/products')}
                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-navy-50 hover:text-navy-700"
                  >
                    <Package className="h-3 w-3" /> {p.name}
                  </button>
                ))}
              </div>

              <button onClick={() => navigate('/products')} className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-navy-600 hover:text-navy-800">
                View products <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

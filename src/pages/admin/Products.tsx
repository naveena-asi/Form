import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, MapPin, FileText, Check, ShieldCheck, PlayCircle } from 'lucide-react'
import { Card, CardHeader, PageHeader, Badge } from '@/components/ui'
import { products, formForProduct, type Product } from '@/data/products'
import { carriers, getCarrier } from '@/data/carriers'
import { getForm } from '@/data/formTemplates'
import { usePolicyStore } from '@/store/usePolicyStore'
import { useFormStore } from '@/store/useFormStore'
import type { FormType } from '@/data/types'
import { cn } from '@/lib/cn'

const statusTone: Record<string, 'green' | 'amber' | 'gray'> = {
  Active: 'green',
  Draft: 'amber',
  Retired: 'gray',
}

export default function Products() {
  const policies = usePolicyStore((s) => s.policies)
  const [selectedId, setSelectedId] = useState(products[0]?.id ?? '')
  const product = products.find((p) => p.id === selectedId) ?? products[0]

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        subtitle="A product is a line of business written by a carrier — its rating base, coverages, eligible states and the forms used for each transaction."
      />

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        {/* Product list grouped by carrier */}
        <div className="space-y-4">
          {carriers.map((carrier) => {
            const list = products.filter((p) => p.carrierId === carrier.id)
            if (!list.length) return null
            return (
              <div key={carrier.id}>
                <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {carrier.name}
                </div>
                <div className="space-y-1.5">
                  {list.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition',
                        selectedId === p.id ? 'border-navy-300 bg-navy-50 ring-1 ring-navy-200' : 'border-slate-200 bg-white hover:bg-slate-50',
                      )}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-navy-600 ring-1 ring-slate-200">
                        <Package className="h-4 w-4" strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-400">{p.code} · ${p.baseRate.toLocaleString()} base</div>
                      </div>
                      <Badge tone={statusTone[p.status]}>{p.status}</Badge>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Product config */}
        {product && <ProductConfig product={product} policiesCount={policies.filter((p) => p.productId === product.id).length} />}
      </div>
    </div>
  )
}

function ProductConfig({ product, policiesCount }: { product: Product; policiesCount: number }) {
  const carrier = getCarrier(product.carrierId)
  const navigate = useNavigate()
  const setRuntimeForm = useFormStore((s) => s.setRuntimeForm)
  // Show the REAL form (catalog form or generated template) in the live preview.
  const previewForm = (type: FormType) => {
    setRuntimeForm(formForProduct(product, type))
    navigate('/preview')
  }
  return (
    <div className="space-y-5">
      {/* Summary */}
      <Card>
        <CardHeader
          title={product.name}
          subtitle={`${carrier?.name} · ${product.code}`}
          icon={Package}
          actions={<Badge tone={statusTone[product.status]}>{product.status}</Badge>}
        />
        <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
          {[
            { label: 'Base rate', value: `$${product.baseRate.toLocaleString()}` },
            { label: 'Coverages', value: String(product.coverages.length) },
            { label: 'States', value: String(product.states.length) },
            { label: 'Bound policies', value: String(policiesCount) },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-xl font-bold text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <span className="font-medium text-slate-700">Eligibility:</span> {product.eligibility}
        </div>
        <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-5 py-3">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          {product.states.map((s) => (
            <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">{s}</span>
          ))}
        </div>
      </Card>

      {/* Coverages */}
      <Card className="overflow-hidden">
        <CardHeader title="Coverages" subtitle="Available limits & deductibles" icon={ShieldCheck} />
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-5 py-2.5">Coverage</th>
              <th className="px-5 py-2.5">Limits</th>
              <th className="px-5 py-2.5">Deductibles</th>
              <th className="px-5 py-2.5 text-center">Required</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {product.coverages.map((c) => (
              <tr key={c.name}>
                <td className="px-5 py-3 font-medium text-slate-700">{c.name}</td>
                <td className="px-5 py-3 text-slate-600">{c.limits.join(', ')}</td>
                <td className="px-5 py-3 text-slate-500">{c.deductibles?.join(', ') ?? '—'}</td>
                <td className="px-5 py-3 text-center">{c.required ? <Check className="mx-auto h-4 w-4 text-brand-500" /> : <span className="text-slate-300">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Form group — open the real form for each transaction */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Form Group"
          subtitle="The form used for each transaction — open one to see its sections & fields"
          icon={FileText}
        />
        <ul className="divide-y divide-slate-100">
          {product.forms.map((f) => {
            const name = f.formId ? getForm(f.formId).name : `${product.name} ${f.type}`
            const sectionCount = (f.formId ? getForm(f.formId) : formForProduct(product, f.type)).sections.length
            return (
              <li key={f.type} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Badge tone="navy">{f.type}</Badge>
                  <span className="truncate text-sm font-medium text-slate-800">{name}</span>
                  <span className="hidden text-xs text-slate-400 sm:inline">· {sectionCount} sections</span>
                  {!f.formId && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      generated
                    </span>
                  )}
                </div>
                <button
                  onClick={() => previewForm(f.type)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-navy-700 transition hover:border-navy-200 hover:bg-navy-50"
                >
                  <PlayCircle className="h-3.5 w-3.5" /> Open form
                </button>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}

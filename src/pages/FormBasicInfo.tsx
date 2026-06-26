import { useNavigate } from 'react-router-dom'
import { FilePlus2, GitBranch, UploadCloud, ArrowRight, Building2 } from 'lucide-react'
import { Card, CardHeader, Button, PageHeader, Badge } from '@/components/ui'
import { useDesignerStore } from '@/store/useDesignerStore'
import { toast } from '@/store/useToast'
import { products, getProduct } from '@/data/products'
import { carriers, getCarrier } from '@/data/carriers'
import type { FormStatus, FormType } from '@/data/types'

export default function FormBasicInfo() {
  const navigate = useNavigate()
  const f = useDesignerStore((s) => s.form)
  const updateForm = useDesignerStore((s) => s.updateForm)
  const publish = useDesignerStore((s) => s.publish)

  // Resolve the current carrier/product from the form (by reference, then by name).
  const product = getProduct(f.productId ?? '') ?? products.find((p) => p.name === f.product)
  const carrierId = f.carrierId ?? product?.carrierId ?? carriers[0]?.id ?? ''
  const carrierProducts = products.filter((p) => p.carrierId === carrierId)
  const productId = f.productId ?? product?.id ?? carrierProducts[0]?.id ?? ''

  const onCarrier = (cid: string) => {
    const first = products.find((p) => p.carrierId === cid)
    updateForm({ carrierId: cid, productId: first?.id, product: first?.name ?? f.product })
  }
  const onProduct = (pid: string) => {
    const p = getProduct(pid)
    if (p) updateForm({ productId: p.id, carrierId: p.carrierId, product: p.name })
  }

  return (
    <div>
      <PageHeader
        eyebrow="Form Designer"
        title="Create / Edit Form"
        subtitle="Basic information that anchors the form's metadata, versioning and lifecycle."
        actions={
          <div className="flex gap-2">
            <Button
              variant="subtle"
              icon={UploadCloud}
              onClick={() => {
                publish()
                toast('Form published')
              }}
            >
              Publish
            </Button>
            <Button variant="primary" iconRight={ArrowRight} onClick={() => navigate('/builder/sections')}>
              Save &amp; Build Sections
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Basic Info" subtitle="Core attributes of the form" icon={FilePlus2} />
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-2.5 text-xs text-slate-500">
            <Building2 className="h-3.5 w-3.5 text-navy-500" />
            Written for
            <Badge tone="navy">{getCarrier(carrierId)?.name ?? '—'}</Badge>
            <span className="text-slate-300">→</span>
            <Badge tone="green">{getProduct(productId)?.name ?? f.product}</Badge>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Form Name <span className="text-red-500">*</span></label>
              <input className="input" value={f.name} onChange={(e) => updateForm({ name: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea className="textarea" rows={2} value={f.description ?? ''} onChange={(e) => updateForm({ description: e.target.value })} />
            </div>
            <div>
              <label className="label">Carrier <span className="text-red-500">*</span></label>
              <select className="select" value={carrierId} onChange={(e) => onCarrier(e.target.value)}>
                {carriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Product <span className="text-red-500">*</span></label>
              <select className="select" value={productId} onChange={(e) => onProduct(e.target.value)}>
                {carrierProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Form Type <span className="text-red-500">*</span></label>
              <select className="select" value={f.type} onChange={(e) => updateForm({ type: e.target.value as FormType })}>
                {['Application', 'Supplemental', 'Quote', 'Endorsement', 'Cancellation', 'Claim', 'Renewal'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Version <span className="text-red-500">*</span></label>
              <input className="input" value={f.version} onChange={(e) => updateForm({ version: e.target.value })} />
            </div>
            <div>
              <label className="label">Status <span className="text-red-500">*</span></label>
              <select className="select" value={f.status} onChange={(e) => updateForm({ status: e.target.value as FormStatus })}>
                {['Draft', 'Published', 'Archived'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Effective Date</label>
              <input className="input" type="date" value={f.effectiveDate} onChange={(e) => updateForm({ effectiveDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Expiration Date</label>
              <input className="input" type="date" value={f.expirationDate} onChange={(e) => updateForm({ expirationDate: e.target.value })} />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Settings" subtitle="Navigation & behaviour" icon={GitBranch} />
          <div className="space-y-4 p-5">
            <div>
              <label className="label">Navigation Style</label>
              <select className="select" value={f.navigationStyle} onChange={(e) => updateForm({ navigationStyle: e.target.value as typeof f.navigationStyle })}>
                {['Wizard', 'Tabs', 'Accordion', 'Single Page'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Base Premium</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                <input className="input pl-7" type="number" value={f.basePremium ?? 0} onChange={(e) => updateForm({ basePremium: Number(e.target.value) })} />
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              <div className="mb-1 font-medium text-slate-700">Metadata summary</div>
              {f.sections.length} sections · {f.sections.flatMap((s) => s.fields).length} fields ·{' '}
              {f.rules.length} rules · {f.validations.length} validations · {f.ratingRules.length} rating rules
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

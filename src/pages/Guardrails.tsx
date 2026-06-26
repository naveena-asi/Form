import { ShieldCheck, Calculator, GitBranch, ListChecks, RotateCcw } from 'lucide-react'
import { Card, CardHeader, PageHeader, Toggle, Button, Badge } from '@/components/ui'
import { useGuardrailStore } from '@/store/useGuardrailStore'
import { toast } from '@/store/useToast'
import type { GuardrailConfig } from '@/data/guardrails'

export default function GuardrailsPage() {
  const config = useGuardrailStore((s) => s.config)
  const set = useGuardrailStore((s) => s.set)
  const resetGuardrails = useGuardrailStore((s) => s.resetGuardrails)

  const ToggleRow = ({ k, label, desc }: { k: keyof GuardrailConfig; label: string; desc: string }) => (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-3.5 py-3">
      <div>
        <div className="text-sm font-medium text-slate-800">{label}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
      <Toggle checked={config[k] as boolean} onChange={(v) => set(k, v as never)} />
    </div>
  )

  const NumberRow = ({ k, label, desc, prefix, suffix }: { k: keyof GuardrailConfig; label: string; desc: string; prefix?: string; suffix?: string }) => (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-slate-800">{label}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
      <div className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 focus-within:border-navy-400">
        {prefix && <span className="text-sm text-slate-400">{prefix}</span>}
        <input
          type="number"
          className="w-24 border-0 bg-transparent py-2 text-right text-sm font-medium text-navy-800 focus:outline-none focus:ring-0"
          value={config[k] as number}
          onChange={(e) => set(k, (Number(e.target.value) || 0) as never)}
        />
        {suffix && <span className="text-sm text-slate-400">{suffix}</span>}
      </div>
    </div>
  )

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Global Guardrails"
        subtitle="Platform-wide underwriting, rating and validation rules enforced on every quote & bind — on top of each form's own logic."
        actions={
          <Button
            variant="subtle"
            icon={RotateCcw}
            onClick={() => {
              resetGuardrails()
              toast('Guardrails reset to defaults', 'info')
            }}
          >
            Reset to defaults
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Underwriting eligibility" subtitle="Appetite & territory" icon={ShieldCheck} />
          <div className="space-y-2 p-5">
            <ToggleRow
              k="enforceStateAvailability"
              label="Enforce state availability"
              desc="Block / decline a quote when the product isn't filed in the applicant's state."
            />
            <p className="px-1 pt-1 text-[11px] text-slate-400">
              Uses each product's filed <Badge tone="navy">states</Badge> from the catalog.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Rating clamps" subtitle="Premium floors & caps (priced forms)" icon={Calculator} />
          <div className="space-y-4 p-5">
            <NumberRow k="minimumPremium" label="Minimum premium" desc="Floor every rated premium. 0 = off." prefix="$" />
            <NumberRow k="maximumPremium" label="Maximum premium" desc="Cap every rated premium. 0 = off." prefix="$" />
            <NumberRow k="maxDiscountPct" label="Max discount" desc="Premium can't fall below base − this %. 0 = off." suffix="%" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Referral & decline thresholds" subtitle="Auto-route by size" icon={GitBranch} />
          <div className="space-y-4 p-5">
            <NumberRow k="referralPremiumAbove" label="Refer premium above" desc="Premium over this → underwriter referral. 0 = off." prefix="$" />
            <NumberRow k="declinePremiumAbove" label="Decline premium above" desc="Premium over this → auto-decline (blocks bind). 0 = off." prefix="$" />
            <NumberRow k="referralVehiclesAbove" label="Refer vehicles above" desc="Vehicle count over this → referral. 0 = off." />
          </div>
        </Card>

        <Card>
          <CardHeader title="Global field validations" subtitle="Applied to every form" icon={ListChecks} />
          <div className="space-y-2 p-5">
            <ToggleRow k="requireSignatureToBind" label="Require signature to bind" desc="A signature field must be completed before binding." />
            <ToggleRow k="effectiveDateNotPast" label="Effective date not in the past" desc="Warn when an effective date is before today." />
            <ToggleRow k="expirationAfterEffective" label="Expiration after effective" desc="Block when expiration is on/before the effective date." />
            <ToggleRow k="validateEmailPhone" label="Validate email & phone" desc="Check email/phone fields are well-formed across all forms." />
          </div>
        </Card>
      </div>
    </div>
  )
}

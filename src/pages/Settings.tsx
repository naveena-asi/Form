import { useState } from 'react'
import { Building2, Palette, ShieldAlert, RotateCcw, Save } from 'lucide-react'
import { Card, CardHeader, PageHeader, Button, Toggle, Badge, ConfirmDialog } from '@/components/ui'
import { useDesignerStore } from '@/store/useDesignerStore'
import { useFormStore } from '@/store/useFormStore'
import { usePolicyStore } from '@/store/usePolicyStore'
import { useGuardrailStore } from '@/store/useGuardrailStore'
import { toast } from '@/store/useToast'

export default function SettingsPage() {
  const resetAll = useDesignerStore((s) => s.resetAll)
  const resetAnswers = useFormStore((s) => s.reset)
  const resetPolicies = usePolicyStore((s) => s.resetPolicies)
  const resetGuardrails = useGuardrailStore((s) => s.resetGuardrails)
  const [confirmReset, setConfirmReset] = useState(false)

  const [org, setOrg] = useState('Quantana Insurance')
  const [currency, setCurrency] = useState('USD ($)')
  const [locale, setLocale] = useState('en-US')
  const [flags, setFlags] = useState({ audit: true, autosave: true, multiTenant: false, aiAssist: false })

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Settings"
        subtitle="Tenant configuration, branding and platform feature flags."
        actions={
          <Button variant="primary" icon={Save} onClick={() => toast('Settings saved')}>
            Save Changes
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Organization" subtitle="Tenant defaults" icon={Building2} />
          <div className="space-y-4 p-5">
            <div>
              <label className="label">Organization Name</label>
              <input className="input" value={org} onChange={(e) => setOrg(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Default Currency</label>
                <select className="select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {['USD ($)', 'AUD ($)', 'GBP (£)', 'EUR (€)'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Locale</label>
                <select className="select" value={locale} onChange={(e) => setLocale(e.target.value)}>
                  {['en-US', 'en-AU', 'en-GB'].map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Feature Flags" subtitle="Platform capabilities" icon={Palette} />
          <div className="space-y-2 p-5">
            {[
              { key: 'audit', label: 'Audit logging' },
              { key: 'autosave', label: 'Auto-save drafts' },
              { key: 'multiTenant', label: 'Multi-tenancy' },
              { key: 'aiAssist', label: 'AI form assist (preview)' },
            ].map((f) => (
              <div key={f.key} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                <span className="text-sm text-slate-600">{f.label}</span>
                <Toggle
                  checked={flags[f.key as keyof typeof flags]}
                  onChange={(v) => {
                    setFlags((s) => ({ ...s, [f.key]: v }))
                    toast(`${f.label} ${v ? 'enabled' : 'disabled'}`)
                  }}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2 border-red-200">
          <CardHeader title="Danger Zone" subtitle="Irreversible actions" icon={ShieldAlert} />
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <div className="text-sm font-medium text-slate-800">Reset platform data</div>
              <p className="text-xs text-slate-500">
                Restore the seeded Commercial Auto form, lookups and clear all runtime answers. <Badge tone="amber">demo</Badge>
              </p>
            </div>
            <Button variant="danger" icon={RotateCcw} onClick={() => setConfirmReset(true)}>
              Reset Everything
            </Button>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset platform data"
        message="This restores all forms, lookups, versions and answers to their seeded defaults. Your edits will be lost."
        confirmLabel="Reset"
        onConfirm={() => {
          resetAll()
          resetAnswers()
          resetPolicies()
          resetGuardrails()
          toast('Platform reset to defaults', 'info')
        }}
        onClose={() => setConfirmReset(false)}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DocumentViewerModal — previews a generated DocumentInstance for the customer.
// Embeds the rendered PDF (data URI) in an iframe when available, otherwise lays
// out the frozen dataSnapshot as a clean key/value view. Shows status, number and
// the delivery trail, offers a Download, and — for an unsigned, signature-bearing
// document — an inline e-Sign panel that records the signature + an esign delivery.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect } from 'react'
import { Download, FileText, PenLine, CheckCircle2, Send } from 'lucide-react'
import {
  DOCUMENT_TOKENS,
  type DocBlock,
  type DocumentInstance,
  type DocumentTemplate,
  type InstanceStatus,
} from '@/data/documents'
import { Badge, Button, Modal } from '@/components/ui'
import { SignatureField } from '@/components/runtime/SignatureField'
import { useDocumentStore } from '@/store/useDocumentStore'
import { useFormStore } from '@/store/useFormStore'
import { toast } from '@/store/useToast'

// ── Shared helpers (reused by the customer Documents card) ───────────────────
/** Does this template emit a signature block (including inside conditionals)? */
export function templateHasSignature(template: DocumentTemplate | undefined): boolean {
  if (!template) return false
  const walk = (blocks: DocBlock[]): boolean =>
    blocks.some((b) => b.kind === 'signature' || (b.kind === 'conditional' && walk(b.blocks)))
  return walk(template.blocks)
}

/** A live document still open for signing (not yet signed, not retired). */
export function isUnsigned(instance: DocumentInstance): boolean {
  return !instance.signedAt && instance.status !== 'Void' && instance.status !== 'Superseded'
}

/** Status → Badge tone for instance lifecycle states. */
export const INSTANCE_TONE: Record<InstanceStatus, 'blue' | 'green' | 'gray' | 'red' | 'amber'> = {
  Draft: 'amber',
  Issued: 'blue',
  Delivered: 'green',
  Superseded: 'gray',
  Void: 'red',
}

/** Trigger a browser download of an instance's rendered PDF data URI. */
export function downloadInstance(instance: DocumentInstance): void {
  if (!instance.url) {
    toast('No file available to download.', 'error')
    return
  }
  const a = document.createElement('a')
  a.href = instance.url
  a.download = `${instance.number}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
}

const TOKEN_LABEL: Record<string, string> = Object.fromEntries(
  DOCUMENT_TOKENS.map((t) => [t.token, t.label]),
)

const fmtDate = (iso: string): string => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const CHANNEL_LABEL: Record<string, string> = {
  portal: 'Customer Portal',
  email: 'Email',
  esign: 'e-Signature',
  print: 'Print / Mail',
}

export function DocumentViewerModal({
  instance,
  open,
  onClose,
  focusSign = false,
}: {
  instance: DocumentInstance
  open: boolean
  onClose: () => void
  focusSign?: boolean
}) {
  // Pull the live record so signing reflects immediately while the modal is open.
  const live = useDocumentStore((s) => s.instances.find((i) => i.id === instance.id)) ?? instance
  const template = useDocumentStore((s) => s.getTemplate(live.templateId))
  const signInstance = useDocumentStore((s) => s.signInstance)
  const recordDelivery = useDocumentStore((s) => s.recordDelivery)

  const signKey = `docsign:${live.id}`
  const setAnswer = useFormStore((s) => s.setAnswer)
  const signatureValue = useFormStore((s) => s.answers[signKey]) as string | undefined

  // Start every signing session with a clean field.
  useEffect(() => {
    if (open) setAnswer(signKey, '')
  }, [open, signKey, setAnswer])

  const canSign = isUnsigned(live) && templateHasSignature(template)
  const isPdf = typeof live.url === 'string' && live.url.startsWith('data:application/pdf')
  const recipient = String(live.dataSnapshot['party.name'] ?? live.dataSnapshot['insured.name'] ?? '')

  const handleSign = () => {
    const data = (signatureValue ?? '').trim()
    if (!data) {
      toast('Please type or draw your signature first.', 'error')
      return
    }
    signInstance(live.id, data)
    recordDelivery(live.id, {
      channel: 'esign',
      to: recipient || 'Insured',
      at: new Date().toISOString(),
      status: 'Signed',
    })
    setAnswer(signKey, '')
    toast('Document signed.', 'success')
  }

  const snapshotRows = Object.entries(live.dataSnapshot).filter(
    ([, v]) => v !== undefined && v !== null && String(v) !== '',
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <FileText className="h-4 w-4 text-navy-500" /> {live.number}
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="secondary" icon={Download} onClick={() => downloadInstance(live)}>
            Download
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <Badge tone={INSTANCE_TONE[live.status]}>{live.status}</Badge>
          <span>Version {live.version}</span>
          <span className="text-slate-300">·</span>
          <span>Generated {fmtDate(live.generatedAt)}</span>
          {live.signedAt && (
            <>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 text-brand-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Signed {fmtDate(live.signedAt)}
              </span>
            </>
          )}
        </div>

        {/* Preview */}
        {isPdf ? (
          <iframe
            title={`${live.number} preview`}
            src={live.url}
            className="h-[52vh] w-full rounded-lg border border-slate-200 bg-slate-50"
          />
        ) : (
          <div className="max-h-[52vh] overflow-auto rounded-lg border border-slate-200">
            <dl className="divide-y divide-slate-100 text-sm">
              {snapshotRows.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-slate-400">
                  No preview data available for this document.
                </div>
              ) : (
                snapshotRows.map(([key, value]) => (
                  <div key={key} className="grid grid-cols-[1fr_1.4fr] gap-3 px-4 py-2.5">
                    <dt className="text-slate-500">{TOKEN_LABEL[key] ?? key}</dt>
                    <dd className="font-medium text-slate-800">{String(value)}</dd>
                  </div>
                ))
              )}
            </dl>
          </div>
        )}

        {/* Deliveries */}
        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Delivery history
          </div>
          {live.deliveries.length === 0 ? (
            <p className="text-xs text-slate-400">Not yet delivered.</p>
          ) : (
            <ul className="space-y-1.5">
              {live.deliveries.map((d, i) => (
                <li
                  key={`${d.channel}-${d.at}-${i}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs"
                >
                  <span className="inline-flex items-center gap-2 text-slate-700">
                    <Send className="h-3.5 w-3.5 text-slate-400" />
                    {CHANNEL_LABEL[d.channel] ?? d.channel} · {d.to}
                  </span>
                  <span className="text-slate-400">
                    {d.status} · {fmtDate(d.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* e-Sign */}
        {canSign && (
          <div
            className={
              'rounded-xl border p-4 ' +
              (focusSign ? 'border-brand-300 bg-brand-50/40 ring-2 ring-brand-200' : 'border-slate-200 bg-slate-50/60')
            }
          >
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <PenLine className="h-4 w-4 text-brand-600" /> Sign this document
            </div>
            <p className="mb-3 text-xs text-slate-500">
              By signing below you acknowledge receipt and acceptance of this document on behalf of{' '}
              <span className="font-medium text-slate-700">{recipient || 'the insured'}</span>.
            </p>
            <SignatureField apiName={signKey} />
            <div className="mt-3 flex justify-end">
              <Button
                variant="primary"
                icon={CheckCircle2}
                disabled={!(signatureValue ?? '').trim()}
                onClick={handleSign}
              >
                Adopt &amp; Sign
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

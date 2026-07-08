// ─────────────────────────────────────────────────────────────────────────────
// VENUSPRO AI backend — Express proxy that turns a plain-English form description
// into a structured form spec using the Claude Messages API (structured outputs).
//
// Run with:  npm run server   (needs ANTHROPIC_API_KEY in the environment / .env)
// The Vite dev server proxies /api → http://localhost:8787 (see vite.config.ts).
// ─────────────────────────────────────────────────────────────────────────────
import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'

const PORT = process.env.PORT || 8787
const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

const hasKey = Boolean(process.env.ANTHROPIC_API_KEY)
const client = hasKey ? new Anthropic() : null

// Field types the designer can render — kept in sync with src/data/types.ts.
const FIELD_TYPES = [
  'text', 'number', 'decimal', 'currency', 'percentage', 'email', 'phone', 'url',
  'date', 'datetime', 'time', 'address', 'state', 'zip', 'select', 'radio', 'checkbox',
  'grid', 'file', 'signature', 'limit', 'deductible', 'coverage', 'classcode', 'premium',
]

// Non-recursive JSON schema for structured outputs. Every property is `required`
// (structured outputs is strict); optional values are returned as "" or [].
const FORM_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: { type: 'string', description: 'Form title' },
    description: { type: 'string' },
    product: { type: 'string', description: 'Insurance product / line of business' },
    type: {
      type: 'string',
      enum: ['Application', 'Supplemental', 'Quote', 'Endorsement', 'Cancellation', 'Claim', 'Renewal'],
    },
    basePremium: { type: 'number', description: 'Starting premium for the rating engine' },
    sections: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          columns: { type: 'integer', enum: [1, 2] },
          fields: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                label: { type: 'string' },
                type: { type: 'string', enum: FIELD_TYPES },
                required: { type: 'boolean' },
                helpText: { type: 'string' },
                options: {
                  type: 'array',
                  description: 'Choices for select/radio/coverage fields; empty otherwise',
                  items: { type: 'string' },
                },
              },
              required: ['label', 'type', 'required', 'helpText', 'options'],
            },
          },
        },
        required: ['name', 'description', 'columns', 'fields'],
      },
    },
  },
  required: ['name', 'description', 'product', 'type', 'basePremium', 'sections'],
}

const SYSTEM = `You are a senior insurance forms architect for VENUSPRO, a metadata-driven form platform.
Given a plain-English description, design a clean, realistic form:
- Break it into logical sections (e.g. Applicant, Business Details, Coverages, Review).
- Choose the most appropriate field type for each data point from the allowed list.
- Use select/radio/coverage with sensible "options" for choices; leave "options" empty otherwise.
- Use currency/limit/deductible/premium for money, date for dates, state/zip/address for locations, grid for collections (vehicles, drivers, locations).
- Mark genuinely required fields as required.
- Pick a reasonable basePremium for the rating engine (0 if not insurance-priced).
- Keep it focused: 3-6 sections, 3-8 fields each. Write concise helpText.`

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ai: hasKey })
})

app.post('/api/generate-form', async (req, res) => {
  const prompt = (req.body?.prompt || '').toString().trim()
  if (!prompt) return res.status(400).json({ error: 'missing_prompt' })
  if (!client) return res.status(503).json({ error: 'no_api_key' })

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: FORM_SCHEMA } },
      system: SYSTEM,
      messages: [{ role: 'user', content: `Design a form for: ${prompt}` }],
    })

    if (response.stop_reason === 'refusal') {
      return res.status(422).json({ error: 'refused' })
    }

    // Structured-output JSON arrives in the (last) text block.
    const textBlock = [...response.content].reverse().find((b) => b.type === 'text')
    if (!textBlock) return res.status(502).json({ error: 'no_output' })

    const form = JSON.parse(textBlock.text)
    res.json({ form, model: response.model })
  } catch (err) {
    console.error('generate-form error:', err?.message || err)
    res.status(500).json({ error: 'generation_failed', detail: String(err?.message || err) })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Documents API — mock endpoints (no persistence, no secrets). Mirrors the shape
// of src/data/documents.ts so the front-end and integrators can build against a
// stable contract. Added after the AI route; existing routes are untouched.
// ─────────────────────────────────────────────────────────────────────────────

// Per-type number prefix (mirrors DOC_TYPE_PREFIX in src/data/documents.ts).
const DOC_TYPE_PREFIX = {
  Declarations: 'DEC', PolicyJacket: 'JKT', FormsSchedule: 'FRM', Certificate: 'COI',
  AutoIDCard: 'IDC', EvidenceOfProperty: 'EOP', Binder: 'BND', Endorsement: 'END',
  CancellationNotice: 'CAN', NonRenewalNotice: 'NON', ReinstatementNotice: 'RST',
  Invoice: 'INV', Quote: 'QTE', RenewalOffer: 'REN', Notice: 'NOT', CoverLetter: 'LTR',
}

// Which document types each lifecycle event produces (mirrors defaultDocPackages).
const EVENT_PACKAGE = {
  bound: ['Declarations', 'PolicyJacket', 'FormsSchedule', 'Certificate', 'Invoice', 'CoverLetter'],
  endorsed: ['Endorsement', 'Declarations'],
  cancelled: ['CancellationNotice', 'Invoice'],
  renewed: ['RenewalOffer', 'Declarations'],
  nonRenewed: ['NonRenewalNotice'],
  reinstated: ['ReinstatementNotice'],
  claimOpened: ['Notice'],
}

const DELIVERY_CHANNELS = ['portal', 'email', 'esign', 'print']

const isoNow = () => new Date().toISOString()
const shortId = () => Math.random().toString(16).slice(2, 8)
const docNumber = (policyId, type, seq) =>
  `${policyId.toUpperCase()}-${DOC_TYPE_PREFIX[type] ?? 'DOC'}-${String(seq).padStart(4, '0')}`

function mockInstance(policyId, type, seq, status = 'Issued') {
  const id = `doc-${shortId()}`
  const at = isoNow()
  return {
    id,
    templateId: `tpl-${type.toLowerCase()}`,
    type,
    policyId,
    number: docNumber(policyId, type, seq),
    status,
    version: 1,
    generatedAt: at,
    issuedAt: status === 'Draft' ? undefined : at,
    url: `/documents/${id}.pdf`,
    deliveries: [],
  }
}

// POST /api/policies/:id/documents:generate  { event }
// Note: the literal ':generate' custom-method suffix collides with Express path
// params, so this route is matched with a RegExp (capture group = policy id).
app.post(/^\/api\/policies\/([^/]+)\/documents:generate$/, (req, res) => {
  const policyId = decodeURIComponent(req.params[0])
  const event = (req.body?.event ?? '').toString()
  const types = EVENT_PACKAGE[event]
  if (!types) {
    return res.status(400).json({ error: 'unknown_event', allowed: Object.keys(EVENT_PACKAGE) })
  }
  const generated = types.map((type, i) => mockInstance(policyId, type, i + 1))
  res.status(201).json({ policyId, event, generated })
})

// GET /api/policies/:id/documents
app.get('/api/policies/:id/documents', (req, res) => {
  const policyId = req.params.id
  const documents = [
    mockInstance(policyId, 'Declarations', 1, 'Delivered'),
    mockInstance(policyId, 'Invoice', 1, 'Issued'),
  ].map((d) => ({
    id: d.id,
    type: d.type,
    number: d.number,
    status: d.status,
    generatedAt: d.generatedAt,
  }))
  res.json({ policyId, documents })
})

// GET /api/documents/:id
app.get('/api/documents/:id', (req, res) => {
  const id = req.params.id
  const at = isoNow()
  res.json({
    id,
    templateId: 'tpl-declarations',
    type: 'Declarations',
    policyId: 'pol-100482',
    number: 'POL-CA-100482-DEC-0001',
    status: 'Delivered',
    version: 1,
    generatedAt: at,
    issuedAt: at,
    url: `/documents/${id}.pdf`,
    deliveries: [{ channel: 'email', to: 'insured@example.com', at, status: 'sent' }],
  })
})

// POST /api/documents/:id/deliver  { channel, to }
app.post('/api/documents/:id/deliver', (req, res) => {
  const id = req.params.id
  const channel = (req.body?.channel ?? 'portal').toString()
  const to = (req.body?.to ?? '').toString()
  if (!DELIVERY_CHANNELS.includes(channel)) {
    return res.status(400).json({ error: 'invalid_channel', allowed: DELIVERY_CHANNELS })
  }
  const delivery = { channel, to, at: isoNow(), status: 'sent' }
  res.json({ id, status: 'Delivered', delivery })
})

// POST /api/documents/:id/sign  { signatureData? }
app.post('/api/documents/:id/sign', (req, res) => {
  const id = req.params.id
  res.json({
    id,
    status: 'Delivered',
    signedAt: isoNow(),
    signatureCaptured: Boolean(req.body?.signatureData),
  })
})

app.listen(PORT, () => {
  console.log(`VENUSPRO AI backend on http://localhost:${PORT}  (ai ${hasKey ? 'enabled' : 'disabled — set ANTHROPIC_API_KEY'})`)
})

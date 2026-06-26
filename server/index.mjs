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

app.listen(PORT, () => {
  console.log(`VENUSPRO AI backend on http://localhost:${PORT}  (ai ${hasKey ? 'enabled' : 'disabled — set ANTHROPIC_API_KEY'})`)
})

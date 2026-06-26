// Output generators — JSON export is real; PDF/Excel/Word are represented via the
// browser print dialog / JSON payload for the prototype (blueprint §18).
import type { Answers, FormDefinition } from '@/data/types'

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function buildSubmission(form: FormDefinition, answers: Answers) {
  return {
    formId: form.id,
    formName: form.name,
    product: form.product,
    version: form.version,
    submittedAt: 'preview',
    answers,
  }
}

export function exportJson(form: FormDefinition, answers: Answers) {
  download(
    `${form.id}-submission.json`,
    JSON.stringify(buildSubmission(form, answers), null, 2),
    'application/json',
  )
}

export function exportCsv(form: FormDefinition, answers: Answers) {
  const flat = Object.entries(answers).filter(([, v]) => !Array.isArray(v))
  const rows = [['Field', 'Value'], ...flat.map(([k, v]) => [k, String(v ?? '')])]
  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  download(`${form.id}-answers.csv`, csv, 'text/csv')
}

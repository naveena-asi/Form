// ─────────────────────────────────────────────────────────────────────────────
// True client-side PDF generation (Phase 3 "PDF Mapping").
// Maps the form metadata + captured answers + rated result into a structured,
// paginated PDF using jsPDF — not a browser print.
// ─────────────────────────────────────────────────────────────────────────────
import { jsPDF } from 'jspdf'
import type { AnswerValue, Field, FormDefinition } from '@/data/types'
import type { RatingResult } from '@/engines/ratingEngine'

export interface PdfOptions {
  form: FormDefinition
  answers: Record<string, AnswerValue>
  rating: RatingResult
  formulaValues: Record<string, string | number>
  isHidden: (key: string) => boolean
}

const NAVY: [number, number, number] = [27, 42, 91]
const GREEN: [number, number, number] = [22, 163, 74]
const GRAY: [number, number, number] = [100, 116, 139]
const DARK: [number, number, number] = [17, 24, 39]

function formatValue(field: Field, value: AnswerValue, formula?: string | number): string {
  if (field.formula && formula !== undefined && formula !== '')
    return `${field.prefix ?? ''}${Number(formula).toLocaleString()}`
  if (value === undefined || value === null || value === '') return '—'
  if (field.type === 'signature')
    return String(value).startsWith('data:image') ? 'Signed (drawn)' : `Signed — ${value}`
  if (Array.isArray(value)) return `${value.length} row(s)`
  if (['currency', 'limit', 'deductible', 'premium'].includes(field.type))
    return `${field.prefix ?? '$'}${Number(value).toLocaleString()}`
  const opt = field.options?.find((o) => o.value === value)
  return opt ? opt.label : String(value)
}

export function generatePdf({ form, answers, rating, formulaValues, isHidden }: PdfOptions): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 40
  const contentW = pageW - margin * 2
  let y = 0

  const ensure = (h: number) => {
    if (y + h > pageH - 50) {
      doc.addPage()
      y = margin
    }
  }

  // ── Header band ──
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, pageW, 90, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(form.name, margin, 40)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(200, 210, 235)
  doc.text(`${form.product}  ·  v${form.version}  ·  ${form.status}`, margin, 60)
  doc.text(`Effective ${form.effectiveDate}`, margin, 75)

  // premium chip (right)
  doc.setTextColor(160, 245, 197)
  doc.setFontSize(9)
  doc.text('RATED PREMIUM', pageW - margin, 36, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(255, 255, 255)
  doc.text(`$${rating.premium.toLocaleString()}`, pageW - margin, 58, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(200, 210, 235)
  doc.text(`Tier ${rating.tier} · ${rating.eligibility}`, pageW - margin, 75, { align: 'right' })

  y = 120

  // ── Sections ──
  for (const section of form.sections) {
    if (isHidden(section.id)) continue
    const fields = section.fields.filter(
      (f) => !isHidden(f.apiName) && f.type !== 'divider' && f.type !== 'label',
    )
    if (fields.length === 0) continue

    ensure(40)
    // section heading
    doc.setFillColor(...GREEN)
    doc.rect(margin, y - 9, 4, 14, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...NAVY)
    doc.text(section.name, margin + 12, y + 2)
    y += 22

    doc.setFontSize(10)
    for (const field of fields) {
      if (field.type === 'grid' && field.grid) {
        const rows = Array.isArray(answers[field.apiName]) ? (answers[field.apiName] as Record<string, unknown>[]) : []
        ensure(28 + rows.length * 16)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...DARK)
        doc.text(`${field.label} (${rows.length})`, margin, y)
        y += 14
        // grid header
        const cols = field.grid.columns
        const colW = contentW / cols.length
        doc.setFontSize(8)
        doc.setTextColor(...GRAY)
        cols.forEach((c, i) => doc.text(c.label, margin + i * colW, y))
        y += 4
        doc.setDrawColor(226, 232, 240)
        doc.line(margin, y, margin + contentW, y)
        y += 12
        doc.setTextColor(...DARK)
        if (rows.length === 0) {
          doc.setTextColor(...GRAY)
          doc.text('— no rows —', margin, y)
          y += 14
        }
        rows.forEach((row) => {
          ensure(16)
          cols.forEach((c, i) => {
            const v = row[c.apiName]
            doc.text(String(v ?? '—').slice(0, 22), margin + i * colW, y)
          })
          y += 14
        })
        doc.setFontSize(10)
        y += 6
      } else {
        ensure(18)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...GRAY)
        doc.text(field.label, margin, y)
        doc.setTextColor(...DARK)
        doc.setFont('helvetica', 'bold')
        const val = formatValue(field, answers[field.apiName], formulaValues[field.apiName])
        const lines = doc.splitTextToSize(val, contentW / 2 - 10) as string[]
        doc.text(lines, margin + contentW / 2, y)
        y += Math.max(16, lines.length * 13)
      }
    }
    y += 8
  }

  // ── Rating summary ──
  if (rating.surcharges.length || rating.referrals.length || rating.messages.length) {
    ensure(40)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...NAVY)
    doc.text('Rating Detail', margin, y)
    y += 18
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK)
    rating.surcharges.forEach((s) => {
      ensure(14)
      doc.text(`• ${s.name}`, margin + 8, y)
      doc.text(s.effect, margin + contentW, y, { align: 'right' })
      y += 14
    })
    ;[...rating.referrals, ...rating.messages].forEach((m) => {
      ensure(14)
      const lines = doc.splitTextToSize(`• ${m}`, contentW - 8) as string[]
      doc.text(lines, margin + 8, y)
      y += lines.length * 13
    })
  }

  // ── Footers ──
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFontSize(8)
    doc.setTextColor(...GRAY)
    doc.text('Generated by VENUSPRO — Dynamic Form Platform', margin, pageH - 24)
    doc.text(`Page ${p} of ${pages}`, pageW - margin, pageH - 24, { align: 'right' })
  }

  return doc
}

export function exportPdf(opts: PdfOptions) {
  generatePdf(opts).save(`${opts.form.id}-submission.pdf`)
}

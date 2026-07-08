// ─────────────────────────────────────────────────────────────────────────────
// Document renderer — walks a DocumentTemplate (header band → body blocks →
// page footer) and paints a paginated jsPDF, reusing the navy/green palette and
// header-band / footer patterns from lib/pdf.ts. Every DocBlock kind is handled
// exhaustively; clause refs and conditional blocks are gated through the shared
// conditionEngine, and merge tokens/tables resolve through lib/mergeContext.
// ─────────────────────────────────────────────────────────────────────────────
import { jsPDF } from 'jspdf'
import {
  DOC_TYPE_LABEL,
  type DocBlock,
  type DocumentInstance,
  type DocumentTemplate,
  type MergeContext,
} from '@/data/documents'
import { evaluateGroup } from '@/engines/conditionEngine'
import { useDocumentStore } from '@/store/useDocumentStore'
import { resolveTable, resolveText, resolveToken } from '@/lib/mergeContext'

const NAVY: [number, number, number] = [27, 42, 91]
const GREEN: [number, number, number] = [22, 163, 74]
const GRAY: [number, number, number] = [100, 116, 139]
const DARK: [number, number, number] = [17, 24, 39]
const LINE: [number, number, number] = [226, 232, 240]

const HEADER_H = 76

/** Strip basic HTML to plain text, preserving paragraph/line breaks + entities. */
function htmlToText(html: string): string {
  return html
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/\s*(p|div|li|tr|h[1-6])\s*>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&middot;/gi, '·')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .trim()
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/** Resolve the display name for a signature party. */
function partyName(party: 'insured' | 'carrier' | 'agent', ctx: MergeContext): string {
  switch (party) {
    case 'insured':
      return resolveToken('insured.name', ctx)
    case 'carrier':
      return resolveToken('carrier.name', ctx)
    case 'agent':
      return ctx.party?.name ?? 'Authorized Agent'
    default: {
      const never: never = party
      return never
    }
  }
}

export function renderDocument(template: DocumentTemplate, ctx: MergeContext): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: template.page.size === 'A4' ? 'a4' : 'letter' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = template.page.margins
  const contentW = pageW - margin * 2
  const footerSpace = 44
  let y = 0

  const ensure = (h: number) => {
    if (y + h > pageH - footerSpace) {
      doc.addPage()
      y = margin
    }
  }

  // ── Header band (first page) ───────────────────────────────────────────────
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, pageW, HEADER_H, 'F')

  const carrierName = resolveToken('carrier.name', ctx) || template.name
  // logo placeholder box
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(margin, 18, 40, 40, 4, 4, 'F')
  doc.setTextColor(...NAVY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(initials(carrierName) || 'VP', margin + 20, 43, { align: 'center' })

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(carrierName, margin + 52, 38)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(200, 210, 235)
  doc.text(template.name, margin + 52, 56)

  // right meta: doc type label / number / policy
  doc.setTextColor(160, 245, 197)
  doc.setFontSize(9)
  doc.text(DOC_TYPE_LABEL[template.type].toUpperCase(), pageW - margin, 30, { align: 'right' })
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  const docNum = resolveToken('doc.number', ctx)
  if (docNum) doc.text(docNum, pageW - margin, 46, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(200, 210, 235)
  doc.text(`Policy ${ctx.policy.number}`, pageW - margin, 62, { align: 'right' })

  y = HEADER_H + 24

  // ── Block renderers ──────────────────────────────────────────────────────
  const renderHeading = (text: string, level: 1 | 2 | 3) => {
    const size = level === 1 ? 16 : level === 2 ? 13 : 11
    ensure(size + 14)
    doc.setFillColor(...GREEN)
    doc.rect(margin, y - size + 2, 4, size, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(size)
    doc.setTextColor(...NAVY)
    doc.text(resolveText(text, ctx), margin + 12, y)
    y += size + 8
  }

  const renderParagraph = (text: string, size = 10, color: [number, number, number] = DARK) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...color)
    const lineH = size + 3
    for (const block of text.split('\n')) {
      if (block === '') {
        y += lineH / 2
        continue
      }
      const lines = doc.splitTextToSize(block, contentW) as string[]
      for (const line of lines) {
        ensure(lineH)
        doc.text(line, margin, y)
        y += lineH
      }
    }
    y += 4
  }

  const renderKeyValue = (rows: { label: string; token: string }[], title?: string) => {
    if (title) renderHeading(title, 2)
    const labelX = margin
    const valueX = margin + contentW / 2
    doc.setFontSize(10)
    for (const row of rows) {
      const value = resolveToken(row.token, ctx)
      const lines = doc.splitTextToSize(value || '—', contentW / 2 - 10) as string[]
      ensure(Math.max(16, lines.length * 13))
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...GRAY)
      doc.text(row.label, labelX, y)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...DARK)
      doc.text(lines, valueX, y)
      y += Math.max(16, lines.length * 13)
    }
    y += 6
  }

  const renderTable = (
    cols: { key: string; label: string }[],
    rows: Record<string, string>[],
    title?: string,
  ) => {
    if (title) renderHeading(title, 2)
    if (cols.length === 0) return
    const colW = contentW / cols.length
    ensure(26)
    // header row
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...GRAY)
    cols.forEach((c, i) => doc.text(c.label.toUpperCase(), margin + i * colW, y))
    y += 5
    doc.setDrawColor(...LINE)
    doc.line(margin, y, margin + contentW, y)
    y += 12
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...DARK)
    if (rows.length === 0) {
      ensure(16)
      doc.setTextColor(...GRAY)
      doc.text('— no rows —', margin, y)
      y += 16
      doc.setTextColor(...DARK)
    }
    for (const row of rows) {
      ensure(16)
      cols.forEach((c, i) => {
        const v = row[c.key] ?? '—'
        const lines = doc.splitTextToSize(v, colW - 6) as string[]
        doc.text(lines[0] ?? '—', margin + i * colW, y)
      })
      y += 15
    }
    y += 8
  }

  const renderSignature = (party: 'insured' | 'carrier' | 'agent', label?: string) => {
    ensure(70)
    y += 12
    const boxW = contentW / 2
    const sig = ctx.answers['signatureData']
    if (party !== 'agent' && typeof sig === 'string' && sig.startsWith('data:image')) {
      try {
        doc.addImage(sig, 'PNG', margin, y - 28, 120, 34)
      } catch {
        /* ignore malformed signature image */
      }
    }
    doc.setDrawColor(...DARK)
    doc.line(margin, y + 10, margin + boxW - 20, y + 10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...GRAY)
    doc.text(label ?? 'Signature', margin, y + 24)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK)
    doc.text(partyName(party, ctx), margin, y + 36)
    y += 48
  }

  const renderImage = (src: 'carrierLogo' | 'url', url?: string, alt?: string) => {
    ensure(60)
    doc.setDrawColor(...LINE)
    doc.roundedRect(margin, y, 120, 48, 4, 4, 'S')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...GRAY)
    const caption =
      src === 'carrierLogo'
        ? resolveText(alt ?? '{{carrier.name}}', ctx)
        : resolveText(alt ?? url ?? 'Image', ctx)
    doc.text(doc.splitTextToSize(caption, 108) as string[], margin + 8, y + 20)
    y += 60
  }

  const renderClause = (clauseId: string) => {
    const clause = useDocumentStore.getState().getClause(clauseId)
    if (!clause) return
    // jurisdiction gate (when an explicit state answer is present)
    const state = ctx.answers['state']
    if (clause.jurisdiction && typeof state === 'string' && !clause.jurisdiction.includes(state)) {
      return
    }
    if (clause.when && !evaluateGroup(clause.when, ctx.answers)) return
    renderHeading(clause.name, 3)
    renderParagraph(resolveText(htmlToText(clause.html), ctx))
  }

  const renderBlock = (block: DocBlock): void => {
    switch (block.kind) {
      case 'heading':
        renderHeading(block.text, block.level)
        break
      case 'richtext':
        renderParagraph(resolveText(htmlToText(block.html), ctx))
        break
      case 'merge': {
        const value = resolveToken(block.token, ctx)
        if (block.label) {
          renderKeyValue([{ label: block.label, token: block.token }])
        } else {
          renderParagraph(value)
        }
        break
      }
      case 'keyValue':
        renderKeyValue(block.rows, block.title)
        break
      case 'table': {
        const resolved = resolveTable(block.source, ctx)
        const cols = block.columns.length ? block.columns : resolved.cols
        renderTable(cols, resolved.rows, block.title)
        break
      }
      case 'clauseRef':
        renderClause(block.clauseId)
        break
      case 'signature':
        renderSignature(block.party, block.label)
        break
      case 'image':
        renderImage(block.src, block.url, block.alt)
        break
      case 'pageBreak':
        doc.addPage()
        y = margin
        break
      case 'conditional':
        if (evaluateGroup(block.when, ctx.answers)) {
          for (const nested of block.blocks) renderBlock(nested)
        }
        break
      default: {
        const never: never = block
        return never
      }
    }
  }

  for (const block of template.blocks) renderBlock(block)

  // ── Footer on every page ───────────────────────────────────────────────────
  const footerText = (template.page.footer ?? [])
    .map((b) => {
      if (b.kind === 'richtext') return htmlToText(b.html)
      if (b.kind === 'merge') return resolveToken(b.token, ctx)
      if (b.kind === 'heading') return b.text
      return ''
    })
    .map((t) => resolveText(t, ctx))
    .filter(Boolean)
    .join('  ·  ')

  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    if (template.page.watermark) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(64)
      doc.setTextColor(241, 245, 249)
      doc.text(template.page.watermark, pageW / 2, pageH / 2, { align: 'center', angle: 30 })
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...GRAY)
    const note = footerText || `${resolveToken('carrier.name', ctx)} · Policy ${ctx.policy.number}`
    doc.text((doc.splitTextToSize(note, contentW - 80) as string[])[0] ?? note, margin, pageH - 24)
    doc.text(`Page ${p} of ${pages}`, pageW - margin, pageH - 24, { align: 'right' })
  }

  return doc
}

/** Render a template+context and return a data URI (for instance.url / preview). */
export function renderToDataUrl(template: DocumentTemplate, ctx: MergeContext): string {
  return renderDocument(template, ctx).output('datauristring')
}

/** Render and trigger a browser download named by the instance number. */
export function downloadDocument(
  instance: DocumentInstance,
  template: DocumentTemplate,
  ctx: MergeContext,
): void {
  // surface the instance number + any captured signature into the merge context
  const renderCtx: MergeContext = {
    ...ctx,
    answers: {
      ...ctx.answers,
      'doc.number': instance.number,
      ...(instance.signatureData ? { signatureData: instance.signatureData } : {}),
    },
  }
  renderDocument(template, renderCtx).save(`${instance.number}.pdf`)
}

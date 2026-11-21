/**
 * Lightweight, zero-dependency valid PDF 1.4 generator for printable reports
 * Supports single and multi-page documents with headers, tables, KPI blocks, and signatures.
 */

export interface SimplePdfDocument {
  title: string
  subtitle?: string
  meta?: Array<{ label: string; value: string }>
  kpi?: Array<{ label: string; value: string; color?: 'default' | 'income' | 'expense' }>
  headers: string[]
  colWidths?: number[] // Percentage or relative widths
  rows: string[][]
  footer?: string
  signatures?: Array<{ title: string; name: string }>
}

function escapePdf(str: string): string {
  if (!str) return ''
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, ' ')
}

export function createSimplePdf(doc: SimplePdfDocument): Uint8Array {
  const PAGE_WIDTH = 595 // A4 width pt
  const PAGE_HEIGHT = 842 // A4 height pt
  const MARGIN_X = 40
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2 // 515 pt

  // We will divide rows across multiple pages
  // Page 1 has header, meta, and KPI, so it has less vertical space for rows (~22 rows)
  // Subsequent pages have mini-header and more space (~38 rows)
  const FIRST_PAGE_ROWS = 20
  const SUBSEQUENT_PAGE_ROWS = 36

  const pagesData: string[][][] = []
  if (doc.rows.length === 0) {
    pagesData.push([])
  } else {
    let remaining = [...doc.rows]
    pagesData.push(remaining.slice(0, FIRST_PAGE_ROWS))
    remaining = remaining.slice(FIRST_PAGE_ROWS)

    while (remaining.length > 0) {
      pagesData.push(remaining.slice(0, SUBSEQUENT_PAGE_ROWS))
      remaining = remaining.slice(SUBSEQUENT_PAGE_ROWS)
    }
  }

  const totalPages = pagesData.length
  const pageStreamContents: string[] = []

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const pageNum = pageIdx + 1
    const pageRows = pagesData[pageIdx]
    const lines: string[] = []

    let y = PAGE_HEIGHT - 45

    if (pageIdx === 0) {
      // --- First Page Header ---
      // Brand Title
      lines.push(`BT /F2 14 Tf ${MARGIN_X} ${y} Td (${escapePdf(doc.title)}) Tj ET`)
      y -= 16

      if (doc.subtitle) {
        lines.push(`BT /F1 9 Tf ${MARGIN_X} ${y} Td (${escapePdf(doc.subtitle)}) Tj ET`)
        y -= 14
      }

      // Meta info (date printed, period, etc.)
      if (doc.meta && doc.meta.length > 0) {
        const metaStr = doc.meta.map((m) => `${m.label}: ${m.value}`).join('   |   ')
        lines.push(`BT /F1 8 Tf ${MARGIN_X} ${y} Td (${escapePdf(metaStr)}) Tj ET`)
        y -= 12
      }

      // Separator line
      y -= 4
      lines.push(`${MARGIN_X} ${y} m ${MARGIN_X + CONTENT_WIDTH} ${y} l S`)
      y -= 14

      // --- KPI Block (if present) ---
      if (doc.kpi && doc.kpi.length > 0) {
        const kpiCount = doc.kpi.length
        const kpiBoxWidth = (CONTENT_WIDTH - (kpiCount - 1) * 8) / kpiCount
        const kpiHeight = 36

        for (let i = 0; i < kpiCount; i++) {
          const kpi = doc.kpi[i]
          const kpiX = MARGIN_X + i * (kpiBoxWidth + 8)

          // Background box
          lines.push(`0.96 0.97 0.98 rg`)
          lines.push(`${kpiX} ${y - kpiHeight} ${kpiBoxWidth} ${kpiHeight} re f`)
          lines.push(`0.85 0.85 0.85 RG 0.5 w`)
          lines.push(`${kpiX} ${y - kpiHeight} ${kpiBoxWidth} ${kpiHeight} re S`)

          // Label
          lines.push(`0 0 0 rg`)
          lines.push(`BT /F1 7 Tf ${kpiX + 6} ${y - 12} Td (${escapePdf(kpi.label.toUpperCase())}) Tj ET`)

          // Value
          lines.push(`BT /F2 10 Tf ${kpiX + 6} ${y - 28} Td (${escapePdf(kpi.value)}) Tj ET`)
        }

        y -= kpiHeight + 16
      }
    } else {
      // --- Subsequent Pages Mini Header ---
      lines.push(`BT /F2 10 Tf ${MARGIN_X} ${y} Td (${escapePdf(doc.title)} (Lanjutan)) Tj ET`)
      y -= 12
      if (doc.subtitle) {
        lines.push(`BT /F1 8 Tf ${MARGIN_X} ${y} Td (${escapePdf(doc.subtitle)}) Tj ET`)
        y -= 10
      }
      lines.push(`${MARGIN_X} ${y} m ${MARGIN_X + CONTENT_WIDTH} ${y} l S`)
      y -= 14
    }

    // --- Table Headers ---
    // Table header background
    lines.push(`0.92 0.95 0.95 rg`)
    lines.push(`${MARGIN_X} ${y - 14} ${CONTENT_WIDTH} 18 re f`)
    lines.push(`0.8 0.85 0.85 RG 0.5 w`)
    lines.push(`${MARGIN_X} ${y - 14} ${CONTENT_WIDTH} 18 re S`)

    // Header text
    lines.push(`0 0 0 rg`)
    lines.push(`BT /F2 8 Tf ${MARGIN_X + 4} ${y - 10} Td (${escapePdf(doc.headers.join('   |   '))}) Tj ET`)
    y -= 22

    // --- Table Rows ---
    for (let rIdx = 0; rIdx < pageRows.length; rIdx++) {
      const row = pageRows[rIdx]
      // Row text
      lines.push(`BT /F1 7.5 Tf ${MARGIN_X + 4} ${y - 9} Td (${escapePdf(row.join('   |   '))}) Tj ET`)

      // Bottom border for each row
      lines.push(`0.92 0.92 0.92 RG 0.3 w`)
      lines.push(`${MARGIN_X} ${y - 12} m ${MARGIN_X + CONTENT_WIDTH} ${y - 12} l S`)
      y -= 14
    }

    if (pageRows.length === 0) {
      lines.push(`BT /F1 8 Tf ${MARGIN_X + 160} ${y - 14} Td ((Belum ada transaksi pada periode ini)) Tj ET`)
      y -= 24
    }

    // --- Signatures block on last page ---
    if (pageIdx === totalPages - 1 && doc.signatures && doc.signatures.length > 0) {
      if (y > 110) {
        y -= 20
        const sigCount = doc.signatures.length
        const sigWidth = CONTENT_WIDTH / sigCount

        for (let s = 0; s < sigCount; s++) {
          const sig = doc.signatures[s]
          const sigX = MARGIN_X + s * sigWidth + 20

          lines.push(`BT /F1 8 Tf ${sigX} ${y} Td (${escapePdf(sig.title)}) Tj ET`)
          lines.push(`BT /F2 8 Tf ${sigX} ${y - 45} Td (${escapePdf(sig.name)}) Tj ET`)
          lines.push(`0.5 0.5 0.5 RG 0.5 w`)
          lines.push(`${sigX} ${y - 48} m ${sigX + 120} ${y - 48} l S`)
        }
      }
    }

    // --- Footer with Page Number ---
    const footerY = 32
    lines.push(`0.8 0.8 0.8 RG 0.5 w`)
    lines.push(`${MARGIN_X} ${footerY + 12} m ${MARGIN_X + CONTENT_WIDTH} ${footerY + 12} l S`)

    const footerText = doc.footer || `Dokumen resmi pembukuan kas SiWarga RT 04 • ${new Date().toLocaleDateString('id-ID')}`
    lines.push(`0.3 0.3 0.3 rg`)
    lines.push(`BT /F1 7.5 Tf ${MARGIN_X} ${footerY} Td (${escapePdf(footerText)}) Tj ET`)

    const pageNumText = `Halaman ${pageNum} dari ${totalPages}`
    lines.push(`BT /F1 7.5 Tf ${MARGIN_X + CONTENT_WIDTH - 65} ${footerY} Td (${escapePdf(pageNumText)}) Tj ET`)

    pageStreamContents.push(lines.join('\n'))
  }

  // --- Compile PDF 1.4 Object Structure ---
  const objects: string[] = []

  // Obj 1: Catalog
  objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`)

  // Obj 2: Pages container
  const pageObjIds: number[] = []
  for (let i = 0; i < totalPages; i++) {
    pageObjIds.push(3 + i * 2) // Page objects: 3, 5, 7, ...
  }

  const kidsStr = pageObjIds.map((id) => `${id} 0 R`).join(' ')
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${totalPages} >>\nendobj`)

  // Next are page objects and their content stream objects
  const fontObjId1 = 3 + totalPages * 2
  const fontObjId2 = fontObjId1 + 1

  for (let i = 0; i < totalPages; i++) {
    const pageId = 3 + i * 2
    const contentId = pageId + 1
    const contentStream = pageStreamContents[i]
    const streamLength = Buffer.byteLength(contentStream, 'utf-8')

    // Page Object
    objects.push(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontObjId1} 0 R /F2 ${fontObjId2} 0 R >> >> >>\nendobj`
    )

    // Contents Stream Object
    objects.push(
      `${contentId} 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj`
    )
  }

  // Fonts
  objects.push(
    `${fontObjId1} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`
  )
  objects.push(
    `${fontObjId2} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj`
  )

  // Build XREF table
  let pdf = `%PDF-1.4\n`
  const offsets: number[] = [0]

  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdf.length)
    pdf += objects[i] + `\n`
  }

  const startxref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += `0000000000 65535 f \n`
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`

  return new TextEncoder().encode(pdf)
}

/**
 * Lightweight, zero-dependency valid PDF 1.4 generator for printable reports
 */

export interface SimplePdfDocument {
  title: string
  subtitle?: string
  headers: string[]
  rows: string[][]
  footer?: string
}

export function createSimplePdf(doc: SimplePdfDocument): Uint8Array {
  // Build PDF text stream
  const lines: string[] = []

  // Header Title
  lines.push(`BT`)
  lines.push(`/F1 16 Tf`)
  lines.push(`50 780 Td`)
  lines.push(`(${escapePdf(doc.title)}) Tj`)
  lines.push(`ET`)

  if (doc.subtitle) {
    lines.push(`BT`)
    lines.push(`/F1 10 Tf`)
    lines.push(`50 760 Td`)
    lines.push(`(${escapePdf(doc.subtitle)}) Tj`)
    lines.push(`ET`)
  }

  // Draw separator line
  lines.push(`50 745 m 550 745 l S`)

  // Table Headers
  let y = 730
  lines.push(`BT`)
  lines.push(`/F2 9 Tf`)
  lines.push(`50 ${y} Td`)
  lines.push(`(${escapePdf(doc.headers.join('   |   '))}) Tj`)
  lines.push(`ET`)

  // Header bottom line
  y -= 8
  lines.push(`50 ${y} m 550 ${y} l S`)

  // Table Rows (up to ~35 rows per page for simple reports)
  y -= 14
  for (const row of doc.rows.slice(0, 40)) {
    lines.push(`BT`)
    lines.push(`/F1 8 Tf`)
    lines.push(`50 ${y} Td`)
    lines.push(`(${escapePdf(row.join('   |   '))}) Tj`)
    lines.push(`ET`)
    y -= 14
    if (y < 60) break
  }

  // Footer
  if (doc.footer) {
    lines.push(`50 45 m 550 45 l S`)
    lines.push(`BT`)
    lines.push(`/F1 8 Tf`)
    lines.push(`50 32 Td`)
    lines.push(`(${escapePdf(doc.footer)}) Tj`)
    lines.push(`ET`)
  }

  const streamContent = lines.join('\n')
  const streamLength = Buffer.byteLength(streamContent, 'utf-8')

  const objects: string[] = []

  // Obj 1: Catalog
  objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`)

  // Obj 2: Pages
  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj`
  )

  // Obj 3: Page (A4: 595 x 842 pt)
  objects.push(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj`
  )

  // Obj 4: Contents Stream
  objects.push(
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj`
  )

  // Obj 5: Font Helvetica
  objects.push(
    `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`
  )

  // Obj 6: Font Helvetica-Bold
  objects.push(
    `6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj`
  )

  // Build xref
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

function escapePdf(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, ' ')
}

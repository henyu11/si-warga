import { NextResponse } from 'next/server'
import {
  generateBillsCSV,
  generateCashCSV,
  generateBillsPDF,
  generateCashPDF,
} from '@/server/services/report.service'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'bills'
  const format = (searchParams.get('format') || 'csv').toLowerCase()
  const month = searchParams.get('month') ? Number(searchParams.get('month')) : new Date().getMonth() + 1
  const year = searchParams.get('year') ? Number(searchParams.get('year')) : new Date().getFullYear()

  try {
    if (format === 'pdf') {
      let pdfBytes: Uint8Array
      let filename = `laporan-${type}-${year}-${String(month).padStart(2, '0')}.pdf`

      if (type === 'kas_umum') {
        pdfBytes = await generateCashPDF('KAS_UMUM', month, year)
      } else if (type === 'kas_keamanan') {
        pdfBytes = await generateCashPDF('KAS_KEAMANAN', month, year)
      } else {
        pdfBytes = await generateBillsPDF(month, year)
      }

      return new NextResponse(pdfBytes as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    // Default to CSV
    let csvString = ''
    let filename = `laporan-${type}-${year}-${String(month).padStart(2, '0')}.csv`

    if (type === 'kas_umum') {
      csvString = await generateCashCSV('KAS_UMUM', month, year)
    } else if (type === 'kas_keamanan') {
      csvString = await generateCashCSV('KAS_KEAMANAN', month, year)
    } else {
      csvString = await generateBillsCSV(month, year)
    }

    return new NextResponse(csvString, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal mengekspor laporan' },
      { status: 500 }
    )
  }
}

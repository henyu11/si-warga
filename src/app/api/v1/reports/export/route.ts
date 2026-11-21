export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import {
  generateBillsCSV,
  generateCashCSV,
  generateBillsPDF,
  generateCashPDF,
  generateCashXLSX,
} from '@/server/services/report.service'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'bills'
  const format = (searchParams.get('format') || 'csv').toLowerCase()
  const month = searchParams.get('month') ? Number(searchParams.get('month')) : new Date().getMonth() + 1
  const year = searchParams.get('year') ? Number(searchParams.get('year')) : new Date().getFullYear()

  try {
    const isKasUmum = type === 'kas_umum'
    const isKasKeamanan = type === 'kas_keamanan'
    const bookType = isKasUmum ? 'KAS_UMUM' : isKasKeamanan ? 'KAS_KEAMANAN' : null

    // 1. Format: Excel (.xlsx)
    if (format === 'xlsx') {
      if (!bookType) {
        return NextResponse.json(
          { success: false, message: 'Format Excel saat ini tersedia untuk Buku Kas (kas_umum atau kas_keamanan)' },
          { status: 400 }
        )
      }

      const xlsxBytes = await generateCashXLSX(bookType, month, year)
      const filename = `buku-${type}-${year}-${String(month).padStart(2, '0')}.xlsx`

      return new NextResponse(xlsxBytes as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    // 2. Format: PDF
    if (format === 'pdf') {
      let pdfBytes: Uint8Array
      const filename = `laporan-${type}-${year}-${String(month).padStart(2, '0')}.pdf`

      if (bookType) {
        pdfBytes = await generateCashPDF(bookType, month, year)
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

    // 3. Format: CSV (Default)
    let csvString = ''
    const filename = `laporan-${type}-${year}-${String(month).padStart(2, '0')}.csv`

    if (bookType) {
      csvString = await generateCashCSV(bookType, month, year)
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
    console.error('Export report error:', err)
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal mengekspor laporan' },
      { status: 500 }
    )
  }
}

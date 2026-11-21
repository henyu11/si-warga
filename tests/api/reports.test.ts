import { describe, it, expect } from 'vitest'
import { GET } from '@/app/api/v1/reports/export/route'

describe('Report Export API (F-010)', () => {
  it('export bills CSV contains header row and household data', async () => {
    const req = new Request('http://localhost:3000/api/v1/reports/export?type=bills&month=11&year=2026&format=csv')
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/csv')
    expect(res.headers.get('content-disposition')).toContain('attachment; filename=')

    const text = await res.text()
    expect(text).toContain('Nama KK')
    expect(text).toContain('Blok')
    expect(text).toContain('Status')
  })

  it('export cash CSV contains header row and transaction lines', async () => {
    const req = new Request('http://localhost:3000/api/v1/reports/export?type=kas_umum&month=11&year=2026&format=csv')
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/csv')

    const text = await res.text()
    expect(text).toContain('Tanggal')
    expect(text).toContain('Jenis')
    expect(text).toContain('Nominal')
  })

  it('export bills PDF returns valid PDF binary buffer', async () => {
    const req = new Request('http://localhost:3000/api/v1/reports/export?type=bills&month=11&year=2026&format=pdf')
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/pdf')

    const buf = await res.arrayBuffer()
    const headerStr = new TextDecoder().decode(new Uint8Array(buf.slice(0, 8)))
    expect(headerStr).toContain('%PDF-')
  })
})

import PDFDocument from 'pdfkit'
import { createWriteStream } from 'fs'
import type { TestReport } from '@shared/types'

// Test raporunu PDF olarak dışa aktarır (prompt 128).
export function exportPdf(report: TestReport, filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const stream = createWriteStream(filePath)
    doc.pipe(stream)

    doc.fontSize(18).text('Cihaz Test Raporu', { align: 'center' })
    doc.moveDown()
    doc.fontSize(11).text(`Cihaz: ${report.deviceSerial}`)
    doc.text(`Tarih: ${new Date(report.createdAt).toLocaleString('tr-TR')}`)
    doc.text(`Sonuç: ${report.passed}/${report.total} başarılı, ${report.failed} başarısız`)
    doc.moveDown()

    for (const r of report.results) {
      const icon = r.status === 'pass' ? '+' : r.status === 'fail' ? '-' : '!'
      doc.fontSize(10).text(`${icon} ${r.name} — ${r.status} (${r.durationMs}ms)`)
      if (r.detail) doc.fontSize(8).text(`   ${r.detail}`)
      if (r.output) doc.fontSize(7).text(`   ${r.output.split('\n').slice(0, 4).join(' | ')}`)
      doc.moveDown(0.4)
    }

    doc.end()
    stream.on('finish', () => resolve(filePath))
    stream.on('error', reject)
  })
}

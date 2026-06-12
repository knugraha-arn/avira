import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { formatDate, formatTimestamp } from '@/lib/utils'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { Document, Page, View, Text } from '@react-pdf/renderer'
import {
  shared, BRAND,
  PdfPageHeader, PdfPageFooter,
  ClassBadge,
} from '@/lib/pdf/template'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('avr_user_profiles').select('full_name').eq('id', user.id).single()

  const { data: risks } = await supabase
    .from('avr_risks')
    .select(`
      risk_code, title, category, status,
      likelihood, impact, inherent_score, inherent_classification,
      residual_score, residual_classification,
      treatment_strategy, treatment_notes, existing_control,
      next_review_date,
      risk_owner:avr_user_profiles!avr_risks_risk_owner_id_fkey(full_name),
      unit_kerja:avr_unit_kerja(nama)
    `)
    .in('inherent_classification', ['High', 'Extreme'])
    .neq('status', 'Closed')
    .order('inherent_score', { ascending: false })

  const now = formatTimestamp(new Date())
  const riskList = risks ?? []
  const extremeCount = riskList.filter(r => r.inherent_classification === 'Extreme').length

  const colW = { code: '9%', title: '30%', inherent: '11%', residual: '11%', treatment: '22%', owner: '12%', review: '5%' }

  const doc = (
    <Document title="High & Extreme Risk Report" author={profile?.full_name ?? 'AVIRA'}>
      <Page size="A4" orientation="landscape" style={shared.page}>
        <PdfPageHeader />
        <PdfPageFooter />

        <View style={[shared.reportHeaderBox, { borderBottomColor: BRAND.red }]}>
          <View>
            <Text style={shared.reportTitle}>High &amp; Extreme Risk Report</Text>
            <Text style={shared.reportMeta}>Digenerate: {now} · Oleh: {profile?.full_name ?? '—'}</Text>
          </View>
          <Text style={[shared.complianceBadge, { backgroundColor: '#FFCCCC', color: BRAND.red }]}>
            ISO 27001 Kl. 8.2
          </Text>
        </View>

        {/* Alert box */}
        <View style={shared.alertBox}>
          <Text style={shared.alertText}>
            ⚠  Laporan ini berisi {riskList.length} risiko dengan klasifikasi High dan Extreme.
            {extremeCount > 0 ? `  Terdapat ${extremeCount} risiko Extreme yang harus dibahas di Management Review Meeting.` : ''}
          </Text>
        </View>

        {/* Tabel */}
        <View style={shared.table}>
          <View style={shared.tableHeader}>
            <Text style={[shared.tableHeaderCell, { width: colW.code }]}>Kode</Text>
            <Text style={[shared.tableHeaderCell, { width: colW.title }]}>Judul Risiko</Text>
            <Text style={[shared.tableHeaderCell, { width: colW.inherent, textAlign: 'center' }]}>Inherent</Text>
            <Text style={[shared.tableHeaderCell, { width: colW.residual, textAlign: 'center' }]}>Residual</Text>
            <Text style={[shared.tableHeaderCell, { width: colW.treatment }]}>Treatment</Text>
            <Text style={[shared.tableHeaderCell, { width: colW.owner }]}>Risk Owner</Text>
            <Text style={[shared.tableHeaderCell, { width: colW.review }]}>Review</Text>
          </View>

          {riskList.length === 0 ? (
            <View style={[shared.tableRow, { justifyContent: 'center' }]}>
              <Text style={{ fontSize: 8, color: BRAND.muted }}>Tidak ada risiko High/Extreme</Text>
            </View>
          ) : riskList.map((r, i) => (
            <View key={r.risk_code} style={[shared.tableRow, i % 2 === 1 ? shared.tableRowAlt : {}]} wrap={false}>
              <Text style={[shared.monoText, { width: colW.code }]}>{r.risk_code}</Text>
              <View style={{ width: colW.title }}>
                <Text style={[shared.tableCell, { fontFamily: 'Helvetica-Bold' }]}>{r.title}</Text>
                <Text style={shared.tableCellMuted}>{r.category} · {(r as any).unit_kerja?.nama ?? '—'}</Text>
                {r.existing_control && (
                  <Text style={[shared.tableCellMuted, { marginTop: 2 }]}>Kontrol: {r.existing_control}</Text>
                )}
              </View>
              <View style={{ width: colW.inherent, alignItems: 'center' }}>
                <ClassBadge value={r.inherent_classification} />
                <Text style={[shared.tableCellMuted, { marginTop: 2 }]}>{r.inherent_score} (L{r.likelihood}×I{r.impact})</Text>
              </View>
              <View style={{ width: colW.residual, alignItems: 'center' }}>
                {r.residual_classification
                  ? <ClassBadge value={r.residual_classification} />
                  : <Text style={{ fontSize: 8, color: BRAND.muted }}>—</Text>}
                {r.residual_score > 0 && (
                  <Text style={[shared.tableCellMuted, { marginTop: 2 }]}>{r.residual_score}</Text>
                )}
              </View>
              <View style={{ width: colW.treatment }}>
                <Text style={shared.tableCell}>{r.treatment_strategy ?? '—'}</Text>
                {r.treatment_notes && (
                  <Text style={shared.tableCellMuted}>{r.treatment_notes}</Text>
                )}
              </View>
              <Text style={[shared.tableCell, { width: colW.owner }]}>{(r as any).risk_owner?.full_name ?? '—'}</Text>
              <Text style={[shared.tableCell, {
                width: colW.review,
                color: new Date(r.next_review_date ?? '').getTime() < Date.now() ? BRAND.red : BRAND.muted,
              }]}>
                {formatDate(r.next_review_date)}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )

  const pdfBuffer = await renderToBuffer(doc)
  const buffer = new Uint8Array(pdfBuffer)
  const filename = `AVIRA_HighExtremeRisk_${new Date().toISOString().slice(0, 10)}.pdf`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

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

  const { data: overdue } = await supabase
    .from('avr_v_overdue_mitigations')
    .select('*')
    .order('days_overdue', { ascending: false })

  const now = formatTimestamp(new Date())
  const overdueList = overdue ?? []

  const colW = { code: '8%', title: '24%', cls: '10%', owner: '13%', target: '9%', late: '8%', progress: '12%', notes: '16%' }

  const doc = (
    <Document title="Overdue Mitigation Report" author={profile?.full_name ?? 'AVIRA'}>
      <Page size="A4" orientation="landscape" style={shared.page}>
        <PdfPageHeader />
        <PdfPageFooter />

        <View style={[shared.reportHeaderBox, { borderBottomColor: BRAND.amber }]}>
          <View>
            <Text style={shared.reportTitle}>Overdue Mitigation Report</Text>
            <Text style={shared.reportMeta}>Digenerate: {now} · Oleh: {profile?.full_name ?? '—'}</Text>
          </View>
          <Text style={[shared.complianceBadge, { backgroundColor: '#FFF0C2', color: '#7A4C00' }]}>
            ISO 27001 Kl. 9.1
          </Text>
        </View>

        {/* Alert */}
        <View style={[shared.alertBox, { backgroundColor: '#FFFBF0', borderColor: '#FFE0A0' }]}>
          <Text style={[shared.alertText, { color: '#7A4C00' }]}>
            ⚠  Terdapat {overdueList.length} mitigasi terlambat per {now}.
            Mitigasi yang terlambat menunjukkan lemahnya pelaksanaan risk treatment dan perlu segera ditindaklanjuti.
          </Text>
        </View>

        {/* Tabel */}
        <View style={shared.table}>
          <View style={shared.tableHeader}>
            <Text style={[shared.tableHeaderCell, { width: colW.code }]}>Kode</Text>
            <Text style={[shared.tableHeaderCell, { width: colW.title }]}>Judul Risiko</Text>
            <Text style={[shared.tableHeaderCell, { width: colW.cls }]}>Klasifikasi</Text>
            <Text style={[shared.tableHeaderCell, { width: colW.owner }]}>Risk Owner</Text>
            <Text style={[shared.tableHeaderCell, { width: colW.target }]}>Target Selesai</Text>
            <Text style={[shared.tableHeaderCell, { width: colW.late }]}>Terlambat</Text>
            <Text style={[shared.tableHeaderCell, { width: colW.progress }]}>Progress</Text>
            <Text style={[shared.tableHeaderCell, { width: colW.notes }]}>Catatan Terakhir</Text>
          </View>

          {overdueList.length === 0 ? (
            <View style={[shared.tableRow, { justifyContent: 'center' }]}>
              <Text style={{ fontSize: 8, color: BRAND.muted }}>Tidak ada mitigasi yang terlambat</Text>
            </View>
          ) : overdueList.map((o: any, i: number) => (
            <View key={o.risk_code + i} style={[shared.tableRow, i % 2 === 1 ? shared.tableRowAlt : {}]} wrap={false}>
              <Text style={[shared.monoText, { width: colW.code }]}>{o.risk_code}</Text>
              <View style={{ width: colW.title }}>
                <Text style={[shared.tableCell, { fontFamily: 'Helvetica-Bold' }]}>{o.risk_title}</Text>
                <Text style={shared.tableCellMuted}>{o.category ?? '—'}</Text>
              </View>
              <View style={{ width: colW.cls }}>
                <ClassBadge value={o.inherent_classification} />
              </View>
              <Text style={[shared.tableCell, { width: colW.owner }]}>{o.risk_owner_name ?? '—'}</Text>
              <Text style={[shared.tableCell, { width: colW.target, color: BRAND.muted }]}>
                {formatDate(o.target_completion_date)}
              </Text>
              <Text style={[shared.tableCell, { width: colW.late, color: BRAND.red, fontFamily: 'Helvetica-Bold' }]}>
                +{o.days_overdue} hari
              </Text>
              <Text style={[shared.tableCell, { width: colW.progress }]}>
                {o.progress_percentage}%
              </Text>
              <Text style={[shared.tableCell, { width: colW.notes, color: BRAND.muted }]}>
                {o.mitigation_notes
                  ? o.mitigation_notes.substring(0, 80) + (o.mitigation_notes.length > 80 ? '...' : '')
                  : '—'}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )

  const buffer = await renderToBuffer(doc)
  const filename = `AVIRA_OverdueMitigation_${new Date().toISOString().slice(0, 10)}.pdf`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

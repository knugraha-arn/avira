import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { formatDate, formatTimestamp } from '@/lib/utils'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import {
  Document, Page, View, Text,
} from '@react-pdf/renderer'
import {
  shared, BRAND,
  PdfPageHeader, PdfPageFooter,
  ClassBadge, StatusBadgePdf,
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
      residual_likelihood, residual_impact, residual_score, residual_classification,
      treatment_strategy, date_identified, next_review_date,
      risk_owner:avr_user_profiles!avr_risks_risk_owner_id_fkey(full_name),
      treatment_owner:avr_user_profiles!avr_risks_treatment_owner_id_fkey(full_name),
      unit_kerja:avr_unit_kerja(nama)
    `)
    .neq('status', 'Closed')
    .order('inherent_score', { ascending: false })

  const now = formatTimestamp(new Date())
  const riskList = risks ?? []

  const colW = { code: '9%', title: '28%', inherent: '10%', residual: '10%', treatment: '17%', owner: '13%', status: '7%', review: '6%' }

  const doc = (
    <Document title="Risk Register Report" author={profile?.full_name ?? 'AVIRA'}>
      <Page size="A4" orientation="landscape" style={shared.page}>
        <PdfPageHeader />
        <PdfPageFooter />

        {/* Report header */}
        <View style={shared.reportHeaderBox}>
          <View>
            <Text style={shared.reportTitle}>Risk Register Report</Text>
            <Text style={shared.reportMeta}>Digenerate: {now} · Oleh: {profile?.full_name ?? '—'}</Text>
          </View>
          <Text style={shared.complianceBadge}>ISO 27001 Kl. 6.1 · ISO 9001 Kl. 6.1</Text>
        </View>

        {/* KPI Summary */}
        <View style={shared.kpiRow}>
          <View style={shared.kpiCard}>
            <Text style={shared.kpiLabel}>Total Risiko</Text>
            <Text style={shared.kpiValue}>{riskList.length}</Text>
          </View>
          <View style={[shared.kpiCard]}>
            <Text style={shared.kpiLabel}>Extreme</Text>
            <Text style={[shared.kpiValue, { color: BRAND.red }]}>
              {riskList.filter(r => r.inherent_classification === 'Extreme').length}
            </Text>
          </View>
          <View style={shared.kpiCard}>
            <Text style={shared.kpiLabel}>High</Text>
            <Text style={[shared.kpiValue, { color: '#7A4C00' }]}>
              {riskList.filter(r => r.inherent_classification === 'High').length}
            </Text>
          </View>
          <View style={shared.kpiCard}>
            <Text style={shared.kpiLabel}>Medium</Text>
            <Text style={shared.kpiValue}>
              {riskList.filter(r => r.inherent_classification === 'Medium').length}
            </Text>
          </View>
          <View style={shared.kpiCard}>
            <Text style={shared.kpiLabel}>Low</Text>
            <Text style={shared.kpiValue}>
              {riskList.filter(r => r.inherent_classification === 'Low').length}
            </Text>
          </View>
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
            <Text style={[shared.tableHeaderCell, { width: colW.status }]}>Status</Text>
            <Text style={[shared.tableHeaderCell, { width: colW.review }]}>Review</Text>
          </View>

          {riskList.length === 0 ? (
            <View style={[shared.tableRow, { justifyContent: 'center' }]}>
              <Text style={{ fontSize: 8, color: BRAND.muted }}>Tidak ada risiko aktif</Text>
            </View>
          ) : riskList.map((r, i) => (
            <View key={r.risk_code} style={[shared.tableRow, i % 2 === 1 ? shared.tableRowAlt : {}]} wrap={false}>
              <Text style={[shared.monoText, { width: colW.code }]}>{r.risk_code}</Text>
              <View style={{ width: colW.title }}>
                <Text style={[shared.tableCell, { fontFamily: 'Helvetica-Bold' }]}>{r.title}</Text>
                <Text style={shared.tableCellMuted}>{r.category} · {(r as any).unit_kerja?.nama ?? '—'}</Text>
              </View>
              <View style={{ width: colW.inherent, alignItems: 'center' }}>
                <ClassBadge value={r.inherent_classification} />
                <Text style={[shared.tableCellMuted, { marginTop: 2 }]}>{r.inherent_score} (L{r.likelihood}×I{r.impact})</Text>
              </View>
              <View style={{ width: colW.residual, alignItems: 'center' }}>
                {r.residual_score > 0 ? (
                  <>
                    <ClassBadge value={r.residual_classification} />
                    <Text style={[shared.tableCellMuted, { marginTop: 2 }]}>{r.residual_score}</Text>
                  </>
                ) : <Text style={{ fontSize: 8, color: BRAND.muted }}>—</Text>}
              </View>
              <Text style={[shared.tableCell, { width: colW.treatment }]}>{r.treatment_strategy ?? '—'}</Text>
              <Text style={[shared.tableCell, { width: colW.owner }]}>{(r as any).risk_owner?.full_name ?? '—'}</Text>
              <View style={{ width: colW.status }}>
                <StatusBadgePdf value={r.status} />
              </View>
              <Text style={[shared.tableCell, { width: colW.review, color: BRAND.muted }]}>
                {formatDate(r.next_review_date)}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )

  const buffer = await renderToBuffer(doc)
  const filename = `AVIRA_RiskRegister_${new Date().toISOString().slice(0, 10)}.pdf`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { formatDate, formatTimestamp } from '@/lib/utils'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { Document as PdfDocument, Page, View, Text } from '@react-pdf/renderer'
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

  const [{ data: risks }, { data: summary }, { data: overdue }] = await Promise.all([
    supabase.from('avr_risks')
      .select(`risk_code, title, inherent_classification, inherent_score, status, treatment_strategy, mrm_reason, next_review_date,
        risk_owner:avr_user_profiles!avr_risks_risk_owner_id_fkey(full_name),
        unit_kerja:avr_unit_kerja(nama)`)
      .eq('is_mrm_flagged', true).neq('status', 'Closed')
      .order('inherent_score', { ascending: false }),
    supabase.from('avr_v_dashboard_summary').select('*').single(),
    supabase.from('avr_v_overdue_mitigations').select('*'),
  ])

  const now = formatTimestamp(new Date())
  const riskList = risks ?? []
  const overdueList = overdue ?? []
  const s = summary as any

  const colW1 = { code: '9%', title: '28%', cls: '13%', owner: '15%', treatment: '22%', reason: '13%' }
  const colW2 = { code: '9%', title: '32%', owner: '18%', late: '12%', progress: '29%' }

  const doc = (
    <PdfDocument title="MRM Risk Summary Report" author={profile?.full_name ?? 'AVIRA'}>
      <Page size="A4" orientation="landscape" style={shared.page}>
        <PdfPageHeader />
        <PdfPageFooter />

        <View style={shared.reportHeaderBox}>
          <View>
            <Text style={shared.reportTitle}>Management Review Meeting — Risk Summary</Text>
            <Text style={shared.reportMeta}>Digenerate: {now} · Oleh: {profile?.full_name ?? '—'}</Text>
          </View>
          <Text style={shared.complianceBadge}>ISO 27001 Kl. 9.3 · ISO 9001 Kl. 9.3</Text>
        </View>

        {/* KPI */}
        <Text style={shared.sectionTitle}>1. Ringkasan Status Risiko</Text>
        <View style={shared.kpiRow}>
          <View style={shared.kpiCard}>
            <Text style={shared.kpiLabel}>Total Risiko Aktif</Text>
            <Text style={shared.kpiValue}>{s?.total_open ?? 0}</Text>
          </View>
          <View style={shared.kpiCard}>
            <Text style={shared.kpiLabel}>Extreme</Text>
            <Text style={[shared.kpiValue, { color: BRAND.red }]}>{s?.total_extreme ?? 0}</Text>
          </View>
          <View style={shared.kpiCard}>
            <Text style={shared.kpiLabel}>High</Text>
            <Text style={[shared.kpiValue, { color: '#7A4C00' }]}>{s?.total_high ?? 0}</Text>
          </View>
          <View style={shared.kpiCard}>
            <Text style={shared.kpiLabel}>Mitigasi Terlambat</Text>
            <Text style={[shared.kpiValue, { color: BRAND.red }]}>{overdueList.length}</Text>
          </View>
          <View style={shared.kpiCard}>
            <Text style={shared.kpiLabel}>Risiko MRM</Text>
            <Text style={shared.kpiValue}>{riskList.length}</Text>
          </View>
        </View>

        {/* Tabel risiko MRM */}
        <Text style={shared.sectionTitle}>2. Risiko untuk Dibahas di MRM ({riskList.length} risiko)</Text>
        <View style={shared.table}>
          <View style={shared.tableHeader}>
            <Text style={[shared.tableHeaderCell, { width: colW1.code }]}>Kode</Text>
            <Text style={[shared.tableHeaderCell, { width: colW1.title }]}>Judul Risiko</Text>
            <Text style={[shared.tableHeaderCell, { width: colW1.cls }]}>Klasifikasi</Text>
            <Text style={[shared.tableHeaderCell, { width: colW1.owner }]}>Risk Owner</Text>
            <Text style={[shared.tableHeaderCell, { width: colW1.treatment }]}>Treatment</Text>
            <Text style={[shared.tableHeaderCell, { width: colW1.reason }]}>Alasan MRM</Text>
          </View>
          {riskList.length === 0 ? (
            <View style={[shared.tableRow, { justifyContent: 'center' }]}>
              <Text style={{ fontSize: 8, color: BRAND.muted }}>Tidak ada risiko MRM</Text>
            </View>
          ) : riskList.map((r, i) => (
            <View key={r.risk_code} style={[shared.tableRow, i % 2 === 1 ? shared.tableRowAlt : {}]} wrap={false}>
              <Text style={[shared.monoText, { width: colW1.code }]}>{r.risk_code}</Text>
              <View style={{ width: colW1.title }}>
                <Text style={[shared.tableCell, { fontFamily: 'Helvetica-Bold' }]}>{r.title}</Text>
                <Text style={shared.tableCellMuted}>{(r as any).unit_kerja?.nama ?? '—'}</Text>
              </View>
              <View style={{ width: colW1.cls }}>
                <ClassBadge value={r.inherent_classification} />
                <Text style={[shared.tableCellMuted, { marginTop: 2 }]}>{r.inherent_score}</Text>
              </View>
              <Text style={[shared.tableCell, { width: colW1.owner }]}>{(r as any).risk_owner?.full_name ?? '—'}</Text>
              <Text style={[shared.tableCell, { width: colW1.treatment }]}>{r.treatment_strategy ?? '—'}</Text>
              <Text style={[shared.tableCell, { width: colW1.reason, color: BRAND.muted }]}>{(r as any).mrm_reason ?? '—'}</Text>
            </View>
          ))}
        </View>

        {/* Tabel overdue */}
        {overdueList.length > 0 && (
          <>
            <Text style={shared.sectionTitle}>3. Mitigasi Terlambat ({overdueList.length} item)</Text>
            <View style={shared.table}>
              <View style={shared.tableHeader}>
                <Text style={[shared.tableHeaderCell, { width: colW2.code }]}>Kode</Text>
                <Text style={[shared.tableHeaderCell, { width: colW2.title }]}>Risiko</Text>
                <Text style={[shared.tableHeaderCell, { width: colW2.owner }]}>Risk Owner</Text>
                <Text style={[shared.tableHeaderCell, { width: colW2.late }]}>Keterlambatan</Text>
                <Text style={[shared.tableHeaderCell, { width: colW2.progress }]}>Progress</Text>
              </View>
              {overdueList.map((o: any, i: number) => (
                <View key={o.risk_code + i} style={[shared.tableRow, i % 2 === 1 ? shared.tableRowAlt : {}]} wrap={false}>
                  <Text style={[shared.monoText, { width: colW2.code }]}>{o.risk_code}</Text>
                  <Text style={[shared.tableCell, { width: colW2.title }]}>{o.risk_title}</Text>
                  <Text style={[shared.tableCell, { width: colW2.owner }]}>{o.risk_owner_name}</Text>
                  <Text style={[shared.tableCell, { width: colW2.late, color: BRAND.red, fontFamily: 'Helvetica-Bold' }]}>+{o.days_overdue} hari</Text>
                  <Text style={[shared.tableCell, { width: colW2.progress }]}>{o.progress_percentage}%</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </Page>
    </PdfDocument>
  )

  const pdfBuffer = await renderToBuffer(doc)
  const buffer = new Uint8Array(pdfBuffer)
  const filename = `AVIRA_MRM_${new Date().toISOString().slice(0, 10)}.pdf`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

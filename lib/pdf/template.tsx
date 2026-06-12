import React from 'react'
import {
  Document as PdfDocument, Page, View, Text, Image, StyleSheet, Font
} from "@react-pdf/renderer"

// ─── Warna brand ──────────────────────────────────────────────
export const BRAND = {
  blue:    '#0344D8',
  navy:    '#1A1F2E',
  lime:    '#D1EA2C',
  amber:   '#FFC128',
  gray:    '#F8F9FB',
  border:  '#E5E7EB',
  muted:   '#888888',
  red:     '#CC0000',
}

export const CLASS_BG: Record<string, string> = {
  Low:     '#D6EFC7',
  Medium:  '#FFF0C2',
  High:    '#FFE0A0',
  Extreme: '#FFCCCC',
}

export const CLASS_COLOR: Record<string, string> = {
  Low:     '#1E5C0A',
  Medium:  '#7A4C00',
  High:    '#6B3500',
  Extreme: '#CC0000',
}

// ─── Shared styles ────────────────────────────────────────────
export const shared = StyleSheet.create({
  page: {
    fontFamily:  'Helvetica',
    fontSize:    9,
    color:       BRAND.navy,
    paddingTop:    52, // ruang untuk fixed header
    paddingBottom: 44, // ruang untuk fixed footer
    paddingHorizontal: 32,
  },
  // Header halaman — fixed di setiap halaman
  pageHeader: {
    position:   'absolute',
    top:        0,
    left:       0,
    right:      0,
    height:     44,
    paddingHorizontal: 32,
    paddingVertical:   10,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
    backgroundColor:   '#FFFFFF',
  },
  confidentialLabel: {
    fontSize:    8,
    fontFamily:  'Helvetica-Bold',
    color:       BRAND.red,
    letterSpacing: 1,
  },
  logo: {
    width:  90,
    height: 26,
    objectFit: 'contain',
  },
  // Footer halaman — fixed di setiap halaman
  pageFooter: {
    position:   'absolute',
    bottom:     0,
    left:       0,
    right:      0,
    height:     32,
    paddingHorizontal: 32,
    paddingVertical:   8,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    borderTopWidth:    1,
    borderTopColor:    BRAND.border,
    backgroundColor:   '#FFFFFF',
  },
  footerLeft: {
    fontSize: 7,
    color:    BRAND.red,
    fontFamily: 'Helvetica-Bold',
  },
  footerRight: {
    fontSize: 7,
    color:    BRAND.muted,
  },
  // Report header (di dalam konten)
  reportHeaderBox: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'flex-start',
    paddingBottom:   10,
    marginBottom:    14,
    borderBottomWidth: 2,
    borderBottomColor: BRAND.blue,
  },
  reportTitle: {
    fontSize:    15,
    fontFamily:  'Helvetica-Bold',
    color:       BRAND.navy,
    marginBottom: 3,
  },
  reportMeta: {
    fontSize: 8,
    color:    BRAND.muted,
  },
  complianceBadge: {
    backgroundColor: BRAND.lime,
    color:           BRAND.navy,
    fontSize:        8,
    fontFamily:      'Helvetica-Bold',
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      4,
  },
  // Tabel
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection:   'row',
    backgroundColor: BRAND.gray,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
    paddingVertical:   6,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontSize:   7,
    fontFamily: 'Helvetica-Bold',
    color:      BRAND.muted,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection:   'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical:   7,
    paddingHorizontal: 6,
  },
  tableRowAlt: {
    backgroundColor: '#FAFAFA',
  },
  tableCell: {
    fontSize: 8,
    color:    BRAND.navy,
  },
  tableCellMuted: {
    fontSize: 7,
    color:    BRAND.muted,
    marginTop: 1,
  },
  // Badge klasifikasi
  classBadge: {
    paddingHorizontal: 6,
    paddingVertical:   2,
    borderRadius:      4,
    fontSize:          8,
    fontFamily:        'Helvetica-Bold',
    alignSelf:         'flex-start',
  },
  // KPI summary cards
  kpiRow: {
    flexDirection:  'row',
    gap:            8,
    marginBottom:   14,
  },
  kpiCard: {
    flex:            1,
    backgroundColor: BRAND.gray,
    borderRadius:    6,
    padding:         10,
  },
  kpiLabel: {
    fontSize: 7,
    color:    BRAND.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  kpiValue: {
    fontSize:   20,
    fontFamily: 'Helvetica-Bold',
    color:      BRAND.navy,
  },
  // Section title
  sectionTitle: {
    fontSize:    10,
    fontFamily:  'Helvetica-Bold',
    color:       BRAND.navy,
    marginTop:   14,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  // Alert box
  alertBox: {
    backgroundColor: '#FFF5F5',
    borderWidth:     1,
    borderColor:     '#FFD0D0',
    borderRadius:    6,
    padding:         10,
    marginBottom:    12,
  },
  alertText: {
    fontSize: 8,
    color:    BRAND.red,
  },
  monoText: {
    fontFamily: 'Courier',
    fontSize:   8,
    color:      BRAND.blue,
  },
})

// ─── Komponen PageHeader (fixed di setiap halaman) ────────────
export function PdfPageHeader() {
  return (
    <View style={shared.pageHeader} fixed>
      <Text style={shared.confidentialLabel}>CONFIDENTIAL</Text>
      <Image
        style={shared.logo}
        src="public/logo-arranet.png"
      />
    </View>
  )
}

// ─── Komponen PageFooter (fixed di setiap halaman) ────────────
export function PdfPageFooter() {
  return (
    <View style={shared.pageFooter} fixed>
      <Text style={shared.footerLeft}>
        CONFIDENTIAL – Dilarang disebarluaskan tanpa izin
      </Text>
      <Text
        style={shared.footerRight}
        render={({ pageNumber, totalPages }) =>
          `AVIRA Risk Management · Arranet    |    Hal ${pageNumber} / ${totalPages}`
        }
      />
    </View>
  )
}

// ─── Komponen ClassBadge ──────────────────────────────────────
export function ClassBadge({ value }: { value: string | null }) {
  if (!value) return <Text style={{ fontSize: 8, color: BRAND.muted }}>—</Text>
  return (
    <View style={[shared.classBadge, {
      backgroundColor: CLASS_BG[value] ?? '#F0F0F0',
    }]}>
      <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: CLASS_COLOR[value] ?? '#666' }}>
        {value}
      </Text>
    </View>
  )
}

// ─── Komponen StatusBadge ─────────────────────────────────────
export function StatusBadgePdf({ value }: { value: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    'Open':        { bg: '#EBF2FF', color: BRAND.blue },
    'In Progress': { bg: '#FFF8E6', color: '#7A4C00' },
    'Closed':      { bg: '#F0F9E8', color: '#1E5C0A' },
  }
  const c = cfg[value] ?? { bg: BRAND.gray, color: BRAND.muted }
  return (
    <View style={[shared.classBadge, { backgroundColor: c.bg }]}>
      <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: c.color }}>{value}</Text>
    </View>
  )
}

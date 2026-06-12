import React from 'react'
import {
  Document as PdfDocument, Page, View, Text, Image, StyleSheet,
} from '@react-pdf/renderer'

export const BRAND = {
  blue:   '#0344D8',
  navy:   '#1A1F2E',
  lime:   '#D1EA2C',
  amber:  '#FFC128',
  gray:   '#F8F9FB',
  border: '#E5E7EB',
  muted:  '#888888',
  red:    '#CC0000',
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

export const shared = StyleSheet.create({
  page: {
    fontFamily:        'Helvetica',
    fontSize:          9,
    color:             '#1A1F2E',
    paddingTop:        52,
    paddingBottom:     44,
    paddingHorizontal: 32,
  },
  pageHeader: {
    position:          'absolute',
    top:               0,
    left:              0,
    right:             0,
    height:            44,
    paddingHorizontal: 32,
    paddingVertical:   10,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor:   '#FFFFFF',
  },
  confidentialLabel: {
    fontSize:      8,
    fontFamily:    'Helvetica-Bold',
    color:         '#CC0000',
    letterSpacing: 1,
  },
  logo: {
    width:     90,
    height:    26,
    objectFit: 'contain',
  },
  pageFooter: {
    position:          'absolute',
    bottom:            0,
    left:              0,
    right:             0,
    height:            32,
    paddingHorizontal: 32,
    paddingVertical:   8,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    borderTopWidth:    1,
    borderTopColor:    '#E5E7EB',
    backgroundColor:   '#FFFFFF',
  },
  footerLeft: {
    fontSize:   7,
    color:      '#CC0000',
    fontFamily: 'Helvetica-Bold',
  },
  footerRight: {
    fontSize: 7,
    color:    '#888888',
  },
  reportHeaderBox: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'flex-start',
    paddingBottom:     10,
    marginBottom:      14,
    borderBottomWidth: 2,
    borderBottomColor: '#0344D8',
  },
  reportTitle: {
    fontSize:     15,
    fontFamily:   'Helvetica-Bold',
    color:        '#1A1F2E',
    marginBottom: 3,
  },
  reportMeta: {
    fontSize: 8,
    color:    '#888888',
  },
  complianceBadge: {
    backgroundColor:   '#D1EA2C',
    color:             '#1A1F2E',
    fontSize:          8,
    fontFamily:        'Helvetica-Bold',
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      4,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection:     'row',
    backgroundColor:   '#F8F9FB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical:   6,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontSize:      7,
    fontFamily:    'Helvetica-Bold',
    color:         '#888888',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection:     'row',
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
    color:    '#1A1F2E',
  },
  tableCellMuted: {
    fontSize:  7,
    color:     '#888888',
    marginTop: 1,
  },
  classBadge: {
    paddingHorizontal: 6,
    paddingVertical:   2,
    borderRadius:      4,
    alignSelf:         'flex-start',
  },
  kpiRow: {
    flexDirection: 'row',
    gap:           8,
    marginBottom:  14,
  },
  kpiCard: {
    flex:            1,
    backgroundColor: '#F8F9FB',
    borderRadius:    6,
    padding:         10,
  },
  kpiLabel: {
    fontSize:      7,
    color:         '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom:  3,
  },
  kpiValue: {
    fontSize:   20,
    fontFamily: 'Helvetica-Bold',
    color:      '#1A1F2E',
  },
  sectionTitle: {
    fontSize:          10,
    fontFamily:        'Helvetica-Bold',
    color:             '#1A1F2E',
    marginTop:         14,
    marginBottom:      8,
    paddingBottom:     4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
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
    color:    '#CC0000',
  },
  monoText: {
    fontFamily: 'Courier',
    fontSize:   8,
    color:      '#0344D8',
  },
})

export function PdfPageHeader() {
  return (
    <View style={shared.pageHeader} fixed>
      <Text style={shared.confidentialLabel}>CONFIDENTIAL</Text>
      <Image style={shared.logo} src="https://avira.arranetwork.com/logo-arranet.png" />
    </View>
  )
}

export function PdfPageFooter() {
  return (
    <View style={shared.pageFooter} fixed>
      <Text style={shared.footerLeft}>
        CONFIDENTIAL – Dilarang disebarluaskan tanpa izin
      </Text>
      <Text
        style={shared.footerRight}
        render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
          `AVIRA Risk Management · Arranet    |    Hal ${pageNumber} / ${totalPages}`
        }
      />
    </View>
  )
}

export function ClassBadge({ value }: { value: string | null }) {
  if (!value) return <Text style={{ fontSize: 8, color: '#888888' }}>—</Text>
  return (
    <View style={[shared.classBadge, { backgroundColor: CLASS_BG[value] ?? '#F0F0F0' }]}>
      <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: CLASS_COLOR[value] ?? '#666' }}>
        {value}
      </Text>
    </View>
  )
}

export function StatusBadgePdf({ value }: { value: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    'Open':        { bg: '#EBF2FF', color: '#0344D8' },
    'In Progress': { bg: '#FFF8E6', color: '#7A4C00' },
    'Closed':      { bg: '#F0F9E8', color: '#1E5C0A' },
  }
  const c = cfg[value] ?? { bg: '#F8F9FB', color: '#888888' }
  return (
    <View style={[shared.classBadge, { backgroundColor: c.bg }]}>
      <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: c.color }}>{value}</Text>
    </View>
  )
}

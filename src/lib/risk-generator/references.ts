/**
 * Referensi standar/regulasi untuk Risk Generator.
 * Teks ini di-inject ke system prompt Claude sesuai checkbox yang dicentang user.
 * Update isi referensi di sini jika ada perubahan regulasi/standar.
 */

export const REFERENCE_ISO27001 = `
## ISO/IEC 27001:2022 — Sistem Manajemen Keamanan Informasi (SMKI)

Fokus: kerahasiaan (confidentiality), integritas (integrity), ketersediaan (availability) informasi.

Kategori risiko utama:
- Kontrol akses (Annex A.5.15-A.5.18) — manajemen identitas, hak akses, akses istimewa
- Keamanan operasional (A.8.1-A.8.34) — malware, backup, logging, manajemen kerentanan teknis
- Keamanan komunikasi & jaringan (A.8.20-A.8.24) — segmentasi jaringan, enkripsi
- Pengembangan sistem aman (A.8.25-A.8.34) — secure coding, pengujian keamanan, pemisahan environment
- Keamanan fisik & lingkungan (A.7) — akses fisik data center, perlindungan peralatan
- Keamanan SDM (A.6) — screening, awareness training, proses offboarding
- Manajemen insiden keamanan informasi (A.5.24-A.5.28)
- Kelangsungan bisnis & keamanan informasi (A.5.29-A.5.30) — BCP/DRP
- Kepatuhan (A.5.31-A.5.36) — hukum, kontraktual, audit independen
- Manajemen risiko pihak ketiga/supplier (A.5.19-A.5.23)

Klausul manajemen (Klausul 4-10): konteks organisasi, kepemimpinan, perencanaan (risk assessment & treatment), dukungan, operasi, evaluasi performa, peningkatan berkelanjutan.
`.trim()

export const REFERENCE_ISO9001 = `
## ISO 9001:2015 — Sistem Manajemen Mutu (SMM)

Fokus: kepuasan pelanggan, konsistensi proses, peningkatan berkelanjutan.

Kategori risiko utama:
- Konteks organisasi & pihak berkepentingan (Klausul 4) — risiko memahami kebutuhan stakeholder
- Kepemimpinan & komitmen (Klausul 5) — risiko kebijakan mutu tidak diterapkan konsisten
- Perencanaan — risiko & peluang (Klausul 6.1) — risiko terhadap pencapaian sasaran mutu
- Dukungan — kompetensi SDM, infrastruktur, lingkungan kerja, sumber daya pemantauan (Klausul 7)
- Operasional (Klausul 8):
  - Perencanaan & kontrol operasional
  - Persyaratan produk/layanan — risiko kesalahan spesifikasi
  - Desain & pengembangan — risiko perubahan tidak terkontrol
  - Kontrol penyedia eksternal — risiko kualitas vendor/supplier
  - Produksi & penyediaan layanan — risiko nonconformity proses
  - Pelepasan produk/layanan — risiko produk cacat lolos ke pelanggan
  - Kontrol output yang tidak sesuai (nonconforming output)
- Evaluasi performa (Klausul 9) — audit internal, management review, kepuasan pelanggan
- Peningkatan (Klausul 10) — nonconformity & corrective action, peningkatan berkelanjutan
`.trim()

export const REFERENCE_POJK11 = `
## POJK 11/POJK.03/2022 & PADK 1/2026 — Penyelenggaraan Teknologi Informasi oleh Bank Umum

Dasar hukum: POJK Nomor 11/POJK.03/2022 (berlaku 6 Okt 2022), dijabarkan teknis oleh PADK OJK Nomor 1 Tahun 2026 (berlaku 1 Maret 2026, mencabut SEOJK 21/SEOJK.03/2017).

Fokus: tata kelola dan manajemen risiko TI khusus sektor perbankan Indonesia.

Kategori risiko utama (11 area):

1. **Tata Kelola TI** — segregation of duties, peran Direksi/Komisaris/Komite Pengarah TI/Pemimpin Satuan Kerja TI, kebijakan-standar-prosedur dengan siklus kaji ulang berkala

2. **Arsitektur TI & Rencana Strategis TI (RSTI)** — arsitektur data/aplikasi/teknologi, RSTI wajib selaras rencana korporasi (periode sama), gap analysis, perubahan RSTI saat merger/akuisisi/perubahan model bisnis

3. **Manajemen Risiko Penyelenggaraan TI** — identifikasi-ukur-pantau-kendalikan risiko di semua tahap (perencanaan s.d. penghapusan sumber daya TI); tahap pengembangan (perencanaan, perancangan, UAT, implementasi, post-implementation review); Disaster Recovery Plan wajib diuji min. 1x/tahun

4. **Operasional Pusat Data & DRC** — akses fisik (kartu akses, log-book), kontrol lingkungan (UPS, fire suppression, CCTV), change management, patch management, migrasi data, helpdesk, privilege access (dual custody), database administrator, disposal aset TI (degaussing/shredding)

5. **Penggunaan Pihak Penyedia Jasa TI (PPJTI/outsourcing)** — kontrak tertulis wajib (peran, kewajiban, tanggung jawab), penggunaan PPJTI di luar Indonesia, penilaian ulang materialitas PPJTI secara berkala

6. **Penempatan Sistem Elektronik & Pemrosesan Transaksi Berbasis TI**

7. **Pengelolaan Data & Pelindungan Data Pribadi** — kepemilikan data, kualitas data, persetujuan pemrosesan data pribadi (consent), Analisis Dampak Pelindungan Data Pribadi (DPIA), pertukaran data pribadi dengan pihak lain

8. **Penyediaan Jasa TI oleh Bank** — jika bank menyediakan jasa TI ke pihak lain, perlu kebijakan dan perjanjian tersendiri

9. **Pengendalian & Audit Intern TI** — frekuensi & lingkup audit memadai, tindak lanjut temuan audit, independensi auditor ekstern

10. **Keamanan & Ketahanan Siber** (mengacu SEOJK Siber tersendiri) — pengujian keamanan siber, penilaian maturitas keamanan siber, unit khusus siber

11. **Maturitas Digital & Pelaporan ke OJK** (mengacu SEOJK DMAB) — self-assessment maturitas digital min. 1x/tahun, pelaporan RSTI/rencana pengembangan/kondisi terkini TI/insiden TI ke OJK via sistem elektronik

Catatan: jika dikombinasikan dengan ISO 27001, ada overlap alami di area pengamanan informasi, manajemen risiko TI, dan BCP/DRC — risiko yang relevan ke keduanya dapat menyebut kedua referensi compliance.
`.trim()

export const REFERENCE_MAP: Record<string, { label: string; text: string }> = {
  iso27001: { label: 'ISO 27001', text: REFERENCE_ISO27001 },
  iso9001:  { label: 'ISO 9001',  text: REFERENCE_ISO9001 },
  pojk11:   { label: 'POJK 11/2022', text: REFERENCE_POJK11 },
}

export type StandardKey = keyof typeof REFERENCE_MAP

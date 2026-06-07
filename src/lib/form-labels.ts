// ============================================================
// AVIRA — Form Labels, Tooltips & Placeholders
// Edit file ini untuk mengubah teks tanpa menyentuh komponen
// ============================================================

export const RISK_FORM = {

  // ── Step 1: Identitas Risiko ──────────────────────────────
  title: {
    label:       'Judul Risiko',
    placeholder: 'Contoh: Kebocoran data pelanggan via API tidak terautentikasi',
    tooltip:     'Singkat dan spesifik. Gunakan format: [Objek] + [Ancaman]. Hindari judul yang terlalu umum seperti "Risiko IT".',
    required:    true,
  },

  description: {
    label:       'Deskripsi Risiko',
    placeholder: 'Jelaskan konteks, penyebab potensial, dan kondisi yang bisa memicu risiko ini terjadi...',
    tooltip:     'Uraikan secara jelas apa yang bisa terjadi, mengapa bisa terjadi, dan dalam kondisi apa.',
    required:    false,
  },

  category: {
    label:       'Kategori Risiko',
    placeholder: 'Pilih kategori',
    tooltip:     'Pilih kategori utama sesuai sumber risiko. Jika bersifat lintas kategori, pilih yang paling dominan.',
    required:    true,
  },

  unit_kerja: {
    label:       'Unit Kerja (Accountable)',
    placeholder: 'Pilih unit kerja',
    tooltip:     'Unit kerja yang accountable — memiliki otoritas dan tanggung jawab penuh atas risiko ini. Hanya satu unit kerja per risiko.',
    required:    true,
  },

  asset_terkait: {
    label:       'Aset Terkait',
    placeholder: 'Contoh: Database pelanggan, Server produksi AWS, Aplikasi mobile',
    tooltip:     'Sistem, data, infrastruktur, atau proses bisnis yang terekspos terhadap risiko ini.',
    required:    false,
  },

  third_party: {
    label:       'Pihak Lain',
    placeholder: 'Cari atau tambah pihak lain...',
    tooltip:     'Isi jika risiko melibatkan pihak eksternal — termasuk vendor, mitra bisnis, prinsipal, bank, atau penyedia jasa lainnya. Kosongkan jika risiko murni internal.',
    required:    false,
  },

  date_identified: {
    label:       'Tanggal Identifikasi',
    placeholder: '',
    tooltip:     'Tanggal risiko pertama kali diketahui atau diidentifikasi, bukan tanggal input ke sistem.',
    required:    false,
  },

  existing_control: {
    label:       'Kontrol yang Sudah Ada',
    placeholder: 'Jelaskan mekanisme pengendalian yang sudah berjalan saat ini, sebelum mitigasi baru diterapkan. Contoh: firewall aktif, backup harian, SOP verifikasi manual...',
    tooltip:     'Catat semua kontrol yang sudah ada, meskipun belum optimal. Ini menjadi dasar penilaian efektivitas mitigasi selanjutnya.',
    required:    false,
  },

  // ── Step 2: Ownership ─────────────────────────────────────
  risk_owner: {
    label:       'Risk Owner (Accountable)',
    placeholder: 'Pilih Risk Owner',
    tooltip:     'Satu orang yang accountable — bertanggung jawab penuh memastikan risiko dimonitor dan ditangani. Biasanya level manajer ke atas. Tidak boleh dirangkap dengan Treatment Owner untuk risiko High dan Extreme.',
    required:    false,
  },

  treatment_owner: {
    label:       'Treatment Owner (Responsible)',
    placeholder: 'Pilih Treatment Owner',
    tooltip:     'Orang yang responsible — secara aktif melaksanakan rencana mitigasi. Dapat berasal dari tim yang sama atau berbeda dengan Risk Owner.',
    required:    false,
  },

  raci_note: 'Dalam ISO 27001, Risk Owner (Accountable) dan Treatment Owner (Responsible) sebaiknya tidak dirangkap oleh orang yang sama untuk risiko High dan Extreme — demi segregation of duties.',

  // ── Step 3: Penilaian Inheren ─────────────────────────────
  likelihood: {
    label:   'Likelihood (Kemungkinan)',
    tooltip: 'Seberapa sering risiko ini bisa terjadi tanpa kontrol tambahan.',
    scale: {
      1: 'Sangat Jarang — kurang dari 1 kali dalam 5 tahun',
      2: 'Jarang — sekitar 1 kali dalam 2–5 tahun',
      3: 'Kadang — sekitar 1 kali per tahun',
      4: 'Sering — beberapa kali per tahun',
      5: 'Pasti Terjadi — hampir pasti terjadi dalam waktu dekat',
    },
  },

  impact: {
    label:   'Impact (Dampak)',
    tooltip: 'Seberapa besar dampak jika risiko ini benar-benar terjadi.',
    scale: {
      1: 'Sangat Kecil — tidak signifikan, dapat ditangani rutin',
      2: 'Kecil — gangguan minor, mudah dipulihkan',
      3: 'Sedang — gangguan operasional, butuh perhatian manajemen',
      4: 'Besar — kerugian signifikan, reputasi terdampak',
      5: 'Kritis — katastrofik, operasional berhenti, kerugian besar',
    },
  },

  inherent_score_note: 'Dihitung otomatis: Likelihood × Impact. Klasifikasi mengacu pada Risk Matrix 5×5 ISO 27001.',

  // ── Step 4: Residual Risk ─────────────────────────────────
  residual_note: 'Isi hanya jika kontrol sudah diterapkan dan efektivitasnya dapat diukur. Nilai residual harus lebih rendah dari nilai inheren.',

  residual_likelihood: {
    label:       'Residual Likelihood',
    placeholder: '— Tidak diisi —',
    tooltip:     'Kemungkinan terjadinya risiko setelah kontrol diterapkan. Harus lebih rendah dari nilai inheren.',
  },

  residual_impact: {
    label:       'Residual Impact',
    placeholder: '— Tidak diisi —',
    tooltip:     'Dampak yang tersisa setelah kontrol diterapkan. Harus lebih rendah dari nilai inheren.',
  },

  // ── Step 5: Treatment ─────────────────────────────────────
  treatment_options: {
    Mitigate: {
      icon:    '🛡️',
      tooltip: 'Terapkan kontrol untuk mengurangi likelihood atau impact. Pilihan paling umum untuk risiko High dan Extreme.',
    },
    Accept: {
      icon:    '✅',
      tooltip: 'Terima risiko apa adanya karena biaya mitigasi melebihi dampak. Wajib ada justifikasi tertulis dan persetujuan Risk Owner.',
    },
    Transfer: {
      icon:    '🤝',
      tooltip: 'Alihkan risiko ke pihak lain. Contoh: asuransi cyber, klausul kontrak vendor, outsourcing layanan.',
    },
    Avoid: {
      icon:    '🚫',
      tooltip: 'Hentikan atau hindari aktivitas yang menjadi sumber risiko.',
    },
  },

  treatment_notes: {
    label:       'Catatan Treatment',
    placeholder: 'Jelaskan rencana penanganan secara konkret: apa yang akan dilakukan, siapa yang melaksanakan, dan kapan target selesai...',
    tooltip:     'Uraikan rencana aksi yang spesifik dan terukur. Catatan ini menjadi acuan dalam monitoring progress mitigasi.',
  },

  // ── Step 6: Review Cycle ──────────────────────────────────
  review_frequency: {
    label:   'Frekuensi Review',
    tooltip: 'Seberapa sering risiko ini wajib di-review oleh Risk Owner.',
    guide:   'Panduan: Extreme/High → minimal triwulan · Medium → semesteran · Low → tahunan',
    options: {
      30:  'Bulanan',
      90:  'Triwulan (disarankan untuk High & Extreme)',
      180: 'Semesteran (disarankan untuk Medium)',
      365: 'Tahunan (disarankan untuk Low)',
    },
  },
}

// ── Master Data Forms ──────────────────────────────────────
export const UNIT_KERJA_FORM = {
  kode: {
    label:       'Kode Unit Kerja',
    placeholder: 'Contoh: IT, FIN, OPS, HR',
    tooltip:     'Kode singkat unik untuk unit kerja. Gunakan huruf kapital, maksimal 10 karakter.',
  },
  nama: {
    label:       'Nama Unit Kerja',
    placeholder: 'Contoh: Teknologi Informasi, Keuangan, Operasional',
    tooltip:     'Nama lengkap unit kerja sesuai struktur organisasi.',
  },
}

export const THIRD_PARTY_FORM = {
  nama: {
    label:       'Nama Pihak Lain',
    placeholder: 'Contoh: PT Mitra Teknologi, Bank BCA, AWS Indonesia',
    tooltip:     'Nama resmi pihak eksternal sesuai dokumen perjanjian atau kontrak.',
  },
  tipe: {
    label:       'Tipe',
    placeholder: 'Pilih tipe',
    tooltip:     'Klasifikasi hubungan dengan pihak eksternal ini.',
  },
  keterangan: {
    label:       'Keterangan',
    placeholder: 'Contoh: Penyedia layanan cloud, mitra distribusi produk, bank kustodian...',
    tooltip:     'Informasi tambahan tentang peran atau hubungan dengan pihak ini.',
  },
}

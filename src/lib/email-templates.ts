// ============================================================
// ARNES — Arranet Notification Services
// Email Templates untuk AVIRA Risk Management
//
// ⚙️  KONFIGURASI SENDER — ubah di sini saja:
// ============================================================

export const ARNES = {
  senderName:  'ARNES — Arranet Notification Services',
  senderEmail: 'arnes-noreply@arranetwork.com',
  brandColor:  '#0344D8',
  appName:     'AVIRA Risk Management',
  appUrl:      'https://avira.arranetwork.com',
  companyName: 'Arranet',
  get from()  { return `${this.senderName} <${this.senderEmail}>` },
}

// ── HTML helpers ──────────────────────────────────────────────
const h2  = (t: string) => `<h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1A1F2E;">${t}</h2>`
const p   = (t: string, muted = false) => `<p style="margin:12px 0;font-size:14px;color:${muted ? '#6B7280' : '#374151'};line-height:1.6;">${t}</p>`
const hr  = () => `<hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">`
const btn = (text: string, url: string) =>
  `<table cellpadding="0" cellspacing="0" style="margin:24px 0 0;"><tr>
    <td style="background:${ARNES.brandColor};border-radius:6px;padding:12px 24px;">
      <a href="${url}" style="color:white;font-size:14px;font-weight:600;text-decoration:none;">${text}</a>
    </td></tr></table>`
const box = (content: string, bg = '#EBF2FF', border = '#0344D8') =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;"><tr>
    <td style="background:${bg};border-left:3px solid ${border};border-radius:0 4px 4px 0;padding:12px 16px;font-size:13px;color:#1A1F2E;line-height:1.6;">${content}</td>
  </tr></table>`
const blockquote = (text: string, color = '#D1D5DB') =>
  `<blockquote style="margin:0 0 16px;padding:12px 16px;background:#F9FAFB;border-left:3px solid ${color};border-radius:0 4px 4px 0;font-size:13px;color:#374151;line-height:1.6;">${text}</blockquote>`

function wrap(content: string): string {
  return `<!DOCTYPE html><html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8F9FB;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FB;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td style="background:${ARNES.brandColor};border-radius:8px 8px 0 0;padding:20px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td><span style="color:white;font-size:16px;font-weight:700;letter-spacing:.05em">ARNES</span>
              <span style="color:rgba(255,255,255,.5);font-size:11px;margin-left:8px">Arranet Notification Services</span></td>
            <td align="right"><span style="color:rgba(255,255,255,.6);font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase">AVIRA</span></td>
          </tr></table>
        </td></tr>
        <tr><td style="background:white;padding:32px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;">
          ${content}
        </td></tr>
        <tr><td style="background:#F8F9FB;border:1px solid #E5E7EB;border-top:0;border-radius:0 0 8px 8px;padding:16px 32px;">
          <p style="margin:0;font-size:11px;color:#9CA3AF;text-align:center;">
            ${ARNES.companyName} · ${ARNES.appName} · <a href="${ARNES.appUrl}" style="color:${ARNES.brandColor};text-decoration:none;">${ARNES.appUrl}</a>
          </p>
          <p style="margin:6px 0 0;font-size:10px;color:#D1D5DB;text-align:center;">Email ini dikirim otomatis. Mohon tidak membalas email ini.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

// ============================================================
// TEMPLATES
// ============================================================
export type EmailTemplate =
  | 'invite' | 'review_due' | 'mitigation_overdue'
  | 'closure_request' | 'closure_approved' | 'closure_rejected'
  | 'risk_escalated' | 'library_expiring' | 'user_deactivated'

export interface EmailData {
  recipientName?: string; inviterName?: string; role?: string
  riskCode?: string; riskTitle?: string; daysUntilReview?: number
  daysOverdue?: number; progressPct?: number
  requesterName?: string; justification?: string
  approverName?: string; rejectionReason?: string; mrmReason?: string
  daysUntilExpire?: number
  deactivatedUserName?: string; deactivatedByName?: string
  riskId?: string; libraryId?: string
}

export const EMAIL_TEMPLATES: Record<EmailTemplate, {
  subject: (d: EmailData) => string
  body:    (d: EmailData) => string
}> = {

  invite: {
    subject: ({ inviterName }) => `[AVIRA] ${inviterName} mengundang Anda bergabung`,
    body: ({ recipientName, inviterName, role }) => wrap(`
      ${h2('Undangan Bergabung ke AVIRA')}
      ${p(`Yth. Bapak/Ibu <strong>${recipientName}</strong>,`)}
      ${p(`Anda telah diundang oleh <strong>${inviterName}</strong> untuk bergabung ke <strong>AVIRA Risk Management</strong> dengan hak akses sebagai:`)}
      ${box(`<strong>Role:</strong> ${role}`)}
      ${p('Silakan masuk menggunakan akun Google <strong>@arranetwork.com</strong> melalui tautan berikut:')}
      ${btn('Masuk ke AVIRA', ARNES.appUrl)}
      ${hr()}
      ${p('Apabila Anda menerima email ini secara tidak sengaja, abaikan email ini.', true)}
    `),
  },

  review_due: {
    subject: ({ riskCode, daysUntilReview }) => `[AVIRA] Review ${riskCode} jatuh tempo dalam ${daysUntilReview} hari`,
    body: ({ recipientName, riskCode, riskTitle, daysUntilReview, riskId }) => wrap(`
      ${h2('Pengingat: Review Risiko Jatuh Tempo')}
      ${p(`Yth. Bapak/Ibu <strong>${recipientName}</strong>,`)}
      ${p('Risiko berikut memerlukan review dalam waktu dekat:')}
      ${box(`<strong>${riskCode}</strong><br>${riskTitle}<br>
        <span style="color:#6B7280;font-size:12px;">Jatuh tempo: <strong>${daysUntilReview === 0 ? 'Hari ini' : `${daysUntilReview} hari lagi`}</strong></span>`,
        daysUntilReview === 0 ? '#FFF5F5' : '#FFF8EC', daysUntilReview === 0 ? '#EF4444' : '#FFC128')}
      ${p('Mohon segera lakukan review untuk memastikan data risiko tetap akurat.')}
      ${btn('Lakukan Review Sekarang', `${ARNES.appUrl}/risks/${riskId}/review`)}
      ${hr()}
      ${p('Email ini dikirim karena Anda terdaftar sebagai Risk Owner dari risiko tersebut.', true)}
    `),
  },

  mitigation_overdue: {
    subject: ({ riskCode, daysOverdue }) => `[AVIRA] Mitigasi ${riskCode} terlambat ${daysOverdue} hari`,
    body: ({ recipientName, riskCode, riskTitle, daysOverdue, progressPct, riskId }) => wrap(`
      ${h2('Peringatan: Mitigasi Risiko Terlambat')}
      ${p(`Yth. Bapak/Ibu <strong>${recipientName}</strong>,`)}
      ${p('Pelaksanaan mitigasi untuk risiko berikut telah melewati target penyelesaian:')}
      ${box(`<strong>${riskCode}</strong><br>${riskTitle}<br>
        <span style="color:#6B7280;font-size:12px;">Keterlambatan: <strong style="color:#EF4444;">+${daysOverdue} hari</strong> &nbsp;·&nbsp; Progress: <strong>${progressPct}%</strong></span>`,
        '#FFF5F5', '#EF4444')}
      ${p('Mohon segera perbarui status mitigasi atau koordinasikan percepatan penyelesaian.')}
      ${btn('Perbarui Log Mitigasi', `${ARNES.appUrl}/risks/${riskId}`)}
      ${hr()}
      ${p('Email ini dikirim karena Anda terdaftar sebagai Risk Owner atau Treatment Owner.', true)}
    `),
  },

  closure_request: {
    subject: ({ riskCode }) => `[AVIRA] Permintaan penutupan risiko ${riskCode} menunggu persetujuan Anda`,
    body: ({ recipientName, riskCode, riskTitle, requesterName, justification, riskId }) => wrap(`
      ${h2('Permintaan Penutupan Risiko')}
      ${p(`Yth. Bapak/Ibu <strong>${recipientName}</strong>,`)}
      ${p(`<strong>${requesterName}</strong> mengajukan permintaan penutupan risiko berikut dan memerlukan persetujuan Anda:`)}
      ${box(`<strong>${riskCode}</strong><br>${riskTitle}`)}
      ${p('<strong>Justifikasi efektivitas mitigasi:</strong>')}
      ${blockquote(justification ?? '')}
      ${p('Mohon tinjau dan berikan keputusan melalui sistem AVIRA.')}
      ${btn('Review & Putuskan', `${ARNES.appUrl}/risks/${riskId}/approve-closure`)}
      ${hr()}
      ${p('Anda menerima email ini karena ditunjuk sebagai approver.', true)}
    `),
  },

  closure_approved: {
    subject: ({ riskCode }) => `[AVIRA] Penutupan risiko ${riskCode} telah disetujui`,
    body: ({ recipientName, riskCode, riskTitle, approverName, riskId }) => wrap(`
      ${h2('Penutupan Risiko Disetujui')}
      ${p(`Yth. Bapak/Ibu <strong>${recipientName}</strong>,`)}
      ${p(`Permintaan penutupan risiko yang Anda ajukan telah <strong style="color:#16A34A;">disetujui</strong> oleh <strong>${approverName}</strong>.`)}
      ${box(`<strong>${riskCode}</strong><br>${riskTitle}<br><span style="color:#16A34A;font-size:12px;font-weight:600;">✓ Status: Closed</span>`, '#F0FDF4', '#16A34A')}
      ${p('Risiko ini kini berstatus <strong>Closed</strong> dan seluruh data telah terkunci sebagai catatan permanen.')}
      ${btn('Lihat Detail Risiko', `${ARNES.appUrl}/risks/${riskId}`)}
    `),
  },

  closure_rejected: {
    subject: ({ riskCode }) => `[AVIRA] Penutupan risiko ${riskCode} ditolak`,
    body: ({ recipientName, riskCode, riskTitle, approverName, rejectionReason, riskId }) => wrap(`
      ${h2('Penutupan Risiko Ditolak')}
      ${p(`Yth. Bapak/Ibu <strong>${recipientName}</strong>,`)}
      ${p(`Permintaan penutupan yang Anda ajukan <strong style="color:#EF4444;">ditolak</strong> oleh <strong>${approverName}</strong>.`)}
      ${box(`<strong>${riskCode}</strong><br>${riskTitle}`, '#FFF5F5', '#EF4444')}
      ${p('<strong>Alasan penolakan:</strong>')}
      ${blockquote(rejectionReason ?? '', '#EF4444')}
      ${p('Mohon tindaklanjuti dan ajukan kembali setelah kondisi mitigasi memenuhi syarat.')}
      ${btn('Lihat Detail Risiko', `${ARNES.appUrl}/risks/${riskId}`)}
    `),
  },

  risk_escalated: {
    subject: ({ riskCode }) => `[AVIRA] Risiko ${riskCode} ditambahkan ke agenda MRM`,
    body: ({ recipientName, riskCode, riskTitle, mrmReason, riskId }) => wrap(`
      ${h2('Risiko Baru dalam Agenda MRM')}
      ${p(`Yth. Bapak/Ibu <strong>${recipientName}</strong>,`)}
      ${p('Risiko berikut telah ditambahkan ke agenda Management Review Meeting:')}
      ${box(`<strong>${riskCode}</strong><br>${riskTitle}${mrmReason ? `<br><span style="color:#6B7280;font-size:12px;"><strong>Alasan:</strong> ${mrmReason}</span>` : ''}`)}
      ${p('Mohon persiapkan pembahasan risiko ini pada Management Review Meeting berikutnya.')}
      ${btn('Lihat Detail Risiko', `${ARNES.appUrl}/risks/${riskId}`)}
      ${hr()}
      ${p('Email ini dikirim kepada seluruh Admin AVIRA.', true)}
    `),
  },

  library_expiring: {
    subject: ({ daysUntilExpire }) => `[AVIRA] ${daysUntilExpire} hari lagi: Risiko di Risk Library akan expire`,
    body: ({ recipientName, riskTitle, daysUntilExpire }) => wrap(`
      ${h2('Risiko di Risk Library Akan Expire')}
      ${p(`Yth. Bapak/Ibu <strong>${recipientName}</strong>,`)}
      ${p('Risiko berikut yang Anda simpan di Risk Library akan expire dalam waktu dekat:')}
      ${box(`<strong>${riskTitle}</strong><br><span style="color:#D97706;font-size:12px;font-weight:600;">Expire dalam ${daysUntilExpire} hari</span>`, '#FFFBEB', '#D97706')}
      ${p('Setelah expire, risiko perlu diaktifkan kembali sebelum dapat dimasukkan ke Risk Register.')}
      ${btn('Proses ke Risk Register', `${ARNES.appUrl}/risk-library`)}
      ${hr()}
      ${p('Risiko di Risk Library akan otomatis expire setelah 90 hari tidak diproses.', true)}
    `),
  },

  user_deactivated: {
    subject: ({ deactivatedUserName }) => `[AVIRA] Akses ${deactivatedUserName} telah dinonaktifkan`,
    body: ({ recipientName, deactivatedUserName, deactivatedByName }) => wrap(`
      ${h2('Konfirmasi: Akses Pengguna Dinonaktifkan')}
      ${p(`Yth. Bapak/Ibu <strong>${recipientName}</strong>,`)}
      ${p('Berikut konfirmasi bahwa akses pengguna berikut telah dinonaktifkan dari sistem AVIRA:')}
      ${box(`<strong>Nama:</strong> ${deactivatedUserName}<br>
        <strong>Dinonaktifkan oleh:</strong> ${deactivatedByName}<br>
        <strong>Waktu:</strong> ${new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Jakarta', hour12: false }).format(new Date()).replace(/\./g, ':').replace(/(\d{4})\s(\d)/, '$1, $2') + ' WIB'}`,
        '#F9FAFB', '#6B7280')}
      ${p('Pengguna tersebut tidak lagi dapat mengakses sistem AVIRA. Data historis tetap tersimpan untuk audit trail.')}
      ${btn('Kelola Pengguna', `${ARNES.appUrl}/users`)}
      ${hr()}
      ${p('Email ini dikirim sebagai bukti dokumentasi offboarding sesuai ISO 27001 A.9.2.6.', true)}
    `),
  },
}

export function getEmailTemplate(template: EmailTemplate, data: EmailData) {
  const t = EMAIL_TEMPLATES[template]
  return { from: ARNES.from, subject: t.subject(data), html: t.body(data) }
}

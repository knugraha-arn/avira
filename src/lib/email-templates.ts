// ============================================================
// ARNES — Arranet Notification Services
// Email Templates untuk AVIRA Risk Management
// Semua template ada di file ini untuk kemudahan maintenance
// ============================================================

const BRAND = {
  name:    'ARNES — Arranet Notification Services',
  from:    'arnes-noreply@arranetwork.com',
  color:   '#0344D8',
  logo:    'ARNES',
  footer:  'Arranet · AVIRA Risk Management System',
  url:     'https://avira.arranetwork.com',
}

// ── Base HTML wrapper ─────────────────────────────────────────
function baseHtml(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F8F9FB;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FB;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background:${BRAND.color};border-radius:8px 8px 0 0;padding:20px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="color:white;font-size:16px;font-weight:700;letter-spacing:0.05em">${BRAND.logo}</span>
                    <span style="color:rgba(255,255,255,0.5);font-size:11px;margin-left:8px">Arranet Notification Services</span>
                  </td>
                  <td align="right">
                    <span style="color:rgba(255,255,255,0.6);font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase">AVIRA</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:white;padding:32px;border-left:1px solid #E5E7EB;border-right:1px solid #E5E7EB;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8F9FB;border:1px solid #E5E7EB;border-top:0;border-radius:0 0 8px 8px;padding:16px 32px;">
              <p style="margin:0;font-size:11px;color:#9CA3AF;text-align:center;">
                ${BRAND.footer} · <a href="${BRAND.url}" style="color:${BRAND.color};text-decoration:none">avira.arranetwork.com</a>
              </p>
              <p style="margin:6px 0 0;font-size:10px;color:#D1D5DB;text-align:center;">
                Email ini dikirim otomatis oleh sistem. Mohon tidak membalas email ini.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function btn(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
    <tr>
      <td style="background:${BRAND.color};border-radius:6px;padding:12px 24px;">
        <a href="${url}" style="color:white;font-size:14px;font-weight:600;text-decoration:none;">${text}</a>
      </td>
    </tr>
  </table>`
}

function infoBox(content: string, color = '#EBF2FF', borderColor = '#0344D8'): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    <tr>
      <td style="background:${color};border-left:3px solid ${borderColor};border-radius:0 4px 4px 0;padding:12px 16px;font-size:13px;color:#1A1F2E;line-height:1.6;">
        ${content}
      </td>
    </tr>
  </table>`
}

function heading(text: string): string {
  return `<h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1A1F2E;">${text}</h2>`
}

function para(text: string, muted = false): string {
  return `<p style="margin:12px 0;font-size:14px;color:${muted ? '#6B7280' : '#374151'};line-height:1.6;">${text}</p>`
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">`
}

// ============================================================
// TEMPLATE DEFINITIONS
// ============================================================

export type EmailTemplate =
  | 'invite'
  | 'review_due'
  | 'mitigation_overdue'
  | 'closure_request'
  | 'closure_approved'
  | 'closure_rejected'
  | 'risk_escalated'
  | 'library_expiring'
  | 'user_deactivated'

export interface EmailData {
  // invite
  recipientName?: string
  inviterName?: string
  role?: string
  // review_due
  riskCode?: string
  riskTitle?: string
  daysUntilReview?: number
  // mitigation_overdue
  daysOverdue?: number
  progressPct?: number
  // closure_request
  requesterName?: string
  justification?: string
  // closure_approved / rejected
  approverName?: string
  rejectionReason?: string
  // risk_escalated
  mrmReason?: string
  // library_expiring
  daysUntilExpire?: number
  // user_deactivated
  deactivatedUserName?: string
  deactivatedByName?: string
  // shared
  riskId?: string
  libraryId?: string
}

export const EMAIL_TEMPLATES: Record<EmailTemplate, {
  subject: (data: EmailData) => string
  html:    (data: EmailData) => string
}> = {

  // 1. Undangan pengguna baru
  invite: {
    subject: ({ inviterName }) =>
      `[AVIRA] ${inviterName} mengundang Anda bergabung`,
    html: ({ recipientName, inviterName, role }) => baseHtml(`
      ${heading('Undangan Bergabung ke AVIRA')}
      ${para(`Yth. Bapak/Ibu <strong>${recipientName}</strong>,`)}
      ${para(`Anda telah diundang oleh <strong>${inviterName}</strong> untuk bergabung ke sistem manajemen risiko <strong>AVIRA</strong> milik Arranet dengan hak akses sebagai:`)}
      ${infoBox(`<strong>Role:</strong> ${role}`)}
      ${para('Untuk mengaktifkan akun Anda, silakan masuk menggunakan akun Google <strong>@arranetwork.com</strong> melalui tautan berikut:')}
      ${btn('Masuk ke AVIRA', BRAND.url)}
      ${divider()}
      ${para('Apabila Anda merasa tidak merasa mendaftar atau menerima email ini secara tidak sengaja, abaikan email ini.', true)}
    `, `Undangan AVIRA dari ${inviterName}`),
  },

  // 2. Review risiko jatuh tempo
  review_due: {
    subject: ({ riskCode, daysUntilReview }) =>
      `[AVIRA] Review ${riskCode} jatuh tempo dalam ${daysUntilReview} hari`,
    html: ({ recipientName, riskCode, riskTitle, daysUntilReview, riskId }) => baseHtml(`
      ${heading('Pengingat: Review Risiko Jatuh Tempo')}
      ${para(`Yth. Bapak/Ibu <strong>${recipientName}</strong>,`)}
      ${para('Risiko berikut memerlukan review dalam waktu dekat:')}
      ${infoBox(`
        <strong>${riskCode}</strong><br>
        ${riskTitle}<br>
        <span style="color:#6B7280;font-size:12px;">Jatuh tempo: <strong>${daysUntilReview === 0 ? 'Hari ini' : `${daysUntilReview} hari lagi`}</strong></span>
      `, daysUntilReview === 0 ? '#FFF5F5' : '#FFF8EC', daysUntilReview === 0 ? '#EF4444' : '#FFC128')}
      ${para('Mohon segera lakukan review untuk memastikan data risiko tetap akurat dan terkini sesuai kondisi organisasi.')}
      ${btn('Lakukan Review Sekarang', `${BRAND.url}/risks/${riskId}/review`)}
      ${divider()}
      ${para('Email ini dikirim karena Anda terdaftar sebagai Risk Owner dari risiko tersebut.', true)}
    `, `Review ${riskCode} jatuh tempo`),
  },

  // 3. Mitigasi terlambat
  mitigation_overdue: {
    subject: ({ riskCode, daysOverdue }) =>
      `[AVIRA] Mitigasi ${riskCode} terlambat ${daysOverdue} hari`,
    html: ({ recipientName, riskCode, riskTitle, daysOverdue, progressPct, riskId }) => baseHtml(`
      ${heading('Peringatan: Mitigasi Risiko Terlambat')}
      ${para(`Yth. Bapak/Ibu <strong>${recipientName}</strong>,`)}
      ${para('Pelaksanaan mitigasi untuk risiko berikut telah melewati target penyelesaian:')}
      ${infoBox(`
        <strong>${riskCode}</strong><br>
        ${riskTitle}<br>
        <span style="color:#6B7280;font-size:12px;">
          Keterlambatan: <strong style="color:#EF4444;">+${daysOverdue} hari</strong> &nbsp;·&nbsp;
          Progress: <strong>${progressPct}%</strong>
        </span>
      `, '#FFF5F5', '#EF4444')}
      ${para('Mohon segera perbarui status mitigasi atau koordinasikan dengan pihak terkait untuk percepatan penyelesaian.')}
      ${btn('Perbarui Log Mitigasi', `${BRAND.url}/risks/${riskId}`)}
      ${divider()}
      ${para('Email ini dikirim karena Anda terdaftar sebagai Risk Owner atau Treatment Owner dari risiko tersebut.', true)}
    `, `Mitigasi ${riskCode} terlambat`),
  },

  // 4. Permintaan penutupan risiko
  closure_request: {
    subject: ({ riskCode }) =>
      `[AVIRA] Permintaan penutupan risiko ${riskCode} menunggu persetujuan Anda`,
    html: ({ recipientName, riskCode, riskTitle, requesterName, justification, riskId }) => baseHtml(`
      ${heading('Permintaan Penutupan Risiko')}
      ${para(`Yth. Bapak/Ibu <strong>${recipientName}</strong>,`)}
      ${para(`<strong>${requesterName}</strong> mengajukan permintaan penutupan risiko berikut dan memerlukan persetujuan Anda:`)}
      ${infoBox(`<strong>${riskCode}</strong><br>${riskTitle}`)}
      ${para('<strong>Justifikasi efektivitas mitigasi:</strong>')}
      <blockquote style="margin:0 0 16px;padding:12px 16px;background:#F9FAFB;border-left:3px solid #D1D5DB;border-radius:0 4px 4px 0;font-size:13px;color:#374151;line-height:1.6;">
        ${justification}
      </blockquote>
      ${para('Mohon tinjau justifikasi di atas dan berikan keputusan Anda melalui sistem AVIRA.')}
      ${btn('Review & Putuskan', `${BRAND.url}/risks/${riskId}/approve-closure`)}
      ${divider()}
      ${para('Anda menerima email ini karena ditunjuk sebagai approver untuk penutupan risiko ini.', true)}
    `, `Permintaan penutupan ${riskCode}`),
  },

  // 5. Penutupan risiko disetujui
  closure_approved: {
    subject: ({ riskCode }) =>
      `[AVIRA] Penutupan risiko ${riskCode} telah disetujui`,
    html: ({ recipientName, riskCode, riskTitle, approverName, riskId }) => baseHtml(`
      ${heading('Penutupan Risiko Disetujui')}
      ${para(`Yth. Bapak/Ibu <strong>${recipientName}</strong>,`)}
      ${para(`Permintaan penutupan risiko yang Anda ajukan telah <strong style="color:#16A34A;">disetujui</strong> oleh <strong>${approverName}</strong>.`)}
      ${infoBox(`<strong>${riskCode}</strong><br>${riskTitle}<br><span style="color:#16A34A;font-size:12px;font-weight:600;">✓ Status: Closed</span>`, '#F0FDF4', '#16A34A')}
      ${para('Risiko ini kini berstatus <strong>Closed</strong> dan seluruh data telah terkunci sebagai catatan permanen.')}
      ${btn('Lihat Detail Risiko', `${BRAND.url}/risks/${riskId}`)}
    `, `Penutupan ${riskCode} disetujui`),
  },

  // 6. Penutupan risiko ditolak
  closure_rejected: {
    subject: ({ riskCode }) =>
      `[AVIRA] Penutupan risiko ${riskCode} ditolak`,
    html: ({ recipientName, riskCode, riskTitle, approverName, rejectionReason, riskId }) => baseHtml(`
      ${heading('Penutupan Risiko Ditolak')}
      ${para(`Yth. Bapak/Ibu <strong>${recipientName}</strong>,`)}
      ${para(`Permintaan penutupan risiko yang Anda ajukan <strong style="color:#EF4444;">ditolak</strong> oleh <strong>${approverName}</strong>.`)}
      ${infoBox(`<strong>${riskCode}</strong><br>${riskTitle}`, '#FFF5F5', '#EF4444')}
      ${para('<strong>Alasan penolakan:</strong>')}
      <blockquote style="margin:0 0 16px;padding:12px 16px;background:#F9FAFB;border-left:3px solid #EF4444;border-radius:0 4px 4px 0;font-size:13px;color:#374151;line-height:1.6;">
        ${rejectionReason}
      </blockquote>
      ${para('Mohon tindaklanjuti catatan di atas dan ajukan kembali setelah kondisi mitigasi memenuhi syarat penutupan.')}
      ${btn('Lihat Detail Risiko', `${BRAND.url}/risks/${riskId}`)}
    `, `Penutupan ${riskCode} ditolak`),
  },

  // 7. Risiko dieskalasi ke MRM
  risk_escalated: {
    subject: ({ riskCode }) =>
      `[AVIRA] Risiko ${riskCode} ditambahkan ke agenda MRM`,
    html: ({ recipientName, riskCode, riskTitle, mrmReason, riskId }) => baseHtml(`
      ${heading('Risiko Baru dalam Agenda MRM')}
      ${para(`Yth. Bapak/Ibu <strong>${recipientName}</strong>,`)}
      ${para('Risiko berikut telah ditambahkan ke agenda Management Review Meeting:')}
      ${infoBox(`
        <strong>${riskCode}</strong><br>
        ${riskTitle}<br>
        ${mrmReason ? `<span style="color:#6B7280;font-size:12px;"><strong>Alasan:</strong> ${mrmReason}</span>` : ''}
      `)}
      ${para('Mohon persiapkan pembahasan risiko ini pada Management Review Meeting berikutnya.')}
      ${btn('Lihat Detail Risiko', `${BRAND.url}/risks/${riskId}`)}
      ${divider()}
      ${para('Email ini dikirim kepada seluruh Admin AVIRA.', true)}
    `, `Risiko ${riskCode} masuk agenda MRM`),
  },

  // 8. Risk Library akan expire
  library_expiring: {
    subject: ({ daysUntilExpire }) =>
      `[AVIRA] ${daysUntilExpire} hari lagi: Risiko di Risk Library akan expire`,
    html: ({ recipientName, riskTitle, daysUntilExpire, libraryId }) => baseHtml(`
      ${heading('Risiko di Risk Library Akan Expire')}
      ${para(`Yth. Bapak/Ibu <strong>${recipientName}</strong>,`)}
      ${para('Risiko berikut yang Anda simpan di Risk Library akan expire dalam waktu dekat:')}
      ${infoBox(`
        <strong>${riskTitle}</strong><br>
        <span style="color:#D97706;font-size:12px;font-weight:600;">Expire dalam ${daysUntilExpire} hari</span>
      `, '#FFFBEB', '#D97706')}
      ${para('Setelah expire, risiko tidak dapat langsung dimasukkan ke Risk Register dan perlu diaktifkan kembali terlebih dahulu.')}
      ${btn('Proses ke Risk Register', `${BRAND.url}/risk-library`)}
      ${divider()}
      ${para('Risiko di Risk Library akan otomatis expire setelah 90 hari tidak diproses, sesuai kebijakan manajemen risiko Arranet.', true)}
    `, 'Risiko Library akan expire'),
  },

  // 9. Pengguna dinonaktifkan
  user_deactivated: {
    subject: ({ deactivatedUserName }) =>
      `[AVIRA] Akses ${deactivatedUserName} telah dinonaktifkan`,
    html: ({ recipientName, deactivatedUserName, deactivatedByName }) => baseHtml(`
      ${heading('Konfirmasi: Akses Pengguna Dinonaktifkan')}
      ${para(`Yth. Bapak/Ibu <strong>${recipientName}</strong>,`)}
      ${para('Berikut adalah konfirmasi bahwa akses pengguna berikut telah dinonaktifkan dari sistem AVIRA:')}
      ${infoBox(`
        <strong>Nama:</strong> ${deactivatedUserName}<br>
        <strong>Dinonaktifkan oleh:</strong> ${deactivatedByName}<br>
        <strong>Waktu:</strong> ${new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
      `, '#F9FAFB', '#6B7280')}
      ${para('Pengguna tersebut tidak lagi dapat mengakses sistem AVIRA. Data historis tetap tersimpan untuk keperluan audit trail.')}
      ${btn('Kelola Pengguna', `${BRAND.url}/users`)}
      ${divider()}
      ${para('Email ini dikirim sebagai bukti dokumentasi proses offboarding sesuai ISO 27001 A.9.2.6.', true)}
    `, `Akses ${deactivatedUserName} dinonaktifkan`),
  },
}

// ── Helper function untuk kirim email ─────────────────────────
export function getEmailTemplate(template: EmailTemplate, data: EmailData) {
  const t = EMAIL_TEMPLATES[template]
  return {
    from:    `ARNES — Arranet Notification Services <arnes-noreply@arranetwork.com>`,
    subject: t.subject(data),
    html:    t.html(data),
  }
}

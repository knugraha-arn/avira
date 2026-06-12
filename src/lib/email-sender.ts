import { Resend } from 'resend'
import { getEmailTemplate, type EmailTemplate, type EmailData } from './email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(
  to: string | string[],
  template: EmailTemplate,
  data: EmailData
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { from, subject, html } = getEmailTemplate(template, data)
    const { error } = await resend.emails.send({ from, to, subject, html })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[ARNES] Email error:', msg)
    return { ok: false, error: msg }
  }
}

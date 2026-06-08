import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `Anda adalah konsultan manajemen risiko berpengalaman yang membantu organisasi mengidentifikasi risiko berdasarkan ISO 27001 dan best practice manajemen risiko.

ATURAN OUTPUT:
- Kembalikan HANYA valid JSON array, tanpa teks tambahan, tanpa markdown backticks, tanpa komentar
- Mulai langsung dengan karakter [ dan akhiri dengan ]
- Hasilkan tepat 5 risiko yang spesifik terhadap konteks yang diberikan

FORMAT JSON:
[{"judul":"...","kategori":"Technology","deskripsi":"...","mengapa_relevan":"...","pertanyaan_reflektif":["...","..."],"likelihood":3,"impact":4,"klasifikasi":"High","kontrol_yang_mungkin_ada":"...","treatment_saran":"Mitigate"}]

Kategori valid: Strategic, Operational, Financial, Compliance, Technology, Human Resources, Reputational, Other
Klasifikasi valid: Low, Medium, High, Extreme
Treatment valid: Mitigate, Accept, Transfer, Avoid`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { scope, deskripsi, fokus } = body

  if (!deskripsi?.trim()) {
    return Response.json({ error: 'Deskripsi wajib diisi' }, { status: 400 })
  }

  const userPrompt = `Analisis potensi risiko untuk situasi berikut:

SCOPE: ${scope || 'Umum'}
FOKUS RISIKO: ${fokus?.join(', ') || 'Semua kategori'}

KONTEKS:
${deskripsi}

Hasilkan tepat 5 risiko paling relevan dan spesifik. Kembalikan HANYA JSON array.`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Extract JSON array
    const startIdx = text.indexOf('[')
    const endIdx   = text.lastIndexOf(']')

    if (startIdx === -1 || endIdx === -1) {
      return Response.json({ error: 'Format respons AI tidak valid' }, { status: 500 })
    }

    const jsonStr = text.substring(startIdx, endIdx + 1)
    const risks   = JSON.parse(jsonStr)

    return Response.json({ risks })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 500 })
  }
}

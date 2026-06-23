import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { REFERENCE_MAP, type StandardKey } from '@/lib/risk-generator/references'

export const runtime = 'nodejs'
export const maxDuration = 60

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const BASE_PROMPT = `Anda adalah konsultan manajemen risiko berpengalaman yang membantu organisasi mengidentifikasi risiko.

ATURAN OUTPUT:
- Kembalikan HANYA valid JSON array, tanpa teks tambahan, tanpa markdown backticks, tanpa komentar
- Mulai langsung dengan karakter [ dan akhiri dengan ]
- Hasilkan tepat 5 risiko yang spesifik terhadap konteks yang diberikan

FORMAT JSON:
[{"judul":"...","kategori":"Technology","deskripsi":"...","mengapa_relevan":"...","pertanyaan_reflektif":["...","..."],"likelihood":3,"impact":4,"klasifikasi":"High","kontrol_yang_mungkin_ada":"...","treatment_saran":"Mitigate","referensi_standar":"..."}]

Kategori valid: Strategic, Operational, Financial, Compliance, Technology, Human Resources, Reputational, Other
Klasifikasi valid: Low, Medium, High, Extreme
Treatment valid: Mitigate, Accept, Transfer, Avoid

Field "referensi_standar" wajib diisi dengan klausul/bab spesifik dari referensi standar yang diberikan di bawah (contoh: "ISO 27001 A.8.1" atau "POJK PTI Bab IV — Manajemen Risiko TI"). Jika risiko relevan ke lebih dari satu standar yang diberikan, sebutkan semuanya dipisah " · ".`

function buildSystemPrompt(standards: StandardKey[]): string {
  const validStandards = standards.filter(s => REFERENCE_MAP[s])

  if (validStandards.length === 0) {
    // Fallback: tidak ada standar dipilih, pakai ISO 27001 sebagai default
    return `${BASE_PROMPT}\n\nGunakan ISO 27001 dan best practice manajemen risiko umum sebagai referensi.\n\n${REFERENCE_MAP.iso27001.text}`
  }

  const refTexts = validStandards.map(s => REFERENCE_MAP[s].text).join('\n\n---\n\n')
  const labels = validStandards.map(s => REFERENCE_MAP[s].label).join(', ')

  return `${BASE_PROMPT}\n\nGunakan referensi standar berikut (${labels}) sebagai dasar identifikasi risiko. Pastikan setiap risiko yang dihasilkan dapat dikaitkan secara spesifik ke salah satu atau lebih kategori dalam referensi ini — jangan generik.\n\n${refTexts}`
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { scope, deskripsi, fokus, standards } = body

  if (!deskripsi?.trim()) {
    return Response.json({ error: 'Deskripsi wajib diisi' }, { status: 400 })
  }

  const selectedStandards: StandardKey[] = Array.isArray(standards) && standards.length > 0
    ? standards
    : ['iso27001']

  const systemPrompt = buildSystemPrompt(selectedStandards)

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
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

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

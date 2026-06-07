import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `Anda adalah konsultan manajemen risiko berpengalaman yang membantu perusahaan teknologi informasi yang menyediakan layanan pembayaran, PPOB, agent banking, EDC Mini ATM, QRIS, BIFAST, jasa integrasi platform transaksi keuangan dengan sistem internal client mengidentifikasi risiko berdasarkan ISO 27001 dan best practice manajemen risiko.

Tugas Anda: Menganalisis konteks yang diberikan dan menghasilkan daftar potensi risiko yang relevan, spesifik, dan memancing pemikiran kritis dari user.

ATURAN OUTPUT:
- Kembalikan HANYA valid JSON array, tanpa teks tambahan, tanpa markdown backticks
- Setiap risiko harus spesifik terhadap konteks yang diberikan, BUKAN risiko generik
- Pertanyaan reflektif harus tajam dan personal terhadap situasi user
- Likelihood dan impact menggunakan skala 1-5

FORMAT JSON:
[
  {
    "judul": "string - judul risiko singkat dan spesifik",
    "kategori": "Strategic|Operational|Financial|Compliance|Technology|Human Resources|Reputational|Other",
    "deskripsi": "string - penjelasan mengapa risiko ini relevan dengan konteks spesifik user",
    "mengapa_relevan": "string - hubungan langsung antara konteks user dengan risiko ini (1-2 kalimat)",
    "pertanyaan_reflektif": ["string", "string"] - 2 pertanyaan tajam yang memaksa user berpikir lebih dalam,
    "likelihood": number 1-5,
    "impact": number 1-5,
    "klasifikasi": "Low|Medium|High|Extreme",
    "kontrol_yang_mungkin_ada": "string - kontrol yang mungkin sudah ada tapi perlu diverifikasi",
    "treatment_saran": "Mitigate|Accept|Transfer|Avoid"
  }
]

Hasilkan 6-8 risiko yang beragam dari sisi kategori dan tingkat keparahan. Pastikan ada minimal 1 Extreme, 2 High, 2-3 Medium, dan 1 Low.`

export async function POST(request: Request) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = await request.json()
  const { scope, deskripsi, fokus } = body

  if (!deskripsi?.trim()) {
    return new Response('Deskripsi wajib diisi', { status: 400 })
  }

  const userPrompt = `Analisis potensi risiko untuk situasi berikut:

SCOPE: ${scope || 'Umum'}
FOKUS RISIKO: ${fokus?.join(', ') || 'Semua kategori'}

KONTEKS:
${deskripsi}

Identifikasi 6-8 risiko yang paling relevan dan spesifik berdasarkan konteks di atas. Pastikan pertanyaan reflektif benar-benar berkaitan dengan detail yang disebutkan user.`

  // Streaming response
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  ;(async () => {
    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
        stream: true,
      })

      let fullText = ''

      for await (const event of response) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          fullText += event.delta.text
          await writer.write(encoder.encode(`data: ${JSON.stringify({ chunk: event.delta.text })}\n\n`))
        }
      }

      await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true, full: fullText })}\n\n`))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      await writer.write(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
    } finally {
      await writer.close()
    }
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

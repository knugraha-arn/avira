import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const [reviewResult, overdueResult] = await Promise.all([
    supabase.rpc('avr_notify_review_due'),
    supabase.rpc('avr_notify_overdue_mitigation'),
  ])

  return NextResponse.json({
    ok: true,
    review_due:         reviewResult.error?.message ?? 'ok',
    overdue_mitigation: overdueResult.error?.message ?? 'ok',
    timestamp:          new Date().toISOString(),
  })
}

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const [reviewResult, overdueResult, expireResult, notifyExpireResult] = await Promise.all([
    supabase.rpc('avr_notify_review_due'),
    supabase.rpc('avr_notify_overdue_mitigation'),
    supabase.rpc('avr_expire_risk_library'),
    supabase.rpc('avr_notify_library_expiring'),
  ])

  return NextResponse.json({
    ok:                 true,
    review_due:         reviewResult.error?.message ?? 'ok',
    overdue_mitigation: overdueResult.error?.message ?? 'ok',
    expire_library:     expireResult.error?.message ?? 'ok',
    notify_expiring:    notifyExpireResult.error?.message ?? 'ok',
    timestamp:          new Date().toISOString(),
  })
}

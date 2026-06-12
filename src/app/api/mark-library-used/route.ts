import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { library_id, risk_id } = await request.json()
  if (!library_id || !risk_id) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('avr_risk_library')
    .update({
      status:  'used',
      risk_id: risk_id,
      used_at: new Date().toISOString(),
      used_by: user.id,
    })
    .eq('id', library_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

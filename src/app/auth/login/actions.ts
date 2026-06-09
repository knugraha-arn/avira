'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signInWithGoogle() {
  const origin = (await headers()).get('origin') ?? 'https://avira.arranetwork.com'
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        hd: 'arranetwork.com',
      },
    },
  })

  if (error) throw error
  if (data.url) redirect(data.url)
}

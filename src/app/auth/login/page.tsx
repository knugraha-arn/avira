'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ShieldCheck, Eye, EyeOff } from 'lucide-react'

const FEATURES = [
  'Risk Register terpusat dengan audit trail otomatis',
  'Heatmap 5×5 real-time berbasis ISO 27001',
  'Workflow mitigasi & closure dengan segregation of duties',
  'Laporan siap Management Review Meeting',
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Login gagal', { description: error.message })
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col bg-brand-navy relative overflow-hidden shrink-0">

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Accent blob */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-brand-blue opacity-20 blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-64 h-64 rounded-full bg-brand-blue opacity-10 blur-3xl" />

        <div className="relative flex flex-col h-full px-10 py-10">

          {/* Company wordmark */}
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-sm font-medium tracking-wide">arranet</span>
          </div>

          {/* App brand */}
          <div className="mt-auto mb-2">
            {/* App icon */}
            <div className="w-16 h-16 rounded-2xl bg-brand-blue flex items-center justify-center mb-6 shadow-lg">
              <ShieldCheck size={32} className="text-white" strokeWidth={1.5} />
            </div>

            <span className="eyebrow mb-3 inline-block">ISO 27001</span>
            <h1 className="text-white text-4xl font-bold tracking-tight leading-tight">
              AVIRA
            </h1>
            <p className="text-white/50 mt-2 text-sm leading-relaxed">
              Avira Risk Management · Sistem manajemen<br />
              risiko informasi terintegrasi
            </p>

            {/* Feature list */}
            <ul className="mt-8 space-y-3">
              {FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/60">
                  <span className="mt-0.5 w-4 h-4 rounded-full bg-brand-lime/20 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-lime" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-white/8">
            <p className="text-white/25 text-xs">AVIRA · by Arranet · v1.0</p>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-brand-blue flex items-center justify-center">
              <ShieldCheck size={16} className="text-white" strokeWidth={1.5} />
            </div>
            <span className="font-semibold text-brand-navy">AVIRA</span>
          </div>

          <h2 className="text-2xl font-semibold text-brand-navy">Selamat datang</h2>
          <p className="text-black/40 text-sm mt-1 mb-8">
            Masuk untuk mengakses dashboard risiko Anda
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="nama@arranet.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full justify-center py-2.5 mt-2"
              disabled={loading}
            >
              {loading
                ? <span className="flex items-center gap-2"><Spinner /> Masuk...</span>
                : 'Masuk'}
            </button>
          </form>

          <p className="text-center text-black/25 text-xs mt-10">
            AVIRA Risk Management · Arranet © {new Date().getFullYear()}
          </p>
        </div>
      </div>

    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}

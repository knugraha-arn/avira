'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck } from 'lucide-react'

const FEATURES = [
  'Risk Register terpusat dengan audit trail otomatis',
  'Heatmap 5×5 real-time berbasis ISO 27001',
  'Workflow mitigasi & closure dengan segregation of duties',
  'Laporan siap Management Review Meeting',
]

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          hd: 'arranetwork.com',
        },
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col bg-brand-navy relative overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-brand-blue opacity-20 blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-64 h-64 rounded-full bg-brand-blue opacity-10 blur-3xl" />

        <div className="relative flex flex-col h-full px-10 py-10">
          <span className="text-white/40 text-sm font-medium tracking-wide">arranet</span>

          <div className="mt-auto mb-2">
            <div className="w-16 h-16 rounded-2xl bg-brand-blue flex items-center justify-center mb-6 shadow-lg">
              <ShieldCheck size={32} className="text-white" strokeWidth={1.5} />
            </div>
            <span className="eyebrow mb-3 inline-block">ISO 27001</span>
            <h1 className="text-white text-4xl font-bold tracking-tight leading-tight">AVIRA</h1>
            <p className="text-white/50 mt-2 text-sm leading-relaxed">
              Avira Risk Management · Sistem manajemen<br />risiko informasi terintegrasi
            </p>
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
            Masuk menggunakan akun Google Arranet kamu untuk melanjutkan.
          </p>

          {error && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-lg border border-black/10 bg-white px-4 py-3.5 text-sm font-medium text-black hover:bg-brand-gray active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? <Spinner /> : <GoogleIcon />}
            {loading ? 'Menghubungkan...' : 'Masuk dengan Google'}
          </button>

          <p className="text-center text-xs mt-5" style={{ color: 'rgba(0,0,0,0.3)' }}>
            Hanya akun dengan domain{' '}
            <span style={{ color: 'rgba(0,0,0,0.5)', fontWeight: 500 }}>@arranetwork.com</span>{' '}
            yang dapat mengakses platform ini.
          </p>

          <p className="text-center text-xs mt-10" style={{ color: 'rgba(0,0,0,0.2)' }}>
            AVIRA Risk Management · Arranet © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}

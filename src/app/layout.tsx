import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'AVIRA — Risk Management',
    template: '%s · AVIRA',
  },
  description: 'Sistem Manajemen Risiko Informasi · ISO 27001',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}

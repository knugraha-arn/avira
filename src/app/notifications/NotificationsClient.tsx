'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Bell, BellOff, CheckCheck, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  type: string
  title: string
  message: string | null
  is_read: boolean
  created_at: string
  risk_id: string | null
  risk?: { risk_code: string; title: string } | null
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  review_due:          { label: 'Review Due',        color: 'bg-brand-amber/10 text-[#7A4C00] border-brand-amber/20' },
  overdue_mitigation:  { label: 'Overdue',           color: 'bg-red-50 text-red-600 border-red-200' },
  closure_request:     { label: 'Closure Request',   color: 'bg-blue-50 text-brand-blue border-brand-blue/20' },
  closure_decided:     { label: 'Closure Decided',   color: 'bg-risk-low text-risk-low-text border-risk-low-text/20' },
  high_risk_no_plan:   { label: 'Action Required',   color: 'bg-red-50 text-red-600 border-red-200' },
  risk_escalated:      { label: 'Eskalasi',          color: 'bg-risk-extreme text-risk-extreme-text border-red-700/30' },
}

export function NotificationsClient({
  initialNotifications,
  userId,
}: {
  initialNotifications: Notification[]
  userId: string
}) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const router = useRouter()

  const unread = notifications.filter(n => !n.is_read)

  async function markRead(id: string) {
    const supabase = createClient()
    await supabase.from('avr_notifications').update({ is_read: true }).eq('id', id)
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n))
    router.refresh()
  }

  async function markAllRead() {
    const supabase = createClient()
    const ids = unread.map(n => n.id)
    if (ids.length === 0) return
    await supabase.from('avr_notifications').update({ is_read: true }).in('id', ids)
    setNotifications(ns => ns.map(n => ({ ...n, is_read: true })))
    toast.success('Semua notifikasi ditandai sudah dibaca')
    router.refresh()
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days  = Math.floor(diff / 86400000)
    if (mins < 1)    return 'Baru saja'
    if (mins < 60)   return `${mins} menit lalu`
    if (hours < 24)  return `${hours} jam lalu`
    if (days < 7)    return `${days} hari lalu`
    // Lebih dari 7 hari — tampilkan timestamp lengkap
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: 'Asia/Jakarta', hour12: false,
    }).format(new Date(dateStr)).replace(/\./g, ':').replace(/(\d{4})\s(\d)/, '$1, $2') + ' WIB'
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="eyebrow">Inbox</span>
          <h1 className="mt-1">Notifikasi</h1>
          <p className="text-sm text-black/50 mt-0.5">
            {unread.length > 0 ? `${unread.length} belum dibaca` : 'Semua sudah dibaca'}
          </p>
        </div>
        {unread.length > 0 && (
          <button onClick={markAllRead} className="btn-ghost text-xs gap-1.5">
            <CheckCheck size={14} /> Tandai semua dibaca
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 gap-3">
          <BellOff size={32} className="text-black/15" />
          <p className="text-sm text-black/30">Tidak ada notifikasi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const cfg = TYPE_CONFIG[n.type] ?? { label: n.type, color: 'bg-black/5 text-black/50 border-black/10' }
            return (
              <div key={n.id}
                className={`card py-3 px-4 flex items-start gap-3 transition-colors ${!n.is_read ? 'border-brand-blue/20 bg-blue-50/30' : ''}`}>

                {/* Unread dot */}
                <div className="mt-1 shrink-0">
                  {!n.is_read
                    ? <div className="w-2 h-2 rounded-full bg-brand-blue" />
                    : <div className="w-2 h-2 rounded-full bg-black/10" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`badge text-[10px] ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-xs text-black/30">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className="text-sm font-medium text-black">{n.title}</p>
                  {n.message && <p className="text-xs text-black/50 mt-0.5 leading-relaxed">{n.message}</p>}
                  {n.risk && (
                    <Link href={`/risks/${n.risk_id}`}
                      className="inline-flex items-center gap-1 mt-1.5 text-xs text-brand-blue hover:underline"
                      onClick={() => !n.is_read && markRead(n.id)}>
                      <ExternalLink size={11} />
                      {n.risk.risk_code} — {n.risk.title}
                    </Link>
                  )}
                </div>

                {!n.is_read && (
                  <button onClick={() => markRead(n.id)}
                    className="btn-ghost py-1 px-2 text-xs shrink-0 text-black/40">
                    Baca
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

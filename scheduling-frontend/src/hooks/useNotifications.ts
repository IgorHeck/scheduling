import { useEffect, useRef, useCallback } from 'react'
import { usePendingAppointments } from './useAppointments'

/**
 * Provides browser notification helpers.
 * - `requestPermission()` — asks the user for Notification permission
 * - `notify(title, body)` — fires a browser notification if permission is granted
 */
export function useNotifications() {
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) return 'denied'
    if (Notification.permission === 'granted') return 'granted'
    if (Notification.permission !== 'denied') {
      return await Notification.requestPermission()
    }
    return Notification.permission
  }, [])

  const notify = useCallback((title: string, body?: string) => {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: 'scheduling-pending',
    })
  }, [])

  return { requestPermission, notify }
}

/**
 * Detects increases in the pending-appointments count (via polling) and
 * fires a browser notification when new requests arrive.
 * Must be called inside a component that is mounted throughout the session
 * (e.g. DashboardLayout or DashboardHome).
 */
export function usePendingNotifications() {
  const { data: pending = [] } = usePendingAppointments()
  const prevCountRef = useRef<number | null>(null)
  const { notify } = useNotifications()

  useEffect(() => {
    const newCount = pending.length

    // Skip the first render — we don't want a notification for the initial load
    if (prevCountRef.current === null) {
      prevCountRef.current = newCount
      return
    }

    if (newCount > prevCountRef.current) {
      const diff = newCount - prevCountRef.current
      notify(
        `${diff} novo${diff > 1 ? 's' : ''} agendamento${diff > 1 ? 's' : ''} pendente${diff > 1 ? 's' : ''}`,
        'Acesse "Pendentes" para confirmar ou recusar.',
      )
    }

    prevCountRef.current = newCount
  }, [pending.length, notify])
}

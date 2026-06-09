import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { useNotifications } from './useNotifications'

interface SSEPayload {
  type: string
  message: string
  appointmentId: number | null
}

/** Mensagens de título exibidas na browser notification por tipo de evento */
const EVENT_TITLES: Record<string, string> = {
  NEW_PENDING:              '📅 Novo agendamento pendente',
  APPOINTMENT_CONFIRMED:    '✅ Agendamento confirmado',
  APPOINTMENT_CANCELLED:    '❌ Agendamento cancelado',
  APPOINTMENT_RESCHEDULED:  '🔄 Agendamento remarcado',
}

/** Query keys a invalidar quando qualquer evento de agendamento chega */
const APPOINTMENT_KEYS = [
  ['appointments'],
  ['my-appointments'],
  ['calendar'],
] as const

const SSE_EVENTS = Object.keys(EVENT_TITLES)

/**
 * Abre uma conexão SSE com o backend e reage a eventos de agendamento:
 * - Invalida as queries do React Query (atualiza listas automaticamente)
 * - Dispara notificação do browser (se permissão concedida)
 *
 * Usa `?token=` na URL porque EventSource não suporta headers customizados.
 * O EventSource reconecta automaticamente em caso de queda.
 *
 * Use no componente raiz de cada área autenticada:
 *   - DashboardLayout  → ADMIN / MANAGER
 *   - MyAppointmentsPage → CLIENT
 */
export function useSSENotifications() {
  const { accessToken, user } = useAuthStore()
  const queryClient            = useQueryClient()
  const { notify }             = useNotifications()

  useEffect(() => {
    if (!accessToken || !user) return

    const url = `${import.meta.env.VITE_API_URL}/api/v1/notifications/subscribe` +
                `?token=${encodeURIComponent(accessToken)}`

    const es = new EventSource(url)

    /** Processa qualquer um dos eventos de agendamento */
    const handleEvent = (type: string, raw: MessageEvent) => {
      try {
        const payload: SSEPayload = JSON.parse(raw.data)

        // 1. Atualizar dados na UI
        APPOINTMENT_KEYS.forEach(key =>
          queryClient.invalidateQueries({ queryKey: key })
        )

        // 2. Notificação no browser
        const title = EVENT_TITLES[type] ?? 'Novo evento'
        notify(title, payload.message)
      } catch {
        // payload malformado — ignora silenciosamente
      }
    }

    // Registra listener para cada tipo de evento de negócio
    SSE_EVENTS.forEach(type => {
      es.addEventListener(type, (e) => handleEvent(type, e as MessageEvent))
    })

    // onerror: EventSource já reconecta automaticamente com back-off
    // Não precisamos fazer nada aqui além de não quebrar

    return () => {
      es.close()
    }
  }, [accessToken, user?.id]) // reconecta se trocar de usuário ou token
}

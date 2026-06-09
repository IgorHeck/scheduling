import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAvailableSlots } from '../api/schedules'
import { useRescheduleAppointment } from '../hooks/useAppointments'
import { useModalDismiss } from '../hooks/useModalDismiss'
import type { AppointmentResponse } from '../types/appointment.types'
import { X, User } from 'lucide-react'

interface Slot {
  startAt: string
  endAt: string
  professionalId: number
  professionalName: string
  available: boolean
}

interface Props {
  appointment: AppointmentResponse
  onClose: () => void
}

const today = new Date().toISOString().split('T')[0]

/** Formata um YYYY-MM-DD sem deslocamento de fuso (local midnight) */
const formatDateStr = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  })
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

export function RescheduleModal({ appointment, onClose }: Props) {
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [error, setError]               = useState('')

  // "sujo" quando já escolheu um novo horário ou mudou a data
  const dirty = selectedSlot !== null || selectedDate !== today
  const { shaking, onOverlayClick } = useModalDismiss(dirty, onClose)

  const reschedule = useRescheduleAppointment()

  const { data: rawSlots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ['available-slots', appointment.companyId, selectedDate],
    queryFn:  () => getAvailableSlots(appointment.companyId, selectedDate),
    enabled:  !!selectedDate,
  })

  const slots          = rawSlots as Slot[]
  const availableSlots = slots.filter(s => s.available)

  // Group by professional
  const byProfessional = availableSlots.reduce<Record<string, { name: string; slots: Slot[] }>>(
    (acc, s) => {
      const key = String(s.professionalId)
      if (!acc[key]) acc[key] = { name: s.professionalName, slots: [] }
      acc[key].slots.push(s)
      return acc
    },
    {}
  )

  const handleConfirm = async () => {
    if (!selectedSlot) return
    setError('')
    try {
      await reschedule.mutateAsync({
        id: appointment.id,
        data: { newStartAt: selectedSlot.startAt, newEndAt: selectedSlot.endAt },
      })
      onClose()
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.response?.data?.message
      setError(msg ?? 'Erro ao remarcar. Tente novamente.')
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={onOverlayClick}
    >
      <div
        className={`modal${shaking ? ' modal-shake' : ''}`}
        style={{ maxWidth: 440, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 20px 16px', borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}>
              Remarcar agendamento
            </div>
            <div className="text-meta" style={{ marginTop: 3 }}>
              #{appointment.id} · {appointment.clientName}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '20px', display: 'flex', flexDirection: 'column', gap: 18,
        }}>

          {/* Current appointment summary */}
          <div style={{
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '10px 12px',
          }}>
            <div className="text-tag" style={{ marginBottom: 4 }}>Agendamento atual</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
              {new Date(appointment.startAt).toLocaleString('pt-BR', {
                weekday: 'short', day: '2-digit', month: '2-digit',
                hour: '2-digit', minute: '2-digit',
              })} – {formatTime(appointment.endAt)}
            </div>
            <div className="text-meta" style={{ marginTop: 2 }}>
              com {appointment.professionalName}
            </div>
          </div>

          {/* Date picker */}
          <div className="field">
            <label>Nova data</label>
            <input
              type="date"
              value={selectedDate}
              min={today}
              onChange={e => {
                setSelectedDate(e.target.value)
                setSelectedSlot(null)
              }}
              className="input"
            />
          </div>

          {/* Available slots */}
          {selectedDate && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 10 }}>
                Horários disponíveis
              </div>

              {slotsLoading ? (
                <div className="loading">Carregando horários...</div>
              ) : availableSlots.length === 0 ? (
                <div className="empty" style={{ padding: '20px 0' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink-2)' }}>
                    Nenhum horário disponível
                  </div>
                  <div className="text-meta" style={{ marginTop: 4 }}>Escolha outra data.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {Object.values(byProfessional).map(({ name, slots: profSlots }) => (
                    <div key={name}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        marginBottom: 8,
                      }}>
                        <User size={12} style={{ color: 'var(--ink-3)' }} />
                        <span className="text-tag">{name}</span>
                      </div>
                      <div
                        className="slots"
                        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))' }}
                      >
                        {profSlots.map(slot => (
                          <button
                            key={slot.startAt}
                            onClick={() => setSelectedSlot(slot)}
                            className={`slot${selectedSlot?.startAt === slot.startAt ? ' selected' : ''}`}
                          >
                            {formatTime(slot.startAt)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected slot summary */}
          {selectedSlot && (
            <div style={{
              padding: '10px 12px', borderRadius: 10,
              background: 'color-mix(in oklch, var(--accent) 8%, transparent)',
              border: '1px solid color-mix(in oklch, var(--accent) 22%, transparent)',
            }}>
              <div className="text-tag" style={{ marginBottom: 4 }}>Novo horário selecionado</div>
              <div style={{
                fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', textTransform: 'capitalize',
              }}>
                {formatDateStr(selectedDate)} às {formatTime(selectedSlot.startAt)} – {formatTime(selectedSlot.endAt)}
              </div>
              <div className="text-meta" style={{ marginTop: 2 }}>
                com {selectedSlot.professionalName}
              </div>
            </div>
          )}

          {error && <div className="alert-error">{error}</div>}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: 10, flexShrink: 0,
        }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleConfirm}
            disabled={!selectedSlot || reschedule.isPending}
          >
            {reschedule.isPending ? 'Remarcando...' : 'Confirmar remarcação'}
          </button>
        </div>

      </div>
    </div>
  )
}

import { useEffect } from 'react'
import { X, Clock, Building2, User, UserCircle, MessageSquare } from 'lucide-react'
import type { AppointmentResponse } from '../types/appointment.types'

interface Props {
  appointment: AppointmentResponse
  onClose: () => void
}

const statusBadge: Record<string, string> = {
  PENDING:   'st-pending',
  CONFIRMED: 'st-confirmed',
  CANCELLED: 'st-cancelled',
  COMPLETED: 'st-completed',
  NO_SHOW:   '',
}

const statusLabel: Record<string, string> = {
  PENDING:   'Aguardando confirmação',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Concluído',
  NO_SHOW:   'Não compareceu',
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ color: 'var(--ink-3)', flexShrink: 0, marginTop: 2 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div className="text-tag" style={{ marginBottom: 2 }}>{label}</div>
        <div style={{
          fontSize: 13.5, color: 'var(--ink)', fontWeight: 500,
          textTransform: 'capitalize', wordBreak: 'break-word',
        }}>
          {value}
        </div>
      </div>
    </div>
  )
}

export function AppointmentDetailModal({ appointment: a, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const formatDuration = (startIso: string, endIso: string) => {
    const diff = (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000
    return diff >= 60
      ? `${Math.floor(diff / 60)}h${diff % 60 > 0 ? ` ${diff % 60}min` : ''}`
      : `${diff}min`
  }

  const badgeMod = statusBadge[a.status]

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" style={{ maxWidth: 440 }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '20px 20px 16px', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="text-mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                #{a.id}
              </span>
              <span className={`badge${badgeMod ? ' ' + badgeMod : ''}`}>
                <span className="dot" />
                {statusLabel[a.status]}
              </span>
            </div>
            <div style={{
              fontWeight: 600, fontSize: 14.5, color: 'var(--ink)',
              textTransform: 'capitalize',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {formatDateTime(a.startAt)}
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={onClose}
            style={{ flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <InfoRow
            icon={<Clock size={15} />}
            label="Duração"
            value={`${formatTime(a.startAt)} – ${formatTime(a.endAt)} (${formatDuration(a.startAt, a.endAt)})`}
          />
          <InfoRow icon={<Building2 size={15} />} label="Empresa"      value={a.companyName} />
          <InfoRow icon={<User size={15} />}       label="Profissional" value={a.professionalName} />
          <InfoRow icon={<UserCircle size={15} />} label="Cliente"      value={a.clientName} />

          {a.notes && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ color: 'var(--ink-3)', flexShrink: 0, marginTop: 2 }}>
                <MessageSquare size={15} />
              </div>
              <div>
                <div className="text-tag" style={{ marginBottom: 4 }}>Observações</div>
                <div style={{
                  fontSize: 13, color: 'var(--ink-2)', fontStyle: 'italic',
                  padding: '8px 10px', borderRadius: 8,
                  background: 'color-mix(in oklch, var(--warning) 6%, transparent)',
                }}>
                  "{a.notes}"
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px 20px', borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div className="text-meta" style={{ fontSize: 11.5 }}>
            Criado em {new Date(a.createdAt).toLocaleDateString('pt-BR')}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Fechar
          </button>
        </div>

      </div>
    </div>
  )
}

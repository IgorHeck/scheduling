import { useState } from 'react'
import { Check, X, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { usePendingAppointments, useConfirmAppointment, useCancelAppointment } from '../hooks/useAppointments'
import type { AppointmentResponse } from '../types/appointment.types'
import { useAuthStore } from '../store/authStore'
import { useProfessionalFilterStore } from '../store/professionalFilterStore'
import { AppointmentDetailModal } from './AppointmentDetailModal'

const PAGE_SIZE_OPTIONS = [5, 10, 20]

function getInitials(name: string) {
  return name
    .split(' ')
    .map(s => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function PendingList() {
  const { user } = useAuthStore()
  const { selectedProfessionalId } = useProfessionalFilterStore()
  const isProfessional = user?.role === 'PROFESSIONAL'

  const { data: pending = [], isLoading } = usePendingAppointments(selectedProfessionalId)
  const confirm = useConfirmAppointment()
  const cancel  = useCancelAppointment()

  const [page, setPage]             = useState(0)
  const [pageSize, setPageSize]     = useState(5)
  const [detailAppt, setDetailAppt] = useState<AppointmentResponse | null>(null)
  const totalPages = Math.ceil(pending.length / pageSize)
  const paginated  = pending.slice(page * pageSize, (page + 1) * pageSize)

  const formatWhen = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', {
      weekday: 'short', day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })

  if (isLoading) {
    return (
      <div className="card card-pad">
        <div className="loading" style={{ height: 80 }}>Carregando...</div>
      </div>
    )
  }

  return (
    <div className="card card-pad" style={{ flex: 1 }}>
      <div className="card-hd">
        <div>
          <div className="h-section">Solicitações pendentes</div>
          <div className="text-meta">
            {pending.length === 0 ? 'Nenhuma pendente' : `${pending.length} aguardando`}
          </div>
        </div>
        {pending.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <select
              className="page-size-select"
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(0) }}
              style={{ fontSize: 11, padding: '2px 5px' }}
            >
              {PAGE_SIZE_OPTIONS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <button
              className="btn-icon"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              title="Anterior"
            >
              <ChevronLeft size={13} />
            </button>
            <span style={{ fontSize: 11, color: 'var(--ink-4)', minWidth: 28, textAlign: 'center' }}>
              {page + 1}/{Math.max(1, totalPages)}
            </span>
            <button
              className="btn-icon"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              title="Próxima"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>

      {pending.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>
          Tudo em dia ✓
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {paginated.map((a: AppointmentResponse) => (
            <div key={a.id} className="pending-row">
              <div className="av-sm">{getInitials(a.clientName)}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.clientName}
                </div>
                <div className="text-meta" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {formatWhen(a.startAt)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {!isProfessional && (
                  <>
                    <button
                      className="btn-icon"
                      title="Confirmar"
                      style={{ color: 'var(--accent)' }}
                      onClick={() => confirm.mutate(a.id)}
                      disabled={confirm.isPending}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      className="btn-icon"
                      title="Recusar"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => cancel.mutate({ id: a.id, reason: 'Recusado pelo gestor' })}
                      disabled={cancel.isPending}
                    >
                      <X size={14} />
                    </button>
                  </>
                )}
                <button
                  className="btn-icon"
                  title="Ver detalhes"
                  onClick={() => setDetailAppt(a)}
                >
                  <Eye size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {detailAppt && (
        <AppointmentDetailModal
          appointment={detailAppt}
          onClose={() => setDetailAppt(null)}
        />
      )}
    </div>
  )
}

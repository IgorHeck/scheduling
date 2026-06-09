import { useState } from 'react'
import { Check, X, Mail, Phone, ChevronLeft, ChevronRight } from 'lucide-react'
// Note: clientEmail/clientPhone not in API type — showing clientId as fallback
import { usePendingAppointments, useConfirmAppointment, useCancelAppointment } from '../../hooks/useAppointments'
import type { AppointmentResponse } from '../../types/appointment.types'
import { useAuthStore } from '../../store/authStore'
import { useProfessionalFilterStore } from '../../store/professionalFilterStore'

const PAGE_SIZE_OPTIONS = [10, 20, 100]

function getInitials(name: string) {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDuration(startIso: string, endIso: string) {
  const diff = (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000
  return diff >= 60 ? `${diff / 60}h` : `${diff}min`
}

export function PendingPage() {
  const { user } = useAuthStore()
  const { selectedProfessionalId } = useProfessionalFilterStore()
  const isProfessional = user?.role === 'PROFESSIONAL'

  const { data: pending = [], isLoading } = usePendingAppointments(selectedProfessionalId)
  const confirm = useConfirmAppointment()
  const cancel  = useCancelAppointment()

  const [page, setPage]         = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const totalPages = Math.ceil(pending.length / pageSize)
  const paginated  = pending.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="h-page">Pendentes</div>
          <div className="sub">
            <span className="text-mono">{pending.length}</span> solicitação{pending.length !== 1 ? 'ões' : ''} aguardando confirmação
          </div>
        </div>
        {pending.length > 0 && !isProfessional && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-ghost"
              onClick={() => { pending.forEach(a => cancel.mutate({ id: a.id, reason: 'Recusado em lote' })); setPage(0) }}
              disabled={cancel.isPending}
            >
              Recusar todas
            </button>
            <button
              className="btn btn-primary"
              onClick={() => { pending.forEach(a => confirm.mutate(a.id)); setPage(0) }}
              disabled={confirm.isPending}
            >
              <Check size={14} /> Confirmar todas
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="loading">Carregando...</div>
      ) : pending.length === 0 ? (
        <div className="empty">
          <div className="icon">✓</div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Tudo em dia!</div>
          <div className="text-meta">Nenhuma solicitação pendente no momento.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {paginated.map((a: AppointmentResponse) => (
            <div key={a.id} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: 16, alignItems: 'start' }}>
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'color-mix(in oklch, var(--accent) 14%, var(--surface-2))',
                  display: 'grid', placeItems: 'center',
                  color: 'var(--accent)', fontWeight: 700, fontSize: 16,
                  border: '1px solid color-mix(in oklch, var(--accent) 22%, transparent)', flexShrink: 0,
                }}>
                  {getInitials(a.clientName)}
                </div>

                {/* Info */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{a.clientName}</span>
                    <span className="badge st-pending">
                      <span className="dot" /> Pendente
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--ink-3)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Mail size={12} /> Cliente #{a.clientId}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={12} /> com {a.professionalName}
                    </span>
                  </div>

                  {/* Meta row */}
                  <div style={{
                    display: 'flex', gap: 18, alignItems: 'center',
                    marginTop: 12, paddingTop: 12,
                    borderTop: '1px dashed var(--border)',
                    flexWrap: 'wrap',
                  }}>
                    <div>
                      <div className="text-tag">Quando</div>
                      <div className="text-mono" style={{ fontSize: 14, marginTop: 3 }}>
                        {formatWhen(a.startAt)}
                      </div>
                    </div>
                    <div className="divider-v" style={{ height: 26 }} />
                    <div>
                      <div className="text-tag">Duração</div>
                      <div style={{ fontSize: 13, marginTop: 3 }}>
                        {formatDuration(a.startAt, a.endAt)}
                      </div>
                    </div>
                    <div className="divider-v" style={{ height: 26 }} />
                    <div>
                      <div className="text-tag">Profissional</div>
                      <div style={{ fontSize: 13, marginTop: 3 }}>{a.professionalName}</div>
                    </div>
                  </div>

                  {/* Notes */}
                  {a.notes && (
                    <div style={{
                      marginTop: 10, padding: '9px 12px', borderRadius: 8,
                      background: 'color-mix(in oklch, var(--warning) 8%, transparent)',
                      color: 'var(--ink-2)', fontSize: 12.5, fontStyle: 'italic',
                    }}>
                      "{a.notes}"
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignSelf: 'stretch' }}>
                  {!isProfessional && (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() => confirm.mutate(a.id)}
                        disabled={confirm.isPending}
                      >
                        <Check size={14} /> Confirmar
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => cancel.mutate({ id: a.id, reason: 'Recusado pelo gestor' })}
                        disabled={cancel.isPending}
                      >
                        <X size={14} /> Recusar
                      </button>
                    </>
                  )}
                  <div style={{ fontSize: 10.5, color: 'var(--ink-4)', textAlign: 'center', marginTop: 4 }}>
                    #{a.id}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <div className="pagination">
          <button
            className="btn btn-ghost"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft size={14} /> Anterior
          </button>
          <span className="page-info">
            Página <strong>{page + 1}</strong> de <strong>{Math.max(1, totalPages)}</strong>
          </span>
          <button
            className="btn btn-ghost"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Próxima <ChevronRight size={14} />
          </button>
          <select
            className="page-size-select"
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(0) }}
          >
            {PAGE_SIZE_OPTIONS.map(n => (
              <option key={n} value={n}>{n} por página</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

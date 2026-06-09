import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { cancelAppointment } from '../../api/appointments'
import { useMyAppointments }       from '../../hooks/useAppointments'
import { listCompanies }           from '../../api/companies'
import type { AppointmentResponse } from '../../types/appointment.types'
import type { CompanyResponse }    from '../../api/companies'
import { useAuthStore }            from '../../store/authStore'
import { useNavigate, Link }       from 'react-router-dom'
import { RescheduleModal }         from '../../components/RescheduleModal'
import { AppointmentDetailModal }  from '../../components/AppointmentDetailModal'
import { useSSENotifications }     from '../../hooks/useSSENotifications'
import { Plus, LogOut, X, Building2, User, MessageSquare, MapPin, Phone } from 'lucide-react'

const statusBadge: Record<string, string> = {
  PENDING:   'st-pending',
  CONFIRMED: 'st-confirmed',
  CANCELLED: 'st-cancelled',
  COMPLETED: 'st-completed',
  NO_SHOW:   '',
}

const statusLabel: Record<string, string> = {
  PENDING:   'Aguardando',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Concluído',
  NO_SHOW:   'Não compareceu',
}

type FilterType = 'TODOS' | 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'

export function MyAppointmentsPage() {
  // SSE: recebe eventos de confirmação/cancelamento em tempo real
  useSSENotifications()

  const { user, logout } = useAuthStore()
  const navigate         = useNavigate()
  const queryClient      = useQueryClient()

  const [filter, setFilter]                     = useState<FilterType>('TODOS')
  const [cancellingId, setCancellingId]         = useState<number | null>(null)
  const [reschedulingAppt, setReschedulingAppt] = useState<AppointmentResponse | null>(null)
  const [detailAppt, setDetailAppt]             = useState<AppointmentResponse | null>(null)
  const [showClinicModal, setShowClinicModal]   = useState(false)
  const [page, setPage]                         = useState(0)
  const [pageSize, setPageSize]                 = useState(10)

  const { data: pageData, isLoading, isFetching } = useMyAppointments(page, pageSize)
  const appointments = pageData?.content  ?? []
  const totalPages   = pageData?.totalPages ?? 0

  // Carrega lista de clínicas apenas quando o modal estiver aberto
  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['companies-list'],
    queryFn:  listCompanies,
    enabled:  showClinicModal,
  })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (detailAppt)       { setDetailAppt(null);         return }
      if (reschedulingAppt) { setReschedulingAppt(null);   return }
      if (showClinicModal)  { setShowClinicModal(false);   return }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [detailAppt, reschedulingAppt, showClinicModal])

  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelAppointment(id, 'Cancelado pelo cliente'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] })
      setCancellingId(null)
    },
  })

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setPage(0)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const filtered = appointments.filter((a: AppointmentResponse) =>
    filter === 'TODOS' || a.status === filter
  )

  const upcoming = appointments.filter((a: AppointmentResponse) =>
    (a.status === 'PENDING' || a.status === 'CONFIRMED') &&
    new Date(a.startAt) >= new Date()
  )

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    })

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const formatDuration = (startIso: string, endIso: string) => {
    const diff = (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000
    return diff >= 60 ? `${diff / 60}h` : `${diff}min`
  }

  const canCancel = (a: AppointmentResponse) =>
    (a.status === 'PENDING' || a.status === 'CONFIRMED') &&
    new Date(a.startAt) > new Date()

  const canReschedule = (a: AppointmentResponse) =>
    (a.status === 'PENDING' || a.status === 'CONFIRMED') &&
    new Date(a.startAt) > new Date()

  const FILTERS: FilterType[] = ['TODOS', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
  const filterLabel: Record<FilterType, string> = {
    TODOS:     'Todos',
    PENDING:   'Pendentes',
    CONFIRMED: 'Confirmados',
    CANCELLED: 'Cancelados',
    COMPLETED: 'Concluídos',
  }

  // Clínicas que aceitam agendamento público
  const activeCompanies = (companies as CompanyResponse[]).filter(c => c.allowClientBooking && c.active)

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── Header ── */}
      <header style={{
        background: 'var(--surface-1)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 24px',
      }}>
        <div style={{
          maxWidth: 680, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
              Meus agendamentos
            </div>
            <div className="text-meta" style={{ marginTop: 2, fontSize: 12 }}>
              Olá, {user?.name?.split(' ')[0]}{' '}
              <Link to="/profile" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                · Editar perfil
              </Link>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowClinicModal(true)}
            >
              <Plus size={14} /> Novo agendamento
            </button>
            <button
              className="btn btn-ghost btn-sm btn-icon"
              onClick={handleLogout}
              title="Sair"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '28px 16px 60px' }}>

        {/* Próximo agendamento */}
        {upcoming.length > 0 && (
          <div style={{
            background: 'color-mix(in oklch, var(--accent) 10%, var(--surface-1))',
            border: '1px solid color-mix(in oklch, var(--accent) 22%, transparent)',
            borderRadius: 14, padding: '16px 20px', marginBottom: 22,
          }}>
            <div className="text-tag" style={{ color: 'var(--accent)', marginBottom: 6 }}>
              Próximo agendamento
            </div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', textTransform: 'capitalize' }}>
              {formatDate(upcoming[0].startAt)}
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 3 }}>
              {formatTime(upcoming[0].startAt)} — {formatTime(upcoming[0].endAt)}
            </div>
            <div className="text-meta" style={{ marginTop: 4 }}>
              com {upcoming[0].professionalName} · {upcoming[0].companyName}
            </div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`badge${statusBadge[upcoming[0].status] ? ' ' + statusBadge[upcoming[0].status] : ''}`}>
                <span className="dot" />
                {statusLabel[upcoming[0].status]}
              </span>
              {upcoming.length > 1 && (
                <span className="text-meta" style={{ fontSize: 11.5 }}>
                  +{upcoming.length - 1} outro(s)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="tabs" style={{ marginBottom: 16, overflowX: 'auto' }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`tab${filter === f ? ' active' : ''}`}
            >
              {filterLabel[f]}
              {f !== 'TODOS' && (
                <span style={{ marginLeft: 4, opacity: 0.65 }}>
                  ({appointments.filter((a: AppointmentResponse) => a.status === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Appointment list */}
        {isLoading ? (
          <div className="loading">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink-2)' }}>
              {filter === 'TODOS' ? 'Nenhum agendamento ainda' : 'Nenhum agendamento nessa categoria'}
            </div>
            {filter === 'TODOS' && (
              <>
                <div className="text-meta" style={{ marginTop: 4 }}>
                  Clique em "+ Novo agendamento" para escolher uma clínica.
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowClinicModal(true)}
                  style={{ marginTop: 12 }}
                >
                  Agendar agora
                </button>
              </>
            )}
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 10,
            opacity: isFetching ? 0.6 : 1, transition: 'opacity 0.15s',
          }}>
            {filtered.map((a: AppointmentResponse) => (
              <div key={a.id} className="card" style={{ padding: 16 }}>

                {/* Top: date + badge */}
                <div style={{
                  display: 'flex', alignItems: 'flex-start',
                  justifyContent: 'space-between', gap: 10, marginBottom: 10,
                }}>
                  <div>
                    <div style={{
                      fontWeight: 600, fontSize: 14, color: 'var(--ink)', textTransform: 'capitalize',
                    }}>
                      {formatDate(a.startAt)}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>
                      {formatTime(a.startAt)} — {formatTime(a.endAt)}
                      <span className="text-meta"> · {formatDuration(a.startAt, a.endAt)}</span>
                    </div>
                  </div>
                  <span
                    className={`badge${statusBadge[a.status] ? ' ' + statusBadge[a.status] : ''}`}
                    style={{ flexShrink: 0 }}
                  >
                    <span className="dot" />
                    {statusLabel[a.status]}
                  </span>
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-3)' }}>
                    <Building2 size={12} /> {a.companyName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-3)' }}>
                    <User size={12} /> com {a.professionalName}
                  </div>
                  {a.notes && (
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 6,
                      fontSize: 12.5, color: 'var(--ink-3)', fontStyle: 'italic',
                    }}>
                      <MessageSquare size={12} style={{ marginTop: 1, flexShrink: 0 }} />
                      "{a.notes}"
                    </div>
                  )}
                </div>

                {/* Cancel confirm */}
                {canCancel(a) && (
                  cancellingId === a.id ? (
                    <div style={{
                      marginBottom: 10, padding: '10px 12px', borderRadius: 8,
                      background: 'color-mix(in oklch, var(--danger) 7%, transparent)',
                      border: '1px solid color-mix(in oklch, var(--danger) 22%, transparent)',
                    }}>
                      <div style={{ fontSize: 12.5, color: 'var(--danger)', fontWeight: 600, marginBottom: 8 }}>
                        Confirmar cancelamento?
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ flex: 1 }}
                          onClick={() => cancelMutation.mutate(a.id)}
                          disabled={cancelMutation.isPending}
                        >
                          {cancelMutation.isPending ? 'Cancelando...' : 'Sim, cancelar'}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ flex: 1 }}
                          onClick={() => setCancellingId(null)}
                        >
                          Voltar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)', fontSize: 12 }}
                        onClick={() => setCancellingId(a.id)}
                      >
                        Cancelar agendamento
                      </button>
                      {canReschedule(a) && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 12 }}
                          onClick={() => setReschedulingAppt(a)}
                        >
                          Remarcar
                        </button>
                      )}
                    </div>
                  )
                )}

                {/* Footer */}
                <div style={{
                  paddingTop: 10, marginTop: 2, borderTop: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span className="text-mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>#{a.id}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="text-meta" style={{ fontSize: 11.5 }}>
                      Solicitado em {new Date(a.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 12, padding: '2px 6px' }}
                      onClick={() => setDetailAppt(a)}
                    >
                      Ver detalhes
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {(totalPages > 1 || appointments.length > 0) && (
          <div
            className="pagination"
            style={{ marginTop: 20, opacity: isFetching ? 0.6 : 1, transition: 'opacity 0.15s' }}
          >
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => handlePageChange(Math.max(0, page - 1))}
              disabled={page === 0 || isFetching}
            >
              ← Anterior
            </button>
            <span className="text-meta">
              Página <strong style={{ color: 'var(--ink-2)' }}>{page + 1}</strong> de{' '}
              <strong style={{ color: 'var(--ink-2)' }}>{Math.max(1, totalPages)}</strong>
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => handlePageChange(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1 || isFetching}
            >
              Próxima →
            </button>
            <select
              className="page-size-select"
              value={pageSize}
              onChange={e => handlePageSizeChange(Number(e.target.value))}
            >
              {[10, 20, 100].map(n => (
                <option key={n} value={n}>{n} por página</option>
              ))}
            </select>
          </div>
        )}

      </main>

      {/* ── Clinic selection modal ── */}
      {showClinicModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowClinicModal(false)}
        >
          <div className="modal" style={{ maxWidth: 400 }}>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 20px 14px', borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--ink)' }}>
                Escolha a clínica
              </div>
              <button
                className="btn btn-ghost btn-sm btn-icon"
                onClick={() => setShowClinicModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '16px 20px 20px' }}>
              {companiesLoading ? (
                <div className="loading">Carregando...</div>
              ) : activeCompanies.length === 0 ? (
                <div className="empty" style={{ padding: '24px 0' }}>
                  <Building2 size={22} style={{ color: 'var(--ink-3)', marginBottom: 8 }} />
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink-2)' }}>
                    Nenhuma clínica disponível
                  </div>
                  <div className="text-meta" style={{ marginTop: 4 }}>
                    Tente novamente mais tarde ou use o link direto compartilhado pela clínica.
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 8,
                  maxHeight: 340, overflowY: 'auto',
                }}>
                  {activeCompanies.map((c: CompanyResponse) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setShowClinicModal(false)
                        navigate(`/${c.id}/booking`)
                      }}
                      className="card"
                      style={{
                        padding: '12px 14px', textAlign: 'left', width: '100%',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)' }}>
                        {c.name}
                      </div>
                      {c.address && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: 12, color: 'var(--ink-3)' }}>
                          <MapPin size={11} /> {c.address}
                        </div>
                      )}
                      {c.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3, fontSize: 12, color: 'var(--ink-3)' }}>
                          <Phone size={11} /> {c.phone}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Reschedule modal ── */}
      {reschedulingAppt && (
        <RescheduleModal
          appointment={reschedulingAppt}
          onClose={() => setReschedulingAppt(null)}
        />
      )}

      {/* ── Detail modal ── */}
      {detailAppt && (
        <AppointmentDetailModal
          appointment={detailAppt}
          onClose={() => setDetailAppt(null)}
        />
      )}

    </div>
  )
}

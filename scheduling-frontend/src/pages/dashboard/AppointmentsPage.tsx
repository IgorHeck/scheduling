import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Search, Plus, Eye, Check, X, History } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  useConfirmAppointment,
  useCompleteAppointment,
  useCancelAppointment,
} from '../../hooks/useAppointments'
import { getCompanyAppointments } from '../../api/appointments'
import { getAvailableSlots } from '../../api/schedules'
import { useCompanyId } from '../../hooks/useCompanyId'
import type { AppointmentResponse } from '../../types/appointment.types'
import { RescheduleModal }        from '../../components/RescheduleModal'
import { AppointmentDetailModal } from '../../components/AppointmentDetailModal'
import { AppointmentModal, type Slot } from '../../components/SlotPanel'
import { useAuthStore }           from '../../store/authStore'
import { useProfessionalFilterStore } from '../../store/professionalFilterStore'

const STATUS_LABEL: Record<string, string> = {
  PENDING:   'Pendente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Concluído',
  NO_SHOW:   'Não compareceu',
}

const STATUS_CLASS: Record<string, string> = {
  PENDING:   'st-pending',
  CONFIRMED: 'st-confirmed',
  CANCELLED: 'st-cancelled',
  COMPLETED: 'st-completed',
  NO_SHOW:   'st-completed',
}

const getMonthRange = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end   = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
  return { start: start.toISOString(), end: end.toISOString() }
}

const PAGE_SIZE_OPTIONS = [10, 20, 100]

function getInitials(name: string) {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
}

export function AppointmentsPage() {
  const { user } = useAuthStore()
  const { selectedProfessionalId } = useProfessionalFilterStore()

  const [currentDate, setCurrentDate]           = useState(new Date())
  const [statusFilter, setStatusFilter]         = useState('TODOS')
  const [search, setSearch]                     = useState('')
  const [page, setPage]                         = useState(0)
  const [pageSize, setPageSize]                 = useState(10)
  const [pastOpen, setPastOpen]                 = useState(false)
  const [showNew, setShowNew]                   = useState(false)
  const [reschedulingAppt, setReschedulingAppt] = useState<AppointmentResponse | null>(null)
  const [detailAppt, setDetailAppt]             = useState<AppointmentResponse | null>(null)

  const queryClient    = useQueryClient()
  const isProfessional = user?.role === 'PROFESSIONAL'

  // ESC fecha o modal aberto no momento
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (detailAppt) { setDetailAppt(null); return }
      if (reschedulingAppt) { setReschedulingAppt(null); return }
      if (showNew) setShowNew(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [detailAppt, reschedulingAppt, showNew])

  const confirm  = useConfirmAppointment()
  const complete = useCompleteAppointment()
  const cancel   = useCancelAppointment()

  const companyId = useCompanyId()
  const { start, end } = getMonthRange(currentDate)

  // Busca todos os agendamentos do mês (paginação/ordenação client-side, para "hoje primeiro")
  const { data: monthData, isLoading, isFetching } = useQuery({
    queryKey: ['appointments', 'company', companyId, start, end, 'all', selectedProfessionalId ?? null],
    queryFn:  () => getCompanyAppointments(companyId!, start, end, 0, 2000, selectedProfessionalId ?? undefined),
    enabled:  !!companyId,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
  const allAppointments = monthData?.content ?? []
  const totalElements   = monthData?.totalElements ?? allAppointments.length

  useEffect(() => { setPage(0) }, [currentDate.getMonth(), currentDate.getFullYear()])
  useEffect(() => { setPage(0) }, [statusFilter])
  useEffect(() => { setPage(0) }, [pageSize])
  useEffect(() => { setPage(0) }, [search])

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  // Filtro de status + busca aplicado sobre o mês inteiro
  const filtered = allAppointments
    .filter((a: AppointmentResponse) => {
      const matchStatus = statusFilter === 'TODOS' || a.status === statusFilter
      const matchSearch = search === '' ||
        a.clientName.toLowerCase().includes(search.toLowerCase()) ||
        a.professionalName.toLowerCase().includes(search.toLowerCase())
      return matchStatus && matchSearch
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())

  // Divide em "anteriores" (antes de hoje) e "de hoje em diante".
  // Só faz sentido quando estamos vendo todos os status sem busca — caso contrário, lista plana.
  const useSplit = statusFilter === 'TODOS' && search === ''
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)

  const pastRows     = useSplit ? filtered.filter(a => new Date(a.startAt) < todayStart) : []
  const upcomingRows = useSplit ? filtered.filter(a => new Date(a.startAt) >= todayStart) : filtered

  // Paginação client-side sobre a lista principal (de hoje em diante, ou a lista filtrada)
  const effectiveTotalElements = upcomingRows.length
  const effectiveTotalPages    = Math.ceil(upcomingRows.length / pageSize)
  const displayRows            = upcomingRows.slice(page * pageSize, (page + 1) * pageSize)

  const isExpiredConfirmed = (a: AppointmentResponse) =>
    a.status === 'CONFIRMED' && new Date(a.endAt) < new Date()

  const monthLabel = (() => {
    const s = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
    return s.charAt(0).toUpperCase() + s.slice(1)
  })()

  // Totais por status — sempre calculados sobre todos os agendamentos do mês
  const counts = allAppointments.reduce((acc: Record<string, number>, a: AppointmentResponse) => {
    acc[a.status] = (acc[a.status] || 0) + 1
    return acc
  }, {})

  // Agrupa uma lista de agendamentos por dia (rótulo "Seg., 01/06")
  const groupByDay = (rows: AppointmentResponse[]) => {
    const g: Record<string, AppointmentResponse[]> = {}
    rows.forEach((a: AppointmentResponse) => {
      const dateLabel = new Date(a.startAt).toLocaleDateString('pt-BR', {
        weekday: 'short', day: '2-digit', month: '2-digit',
      })
      const key = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)
      ;(g[key] = g[key] ?? []).push(a)
    })
    return g
  }

  const groups     = groupByDay(displayRows)
  const pastGroups = groupByDay(pastRows)

  // ── Renderização de uma linha de agendamento ──
  const renderRow = (a: AppointmentResponse) => (
    <div key={a.id} className="row" style={{ gridTemplateColumns: '70px 36px 1fr auto auto' }}>
      {/* Time */}
      <div className="text-mono" style={{ fontSize: 14, color: 'var(--ink)' }}>
        {new Date(a.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        <div className="text-meta">
          {Math.round((new Date(a.endAt).getTime() - new Date(a.startAt).getTime()) / 60000)}min
        </div>
      </div>

      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'color-mix(in oklch, var(--accent) 14%, var(--surface-2))',
        display: 'grid', placeItems: 'center',
        color: 'var(--accent)', fontWeight: 700, fontSize: 13,
        border: '1px solid color-mix(in oklch, var(--accent) 22%, transparent)',
      }}>
        {getInitials(a.clientName)}
      </div>

      {/* Name */}
      <div>
        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.clientName}</div>
        <div className="text-meta">com {a.professionalName}</div>
      </div>

      {/* Status badge */}
      <span className={`badge ${STATUS_CLASS[a.status] ?? 'st-completed'}`}>
        <span className="dot" /> {STATUS_LABEL[a.status] ?? a.status}
      </span>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4 }}>
        {!isProfessional && a.status === 'PENDING' && (
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
        {!isProfessional && a.status === 'CONFIRMED' && isExpiredConfirmed(a) && (
          <button
            className="btn-icon"
            title="Concluir"
            style={{ color: 'var(--accent)' }}
            onClick={() => complete.mutate(a.id)}
            disabled={complete.isPending}
          >
            <Check size={14} />
          </button>
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
  )

  // ── Renderização de um grupo de dia ──
  const renderDayGroup = (date: string, rows: AppointmentResponse[]) => (
    <div key={date}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8, padding: '0 4px' }}>
        <span className="text-tag">{date}</span>
        <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span className="text-meta text-mono">{rows.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map(renderRow)}
      </div>
    </div>
  )

  const tabs = [
    { id: 'TODOS',     label: 'Todos',       n: totalElements },
    { id: 'PENDING',   label: 'Pendentes',   n: counts['PENDING']   || 0 },
    { id: 'CONFIRMED', label: 'Confirmados', n: counts['CONFIRMED'] || 0 },
    { id: 'COMPLETED', label: 'Concluídos',  n: counts['COMPLETED'] || 0 },
    { id: 'CANCELLED', label: 'Cancelados',  n: counts['CANCELLED'] || 0 },
  ]

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="h-page">Agendamentos</div>
          <div className="sub">
            {monthLabel} · <span className="text-mono">{totalElements}</span> no mês
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-icon" onClick={prevMonth}><ChevronLeft size={14} /></button>
          <span style={{ fontSize: 13, color: 'var(--ink-2)', minWidth: 110, textAlign: 'center' }}>
            {monthLabel}
          </span>
          <button className="btn-icon" onClick={nextMonth}><ChevronRight size={14} /></button>
          <div className="divider-v" />
          {!isProfessional && (
            <button className="btn btn-primary" onClick={() => setShowNew(true)}>
              <Plus size={14} /> Novo
            </button>
          )}
        </div>
      </div>

      {/* Search + Tabs */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
        <div className="search" style={{ flex: 1, minWidth: 0 }}>
          <Search size={14} />
          <input
            placeholder="Filtrar por cliente ou profissional…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="tabs">
          {tabs.map(t => (
            <div
              key={t.id}
              className={`tab${statusFilter === t.id ? ' active' : ''}`}
              onClick={() => setStatusFilter(t.id)}
            >
              {t.label} <span className="count">{t.n}</span>
            </div>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="loading">Carregando...</div>
      ) : displayRows.length === 0 && pastRows.length === 0 ? (
        <div className="empty">
          <p>Nenhum agendamento encontrado.</p>
          <p className="text-meta">Tente mudar os filtros ou o mês selecionado.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'flex', flexDirection: 'column', gap: 18,
            opacity: isFetching ? 0.6 : 1,
            transition: 'opacity .15s ease',
          }}
        >
          {/* Anteriores (antes de hoje) — minimizado por padrão */}
          {pastRows.length > 0 && (
            <div>
              <button
                onClick={() => setPastOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: pastOpen ? '10px 12px' : '6px 4px',
                  background: pastOpen ? 'var(--surface-2)' : 'none',
                  border: pastOpen ? '1px solid var(--border)' : 'none',
                  borderRadius: pastOpen ? '10px 10px 0 0' : 0,
                  borderBottom: pastOpen ? 'none' : undefined,
                  cursor: 'pointer', font: 'inherit',
                  color: pastOpen ? 'var(--ink)' : 'var(--ink-3)',
                  transition: 'padding .15s, background .15s',
                }}
              >
                <History size={13} style={{ flexShrink: 0 }} />
                <span className="text-tag" style={{ color: pastOpen ? 'var(--ink-2)' : 'var(--ink-3)' }}>
                  Anteriores deste mês
                </span>
                <span style={{ fontSize: 12, color: 'var(--ink-4)', textTransform: 'capitalize' }}>
                  · {monthLabel}
                </span>
                <span style={{ flex: 1, height: 1, transform: 'scaleY(0.5)', background: 'color-mix(in oklch, var(--border) 60%, transparent)' }} />
                <span className="text-meta text-mono">{pastRows.length}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  {pastOpen ? 'ocultar' : 'ver'}
                </span>
                <ChevronDown
                  size={14}
                  style={{ transform: pastOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
                />
              </button>

              {pastOpen && (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 18,
                  padding: '16px 12px',
                  background: 'color-mix(in oklch, var(--surface-2) 50%, transparent)',
                  border: '1px solid var(--border)', borderTop: 'none',
                  borderRadius: '0 0 10px 10px',
                }}>
                  {Object.entries(pastGroups).map(([date, rows]) => renderDayGroup(date, rows))}
                </div>
              )}
            </div>
          )}

          {/* De hoje em diante */}
          {displayRows.length === 0 ? (
            <div className="empty">
              <p>Nenhum agendamento de hoje em diante.</p>
              <p className="text-meta">
                {pastRows.length > 0 ? 'Veja os anteriores acima.' : 'Tente outro mês.'}
              </p>
            </div>
          ) : (
            Object.entries(groups).map(([date, rows]) => renderDayGroup(date, rows))
          )}
        </div>
      )}

      {/* Pagination */}
      {(effectiveTotalPages > 1 || effectiveTotalElements > 0) && (
        <div className="pagination">
          <button
            className="btn btn-ghost"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || isFetching}
          >
            <ChevronLeft size={14} /> Anterior
          </button>
          <span className="page-info">
            Página <strong>{page + 1}</strong> de <strong>{Math.max(1, effectiveTotalPages)}</strong>
          </span>
          <button
            className="btn btn-ghost"
            onClick={() => setPage(p => Math.min(effectiveTotalPages - 1, p + 1))}
            disabled={page >= effectiveTotalPages - 1 || isFetching}
          >
            Próxima <ChevronRight size={14} />
          </button>
          <select
            className="page-size-select"
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map(n => (
              <option key={n} value={n}>{n} por página</option>
            ))}
          </select>
        </div>
      )}

      {reschedulingAppt && (
        <RescheduleModal
          appointment={reschedulingAppt}
          onClose={() => setReschedulingAppt(null)}
        />
      )}
      {detailAppt && (
        <AppointmentDetailModal
          appointment={detailAppt}
          onClose={() => setDetailAppt(null)}
        />
      )}

      {showNew && companyId && (
        <NewAppointmentModal
          companyId={companyId}
          professionalId={selectedProfessionalId ?? null}
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false)
            queryClient.invalidateQueries({ queryKey: ['appointments'] })
            queryClient.invalidateQueries({ queryKey: ['calendar'] })
            queryClient.invalidateQueries({ queryKey: ['slots'] })
          }}
        />
      )}
    </div>
  )
}

/* ── Modal de novo agendamento: escolhe data → slot → dados do cliente ── */
function NewAppointmentModal({
  companyId, professionalId, onClose, onCreated,
}: {
  companyId: number
  professionalId: number | null
  onClose: () => void
  onCreated: () => void
}) {
  const todayStr = new Date().toISOString().split('T')[0]
  const [date, setDate]       = useState(todayStr)
  const [slot, setSlot]       = useState<Slot | null>(null)
  const [openProf, setOpenProf] = useState<number | null>(null)
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (slot) setSlot(null); else onClose() }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [slot, onClose])

  // clicar fora: se já mexeu na data, balança; senão fecha
  const onOverlayClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return
    if (date !== todayStr) {
      setShaking(true)
      setTimeout(() => setShaking(false), 400)
    } else {
      onClose()
    }
  }

  const { data: rawSlots = [], isLoading } = useQuery({
    queryKey: ['slots', companyId, date],
    queryFn:  () => getAvailableSlots(companyId, date),
    enabled:  !!date,
  })

  // Agrupa por profissional, respeitando o filtro do topo (se houver)
  const groups = (() => {
    const map = new Map<number, { name: string; slots: Slot[] }>()
    for (const s of rawSlots as Slot[]) {
      if (professionalId && s.professionalId !== professionalId) continue
      if (!map.has(s.professionalId)) map.set(s.professionalId, { name: s.professionalName, slots: [] })
      map.get(s.professionalId)!.slots.push(s)
    }
    return [...map.entries()]
  })()

  // Quando um slot é escolhido, reutiliza o modal de criação existente
  if (slot) {
    return (
      <AppointmentModal
        slot={slot}
        companyId={companyId}
        date={date}
        onClose={() => setSlot(null)}
        onSuccess={onCreated}
      />
    )
  }

  return (
    <div className="modal-overlay" onClick={onOverlayClick}>
      <div className={`modal${shaking ? ' modal-shake' : ''}`} style={{ maxWidth: 460 }}>
        <div className="modal-head">
          <div style={{ fontWeight: 600, fontSize: 15 }}>Novo agendamento</div>
          <button className="btn-icon" onClick={onClose}><X size={14} /></button>
        </div>

        <div style={{ padding: '16px 22px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label>Data</label>
            <input
              type="date"
              value={date}
              min={todayStr}
              onChange={e => setDate(e.target.value)}
              style={{
                width: '100%', background: 'var(--surface-2)', color: 'var(--ink)',
                border: '1px solid var(--border)', borderRadius: 10,
                padding: '10px 12px', font: 'inherit', fontSize: 13.5,
              }}
            />
          </div>

          {isLoading ? (
            <div className="loading" style={{ height: 60 }}>Carregando horários…</div>
          ) : groups.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--ink-4)', fontSize: 13, padding: '16px 0' }}>
              Nenhum horário disponível nesta data.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
              {groups.map(([pid, group], i) => {
                const open = openProf === null ? i === 0 : openProf === pid
                const available = group.slots.filter(s => s.available).length
                return (
                  <div key={pid} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <div
                      onClick={() => setOpenProf(open ? -1 : pid)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px',
                        cursor: 'pointer', userSelect: 'none',
                        background: open ? 'color-mix(in oklch, var(--accent) 5%, var(--surface-2))' : 'var(--surface-2)',
                      }}
                    >
                      <div style={{
                        width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                        background: 'color-mix(in oklch, var(--accent) 14%, var(--surface-3))',
                        display: 'grid', placeItems: 'center',
                        color: 'var(--accent)', fontWeight: 700, fontSize: 9,
                        border: '1px solid color-mix(in oklch, var(--accent) 20%, transparent)',
                      }}>
                        {group.name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)' }}>{group.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{available} livre{available !== 1 ? 's' : ''}</span>
                      {open ? <ChevronUp size={13} style={{ color: 'var(--ink-4)' }} />
                             : <ChevronDown size={13} style={{ color: 'var(--ink-4)' }} />}
                    </div>
                    {open && (
                      <div style={{ padding: 12, background: 'var(--surface-1)' }}>
                        <div className="slots" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' }}>
                          {group.slots.map((s, idx) => (
                            <button
                              key={idx}
                              className={`slot${!s.available ? ' taken' : ''}`}
                              disabled={!s.available}
                              onClick={() => s.available && setSlot(s)}
                            >
                              {new Date(s.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

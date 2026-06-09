import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Hand, ChevronDown, ChevronUp, CalendarDays, ChevronRight, Users, Clock, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CalendarView } from '../../components/CalendarView'
import { PendingList }  from '../../components/PendingList'
import { AppointmentModal, type Slot } from '../../components/SlotPanel'
import { Sparkline } from '../../components/charts/Sparkline'
import { Donut } from '../../components/charts/Donut'
import { useAuthStore } from '../../store/authStore'
import { useCompanyId } from '../../hooks/useCompanyId'
import { useProfessionalFilterStore } from '../../store/professionalFilterStore'
import {
  getTodayAppointments,
  getMonthAppointments,
  getPendingAppointments,
} from '../../api/appointments'
import { getAvailableSlots } from '../../api/schedules'
import type { AppointmentResponse } from '../../types/appointment.types'

// ── Mini metric ───────────────────────────────────────────────────────
function MiniMetric({
  label, value, subtitle, warn, loading, onNav,
}: {
  label: string; value: number; subtitle?: string
  warn?: boolean; loading?: boolean; onNav?: () => void
}) {
  const accent = warn ? 'var(--warning)' : 'var(--accent)'
  return (
    <div style={{
      background: warn
        ? 'color-mix(in oklch, var(--warning) 8%, var(--surface-1))'
        : 'color-mix(in oklch, var(--accent) 6%, var(--surface-1))',
      border: `1px solid ${warn
        ? 'color-mix(in oklch, var(--warning) 22%, transparent)'
        : 'var(--border)'}`,
      borderRadius: 14, boxShadow: 'var(--shadow-1)',
      padding: '13px 16px',
      /* Fixed size so it never changes with content */
      width: 130, flexShrink: 0,
      display: 'flex', flexDirection: 'column', gap: 3,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="text-tag" style={{ color: warn ? 'var(--warning)' : 'var(--ink-3)' }}>
          {label}
        </div>
        {onNav && (
          <button
            className="btn-icon"
            style={{ width: 18, height: 18, color: accent, opacity: 0.7 }}
            onClick={onNav}
            title={`Ir para ${label}`}
          >
            <ChevronRight size={12} />
          </button>
        )}
      </div>
      {loading ? (
        <div style={{ height: 30, width: 44, background: 'var(--surface-3)', borderRadius: 6 }} />
      ) : (
        <div className="num-display" style={{ fontSize: 30, lineHeight: 1, color: accent }}>
          {value}
        </div>
      )}
      {subtitle && !loading && (
        <div style={{ fontSize: 10.5, color: warn ? 'var(--warning)' : 'var(--ink-4)', lineHeight: 1.3, marginTop: 1 }}>
          {subtitle}
        </div>
      )}
    </div>
  )
}

// ── Bottom metric ─────────────────────────────────────────────────────
function BottomMetric({
  label, value, delta, spark, donut, loading,
}: {
  label: string; value: number | string; delta?: string
  spark?: number[]; donut?: number; loading?: boolean
}) {
  return (
    <div className="metric">
      <div className="label">
        <span className="t">{label}</span>
        {donut != null
          ? <Donut pct={donut} />
          : spark
            ? <div className="spark"><Sparkline data={spark} color="var(--accent)" /></div>
            : null}
      </div>
      {loading ? (
        <div style={{ height: 32, width: 64, background: 'var(--surface-3)', borderRadius: 8, marginTop: 10 }} />
      ) : (
        <div className="num num-display">{value}</div>
      )}
      {delta && !loading && <div className="delta"><span>{delta}</span></div>}
    </div>
  )
}

// ── Slot group accordion ──────────────────────────────────────────────
function SlotGroup({
  profId, name, slots, bookingSlot, isProfessional, onSlotClick, defaultExpanded,
}: {
  profId: number; name: string; slots: Slot[]
  bookingSlot: Slot | null; isProfessional: boolean
  onSlotClick: (s: Slot) => void; defaultExpanded: boolean
}) {
  const [open, setOpen] = useState(defaultExpanded)
  const available = slots.filter(s => s.available).length

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
      {/* Accordion header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 12px', cursor: 'pointer',
          background: open ? 'color-mix(in oklch, var(--accent) 5%, var(--surface-2))' : 'var(--surface-2)',
          userSelect: 'none',
        }}
      >
        <div style={{
          width: 24, height: 24, borderRadius: 6, flexShrink: 0,
          background: 'color-mix(in oklch, var(--accent) 14%, var(--surface-3))',
          display: 'grid', placeItems: 'center',
          color: 'var(--accent)', fontWeight: 700, fontSize: 9,
          border: '1px solid color-mix(in oklch, var(--accent) 20%, transparent)',
        }}>
          {name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)' }}>
          {name}
        </span>
        <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>
          {available}/{slots.length} livre{available !== 1 ? 's' : ''}
        </span>
        {open ? <ChevronUp size={13} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
               : <ChevronDown size={13} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />}
      </div>

      {/* Slots */}
      {open && (
        <div style={{ padding: '10px 12px', background: 'var(--surface-1)' }}>
          {isProfessional ? (
            <div className="slots">
              {slots.map((slot, idx) => (
                <div key={idx} className={['slot', !slot.available ? 'taken' : ''].filter(Boolean).join(' ')} style={{ cursor: 'default' }}>
                  {new Date(slot.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              ))}
            </div>
          ) : (
            <div className="slots">
              {slots.map((slot, idx) => (
                <button
                  key={idx}
                  className={[
                    'slot',
                    !slot.available ? 'taken' : '',
                    bookingSlot?.startAt === slot.startAt && bookingSlot.professionalId === profId ? 'selected' : '',
                  ].filter(Boolean).join(' ')}
                  disabled={!slot.available}
                  onClick={() => slot.available && onSlotClick(slot)}
                >
                  {new Date(slot.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Professional picker (time-view) ───────────────────────────────────
function ProfPicker({
  slots, onPick, onCancel,
}: { slots: Slot[]; onPick: (s: Slot) => void; onCancel: () => void }) {
  return (
    <div style={{
      border: '1px solid var(--border-strong)', borderRadius: 10,
      background: 'var(--surface-1)', boxShadow: 'var(--shadow-2)',
      padding: '10px',
    }}>
      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 8, fontWeight: 600 }}>
        Escolha o profissional
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {slots.map(s => (
          <button
            key={s.professionalId}
            className="btn btn-ghost btn-sm"
            style={{ justifyContent: 'flex-start', gap: 8 }}
            onClick={() => onPick(s)}
          >
            <div style={{
              width: 20, height: 20, borderRadius: 5, flexShrink: 0,
              background: 'color-mix(in oklch, var(--accent) 14%, var(--surface-2))',
              display: 'grid', placeItems: 'center',
              color: 'var(--accent)', fontWeight: 700, fontSize: 8,
              border: '1px solid color-mix(in oklch, var(--accent) 20%, transparent)',
            }}>
              {s.professionalName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            {s.professionalName}
          </button>
        ))}
      </div>
      <button className="btn btn-subtle btn-sm" style={{ width: '100%', marginTop: 6 }} onClick={onCancel}>
        Cancelar
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────
export function DashboardHome() {
  const { user } = useAuthStore()
  const companyId = useCompanyId()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { selectedProfessionalId } = useProfessionalFilterStore()

  const [selectedDate, setSelectedDate]   = useState<string | undefined>()
  const [bookingSlot, setBookingSlot]     = useState<Slot | null>(null)
  const [slotView, setSlotView]           = useState<'professional' | 'time'>('professional')
  const [pickerTime, setPickerTime]       = useState<string | null>(null)
  const [pickerSlots, setPickerSlots]     = useState<Slot[]>([])

  const profId = selectedProfessionalId ?? undefined

  // ── Data ──────────────────────────────────────────────────────
  const { data: rawSlots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ['slots', companyId, selectedDate],
    queryFn:  () => getAvailableSlots(companyId!, selectedDate!),
    enabled:  !!companyId && !!selectedDate,
  })

  const { data: todayAppts = [], isLoading: loadingToday } = useQuery({
    queryKey: ['appointments', 'today', companyId, profId],
    queryFn:  () => getTodayAppointments(companyId!, profId),
    enabled:  !!companyId,
    refetchInterval: 60000,
  })

  const { data: monthAppts = [], isLoading: loadingMonth } = useQuery({
    queryKey: ['appointments', 'month', companyId, profId],
    queryFn:  () => getMonthAppointments(companyId!, profId),
    enabled:  !!companyId,
    staleTime: 1000 * 60 * 5,
  })

  const { data: pendingAppts = [], isLoading: loadingPending } = useQuery({
    queryKey: ['appointments', 'pending', companyId, profId],
    queryFn:  () => getPendingAppointments(companyId!, profId),
    enabled:  !!companyId,
    refetchInterval: 30000,
  })

  // ── Derived ───────────────────────────────────────────────────
  const todayTotal = (todayAppts as AppointmentResponse[])
    .filter(a => a.status !== 'CANCELLED').length

  const monthConfirmed = (monthAppts as AppointmentResponse[])
    .filter(a => a.status === 'CONFIRMED' || a.status === 'COMPLETED').length

  const monthTotal = (monthAppts as AppointmentResponse[])
    .filter(a => a.status !== 'CANCELLED').length

  const confirmRate = monthTotal > 0 ? Math.round((monthConfirmed / monthTotal) * 100) : 0

  // ── Slot groups: by professional ─────────────────────────────
  const slotsByProf = (() => {
    const map = new Map<number, { name: string; slots: Slot[] }>()
    for (const slot of rawSlots as Slot[]) {
      if (selectedProfessionalId && slot.professionalId !== selectedProfessionalId) continue
      if (!map.has(slot.professionalId)) {
        map.set(slot.professionalId, { name: slot.professionalName, slots: [] })
      }
      map.get(slot.professionalId)!.slots.push(slot)
    }
    return [...map.entries()]
  })()

  // ── Slot groups: by time ─────────────────────────────────────
  const slotsByTime = (() => {
    const map = new Map<string, Slot[]>()
    for (const slot of rawSlots as Slot[]) {
      if (selectedProfessionalId && slot.professionalId !== selectedProfessionalId) continue
      if (!map.has(slot.startAt)) map.set(slot.startAt, [])
      map.get(slot.startAt)!.push(slot)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  })()

  // ── Navigation ────────────────────────────────────────────────
  const base = user?.companyId ? `/${user.companyId}/dashboard` : ''
  const goToPending     = () => navigate(`${base}/pending`)
  const goToAppointments = () => navigate(`${base}/appointments`)

  // ── Handlers ─────────────────────────────────────────────────
  const handleCloseSlots = () => {
    setSelectedDate(undefined)
    setBookingSlot(null)
    setPickerTime(null)
    setPickerSlots([])
  }

  const handleTimeClick = (time: string, slots: Slot[]) => {
    const available = slots.filter(s => s.available)
    if (available.length === 0) return
    if (available.length === 1) {
      setBookingSlot(available[0])
      setPickerTime(null)
    } else {
      setPickerTime(time)
      setPickerSlots(available)
    }
  }

  // ── Labels ────────────────────────────────────────────────────
  const today = new Date().toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  const todayLabel = today.charAt(0).toUpperCase() + today.slice(1)
  const firstName  = user?.name?.split(' ')[0] ?? 'você'

  const selectedDateLabel = selectedDate
    ? (() => {
        const d = new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', {
          weekday: 'long', day: '2-digit', month: 'long',
        })
        return d.charAt(0).toUpperCase() + d.slice(1)
      })()
    : ''

  const isProfessional = user?.role === 'PROFESSIONAL'

  return (
    <div className="page">

      {/* ── Top: greeting + 2 fixed mini metrics ─────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 20, marginBottom: 20,
      }}>
        <div>
          <div className="h-display" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Olá, {firstName}
            <span style={{ color: 'var(--accent)' }}><Hand size={22} /></span>
          </div>
          <div className="sub" style={{ marginTop: 6 }}>
            {todayLabel} · <span className="text-mono">{todayTotal}</span>{' '}
            agendamento{todayTotal !== 1 ? 's' : ''} hoje
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <MiniMetric
            label="Hoje"
            value={todayTotal}
            subtitle="agendamentos confirmados"
            loading={loadingToday}
            onNav={goToAppointments}
          />
          <MiniMetric
            label="Pendentes"
            value={pendingAppts.length}
            subtitle={pendingAppts.length === 0 ? 'tudo em dia ✓' : 'aguardando confirmação'}
            warn={pendingAppts.length > 0}
            loading={loadingPending}
            onNav={goToPending}
          />
        </div>
      </div>

      {/* ── Middle: calendar (left) + slots (right) ──────────── */}
      {/*
        alignItems: stretch → ambas as colunas ficam com a mesma altura (definida pelo calendário).
        overflow: hidden no card de slots → impede que ele "empurre" a linha para cima;
        o conteúdo interno rola via overflowY: auto no scroll container.
      */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14, alignItems: 'stretch' }}>

        {/* Calendar */}
        <div className="card card-pad">
          <CalendarView
            onDayClick={d => { setSelectedDate(d); setBookingSlot(null); setPickerTime(null) }}
            selectedDate={selectedDate}
            noCard
          />
        </div>

        {/* Slots panel — altura igual ao calendário; conteúdo interno faz scroll */}
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedDate ? (
            /* Empty state — ocupa toda a altura via flex: 1 */
            <div style={{
              flex: 1, minHeight: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 10, color: 'var(--ink-4)',
            }}>
              <CalendarDays size={28} style={{ opacity: 0.35 }} />
              <div style={{ fontSize: 13 }}>Selecione um dia no calendário</div>
            </div>
          ) : (
            <>
              {/* Header: date + view filter + close */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 12, paddingBottom: 12,
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
              }}>
                <div style={{ flex: 1, fontWeight: 600, fontSize: 13, color: 'var(--ink)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedDateLabel}
                </div>

                {/* View filter */}
                {!isProfessional && (
                  <div style={{ display: 'flex', gap: 1, background: 'var(--surface-2)', borderRadius: 7, padding: 2, flexShrink: 0 }}>
                    {([
                      { view: 'professional', icon: <Users size={10} />, label: 'Profissional' },
                      { view: 'time',         icon: <Clock size={10} />, label: 'Horário' },
                    ] as const).map(({ view, icon, label }) => (
                      <button
                        key={view}
                        title={`Ver por ${label}`}
                        onClick={() => { setSlotView(view); setPickerTime(null) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 3,
                          padding: '3px 7px', borderRadius: 5, border: 'none', cursor: 'pointer',
                          fontSize: 10, fontWeight: 600, font: 'inherit', letterSpacing: '0.01em',
                          background: slotView === view ? 'var(--surface-1)' : 'transparent',
                          color: slotView === view ? 'var(--ink)' : 'var(--ink-4)',
                          boxShadow: slotView === view ? 'var(--shadow-1)' : 'none',
                          transition: 'all .12s',
                        }}
                      >
                        {icon} {label}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  className="btn-icon"
                  style={{ width: 22, height: 22, flexShrink: 0 }}
                  onClick={handleCloseSlots}
                  title="Fechar"
                >
                  <X size={13} />
                </button>
              </div>

              {loadingSlots ? (
                <div className="loading" style={{ height: 60 }}>Carregando horários…</div>
              ) : (slotView === 'professional' ? slotsByProf : slotsByTime).length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--ink-4)', fontSize: 13, padding: '24px 0', flex: 1 }}>
                  Nenhum horário disponível para este dia.
                </div>
              ) : slotView === 'professional' ? (
                /* ── Professional view ── */
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {slotsByProf.map(([pid, group], i) => (
                    <SlotGroup
                      key={pid}
                      profId={pid}
                      name={group.name}
                      slots={group.slots}
                      bookingSlot={bookingSlot}
                      isProfessional={isProfessional}
                      onSlotClick={setBookingSlot}
                      defaultExpanded={i === 0}
                    />
                  ))}
                </div>
              ) : (
                /* ── Time view ── */
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                  {/*
                    Botões direto no grid (sem wrapper div) para que o
                    grid-template-columns: repeat(6, 1fr) os dimensione corretamente.
                  */}
                  <div className="slots">
                    {slotsByTime.map(([time, slots]) => {
                      const available = slots.filter(s => s.available)
                      const isAvail   = available.length > 0
                      const isPicked  = pickerTime === time

                      return (
                        <button
                          key={time}
                          className={['slot', !isAvail ? 'taken' : '', isPicked ? 'selected' : ''].filter(Boolean).join(' ')}
                          style={{ width: '100%' }}
                          disabled={!isAvail}
                          onClick={() => isAvail && handleTimeClick(time, slots)}
                        >
                          {new Date(time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </button>
                      )
                    })}
                  </div>

                  {/* Professional picker shown below the time grid */}
                  {pickerTime && pickerSlots.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <ProfPicker
                        slots={pickerSlots}
                        onPick={s => { setBookingSlot(s); setPickerTime(null) }}
                        onCancel={() => setPickerTime(null)}
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Bottom: pending (left) + month metrics (right) ──── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
        <PendingList />
        <div className="metrics" style={{ gridTemplateColumns: '1fr', gap: 12 }}>
          <BottomMetric
            label="Mês atual"
            value={monthTotal}
            delta={`${monthConfirmed} confirmado(s)`}
            spark={[5, 4, 6, 7, 5, 4, monthTotal]}
            loading={loadingMonth}
          />
          <BottomMetric
            label="Taxa de confirmação"
            value={`${confirmRate}%`}
            delta={`${monthConfirmed} de ${monthTotal}`}
            donut={confirmRate}
            loading={loadingMonth}
          />
        </div>
      </div>

      {/* Booking modal */}
      {bookingSlot && companyId && selectedDate && (
        <AppointmentModal
          slot={bookingSlot}
          companyId={companyId}
          date={selectedDate}
          onClose={() => setBookingSlot(null)}
          onSuccess={() => {
            setBookingSlot(null)
            queryClient.invalidateQueries({ queryKey: ['slots', companyId, selectedDate] })
            queryClient.invalidateQueries({ queryKey: ['calendar'] })
            queryClient.invalidateQueries({ queryKey: ['appointments'] })
          }}
        />
      )}
    </div>
  )
}

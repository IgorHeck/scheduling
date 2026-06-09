import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  getPublicCompany,
  getPublicCalendar,
  getPublicSlots,
  createPublicAppointment,
} from '../../api/public'
import type { CalendarDayResponse } from '../../types/appointment.types'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Building2, Check, Lock, AlertCircle, Users, Clock } from 'lucide-react'
import { useAccentColor } from '../../hooks/useAccentColor'

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const schema = z.object({
  clientName:  z.string().min(2, 'Nome muito curto'),
  clientEmail: z.string().email('Email inválido'),
  clientPhone: z.string().optional(),
  notes:       z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Slot {
  startAt: string
  endAt: string
  professionalId: number
  professionalName: string
  available: boolean
}

type Step = 'calendar' | 'slots' | 'form' | 'success'

/* ── Error screen for guard states ── */
function BookingErrorScreen({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div className="card card-pad" style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--surface-2)',
          display: 'grid', placeItems: 'center',
          margin: '0 auto 16px',
          color: 'var(--ink-3)',
          border: '1px solid var(--border)',
        }}>
          {icon}
        </div>
        <div className="h-card" style={{ marginBottom: 8 }}>{title}</div>
        <div className="text-meta">{description}</div>
      </div>
    </div>
  )
}

export function BookingPage() {
  const { companyId: companyIdParam } = useParams<{ companyId: string }>()
  const COMPANY_ID = Number(companyIdParam)

  /* ── Apply company accent color (localStorage, same browser only).
     TODO: once backend exposes accentColor on GET /companies/{id}/public,
     replace with that value so cross-browser accent works. ── */
  const invalidId = !companyIdParam || isNaN(COMPANY_ID) || COMPANY_ID <= 0
  useAccentColor(invalidId ? undefined : COMPANY_ID)

  const [step, setStep]               = useState<Step>('calendar')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [slotView, setSlotView]       = useState<'professional' | 'time'>('professional')
  const [openProfId, setOpenProfId]   = useState<number | null>(null)
  const [pickerTime, setPickerTime]   = useState<string | null>(null)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const navigate = useNavigate()

  const year     = currentDate.getFullYear()
  const month    = currentDate.getMonth()
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
  const today    = new Date().toISOString().split('T')[0]

  /* ── Guard 1: invalid companyId in URL (also used above for useAccentColor) ── */

  const { data: company, isLoading: companyLoading, isError: companyError } = useQuery({
    queryKey: ['public-company', COMPANY_ID],
    queryFn: () => getPublicCompany(COMPANY_ID),
    enabled: !invalidId,
    retry: false,
  })

  const { data: calendarDays = [] } = useQuery({
    queryKey: ['public-calendar', COMPANY_ID, monthStr],
    queryFn: () => getPublicCalendar(COMPANY_ID, monthStr),
  })

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ['public-slots', COMPANY_ID, selectedDate],
    queryFn: () => getPublicSlots(COMPANY_ID, selectedDate!),
    enabled: !!selectedDate,
  })

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const dayMap = new Map<string, CalendarDayResponse>(
    calendarDays.map((d: CalendarDayResponse) => [d.date, d])
  )

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const handleDayClick = (dateStr: string) => {
    if (dateStr < today) return
    setSelectedDate(dateStr)
    setPickerTime(null)
    setOpenProfId(null)
    setStep('slots')
  }

  const handleSlotClick = (slot: Slot) => {
    if (!slot.available) return
    setSelectedSlot(slot)
    setStep('form')
  }

  const handleTimeClick = (timeSlots: Slot[]) => {
    const available = timeSlots.filter(s => s.available)
    if (available.length === 0) return
    if (available.length === 1) {
      handleSlotClick(available[0])
    } else {
      // Vários profissionais nesse horário — cliente escolhe qual
      setPickerTime(available[0].startAt)
    }
  }

  // ── Agrupamento dos slots ──
  const slotsByProf = (() => {
    const map = new Map<number, { name: string; slots: Slot[] }>()
    for (const slot of slots as Slot[]) {
      if (!map.has(slot.professionalId)) {
        map.set(slot.professionalId, { name: slot.professionalName, slots: [] })
      }
      map.get(slot.professionalId)!.slots.push(slot)
    }
    return [...map.entries()]
  })()

  const slotsByTime = (() => {
    const map = new Map<string, Slot[]>()
    for (const slot of slots as Slot[]) {
      if (!map.has(slot.startAt)) map.set(slot.startAt, [])
      map.get(slot.startAt)!.push(slot)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  })()

  const onSubmit = async (data: FormData) => {
    if (!selectedSlot) return
    setSaving(true)
    setError('')
    try {
      await createPublicAppointment({
        companyId: COMPANY_ID,
        professionalId: selectedSlot.professionalId,
        startAt: selectedSlot.startAt,
        endAt: selectedSlot.endAt,
        ...data,
      })
      setStep('success')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao solicitar agendamento.')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long',
    })

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  /* ── Guards ── */
  if (invalidId)
    return (
      <BookingErrorScreen
        icon={<AlertCircle size={24} />}
        title="Link inválido"
        description="Este link não corresponde a nenhuma empresa. Verifique se copiou o endereço corretamente."
      />
    )

  if (companyLoading)
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading">Carregando...</div>
      </div>
    )

  if (companyError)
    return (
      <BookingErrorScreen
        icon={<Building2 size={24} />}
        title="Empresa não encontrada"
        description="Este link pode estar desatualizado ou a empresa foi removida. Solicite um novo link à empresa."
      />
    )

  if (company && !company.active)
    return (
      <BookingErrorScreen
        icon={<AlertCircle size={24} />}
        title="Empresa temporariamente indisponível"
        description="Esta empresa está pausada no momento. Tente novamente mais tarde ou entre em contato diretamente."
      />
    )

  if (company && !company.allowClientBooking)
    return (
      <BookingErrorScreen
        icon={<Lock size={24} />}
        title="Agendamentos desativados"
        description="Esta empresa não está aceitando solicitações online no momento. Entre em contato por telefone ou outro canal."
      />
    )

  const companyInitials = company?.name
    .split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? ''

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── Header ── */}
      <header style={{
        background: 'var(--surface-1)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 24px',
      }}>
        <div style={{
          maxWidth: 640, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            {company?.logoUrl ? (
              <img
                src={`${import.meta.env.VITE_API_URL}${company.logoUrl}`}
                alt={company.name}
                style={{
                  width: 40, height: 40, borderRadius: 10,
                  objectFit: 'cover', flexShrink: 0,
                  border: '1px solid var(--border)',
                }}
              />
            ) : (
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: 'color-mix(in oklch, var(--accent) 14%, var(--surface-2))',
                display: 'grid', placeItems: 'center',
                color: 'var(--accent)', fontWeight: 700, fontSize: 15,
                border: '1px solid color-mix(in oklch, var(--accent) 22%, transparent)',
              }}>
                {companyInitials || <Building2 size={18} style={{ color: 'var(--accent)' }} />}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontWeight: 600, fontSize: 14, color: 'var(--ink)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {company?.name ?? 'Agendamento'}
              </div>
              {company?.address && (
                <div className="text-meta" style={{
                  fontSize: 11.5, marginTop: 1,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {company.address}
                </div>
              )}
            </div>
          </div>
          {company?.phone && (
            <a
              href={`tel:${company.phone}`}
              style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', flexShrink: 0, fontWeight: 500 }}
            >
              {company.phone}
            </a>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '28px 16px 60px' }}>

        {/* Step indicator */}
        {step !== 'success' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            {[
              { key: 'calendar', label: 'Escolha o dia' },
              { key: 'slots',    label: 'Escolha o horário' },
              { key: 'form',     label: 'Seus dados' },
            ].map((s, idx) => {
              const allSteps   = ['calendar', 'slots', 'form']
              const currentIdx = allSteps.indexOf(step)
              const thisIdx    = allSteps.indexOf(s.key)
              const done   = thisIdx < currentIdx
              const active = thisIdx === currentIdx
              return (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    opacity: active ? 1 : done ? 0.7 : 0.3,
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      display: 'grid', placeItems: 'center',
                      background: active ? 'var(--accent)' : 'var(--surface-3)',
                      color: active ? 'var(--bg)' : 'var(--ink-2)',
                      fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>
                      {done ? <Check size={12} /> : idx + 1}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-2)' }}>
                      {s.label}
                    </span>
                  </div>
                  {idx < 2 && (
                    <span style={{ color: 'var(--border-strong)', fontSize: 14 }}>›</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── STEP 1: Calendar ── */}
        {step === 'calendar' && (
          <div className="card card-pad">

            {/* Month navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <button
                className="btn btn-ghost btn-sm btn-icon"
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                aria-label="Mês anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', textTransform: 'capitalize' }}>
                {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
              </div>
              <button
                className="btn btn-ghost btn-sm btn-icon"
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                aria-label="Próximo mês"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day-of-week headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
              {DAYS_OF_WEEK.map(d => (
                <div key={d} className="cal-head">{d}</div>
              ))}
            </div>

            {/* Calendar cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
              {cells.map((day, idx) => {
                if (!day) return <div key={'e-' + idx} style={{ aspectRatio: '1' }} />

                const dateStr  = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const info     = dayMap.get(dateStr)
                const isPast   = dateStr < today
                const isFull   = info?.status === 'full'
                const isPartial = info?.status === 'partial'
                const isSelected = dateStr === selectedDate
                const disabled = isPast || isFull

                let extraStyle: React.CSSProperties = {}
                if (disabled) {
                  extraStyle = { opacity: 0.22, cursor: 'not-allowed', pointerEvents: 'none' }
                } else if (isPartial) {
                  extraStyle = {
                    background: 'color-mix(in oklch, var(--warning) 10%, transparent)',
                    color: 'var(--warning)',
                  }
                }
                if (isSelected) {
                  extraStyle = { ...extraStyle, outline: '2px solid var(--accent)', outlineOffset: 1 }
                }

                return (
                  <button
                    key={dateStr}
                    onClick={() => !disabled && handleDayClick(dateStr)}
                    disabled={disabled}
                    className={`cal-cell${isSelected ? ' selected' : ''}`}
                    style={extraStyle}
                  >
                    {day}
                    {info && !isPast && (
                      <span style={{
                        display: 'block', width: 4, height: 4, borderRadius: '50%',
                        margin: '2px auto 0',
                        background: isFull
                          ? 'var(--danger)'
                          : isPartial ? 'var(--warning)' : 'var(--accent)',
                      }} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div style={{
              display: 'flex', gap: 16, flexWrap: 'wrap',
              marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)',
            }}>
              {[
                { color: 'var(--accent)',  label: 'Disponível' },
                { color: 'var(--warning)', label: 'Parcial' },
                { color: 'var(--danger)',  label: 'Lotado' },
              ].map(item => (
                <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--ink-3)' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: Slots ── */}
        {step === 'slots' && selectedDate && (
          <div className="card card-pad">

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <button
                className="btn btn-ghost btn-sm btn-icon"
                onClick={() => setStep('calendar')}
                aria-label="Voltar"
              >
                <ChevronLeft size={16} />
              </button>
              <div style={{ flex: 1, fontWeight: 600, fontSize: 14, color: 'var(--ink)', textTransform: 'capitalize', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {formatDate(selectedDate)}
              </div>

              {/* Seletor de visualização: por profissional ou por horário */}
              {slots.filter((s: Slot) => s.available).length > 0 && (
                <div style={{ display: 'flex', gap: 1, background: 'var(--surface-2)', borderRadius: 7, padding: 2, flexShrink: 0 }}>
                  {([
                    { view: 'professional', icon: <Users size={10} />, label: 'Profissional' },
                    { view: 'time',         icon: <Clock size={10} />, label: 'Horário' },
                  ] as const).map(({ view, icon, label }) => (
                    <button
                      key={view}
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
            </div>

            {slotsLoading ? (
              <div className="loading">Carregando horários...</div>
            ) : slots.filter((s: Slot) => s.available).length === 0 ? (
              <div className="empty">
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink-2)' }}>Nenhum horário disponível</div>
                <div className="text-meta" style={{ marginTop: 4 }}>Escolha outro dia.</div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setStep('calendar')}
                  style={{ marginTop: 12 }}
                >
                  ← Voltar ao calendário
                </button>
              </div>
            ) : slotView === 'professional' ? (
              /* ── Por profissional (accordion) ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {slotsByProf.map(([pid, group], i) => {
                  const open = openProfId === null ? i === 0 : openProfId === pid
                  const available = group.slots.filter(s => s.available).length
                  return (
                    <div key={pid} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <div
                        onClick={() => setOpenProfId(open ? -1 : pid)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '10px 12px', cursor: 'pointer', userSelect: 'none',
                          background: open ? 'color-mix(in oklch, var(--accent) 5%, var(--surface-2))' : 'var(--surface-2)',
                        }}
                      >
                        <div style={{
                          width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                          background: 'color-mix(in oklch, var(--accent) 14%, var(--surface-3))',
                          display: 'grid', placeItems: 'center',
                          color: 'var(--accent)', fontWeight: 700, fontSize: 10,
                          border: '1px solid color-mix(in oklch, var(--accent) 20%, transparent)',
                        }}>
                          {group.name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>{group.name}</span>
                        <span style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>
                          {available} livre{available !== 1 ? 's' : ''}
                        </span>
                        {open ? <ChevronUp size={14} style={{ color: 'var(--ink-4)' }} />
                               : <ChevronDown size={14} style={{ color: 'var(--ink-4)' }} />}
                      </div>
                      {open && (
                        <div style={{ padding: '12px', background: 'var(--surface-1)' }}>
                          <div className="slots" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))' }}>
                            {group.slots.map((slot, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSlotClick(slot)}
                                disabled={!slot.available}
                                className={`slot${!slot.available ? ' taken' : ''}`}
                              >
                                {formatTime(slot.startAt)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              /* ── Por horário ── */
              <div>
                <div className="text-meta" style={{ marginBottom: 12 }}>
                  Escolha um horário — se houver mais de um profissional, você seleciona em seguida.
                </div>
                <div className="slots" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))' }}>
                  {slotsByTime.map(([time, timeSlots]) => {
                    const available = timeSlots.filter(s => s.available)
                    const isAvail = available.length > 0
                    return (
                      <button
                        key={time}
                        onClick={() => handleTimeClick(timeSlots)}
                        disabled={!isAvail}
                        className={`slot${!isAvail ? ' taken' : ''}${pickerTime === time ? ' selected' : ''}`}
                      >
                        {formatTime(time)}
                      </button>
                    )
                  })}
                </div>

                {/* Picker de profissional quando há vários no horário escolhido */}
                {pickerTime && (
                  <div style={{
                    marginTop: 14, padding: 12, borderRadius: 10,
                    border: '1px solid var(--border-strong)', background: 'var(--surface-1)',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 8 }}>
                      Profissionais disponíveis às {formatTime(pickerTime)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {slots
                        .filter((s: Slot) => s.startAt === pickerTime && s.available)
                        .map((slot: Slot) => (
                          <button
                            key={slot.professionalId}
                            className="btn btn-ghost btn-sm"
                            style={{ justifyContent: 'flex-start', gap: 8 }}
                            onClick={() => handleSlotClick(slot)}
                          >
                            <div style={{
                              width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                              background: 'color-mix(in oklch, var(--accent) 14%, var(--surface-2))',
                              display: 'grid', placeItems: 'center',
                              color: 'var(--accent)', fontWeight: 700, fontSize: 9,
                              border: '1px solid color-mix(in oklch, var(--accent) 20%, transparent)',
                            }}>
                              {slot.professionalName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                            </div>
                            {slot.professionalName}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Form ── */}
        {step === 'form' && selectedSlot && selectedDate && (
          <div className="card card-pad">

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <button
                className="btn btn-ghost btn-sm btn-icon"
                onClick={() => setStep('slots')}
                aria-label="Voltar"
              >
                <ChevronLeft size={16} />
              </button>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>Seus dados</div>
            </div>

            {/* Slot summary */}
            <div style={{
              padding: '12px 14px', borderRadius: 10, marginBottom: 20,
              background: 'color-mix(in oklch, var(--accent) 8%, transparent)',
              border: '1px solid color-mix(in oklch, var(--accent) 22%, transparent)',
            }}>
              <div className="text-tag" style={{ marginBottom: 5 }}>Horário selecionado</div>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)', textTransform: 'capitalize' }}>
                {formatDate(selectedDate)}
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--accent)', fontWeight: 500, marginTop: 3 }}>
                {formatTime(selectedSlot.startAt)} — {formatTime(selectedSlot.endAt)}
              </div>
              <div className="text-meta" style={{ marginTop: 3 }}>
                com {selectedSlot.professionalName}
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div className="field">
                <label>Nome completo <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  {...register('clientName')}
                  type="text"
                  placeholder="João Silva"
                  className="input"
                />
                {errors.clientName && <div className="error">{errors.clientName.message}</div>}
              </div>

              <div className="field">
                <label>Email <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  {...register('clientEmail')}
                  type="email"
                  placeholder="seu@email.com"
                  className="input"
                />
                {errors.clientEmail && <div className="error">{errors.clientEmail.message}</div>}
              </div>

              <div className="field">
                <label>
                  Telefone{' '}
                  <span className="text-meta" style={{ fontWeight: 400 }}>(opcional)</span>
                </label>
                <input
                  {...register('clientPhone')}
                  type="tel"
                  placeholder="(48) 99999-9999"
                  className="input"
                />
              </div>

              <div className="field">
                <label>
                  Observações{' '}
                  <span className="text-meta" style={{ fontWeight: 400 }}>(opcional)</span>
                </label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  placeholder="Ex: Primeira consulta, trazer documentos..."
                  className="input"
                  style={{ resize: 'none', minHeight: 68 }}
                />
              </div>

              {error && <div className="alert-error">{error}</div>}

              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {saving ? 'Enviando...' : 'Solicitar agendamento'}
              </button>

              <div className="text-meta" style={{ textAlign: 'center', fontSize: 11.5 }}>
                Sua solicitação será analisada e confirmada em breve.
              </div>
            </form>
          </div>
        )}

        {/* ── STEP 4: Success ── */}
        {step === 'success' && selectedSlot && selectedDate && (
          <div className="card card-pad" style={{ textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'color-mix(in oklch, var(--accent) 14%, transparent)',
              border: '1px solid color-mix(in oklch, var(--accent) 28%, transparent)',
              display: 'grid', placeItems: 'center',
              margin: '0 auto 16px',
            }}>
              <Check size={26} style={{ color: 'var(--accent)' }} />
            </div>

            <div className="h-card" style={{ marginBottom: 6 }}>Solicitação enviada!</div>
            <div className="text-meta" style={{ marginBottom: 22 }}>
              Sua solicitação foi recebida e será confirmada em breve.
            </div>

            {/* Booking details */}
            <div style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '14px 16px',
              marginBottom: 24, textAlign: 'left',
            }}>
              <div className="text-tag" style={{ marginBottom: 8 }}>Detalhes do agendamento</div>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)', textTransform: 'capitalize' }}>
                {formatDate(selectedDate)}
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 3 }}>
                {formatTime(selectedSlot.startAt)} — {formatTime(selectedSlot.endAt)}
              </div>
              <div className="text-meta" style={{ marginTop: 4 }}>
                com {selectedSlot.professionalName}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setStep('calendar')
                  setSelectedDate(null)
                  setSelectedSlot(null)
                }}
              >
                Fazer outro agendamento
              </button>
              <button
                className="btn btn-ghost"
                style={{ color: 'var(--ink-3)', fontSize: 13 }}
                onClick={() => navigate('/my-appointments')}
              >
                Ver meus agendamentos
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

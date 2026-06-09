import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCalendarMonth } from '../hooks/useAppointments'
import type { CalendarDayResponse } from '../types/appointment.types'

interface Props {
  onDayClick?: (date: string) => void
  selectedDate?: string
  noCard?: boolean
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function getStatusBars(status: string): [number, number, number] {
  // [avail, partial, full] counts for bars
  if (status === 'available') return [3, 0, 0]
  if (status === 'partial') return [1, 2, 0]
  if (status === 'full') return [0, 0, 3]
  return [0, 0, 0]
}

export function CalendarView({ onDayClick, selectedDate, noCard = false }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  const { data: calendarDays = [], isLoading } = useCalendarMonth(monthStr)

  const dayMap = new Map<string, CalendarDayResponse>(
    calendarDays.map((d: CalendarDayResponse) => [d.date, d])
  )

  const firstDay   = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const today = new Date().toISOString().split('T')[0]

  const monthLabel = currentDate.toLocaleString('pt-BR', {
    month: 'long', year: 'numeric',
  })
  const monthLabelCap = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  // Build grid: leading gutter + 7 day-of-week headers, then rows
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to multiple of 7
  while (cells.length % 7 !== 0) cells.push(null)

  const inner = (
    <>
      <div className="card-hd">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="h-section">{monthLabelCap}</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn-icon" onClick={prevMonth} title="Mês anterior">
            <ChevronLeft size={14} />
          </button>
          <button className="btn-icon" onClick={nextMonth} title="Próximo mês">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <>
          {/* Calendar grid */}
          <div className="cal">
            {/* Leading gutter cell */}
            <div className="cal-head" />
            {WEEK_DAYS.map(d => (
              <div key={d} className="cal-head">{d}</div>
            ))}

            {/* Rows */}
            {Array.from({ length: cells.length / 7 }, (_, row) => (
              <div key={row} style={{ display: 'contents' }}>
                {/* Row gutter */}
                <div className="cal-head" />
                {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
                  if (!day) {
                    return <div key={`empty-${row}-${col}`} className="cal-cell dim" style={{ cursor: 'default' }} />
                  }
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const info = dayMap.get(dateStr)
                  const isToday = dateStr === today
                  const isSelected = dateStr === selectedDate
                  const isPast = dateStr < today

                  const cls = [
                    'cal-cell',
                    isPast ? 'dim' : '',
                    isToday && !isSelected ? 'today' : '',
                    isSelected ? 'selected' : '',
                  ].filter(Boolean).join(' ')

                  const bars = info ? getStatusBars(info.status) : null

                  return (
                    <div
                      key={dateStr}
                      className={cls}
                      onClick={() => !isPast && onDayClick?.(dateStr)}
                      style={isPast ? { cursor: 'default' } : undefined}
                    >
                      <span>{day}</span>
                      {bars && (
                        <span className="bars">
                          {bars[0] > 0 && Array.from({ length: bars[0] }, (_, k) => (
                            <span key={`a${k}`} className="bar avail" style={{ height: 6 + k * 2 }} />
                          ))}
                          {bars[1] > 0 && Array.from({ length: bars[1] }, (_, k) => (
                            <span key={`p${k}`} className="bar partial" style={{ height: 8 + k * 2 }} />
                          ))}
                          {bars[2] > 0 && Array.from({ length: bars[2] }, (_, k) => (
                            <span key={`f${k}`} className="bar full" style={{ height: 10 + k * 2 }} />
                          ))}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 12, color: 'var(--ink-3)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--accent)', display: 'inline-block' }} />
              Disponível
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--warning)', display: 'inline-block' }} />
              Parcial
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--danger)', display: 'inline-block' }} />
              Lotado
            </span>
            <span className="text-meta" style={{ marginLeft: 'auto' }}>
              Clique em um dia para abrir os slots
            </span>
          </div>
        </>
      )}
    </>
  )

  if (noCard) return <>{inner}</>
  return <div className="card card-pad">{inner}</div>
}

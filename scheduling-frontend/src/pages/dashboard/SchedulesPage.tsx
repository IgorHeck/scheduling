import { useState, useEffect } from 'react'
import { Lock, Pencil, Trash2, X, ChevronDown, ChevronRight, Check } from 'lucide-react'
import {
  getCompanySchedules, createSchedule, updateSchedule,
  deleteSchedule, createBlock, getBlocks, deleteBlock,
  type ScheduleResponse, type BlockResponse,
} from '../../api/schedules'
import { DAY_LABELS, type DayOfWeek } from '../../types/schedule.types'
import { useCompanyId } from '../../hooks/useCompanyId'
import { useAuthStore } from '../../store/authStore'
import { useProfessionalFilterStore } from '../../store/professionalFilterStore'
import { useProfessionals } from '../../hooks/useUsers'

const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

const DAY_SHORT: Record<DayOfWeek, string> = {
  MONDAY: 'Seg', TUESDAY: 'Ter', WEDNESDAY: 'Qua',
  THURSDAY: 'Qui', FRIDAY: 'Sex', SATURDAY: 'Sáb', SUNDAY: 'Dom',
}

const SLOT_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h30' },
  { value: 120, label: '2 horas' },
]

interface DayDraft {
  scheduleId: number | null
  enabled: boolean
  startTime: string
  endTime: string
  lunchStart: string
  lunchEnd: string
  slotDurationMinutes: number
}

type EditDraft = Partial<Record<DayOfWeek, DayDraft>>

interface ProfGroup {
  professionalId: number
  professionalName: string
  schedules: ScheduleResponse[]
}

const DEFAULT_DAY: DayDraft = {
  scheduleId: null, enabled: false,
  startTime: '08:00', endTime: '18:00',
  lunchStart: '', lunchEnd: '', slotDurationMinutes: 60,
}

function buildDraft(schedules: ScheduleResponse[]): EditDraft {
  const draft: EditDraft = {}
  for (const day of DAYS) {
    const s = schedules.find(x => x.dayOfWeek === day)
    draft[day] = s ? {
      scheduleId: s.id, enabled: true,
      startTime:  s.startTime.substring(0, 5),
      endTime:    s.endTime.substring(0, 5),
      lunchStart: s.lunchStart ? s.lunchStart.substring(0, 5) : '',
      lunchEnd:   s.lunchEnd   ? s.lunchEnd.substring(0, 5)   : '',
      slotDurationMinutes: s.slotDurationMinutes,
    } : { ...DEFAULT_DAY }
  }
  return draft
}

function getInitials(name: string) {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
}

const inputSm: React.CSSProperties = {
  background: 'var(--surface-3)', color: 'var(--ink)',
  border: '1px solid var(--border)', borderRadius: 7,
  padding: '5px 7px', font: 'inherit', fontSize: 12.5, width: '100%',
}

export function SchedulesPage() {
  const { user } = useAuthStore()
  const companyId = useCompanyId()
  const { selectedProfessionalId } = useProfessionalFilterStore()
  const { data: professionals = [] } = useProfessionals(companyId)

  const [schedules, setSchedules] = useState<ScheduleResponse[]>([])
  const [blocks, setBlocks]       = useState<BlockResponse[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const [editingProfId, setEditingProfId]   = useState<number | null>(null)
  const [editDraft, setEditDraft]           = useState<EditDraft>({})
  const [expandedKeys, setExpandedKeys]     = useState<Set<string>>(new Set())
  // Grupos abertos na view mode — começa vazio (todos colapsados)
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set())

  const toggleGroupExpand = (profId: number) =>
    setExpandedGroups(prev => {
      const next = new Set(prev)
      next.has(profId) ? next.delete(profId) : next.add(profId)
      return next
    })

  const [showBlockForm, setShowBlockForm]       = useState(false)
  const [blockDate, setBlockDate]               = useState('')
  const [blockStart, setBlockStart]             = useState('')
  const [blockEnd, setBlockEnd]                 = useState('')
  const [blockReason, setBlockReason]           = useState('')
  const [blockProfessionalId, setBlockProfId]   = useState<number | null>(null)

  const isProfessional = user?.role === 'PROFESSIONAL'

  useEffect(() => {
    if (!companyId) return
    setLoading(true)
    Promise.all([
      getCompanySchedules(companyId).then(setSchedules),
      getBlocks(companyId).then(setBlocks),
    ]).finally(() => setLoading(false))
  }, [companyId])

  // ── Group schedules by professional ─────────────────────────────
  const allGroups: ProfGroup[] = []
  const seenIds = new Set<number>()

  for (const s of schedules) {
    if (!s.professional) continue
    const pid = s.professional.id
    if (!seenIds.has(pid)) {
      seenIds.add(pid)
      allGroups.push({ professionalId: pid, professionalName: s.professional.name, schedules: [] })
    }
    allGroups.find(g => g.professionalId === pid)!.schedules.push(s)
  }

  // Include professionals with no schedules yet
  for (const p of professionals) {
    if (!seenIds.has(p.id)) {
      allGroups.push({ professionalId: p.id, professionalName: p.name, schedules: [] })
    }
  }

  const groups = selectedProfessionalId
    ? allGroups.filter(g => g.professionalId === selectedProfessionalId)
    : allGroups

  // ── Edit ─────────────────────────────────────────────────────────
  const enterEdit = (group: ProfGroup) => {
    setEditingProfId(group.professionalId)
    setEditDraft(buildDraft(group.schedules))
    setError('')
  }

  const cancelEdit = () => { setEditingProfId(null); setEditDraft({}); setError('') }

  const toggleDay = (day: DayOfWeek) =>
    setEditDraft(prev => ({
      ...prev,
      [day]: { ...prev[day]!, enabled: !prev[day]!.enabled },
    }))

  const setDayField = (day: DayOfWeek, field: keyof DayDraft, value: string | number | boolean) =>
    setEditDraft(prev => ({ ...prev, [day]: { ...prev[day]!, [field]: value } }))

  const saveEdit = async () => {
    if (!editingProfId || !companyId) return
    setSaving(true); setError('')
    try {
      const updated: ScheduleResponse[] = []
      for (const day of DAYS) {
        const draft = editDraft[day]
        if (!draft) continue
        const req = {
          companyId, professionalId: editingProfId, dayOfWeek: day,
          startTime: draft.startTime, endTime: draft.endTime,
          lunchStart: draft.lunchStart || undefined,
          lunchEnd:   draft.lunchEnd   || undefined,
          slotDurationMinutes: draft.slotDurationMinutes,
        }
        if (draft.enabled) {
          if (draft.scheduleId) {
            updated.push(await updateSchedule(draft.scheduleId, req))
          } else {
            updated.push(await createSchedule(req))
          }
        } else if (draft.scheduleId) {
          await deleteSchedule(draft.scheduleId)
        }
      }
      setSchedules(prev => [
        ...prev.filter(s => s.professional?.id !== editingProfId),
        ...updated,
      ])
      setEditingProfId(null)
      setEditDraft({})
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao salvar.')
    } finally { setSaving(false) }
  }

  const handleDeleteGroup = async (group: ProfGroup) => {
    if (!confirm(`Remover todos os horários de ${group.professionalName}?`)) return
    for (const s of group.schedules) await deleteSchedule(s.id)
    setSchedules(prev => prev.filter(s => s.professional?.id !== group.professionalId))
  }

  // ── Blocks ────────────────────────────────────────────────────────
  const toggleExpand = (key: string) =>
    setExpandedKeys(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })

  const blocksForDay = (day: DayOfWeek, professionalId: number) => {
    const idx = DAYS.indexOf(day)
    const now = new Date()
    const cutoff = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
    return blocks.filter(b => {
      const d = new Date(b.startAt)
      if (((d.getDay() + 6) % 7) !== idx || d < now || d > cutoff) return false
      // Show block if it targets this professional OR all professionals (null)
      return b.professionalId == null || b.professionalId === professionalId
    })
  }

  const submitBlock = async () => {
    if (!companyId || !blockDate || !blockStart || !blockEnd) return
    setSaving(true)
    try {
      const b = await createBlock({
        companyId,
        startAt: `${blockDate}T${blockStart}:00`,
        endAt:   `${blockDate}T${blockEnd}:00`,
        reason:  blockReason || undefined,
        professionalId: blockProfessionalId,
      })
      setBlocks(prev => [...prev, b])
      setShowBlockForm(false)
      setBlockDate(''); setBlockStart(''); setBlockEnd('')
      setBlockReason(''); setBlockProfId(null)
      setError('')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao criar bloqueio.')
    } finally { setSaving(false) }
  }

  const handleDeleteBlock = async (id: number) => {
    if (!confirm('Remover bloqueio?')) return
    await deleteBlock(id)
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  // ── Render ────────────────────────────────────────────────────────
  if (loading) return <div className="page"><div className="loading">Carregando...</div></div>

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--surface-2)', color: 'var(--ink)',
    border: '1px solid var(--border)', borderRadius: 10,
    padding: '10px 12px', font: 'inherit', fontSize: 13.5,
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="h-page">Grade de horários</div>
          <div className="sub">Horários de atendimento por profissional</div>
        </div>
        {!isProfessional && (
          <button
            className={`btn ${showBlockForm ? 'btn-ghost' : 'btn-ghost'}`}
            onClick={() => { setShowBlockForm(s => !s); setError('') }}
          >
            <Lock size={14} /> {showBlockForm ? 'Cancelar' : 'Bloquear horário'}
          </button>
        )}
      </div>

      {/* ── Block form ─────────────────────────────────────────── */}
      {showBlockForm && (
        <div className="card card-pad" style={{ marginBottom: 18 }}>
          <div className="card-hd">
            <div className="h-card">Bloquear horário pontual</div>
            <button className="btn-icon" onClick={() => setShowBlockForm(false)}><X size={14} /></button>
          </div>
          <div className="text-meta" style={{ marginBottom: 14 }}>
            Bloqueia um período específico sem alterar a grade permanente.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Profissional</label>
              <select
                value={blockProfessionalId ?? ''}
                onChange={e => setBlockProfId(e.target.value === '' ? null : Number(e.target.value))}
                style={inputStyle}
              >
                <option value="">Todos os profissionais</option>
                {professionals.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Data</label>
              <input type="date" value={blockDate} onChange={e => setBlockDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} style={inputStyle} />
            </div>
            <div className="field">
              <label>A partir das</label>
              <input type="time" value={blockStart} onChange={e => setBlockStart(e.target.value)} style={inputStyle} />
            </div>
            <div className="field">
              <label>Até</label>
              <input type="time" value={blockEnd} onChange={e => setBlockEnd(e.target.value)} style={inputStyle} />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Motivo (opcional)</label>
              <input type="text" value={blockReason} onChange={e => setBlockReason(e.target.value)}
                placeholder="Ex: Reunião, feriado…" style={inputStyle} />
            </div>
          </div>
          {error && <div className="alert-error" style={{ marginTop: 10 }}>{error}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
            <button className="btn btn-ghost" onClick={() => setShowBlockForm(false)}>Cancelar</button>
            <button
              className="btn btn-primary"
              onClick={submitBlock}
              disabled={saving || !blockDate || !blockStart || !blockEnd}
            >
              {saving ? 'Bloqueando…' : 'Bloquear'}
            </button>
          </div>
        </div>
      )}

      {/* ── Professional cards ─────────────────────────────────── */}
      {groups.length === 0 ? (
        <div className="empty">
          <p>Nenhum profissional encontrado.</p>
          <p className="text-meta">
            Marque usuários como profissionais na página Usuários para que apareçam aqui.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {groups.map(group => {
            const isEditing    = editingProfId === group.professionalId
            const isOpen       = isEditing || expandedGroups.has(group.professionalId)
            const configuredDays = DAYS.filter(d => group.schedules.some(s => s.dayOfWeek === d))

            return (
              <div key={group.professionalId} className="card" style={{ overflow: 'hidden' }}>

                {/* ── Card header ── */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px',
                  borderBottom: isOpen ? '1px solid var(--border)' : 'none',
                  background: 'color-mix(in oklch, var(--accent) 4%, var(--surface-1))',
                }}>
                  {/* Left: clicável para abrir/fechar (exceto durante edição) */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: isEditing ? 'default' : 'pointer', minWidth: 0 }}
                    onClick={() => !isEditing && toggleGroupExpand(group.professionalId)}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: 'color-mix(in oklch, var(--accent) 14%, var(--surface-2))',
                      display: 'grid', placeItems: 'center',
                      color: 'var(--accent)', fontWeight: 700, fontSize: 12,
                      border: '1px solid color-mix(in oklch, var(--accent) 22%, transparent)',
                    }}>
                      {getInitials(group.professionalName)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14.5 }}>{group.professionalName}</div>
                      <div className="text-meta" style={{ marginTop: 1 }}>
                        {configuredDays.length === 0
                          ? 'Sem horários configurados'
                          : configuredDays.map(d => DAY_SHORT[d]).join(' · ')}
                      </div>
                    </div>
                    {!isEditing && (
                      isOpen
                        ? <ChevronDown size={15} style={{ color: 'var(--ink-4)', flexShrink: 0, marginLeft: 4 }} />
                        : <ChevronRight size={15} style={{ color: 'var(--ink-4)', flexShrink: 0, marginLeft: 4 }} />
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {isEditing ? (
                      <>
                        <button className="btn btn-ghost btn-sm" onClick={cancelEdit} disabled={saving}>
                          Cancelar
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={saving}>
                          <Check size={13} /> {saving ? 'Salvando…' : 'Salvar'}
                        </button>
                      </>
                    ) : !isProfessional ? (
                      <>
                        <button className="btn btn-ghost btn-sm" onClick={() => enterEdit(group)}>
                          <Pencil size={13} /> Editar
                        </button>
                        {group.schedules.length > 0 && (
                          <button
                            className="btn-icon"
                            title="Remover todos os horários"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => handleDeleteGroup(group)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>

                {/* ── Conteúdo — só aparece quando aberto ── */}
                {isEditing ? (
                  <div style={{ padding: '8px 20px 16px' }}>
                    {error && <div className="alert-error" style={{ margin: '8px 0 12px' }}>{error}</div>}
                    <div className="text-meta" style={{ margin: '8px 0 10px' }}>
                      Marque os dias ativos e configure os horários. Dias desmarcados serão removidos.
                    </div>

                    {/* Column headers */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '18px 36px 1fr 1fr 2fr 1fr',
                      gap: 8, padding: '4px 0 6px',
                      borderBottom: '1px solid var(--border)',
                    }}>
                      {['', 'Dia', 'Início', 'Fim', 'Intervalo', 'Slot'].map((h, i) => (
                        <span key={i} className="text-tag">{h}</span>
                      ))}
                    </div>

                    {DAYS.map((day, idx) => {
                      const draft = editDraft[day]
                      if (!draft) return null
                      return (
                        <div key={day} style={{
                          display: 'grid',
                          gridTemplateColumns: '18px 36px 1fr 1fr 2fr 1fr',
                          gap: 8, alignItems: 'center',
                          padding: '9px 0',
                          borderBottom: idx < 6 ? '1px dashed var(--border)' : 'none',
                          opacity: draft.enabled ? 1 : 0.4,
                          transition: 'opacity .15s',
                        }}>
                          <input
                            type="checkbox"
                            checked={draft.enabled}
                            onChange={() => toggleDay(day)}
                            style={{ cursor: 'pointer', accentColor: 'var(--accent)', width: 14, height: 14 }}
                          />
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)' }}>
                            {DAY_SHORT[day]}
                          </span>
                          <input
                            type="time"
                            value={draft.startTime}
                            disabled={!draft.enabled}
                            onChange={e => setDayField(day, 'startTime', e.target.value)}
                            style={inputSm}
                          />
                          <input
                            type="time"
                            value={draft.endTime}
                            disabled={!draft.enabled}
                            onChange={e => setDayField(day, 'endTime', e.target.value)}
                            style={inputSm}
                          />
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <input
                              type="time"
                              value={draft.lunchStart}
                              disabled={!draft.enabled}
                              onChange={e => setDayField(day, 'lunchStart', e.target.value)}
                              style={{ ...inputSm, flex: 1 }}
                            />
                            <span style={{ color: 'var(--ink-5)', fontSize: 11 }}>–</span>
                            <input
                              type="time"
                              value={draft.lunchEnd}
                              disabled={!draft.enabled}
                              onChange={e => setDayField(day, 'lunchEnd', e.target.value)}
                              style={{ ...inputSm, flex: 1 }}
                            />
                          </div>
                          <select
                            value={draft.slotDurationMinutes}
                            disabled={!draft.enabled}
                            onChange={e => setDayField(day, 'slotDurationMinutes', Number(e.target.value))}
                            style={inputSm}
                          >
                            {SLOT_OPTIONS.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                      )
                    })}
                  </div>
                ) : !isOpen ? null : configuredDays.length === 0 ? (
                  /* No schedules */
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>
                    Nenhum horário configurado
                    {!isProfessional && (
                      <> · <button className="btn btn-subtle btn-sm" onClick={() => enterEdit(group)} style={{ marginLeft: 6 }}>
                        Configurar agora
                      </button></>
                    )}
                  </div>
                ) : (
                  /* View mode — day rows */
                  configuredDays.map((day, idx) => {
                    const s = group.schedules.find(x => x.dayOfWeek === day)!
                    const dayBlocks = blocksForDay(day, group.professionalId)
                    const expandKey = `${group.professionalId}-${day}`
                    const expanded = expandedKeys.has(expandKey)

                    return (
                      <div key={day} style={{ borderTop: idx > 0 ? '1px solid var(--border)' : 'none' }}>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '72px 1fr 1fr 1fr auto',
                            gap: 16, alignItems: 'center',
                            padding: '11px 20px',
                            cursor: dayBlocks.length > 0 ? 'pointer' : 'default',
                          }}
                          onClick={() => dayBlocks.length > 0 && toggleExpand(expandKey)}
                        >
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                            {DAY_LABELS[day].split('-')[0]}
                          </span>
                          <div>
                            <div className="text-tag">Horário</div>
                            <div className="text-mono" style={{ fontSize: 13, marginTop: 2 }}>
                              {s.startTime.substring(0, 5)} – {s.endTime.substring(0, 5)}
                            </div>
                          </div>
                          <div>
                            <div className="text-tag">Intervalo</div>
                            <div style={{ fontSize: 12.5, marginTop: 2, color: s.lunchStart ? 'var(--warning)' : 'var(--ink-4)' }}>
                              {s.lunchStart && s.lunchEnd
                                ? `${s.lunchStart.substring(0, 5)} – ${s.lunchEnd.substring(0, 5)}`
                                : '—'}
                            </div>
                          </div>
                          <div>
                            <div className="text-tag">Slot</div>
                            <div style={{ fontSize: 12.5, marginTop: 2 }}>{s.slotDurationMinutes} min</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {dayBlocks.length > 0 && (
                              <span className="badge st-cancelled" style={{ fontSize: 10.5, gap: 4 }}>
                                <Lock size={9} /> {dayBlocks.length}
                              </span>
                            )}
                            {dayBlocks.length > 0
                              ? expanded
                                ? <ChevronDown size={14} style={{ color: 'var(--ink-4)' }} />
                                : <ChevronRight size={14} style={{ color: 'var(--ink-4)' }} />
                              : <div style={{ width: 14 }} />}
                          </div>
                        </div>

                        {/* Expanded blocks for this day */}
                        {expanded && dayBlocks.length > 0 && (
                          <div style={{
                            padding: '4px 20px 10px 36px',
                            borderTop: '1px dashed var(--border)',
                            display: 'flex', flexDirection: 'column', gap: 5,
                          }}>
                            {dayBlocks.map(b => (
                              <div key={b.id} style={{
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'space-between', gap: 12,
                                padding: '5px 10px', borderRadius: 7,
                                background: 'color-mix(in oklch, var(--danger) 7%, transparent)',
                                border: '1px solid color-mix(in oklch, var(--danger) 18%, transparent)',
                              }}>
                                <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                                  <span className="text-mono">
                                    {new Date(b.startAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                    {' '}
                                    {new Date(b.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    {' – '}
                                    {new Date(b.endAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {b.reason && (
                                    <span className="text-meta"> · {b.reason}</span>
                                  )}
                                </div>
                                {!isProfessional && (
                                  <button
                                    className="btn-icon"
                                    style={{ color: 'var(--danger)', width: 22, height: 22 }}
                                    onClick={e => { e.stopPropagation(); handleDeleteBlock(b.id) }}
                                  >
                                    <X size={11} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── All active blocks (bottom) ──────────────────────────── */}
      {blocks.filter(b => new Date(b.endAt) >= new Date()).length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div className="text-tag" style={{ marginBottom: 10 }}>Bloqueios ativos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {blocks
              .filter(b => new Date(b.endAt) >= new Date())
              .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
              .map(b => (
                <div key={b.id} className="row" style={{ gridTemplateColumns: 'auto 1fr auto' }}>
                  <span className="badge st-cancelled"><Lock size={11} /> Bloqueado</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>
                        {new Date(b.startAt).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                        {' · '}
                        {new Date(b.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {' – '}
                        {new Date(b.endAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="badge" style={{ fontSize: 10.5 }}>
                        {b.professionalName ?? 'Todos os profissionais'}
                      </span>
                    </div>
                    {b.reason && <div className="text-meta">{b.reason}</div>}
                  </div>
                  {!isProfessional && (
                    <button className="btn btn-subtle btn-sm" onClick={() => handleDeleteBlock(b.id)}>
                      Remover
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

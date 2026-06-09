import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Search, Check } from 'lucide-react'
import { getAvailableSlots } from '../api/schedules'
import { createAppointment } from '../api/appointments'
import { getUsersByCompany, createQuickClient } from '../api/users'
import type { User } from '../types/auth.types'
import { useModalDismiss } from '../hooks/useModalDismiss'

interface Props {
  date: string
  companyId: number
  onClose: () => void
}

export interface Slot {
  startAt: string
  endAt: string
  professionalId: number
  professionalName: string
  available: boolean
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function SlotPanel({ date, companyId, onClose }: Props) {
  const queryClient = useQueryClient()
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [showModal, setShowModal] = useState(false)

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['slots', companyId, date],
    queryFn: () => getAvailableSlots(companyId, date),
  })

  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  })
  const dateLabelCap = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)

  const handleSlotClick = (slot: Slot) => {
    if (!slot.available) return
    setSelectedSlot(slot)
    setShowModal(true)
  }

  return (
    <>
      <div className="card card-pad">
        <div className="card-hd">
          <div className="h-section">{dateLabelCap}</div>
          <button className="btn-icon" onClick={onClose} title="Fechar">
            <X size={14} />
          </button>
        </div>

        {isLoading ? (
          <div className="loading" style={{ height: 80 }}>Carregando slots...</div>
        ) : slots.length === 0 ? (
          <div className="empty">
            <p>Nenhum horário disponível para este dia.</p>
          </div>
        ) : (
          <>
            <div className="divider" style={{ marginTop: 0, marginBottom: 14 }}>
              <span>Grade de horários</span>
            </div>
            <div className="slots">
              {slots.map((slot: Slot, idx: number) => {
                const isTaken = !slot.available
                const isSelected = selectedSlot?.startAt === slot.startAt

                const cls = [
                  'slot',
                  isTaken ? 'taken' : '',
                  isSelected ? 'selected' : '',
                ].filter(Boolean).join(' ')

                return (
                  <button
                    key={idx}
                    className={cls}
                    onClick={() => handleSlotClick(slot)}
                    disabled={isTaken}
                  >
                    {formatTime(slot.startAt)}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {showModal && selectedSlot && (
        <AppointmentModal
          slot={selectedSlot}
          companyId={companyId}
          date={date}
          onClose={() => { setShowModal(false); setSelectedSlot(null) }}
          onSuccess={() => {
            setShowModal(false)
            setSelectedSlot(null)
            queryClient.invalidateQueries({ queryKey: ['slots'] })
            queryClient.invalidateQueries({ queryKey: ['calendar'] })
            queryClient.refetchQueries({ queryKey: ['slots', companyId, date] })
          }}
        />
      )}
    </>
  )
}

export interface ModalProps {
  slot: Slot
  companyId: number
  date: string
  onClose: () => void
  onSuccess: () => void
}

export function AppointmentModal({ slot, companyId, onClose, onSuccess }: ModalProps) {
  const [mode, setMode] = useState<'search' | 'create'>('search')
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<User | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [newName, setNewName]   = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')

  const dirty = !!(search || selectedClient || notes || newName || newEmail || newPhone)
  const { shaking, onOverlayClick } = useModalDismiss(dirty, onClose)

  const { data: users = [] } = useQuery({
    queryKey: ['users', companyId],
    queryFn: () => getUsersByCompany(companyId),
  })

  const filtered = (users as User[]).filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async () => {
    setError('')
    setSaving(true)
    try {
      let clientId = selectedClient?.id

      if (mode === 'create') {
        if (!newName || !newEmail) {
          setError('Nome e email são obrigatórios.')
          setSaving(false)
          return
        }
        const created = await createQuickClient({
          name: newName,
          email: newEmail,
          phone: newPhone || undefined,
          password: Math.random().toString(36).slice(-8),
        })
        clientId = (created as any).id ?? undefined
      }

      if (!clientId && mode === 'search') {
        setError('Selecione um cliente.')
        setSaving(false)
        return
      }

      await createAppointment({
        companyId,
        professionalId: slot.professionalId,
        clientId,
        startAt: slot.startAt,
        endAt: slot.endAt,
        notes: notes || undefined,
      })

      onSuccess()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao criar agendamento.')
    } finally {
      setSaving(false)
    }
  }

  const timeLabel = `${formatTime(slot.startAt)} — ${formatTime(slot.endAt)}`

  return (
    <div className="modal-overlay" onClick={onOverlayClick}>
      <div className={`modal${shaking ? ' modal-shake' : ''}`}>
        <div className="modal-head">
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Novo agendamento</div>
            <div className="text-meta" style={{ marginTop: 2 }}>
              {timeLabel} · {slot.professionalName}
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Mode tabs */}
          <div className="tabs" style={{ width: '100%', display: 'flex' }}>
            <div
              className={`tab${mode === 'search' ? ' active' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => setMode('search')}
            >
              Buscar cliente
            </div>
            <div
              className={`tab${mode === 'create' ? ' active' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => setMode('create')}
            >
              Criar cliente
            </div>
          </div>

          {/* Search mode */}
          {mode === 'search' && (
            <div>
              <div className="search" style={{ minWidth: 'unset' }}>
                <Search size={14} />
                <input
                  placeholder="Buscar por nome ou email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              {search && (
                <div style={{
                  marginTop: 6, border: '1px solid var(--border)', borderRadius: 10,
                  overflow: 'hidden', maxHeight: 160, overflowY: 'auto',
                  background: 'var(--surface-1)',
                }}>
                  {filtered.length === 0 ? (
                    <div style={{ padding: 12, fontSize: 13, color: 'var(--ink-4)', textAlign: 'center' }}>
                      Nenhum cliente encontrado
                    </div>
                  ) : (
                    filtered.map((u: User) => (
                      <button
                        key={u.id}
                        onClick={() => { setSelectedClient(u); setSearch(u.name) }}
                        style={{
                          width: '100%', textAlign: 'left', padding: '10px 14px',
                          background: 'none', border: 'none', cursor: 'pointer',
                          borderBottom: '1px solid var(--border)', color: 'var(--ink)',
                          font: 'inherit',
                        }}
                        onMouseOver={e => (e.currentTarget.style.background = 'var(--hover)')}
                        onMouseOut={e => (e.currentTarget.style.background = 'none')}
                      >
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                        <div className="text-meta">{u.email}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
              {selectedClient && (
                <div style={{
                  marginTop: 8, padding: '10px 14px', borderRadius: 10,
                  background: 'color-mix(in oklch, var(--accent) 10%, transparent)',
                  border: '1px solid var(--border-accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{selectedClient.name}</div>
                    <div className="text-meta">{selectedClient.email}</div>
                  </div>
                  <button
                    className="btn-icon"
                    onClick={() => { setSelectedClient(null); setSearch('') }}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Create mode */}
          {mode === 'create' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                className="input"
                placeholder="Nome completo *"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
              <input
                className="input"
                type="email"
                placeholder="Email *"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
              />
              <input
                className="input"
                type="tel"
                placeholder="Telefone (opcional)"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
              />
              <div className="text-meta">Uma senha temporária será gerada automaticamente.</div>
            </div>
          )}

          {/* Notes */}
          <div className="field">
            <label>Observações <span style={{ textTransform: 'none', fontWeight: 400 }}>(opcional)</span></label>
            <textarea
              className="input"
              rows={2}
              placeholder="Ex: Primeira consulta, trazer exames..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {error && <div className="alert-error">{error}</div>}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={handleSave}
              disabled={saving}
            >
              <Check size={14} />
              {saving ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

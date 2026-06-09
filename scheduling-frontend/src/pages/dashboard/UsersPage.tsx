import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Mail, MoreHorizontal, X, Phone, ChevronLeft, ChevronRight, Stethoscope } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  useListUsers,
  useCreateManager,
  useRemoveFromCompany,
  useUpdateUserPhone,
} from '../../hooks/useUsers'
import type { CreateManagerRequest } from '../../types/auth.types'
import type { User } from '../../types/auth.types'

const PAGE_SIZE_OPTIONS = [10, 20, 100]

const createSchema = z.object({
  name:         z.string().min(1, 'Nome obrigatório'),
  email:        z.string().email('E-mail inválido'),
  password:     z.string().min(6, 'Mínimo 6 caracteres'),
  phone:        z.string().optional(),
  role:         z.enum(['MANAGER', 'PROFESSIONAL']),
  professional: z.boolean(),
})
type CreateFormData = z.infer<typeof createSchema>

const ROLE_CLASS: Record<string, string> = {
  ADMIN:        'role-admin',
  MANAGER:      'role-manager',
  PROFESSIONAL: 'role-manager',
  CLIENT:       'role-client',
}
const ROLE_LABEL: Record<string, string> = {
  ADMIN:        'Admin',
  MANAGER:      'Manager',
  PROFESSIONAL: 'Profissional',
  CLIENT:       'Cliente',
}

type RoleFilter = 'TODOS' | 'ADMIN' | 'MANAGER' | 'PROFESSIONAL' | 'CLIENT'

function getInitials(name: string) {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--surface-2)', color: 'var(--ink)',
  border: '1px solid var(--border)', borderRadius: 10,
  padding: '10px 12px', font: 'inherit', fontSize: 13.5,
}

export function UsersPage() {
  const { companyId: companyIdStr } = useParams<{ companyId: string }>()
  const companyId = Number(companyIdStr)
  const { user: me } = useAuthStore()

  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('TODOS')
  const [openCreate, setOpenCreate] = useState(false)
  const [apiError, setApiError]     = useState('')
  const [success, setSuccess]       = useState(false)
  const [page, setPage]             = useState(0)
  const [pageSize, setPageSize]     = useState(10)

  // 3-dot menu
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Edit modal
  const [editTarget, setEditTarget]           = useState<User | null>(null)
  const [editPhone, setEditPhone]             = useState('')
  const [editProfessional, setEditProfessional] = useState(false)
  const [editError, setEditError]             = useState('')

  // Remove from company confirmation
  const [removeTarget, setRemoveTarget] = useState<User | null>(null)

  const { data: users = [], isLoading } = useListUsers(companyId)
  const { mutate: createManager, isPending } = useCreateManager(companyId)
  const { mutate: removeFromCompany, isPending: removing } = useRemoveFromCompany(companyId)
  const { mutate: updatePhone, isPending: savingPhone } = useUpdateUserPhone(companyId)

  const { register, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'MANAGER', professional: false },
  })

  // Balançada quando tenta fechar (clique fora) um modal com dados preenchidos
  const [shakingModal, setShakingModal] = useState<'create' | 'edit' | null>(null)
  const guardClose = (which: 'create' | 'edit', dirty: boolean, close: () => void) =>
    (e: React.MouseEvent) => {
      if (e.target !== e.currentTarget) return
      if (dirty) {
        setShakingModal(which)
        setTimeout(() => setShakingModal(null), 400)
      } else {
        close()
      }
    }

  useEffect(() => { setPage(0) }, [roleFilter, search, pageSize])

  // ESC fecha o modal mais recente
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (removeTarget) { setRemoveTarget(null); return }
      if (editTarget)   { setEditTarget(null);   return }
      if (openCreate)   { setOpenCreate(false);  return }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [removeTarget, editTarget, openCreate])

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    if (openMenuId !== null) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenuId])

  const openEdit = (u: User) => {
    setEditTarget(u)
    setEditPhone(u.phone ?? '')
    setEditProfessional(u.professional ?? false)
    setEditError('')
    setOpenMenuId(null)
  }

  const openRemove = (u: User) => {
    setRemoveTarget(u)
    setOpenMenuId(null)
  }

  const handleSavePhone = () => {
    if (!editTarget) return
    setEditError('')
    updatePhone(
      { userId: editTarget.id, phone: editPhone, professional: editProfessional },
      {
        onSuccess: () => setEditTarget(null),
        onError: () => setEditError('Erro ao salvar.'),
      }
    )
  }

  const handleRemove = () => {
    if (!removeTarget) return
    removeFromCompany(removeTarget.id, { onSuccess: () => setRemoveTarget(null) })
  }

  const onSubmit = (data: CreateFormData) => {
    setApiError('')
    const payload: CreateManagerRequest = {
      name: data.name, email: data.email, password: data.password,
      phone: data.phone || undefined,
      companyId,
      role: data.role,
      professional: data.role === 'PROFESSIONAL' ? true : data.professional,
    }
    createManager(payload, {
      onSuccess: () => {
        setSuccess(true)
        setTimeout(() => { setOpenCreate(false); setSuccess(false); reset() }, 1500)
      },
      onError: (err: any) => {
        setApiError(err?.response?.data?.message ?? 'Erro ao criar manager.')
      },
    })
  }

  const filtered = (users as User[]).filter(u => {
    if (roleFilter !== 'TODOS' && u.role !== roleFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    }
    return true
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated  = filtered.slice(page * pageSize, (page + 1) * pageSize)

  const counts = (users as User[]).reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const tabs = [
    { id: 'TODOS',        label: 'Todos',         n: (users as User[]).length },
    { id: 'ADMIN',        label: 'Admins',         n: counts['ADMIN']        || 0 },
    { id: 'MANAGER',      label: 'Managers',       n: counts['MANAGER']      || 0 },
    { id: 'PROFESSIONAL', label: 'Profissionais',  n: counts['PROFESSIONAL'] || 0 },
    { id: 'CLIENT',       label: 'Clientes',       n: counts['CLIENT']       || 0 },
  ]

  const canManage = (u: User) => me?.role === 'ADMIN' && u.id !== me.id

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="h-page">Usuários</div>
          <div className="sub">
            <span className="text-mono">{(users as User[]).length}</span> nesta empresa
            {counts['CLIENT'] != null && (
              <> · <span className="text-mono">{counts['CLIENT']}</span> clientes</>
            )}
          </div>
        </div>
        {me?.role === 'ADMIN' && (
          <button className="btn btn-primary" onClick={() => { reset(); setApiError(''); setSuccess(false); setOpenCreate(true) }}>
            <Plus size={14} /> Criar Colaborador
          </button>
        )}
      </div>

      {/* Search + Tabs */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <div className="search" style={{ flex: 1, minWidth: 0 }}>
          <Mail size={14} />
          <input
            placeholder="Buscar por nome ou e-mail…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="tabs">
          {tabs.map(t => (
            <div
              key={t.id}
              className={`tab${roleFilter === t.id ? ' active' : ''}`}
              onClick={() => setRoleFilter(t.id as RoleFilter)}
            >
              {t.label} <span className="count">{t.n}</span>
            </div>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="loading">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="empty"><p>Nenhum usuário encontrado.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {paginated.map((u: User) => (
            <div
              key={u.id}
              className="row"
              style={{ gridTemplateColumns: '40px 1fr 1fr auto', gap: 16 }}
            >
              {/* Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'color-mix(in oklch, var(--accent) 14%, var(--surface-2))',
                display: 'grid', placeItems: 'center',
                color: 'var(--accent)', fontWeight: 700, fontSize: 14,
                border: '1px solid color-mix(in oklch, var(--accent) 22%, transparent)', flexShrink: 0,
              }}>
                {getInitials(u.name)}
              </div>

              {/* Name + role + email */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</span>
                  <span className={`badge ${ROLE_CLASS[u.role] ?? 'role-client'}`}>
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>
                  {u.professional && u.role === 'MANAGER' && (
                    <span className="badge st-confirmed" title="Também é profissional de atendimento">
                      <Stethoscope size={10} /> Profissional
                    </span>
                  )}
                  {!u.active && <span className="badge st-cancelled">Inativo</span>}
                </div>
                <div className="text-meta" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                  <Mail size={11} /> {u.email}
                </div>
              </div>

              {/* Phone */}
              <div>
                {u.phone ? (
                  <>
                    <div className="text-tag">Contato</div>
                    <div className="text-mono" style={{ fontSize: 13, marginTop: 3, color: 'var(--ink-2)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Phone size={11} /> {u.phone}
                    </div>
                  </>
                ) : (
                  <span className="text-meta">Sem contato</span>
                )}
              </div>

              {/* 3-dot menu */}
              <div style={{ position: 'relative' }} ref={openMenuId === u.id ? menuRef : undefined}>
                {canManage(u) && (
                  <button
                    className="btn-icon"
                    onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                  >
                    <MoreHorizontal size={14} />
                  </button>
                )}
                {openMenuId === u.id && (
                  <div className="user-menu-dropdown">
                    <button className="user-menu-item" onClick={() => openEdit(u)}>
                      Ajustar dados
                    </button>
                    <button className="user-menu-item user-menu-item-danger" onClick={() => openRemove(u)}>
                      Remover da empresa
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
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
            onChange={e => setPageSize(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map(n => (
              <option key={n} value={n}>{n} por página</option>
            ))}
          </select>
        </div>
      )}

      {/* Modal — criar Manager */}
      {openCreate && (
        <div className="modal-overlay" onClick={guardClose('create', isDirty, () => setOpenCreate(false))}>
          <div className={`modal${shakingModal === 'create' ? ' modal-shake' : ''}`}>
            <div className="modal-head">
              <div style={{ fontWeight: 600, fontSize: 15 }}>Criar Colaborador</div>
              <button className="btn-icon" onClick={() => setOpenCreate(false)}><X size={14} /></button>
            </div>
            <div style={{ padding: '16px 22px 22px' }}>
              {success ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 8 }}>
                  <span style={{ fontSize: 32, color: 'var(--accent)' }}>✓</span>
                  <div style={{ fontWeight: 600 }}>Colaborador criado com sucesso!</div>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {apiError && <div className="alert-error">{apiError}</div>}

                  {/* Tipo de acesso */}
                  <div className="field">
                    <label>Tipo *</label>
                    <select {...register('role')} style={inputStyle}>
                      <option value="MANAGER">Manager (gestor / recepcionista)</option>
                      <option value="PROFESSIONAL">Profissional (apenas atendimento)</option>
                    </select>
                  </div>

                  {/* Profissional também? (só para MANAGER) */}
                  {watch('role') === 'MANAGER' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--ink-2)', cursor: 'pointer' }}>
                      <input type="checkbox" {...register('professional')} style={{ width: 15, height: 15, cursor: 'pointer' }} />
                      É também profissional de atendimento
                    </label>
                  )}

                  {[
                    { name: 'name',     label: 'Nome *',             type: 'text',     placeholder: 'Nome completo' },
                    { name: 'email',    label: 'E-mail *',           type: 'email',    placeholder: 'email@exemplo.com' },
                    { name: 'password', label: 'Senha *',            type: 'password', placeholder: 'Mínimo 6 caracteres' },
                    { name: 'phone',    label: 'Telefone (opcional)', type: 'tel',      placeholder: '(48) 99999-9999' },
                  ].map(f => (
                    <div key={f.name} className="field">
                      <label>{f.label}</label>
                      <input
                        {...register(f.name as keyof CreateFormData)}
                        type={f.type}
                        placeholder={f.placeholder}
                        style={inputStyle}
                      />
                      {errors[f.name as keyof typeof errors] && (
                        <div className="error">{(errors[f.name as keyof typeof errors] as any)?.message}</div>
                      )}
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setOpenCreate(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isPending}>
                      {isPending ? 'Criando...' : 'Criar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal — ajustar telefone */}
      {editTarget && (
        <div
          className="modal-overlay"
          onClick={guardClose(
            'edit',
            editPhone !== (editTarget.phone ?? '') || editProfessional !== (editTarget.professional ?? false),
            () => setEditTarget(null)
          )}
        >
          <div className={`modal${shakingModal === 'edit' ? ' modal-shake' : ''}`} style={{ maxWidth: 360 }}>
            <div className="modal-head">
              <div style={{ fontWeight: 600, fontSize: 15 }}>Ajustar dados</div>
              <button className="btn-icon" onClick={() => setEditTarget(null)}><X size={14} /></button>
            </div>
            <div style={{ padding: '16px 22px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="text-meta">Usuário: <strong style={{ color: 'var(--ink)' }}>{editTarget.name}</strong></div>
              {editError && <div className="alert-error">{editError}</div>}
              <div className="field">
                <label>Telefone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  placeholder="(48) 99999-9999"
                  style={inputStyle}
                />
              </div>
              {(editTarget.role === 'MANAGER' || editTarget.role === 'PROFESSIONAL') && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--ink-2)', cursor: 'pointer', padding: '4px 0' }}>
                  <input
                    type="checkbox"
                    checked={editProfessional}
                    onChange={e => setEditProfessional(e.target.checked)}
                    style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--accent)' }}
                  />
                  É profissional de atendimento
                </label>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditTarget(null)}>Cancelar</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSavePhone} disabled={savingPhone}>
                  {savingPhone ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal — confirmar remoção da empresa */}
      {removeTarget && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 360 }}>
            <div className="modal-head">
              <div style={{ fontWeight: 600, fontSize: 15 }}>Remover da empresa</div>
              <button className="btn-icon" onClick={() => setRemoveTarget(null)}><X size={14} /></button>
            </div>
            <div style={{ padding: '16px 22px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: 0 }}>
                Remover <strong style={{ color: 'var(--ink)' }}>{removeTarget.name}</strong> desta empresa?
                A conta do usuário permanece ativa.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setRemoveTarget(null)}>Cancelar</button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleRemove} disabled={removing}>
                  {removing ? 'Removendo...' : 'Remover'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

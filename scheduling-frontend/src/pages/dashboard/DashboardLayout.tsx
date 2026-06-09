import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Building2, ChevronDown, Check, Lock, LogOut } from 'lucide-react'
import { Sidebar } from '../../components/Sidebar'
import { useAuthStore } from '../../store/authStore'
import { logout } from '../../api/auth'
import { getCompanyById, getMyCompanies } from '../../api/companies'
import type { CompanyResponse } from '../../api/companies'
import { useNotifications, usePendingNotifications } from '../../hooks/useNotifications'
import { useSSENotifications } from '../../hooks/useSSENotifications'
import { useAccentColor } from '../../hooks/useAccentColor'
import { useProfessionalFilterStore } from '../../store/professionalFilterStore'
import { useProfessionals } from '../../hooks/useUsers'

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Visão geral',
  schedules: 'Horários',
  pending: 'Pendentes',
  appointments: 'Agendamentos',
  users: 'Usuários',
  settings: 'Configurações',
}

function NotificationMonitor() {
  useSSENotifications()
  usePendingNotifications()
  return null
}

export function DashboardLayout() {
  const { user, switchCompany, logout: localLogout } = useAuthStore()
  const { requestPermission } = useNotifications()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await logout() } catch { /* ignore */ }
    localLogout()
    navigate('/login')
  }

  const roleLabel: Record<string, string> = {
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    PROFESSIONAL: 'Profissional',
    CLIENT: 'Cliente',
  }
  const userInitials = (user?.name ?? 'U')
    .split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [profDropdownOpen, setProfDropdownOpen] = useState(false)
  const pillRef = useRef<HTMLDivElement>(null)
  const profRef = useRef<HTMLDivElement>(null)

  const { selectedProfessionalId, setSelectedProfessionalId } = useProfessionalFilterStore()
  const { data: professionals = [] } = useProfessionals(user?.companyId)

  useAccentColor(user?.companyId)

  useEffect(() => {
    requestPermission()
  }, [requestPermission])

  // Para PROFESSIONAL: fixa o filtro no próprio usuário; para outros: reseta ao trocar empresa
  useEffect(() => {
    if (user?.role === 'PROFESSIONAL') {
      setSelectedProfessionalId(user.id)
    } else {
      setSelectedProfessionalId(null)
    }
  }, [user?.id, user?.role, user?.companyId, setSelectedProfessionalId])

  // Fecha dropdown de profissional ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profRef.current && !profRef.current.contains(e.target as Node)) {
        setProfDropdownOpen(false)
      }
    }
    if (profDropdownOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [profDropdownOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const { data: company } = useQuery({
    queryKey: ['company-detail', user?.companyId],
    queryFn: () => getCompanyById(user!.companyId!),
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000,
  })

  const { data: myCompanies = [] } = useQuery({
    queryKey: ['my-companies'],
    queryFn: getMyCompanies,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })

  const handleSelectCompany = (c: CompanyResponse) => {
    setDropdownOpen(false)
    if (c.id === user?.companyId) return
    switchCompany(c.id, c.name)
    navigate(`/${c.id}/dashboard`)
  }

  const segments = location.pathname.split('/').filter(Boolean)
  const lastSegment = segments[segments.length - 1]
  const pageLabel = ROUTE_LABELS[lastSegment] ?? ROUTE_LABELS['dashboard']

  const companyName = company?.name ?? user?.companyName ?? '—'

  const isProfessionalOnly = user?.role === 'PROFESSIONAL'
  const selectedProfName = selectedProfessionalId
    ? (professionals.find(p => p.id === selectedProfessionalId)?.name ?? 'Profissional')
    : null

  return (
    <div className="app">
      <Sidebar />

      {user?.companyId && <NotificationMonitor />}

      <div className="main-col">
        {/* Topbar */}
        <header className="topbar">
          <div className="crumbs">
            {/* Seletor de empresa */}
            <div className="prof-selector-wrap" ref={pillRef}>
              <button
                className="prof-selector clickable"
                onClick={() => setDropdownOpen(o => !o)}
                title="Trocar empresa"
              >
                <Building2 size={13} />
                {companyName}
                <ChevronDown
                  size={12}
                  style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
                />
              </button>
              {dropdownOpen && (
                <div className="company-dropdown">
                  <div className="company-dropdown-label">Suas empresas</div>
                  {myCompanies.length === 0 ? (
                    <div className="company-dropdown-empty">Nenhuma empresa vinculada</div>
                  ) : (
                    myCompanies.map(c => (
                      <button
                        key={c.id}
                        className="company-dropdown-item"
                        onClick={() => handleSelectCompany(c)}
                      >
                        <div className="company-dropdown-av">
                          {c.name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <span style={{ flex: 1, fontSize: 13, color: 'var(--ink)' }}>{c.name}</span>
                        {c.id === user?.companyId && (
                          <Check size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <span className="sep">/</span>

            {/* Seletor de profissional */}
            {isProfessionalOnly ? (
              /* PROFESSIONAL: mostra nome próprio, bloqueado */
              <span className="prof-selector locked" title="Visão do seu próprio calendário">
                <Lock size={11} />
                {user?.name?.split(' ')[0]}
              </span>
            ) : professionals.length > 0 ? (
              /* MANAGER/ADMIN com profissionais cadastrados: dropdown */
              <div className="prof-selector-wrap" ref={profRef}>
                <button
                  className="prof-selector clickable"
                  onClick={() => setProfDropdownOpen(o => !o)}
                >
                  {selectedProfessionalId
                    ? <span className="prof-dot" />
                    : null}
                  {selectedProfName ?? 'Todos'}
                  <ChevronDown
                    size={12}
                    style={{ transform: profDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
                  />
                </button>
                {profDropdownOpen && (
                  <div className="prof-dropdown">
                    <button
                      className={`prof-dropdown-item${!selectedProfessionalId ? ' active' : ''}`}
                      onClick={() => { setSelectedProfessionalId(null); setProfDropdownOpen(false) }}
                    >
                      {!selectedProfessionalId && <Check size={12} />}
                      Todos
                    </button>
                    {professionals.map(p => (
                      <button
                        key={p.id}
                        className={`prof-dropdown-item${selectedProfessionalId === p.id ? ' active' : ''}`}
                        onClick={() => { setSelectedProfessionalId(p.id); setProfDropdownOpen(false) }}
                      >
                        {selectedProfessionalId === p.id && <Check size={12} />}
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {(isProfessionalOnly || professionals.length > 0) && <span className="sep">/</span>}
            <span className="here">{pageLabel}</span>
          </div>

          <div className="right">
            <button
              className="topbar-user"
              onClick={() => navigate('/profile')}
              title="Editar perfil"
            >
              <div className="avatar" style={{ width: 30, height: 30, fontSize: 12 }}>
                {userInitials}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, textAlign: 'left' }}>
                <span style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 600 }}>{user?.name}</span>
                <span style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>{roleLabel[user?.role ?? ''] ?? ''}</span>
              </div>
            </button>
            <button className="btn-icon" title="Sair" onClick={handleLogout}>
              <LogOut size={15} />
            </button>
          </div>
        </header>

        <main style={{ overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

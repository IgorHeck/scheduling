import { NavLink, useParams } from 'react-router-dom'
import {
  LayoutGrid, Clock, Hourglass, Calendar, Users, Settings,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { usePendingAppointments } from '../hooks/useAppointments'

export function Sidebar() {
  const { user } = useAuthStore()
  const { companyId } = useParams<{ companyId: string }>()
  const { data: pending = [] } = usePendingAppointments()

  const base = `/${companyId}/dashboard`
  const pendingCount = pending.length

  const isProfessional = user?.role === 'PROFESSIONAL'

  const navItems = [
    {
      to: base,
      label: 'Visão geral',
      icon: <LayoutGrid size={16} />,
      section: 'OPERAÇÃO',
      end: true,
    },
    {
      to: `${base}/schedules`,
      label: 'Horários',
      icon: <Clock size={16} />,
      end: false,
      hideForProfessional: true,
    },
    {
      to: `${base}/pending`,
      label: 'Pendentes',
      icon: <Hourglass size={16} />,
      count: pendingCount,
      end: false,
    },
    {
      to: `${base}/appointments`,
      label: 'Agendamentos',
      icon: <Calendar size={16} />,
      end: false,
    },
    {
      to: `${base}/users`,
      label: 'Usuários',
      icon: <Users size={16} />,
      section: 'ADMINISTRAÇÃO',
      adminOnly: true,
      end: false,
    },
  ]

  const links = navItems.filter(l => {
    if (l.adminOnly && user?.role !== 'ADMIN') return false
    if (l.hideForProfessional && isProfessional) return false
    return true
  })

  return (
    <aside className="side">
      {/* Brand */}
      <div className="side-brand">
        <div className="side-logo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="2.5" />
            <path d="M3 10h18" />
            <path d="M8 3v4M16 3v4" />
          </svg>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="name">Agendamento</div>
          <div className="sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.companyName ?? '—'}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {links.map(item => (
          <div key={item.to}>
            {item.section && (
              <div className="side-section">{item.section}</div>
            )}
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `nav-item${isActive ? ' active' : ''}`
              }
            >
              <span className="ico">{item.icon}</span>
              <span>{item.label}</span>
              {item.count != null && item.count > 0 && (
                <span className="badge-num">{item.count}</span>
              )}
            </NavLink>
          </div>
        ))}
      </nav>

      {/* Footer — Configurações */}
      {!isProfessional && (
        <div className="side-foot" style={{ padding: 0, gap: 0 }}>
          <NavLink
            to={`${base}/settings`}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            style={{ width: '100%' }}
          >
            <span className="ico"><Settings size={16} /></span>
            <span>Configurações</span>
          </NavLink>
        </div>
      )}
    </aside>
  )
}

import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { logout } from '../api/auth'
import { Building2 } from 'lucide-react'

export function NoCompanyPage() {
  const { user, logout: localLogout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await logout() } catch { /* ignore */ }
    localLogout()
    navigate('/login')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div className="card card-pad" style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>

        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          display: 'grid', placeItems: 'center',
          margin: '0 auto 18px',
          color: 'var(--ink-3)',
        }}>
          <Building2 size={24} />
        </div>

        <div className="h-card" style={{ marginBottom: 10 }}>Sem empresa vinculada</div>

        <div className="text-meta" style={{ marginBottom: 24, lineHeight: 1.6 }}>
          Olá, <strong style={{ color: 'var(--ink-2)' }}>{user?.name}</strong>.{' '}
          {user?.role === 'MANAGER'
            ? 'Sua conta ainda não está vinculada a nenhuma empresa. Entre em contato com o administrador para ser associado.'
            : 'Sua conta ainda não está vinculada a nenhuma empresa. Crie uma empresa para continuar.'}
        </div>

        {user?.role === 'ADMIN' && (
          <a
            href="/setup/company"
            className="btn btn-primary"
            style={{ display: 'inline-flex', marginBottom: 14 }}
          >
            Criar empresa
          </a>
        )}

        <div>
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--ink-3)' }}
          >
            Sair da conta
          </button>
        </div>

      </div>
    </div>
  )
}

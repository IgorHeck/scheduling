import { useAuthStore } from '../../store/authStore.ts'

export function DashboardPage() {
  const { user, logout } = useAuthStore()

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <div className="h-page">Dashboard</div>
            <div className="text-meta" style={{ marginTop: 4 }}>Olá, {user?.name}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout}>
            Sair
          </button>
        </div>
        <div className="text-meta">Painel do gestor — em construção</div>
      </div>
    </div>
  )
}

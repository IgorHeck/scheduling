import { Navigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore.ts'
import type { User } from '../types/auth.types'

interface Props {
  children: React.ReactNode
  allowedRoles?: User['role'][]
  /** Quando true, exige que o usuário tenha company vinculada e que o :companyId da URL bata com ela */
  requireCompany?: boolean
}

export function ProtectedRoute({ children, allowedRoles, requireCompany }: Props) {
  const { isAuthenticated, user } = useAuthStore()
  const { companyId: urlCompanyId } = useParams<{ companyId: string }>()

  if (!isAuthenticated()) return <Navigate to="/login" replace />

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  if (requireCompany && user) {
    // Usuário sem empresa → redireciona para fluxo adequado
    if (!user.companyId) {
      if (user.role === 'ADMIN') return <Navigate to="/setup/company" replace />
      return <Navigate to="/no-company" replace />
    }

    // URL com companyId errado → redireciona para a empresa correta
    if (urlCompanyId && Number(urlCompanyId) !== user.companyId) {
      return <Navigate to={`/${user.companyId}/dashboard`} replace />
    }
  }

  return <>{children}</>
}

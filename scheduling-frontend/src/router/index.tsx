import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage }           from '../pages/auth/LoginPage'
import { RegisterPage }        from '../pages/auth/RegisterPage'
import { ForgotPasswordPage }  from '../pages/auth/ForgotPasswordPage'
import { ResetPasswordPage }   from '../pages/auth/ResetPasswordPage'
import { SetupCompanyPage }    from '../pages/setup/SetupCompanyPage'
import { NoCompanyPage }       from '../pages/NoCompanyPage'
import { DashboardLayout }     from '../pages/dashboard/DashboardLayout'
import { DashboardHome }       from '../pages/dashboard/DashboardHome'
import { SchedulesPage }       from '../pages/dashboard/SchedulesPage'
import { BookingPage }         from '../pages/booking/BookingPage'
import { ProtectedRoute }      from '../components/ProtectedRoute'
import { PendingPage }         from '../pages/dashboard/PendingPage'
import { AppointmentsPage }    from '../pages/dashboard/AppointmentsPage'
import { CompanySettingsPage } from '../pages/dashboard/CompanySettingsPage'
import { MyAppointmentsPage }  from '../pages/client/MyAppointmentsPage'
import { UsersPage }           from '../pages/dashboard/UsersPage'
import { ProfilePage }         from '../pages/profile/ProfilePage'

export function AppRouter() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/register"        element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />

      {/* Usuário autenticado sem empresa */}
      <Route path="/no-company" element={
        <ProtectedRoute>
          <NoCompanyPage />
        </ProtectedRoute>
      } />

      {/* Criação de empresa (só ADMIN, sem empresa ainda) */}
      <Route path="/setup/company" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <SetupCompanyPage />
        </ProtectedRoute>
      } />

      {/* Dashboard com prefixo de empresa — /:companyId/dashboard/* */}
      <Route path="/:companyId/dashboard" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'PROFESSIONAL']} requireCompany>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardHome />} />
        <Route path="schedules"    element={<SchedulesPage />} />
        <Route path="pending"      element={<PendingPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="settings"     element={<CompanySettingsPage />} />
        <Route path="users"        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <UsersPage />
          </ProtectedRoute>
        } />
      </Route>

      {/* Booking público por empresa */}
      <Route path="/:companyId/booking" element={<BookingPage />} />

      {/* Cliente */}
      <Route path="/my-appointments" element={
        <ProtectedRoute>
          <MyAppointmentsPage />
        </ProtectedRoute>
      } />

      {/* Perfil — todos os usuários autenticados */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/unauthorized" element={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="h-page" style={{ color: 'var(--danger)', marginBottom: 8 }}>Acesso não autorizado</div>
            <div className="text-meta">Você não tem permissão para acessar esta página.</div>
          </div>
        </div>
      } />
    </Routes>
  )
}

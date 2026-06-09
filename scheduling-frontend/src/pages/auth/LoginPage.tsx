import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { login, getMe } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { loginSchema, type LoginFormData as FormData } from '../../schemas/auth'

const schema = loginSchema

function BrandMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="url(#brand-grad)" />
      <rect x="10" y="13" width="20" height="17" rx="3.5" stroke="white" strokeWidth="1.6" fill="none" />
      <line x1="10" y1="19" x2="30" y2="19" stroke="white" strokeWidth="1.6" />
      <rect x="14" y="9" width="2.5" height="6" rx="1.25" fill="white" />
      <rect x="23.5" y="9" width="2.5" height="6" rx="1.25" fill="white" />
      <defs>
        <linearGradient id="brand-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#69d3a7" />
          <stop offset="1" stopColor="#3a9e75" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const tokens = await login(data)
      setTokens(tokens.accessToken, tokens.refreshToken)
      const user = await getMe()
      setUser(user)

      if (user.role === 'CLIENT') {
        navigate('/my-appointments')
      } else if (user.companyId) {
        navigate(`/${user.companyId}/dashboard`)
      } else if (user.role === 'ADMIN') {
        navigate('/setup/company')
      } else {
        navigate('/no-company')
      }
    } catch {
      setError('Email ou senha incorretos.')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div className="card card-pad" style={{ width: '100%', maxWidth: 420 }}>

        {/* Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <BrandMark />
          <div className="h-page" style={{ marginTop: 14, marginBottom: 4, textAlign: 'center' }}>
            Entrar
          </div>
          <div className="text-meta" style={{ textAlign: 'center' }}>
            Acesse sua conta para continuar
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div className="field">
            <label>Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="seu@email.com"
              className="input"
            />
            {errors.email && <div className="error">{errors.email.message}</div>}
          </div>

          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ margin: 0 }}>Senha</label>
              <Link
                to="/forgot-password"
                style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}
              >
                Esqueceu a senha?
              </Link>
            </div>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••"
              className="input"
            />
            {errors.password && <div className="error">{errors.password.message}</div>}
          </div>

          {error && <div className="alert-error">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 4 }}
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
        }}>
          <span className="text-meta">Não tem uma conta? </span>
          <Link
            to="/register"
            style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}
          >
            Criar conta
          </Link>
        </div>

      </div>
    </div>
  )
}

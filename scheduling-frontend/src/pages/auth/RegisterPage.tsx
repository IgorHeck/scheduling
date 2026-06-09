import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { register as registerUser, getMe } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { registerSchema, type RegisterFormData as FormData } from '../../schemas/auth'

const schema = registerSchema

function BrandMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="url(#brand-grad-r)" />
      <rect x="10" y="13" width="20" height="17" rx="3.5" stroke="white" strokeWidth="1.6" fill="none" />
      <line x1="10" y1="19" x2="30" y2="19" stroke="white" strokeWidth="1.6" />
      <rect x="14" y="9" width="2.5" height="6" rx="1.25" fill="white" />
      <rect x="23.5" y="9" width="2.5" height="6" rx="1.25" fill="white" />
      <defs>
        <linearGradient id="brand-grad-r" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#69d3a7" />
          <stop offset="1" stopColor="#3a9e75" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const tokens = await registerUser({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      })
      setTokens(tokens.accessToken, tokens.refreshToken)
      const user = await getMe()
      setUser(user)
      navigate('/my-appointments')
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setError(msg || 'Erro ao criar conta. Tente novamente.')
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
            Criar conta
          </div>
          <div className="text-meta" style={{ textAlign: 'center' }}>
            Preencha os dados para se cadastrar
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div className="field">
            <label>Nome completo</label>
            <input
              {...register('name')}
              type="text"
              placeholder="João Silva"
              className="input"
            />
            {errors.name && <div className="error">{errors.name.message}</div>}
          </div>

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
            <label>
              Telefone{' '}
              <span className="text-meta" style={{ fontWeight: 400 }}>(opcional)</span>
            </label>
            <input
              {...register('phone')}
              type="tel"
              placeholder="(48) 99999-9999"
              className="input"
            />
          </div>

          <div className="field">
            <label>Senha</label>
            <input
              {...register('password')}
              type="password"
              placeholder="Mínimo 6 caracteres"
              className="input"
            />
            {errors.password && <div className="error">{errors.password.message}</div>}
          </div>

          <div className="field">
            <label>Confirmar senha</label>
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="Repita a senha"
              className="input"
            />
            {errors.confirmPassword && (
              <div className="error">{errors.confirmPassword.message}</div>
            )}
          </div>

          {error && <div className="alert-error">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 4 }}
          >
            {isSubmitting ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <div style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
        }}>
          <span className="text-meta">Já tem uma conta? </span>
          <Link
            to="/login"
            style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}
          >
            Entrar
          </Link>
        </div>

      </div>
    </div>
  )
}

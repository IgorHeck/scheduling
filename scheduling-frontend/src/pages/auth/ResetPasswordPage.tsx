import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPassword } from '../../api/auth'
import { resetPasswordSchema, type ResetPasswordFormData as FormData } from '../../schemas/auth'
import { Check, AlertCircle, ArrowRight } from 'lucide-react'

const schema = resetPasswordSchema

export function ResetPasswordPage() {
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const token = searchParams.get('token') ?? ''

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    if (!token) {
      setError('Token inválido. Use o link enviado por e-mail.')
      return
    }
    try {
      await resetPassword(token, data.newPassword)
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.response?.data?.message
      setError(msg ?? 'Link inválido ou expirado. Solicite um novo.')
    }
  }

  const centeredWrap: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
  }

  /* ── Done ── */
  if (done) {
    return (
      <div style={centeredWrap}>
        <div className="card card-pad" style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'color-mix(in oklch, var(--accent) 14%, transparent)',
            border: '1px solid color-mix(in oklch, var(--accent) 28%, transparent)',
            display: 'grid', placeItems: 'center',
            margin: '0 auto 18px',
          }}>
            <Check size={26} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="h-card" style={{ marginBottom: 8 }}>Senha redefinida!</div>
          <div className="text-meta" style={{ marginBottom: 24, lineHeight: 1.6 }}>
            Sua senha foi atualizada com sucesso. Você será redirecionado para o login em instantes.
          </div>
          <Link
            to="/login"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'var(--accent)', fontWeight: 600, fontSize: 13, textDecoration: 'none',
            }}
          >
            Ir para o login <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    )
  }

  /* ── No token ── */
  if (!token) {
    return (
      <div style={centeredWrap}>
        <div className="card card-pad" style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'color-mix(in oklch, var(--warning) 12%, transparent)',
            border: '1px solid color-mix(in oklch, var(--warning) 25%, transparent)',
            display: 'grid', placeItems: 'center',
            margin: '0 auto 18px',
            color: 'var(--warning)',
          }}>
            <AlertCircle size={24} />
          </div>
          <div className="h-card" style={{ marginBottom: 8 }}>Link inválido</div>
          <div className="text-meta" style={{ marginBottom: 24, lineHeight: 1.6 }}>
            Este link não é válido. Use o link enviado por e-mail ou solicite um novo.
          </div>
          <Link
            to="/forgot-password"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'var(--accent)', fontWeight: 600, fontSize: 13, textDecoration: 'none',
            }}
          >
            Solicitar novo link <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    )
  }

  /* ── Form ── */
  return (
    <div style={centeredWrap}>
      <div className="card card-pad" style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ marginBottom: 24 }}>
          <div className="h-page" style={{ marginBottom: 6 }}>Nova senha</div>
          <div className="text-meta">Crie uma nova senha para sua conta.</div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div className="field">
            <label>Nova senha</label>
            <input
              {...register('newPassword')}
              type="password"
              placeholder="Mínimo 6 caracteres"
              className="input"
            />
            {errors.newPassword && <div className="error">{errors.newPassword.message}</div>}
          </div>

          <div className="field">
            <label>Confirmar senha</label>
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="Repita a nova senha"
              className="input"
            />
            {errors.confirmPassword && <div className="error">{errors.confirmPassword.message}</div>}
          </div>

          {error && <div className="alert-error">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar nova senha'}
          </button>

        </form>

        <div style={{
          marginTop: 24, paddingTop: 20,
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
        }}>
          <Link
            to="/forgot-password"
            style={{ color: 'var(--ink-3)', fontSize: 13, textDecoration: 'none' }}
          >
            Reenviar link de recuperação
          </Link>
        </div>

      </div>
    </div>
  )
}

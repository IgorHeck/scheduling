import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { forgotPassword } from '../../api/auth'
import { Mail, ArrowLeft } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Email inválido'),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sent, setSent]   = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await forgotPassword(data.email)
      setSent(true)
    } catch {
      setError('Ocorreu um erro. Tente novamente.')
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

        {sent ? (
          /* ── Sent state ── */
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'color-mix(in oklch, var(--accent) 14%, transparent)',
              border: '1px solid color-mix(in oklch, var(--accent) 28%, transparent)',
              display: 'grid', placeItems: 'center',
              margin: '0 auto 18px',
            }}>
              <Mail size={24} style={{ color: 'var(--accent)' }} />
            </div>
            <div className="h-card" style={{ marginBottom: 8 }}>Verifique seu e-mail</div>
            <div className="text-meta" style={{ marginBottom: 24, lineHeight: 1.6 }}>
              Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha
              nos próximos minutos. Verifique também a pasta de spam.
            </div>
            <Link
              to="/login"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                color: 'var(--accent)', fontWeight: 600, fontSize: 13, textDecoration: 'none',
              }}
            >
              <ArrowLeft size={14} /> Voltar para o login
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <div style={{ marginBottom: 24 }}>
              <div className="h-page" style={{ marginBottom: 6 }}>Recuperar senha</div>
              <div className="text-meta">
                Informe seu e-mail e enviaremos um link para criar uma nova senha.
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

              {error && <div className="alert-error">{error}</div>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>

            </form>

            <div style={{
              marginTop: 24, paddingTop: 20,
              borderTop: '1px solid var(--border)',
              textAlign: 'center',
            }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  color: 'var(--ink-3)', fontSize: 13, textDecoration: 'none',
                }}
              >
                <ArrowLeft size={13} /> Voltar para o login
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

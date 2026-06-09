import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { updateMe } from '../../api/users'
import { useAuthStore } from '../../store/authStore'
import { ChevronLeft } from 'lucide-react'

const schema = z.object({
  name:  z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  phone: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const roleBadgeClass: Record<string, string> = {
  ADMIN:   'role-admin',
  MANAGER: 'role-manager',
  CLIENT:  'role-client',
}

function getInitials(name: string) {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        name:  user?.name  ?? '',
        phone: user?.phone ?? '',
      },
    })

  const onSubmit = async (data: FormData) => {
    setError('')
    setSaved(false)
    try {
      const updated = await updateMe({
        name:  data.name,
        phone: data.phone || undefined,
      })
      setUser(updated)
      setSaved(true)
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.response?.data?.message
      setError(msg ?? 'Erro ao salvar. Tente novamente.')
    }
  }

  const roleMod = user?.role ? (roleBadgeClass[user.role] ?? '') : ''

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── Header ── */}
      <header style={{
        background: 'var(--surface-1)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 24px',
      }}>
        <div style={{
          maxWidth: 540, margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => navigate(-1)}
            aria-label="Voltar"
          >
            <ChevronLeft size={16} />
          </button>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>Meu perfil</div>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ maxWidth: 540, margin: '0 auto', padding: '28px 16px 60px' }}>
        <div className="card card-pad">

          {/* Avatar + info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            marginBottom: 22, paddingBottom: 20, borderBottom: '1px solid var(--border)',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
              background: 'color-mix(in oklch, var(--accent) 14%, var(--surface-2))',
              display: 'grid', placeItems: 'center',
              color: 'var(--accent)', fontWeight: 700, fontSize: 20,
              border: '1px solid color-mix(in oklch, var(--accent) 22%, transparent)',
            }}>
              {user?.name ? getInitials(user.name) : '?'}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{user?.name}</div>
              <div className="text-meta" style={{ marginTop: 2 }}>{user?.email}</div>
              {user?.role && (
                <span className={`badge${roleMod ? ' ' + roleMod : ''}`} style={{ marginTop: 6 }}>
                  {user.role}
                </span>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div className="field">
              <label>Nome</label>
              <input
                {...register('name')}
                type="text"
                placeholder="Seu nome completo"
                className="input"
              />
              {errors.name && <div className="error">{errors.name.message}</div>}
            </div>

            <div className="field">
              <label>
                Telefone{' '}
                <span className="text-meta" style={{ fontWeight: 400 }}>(opcional)</span>
              </label>
              <input
                {...register('phone')}
                type="tel"
                placeholder="(51) 99999-9999"
                className="input"
              />
            </div>

            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="input"
                style={{ opacity: 0.45, cursor: 'not-allowed' }}
              />
              <div className="text-meta" style={{ marginTop: 4, fontSize: 11.5 }}>
                O email não pode ser alterado.
              </div>
            </div>

            {saved  && <div className="alert-success">✓ Perfil atualizado com sucesso!</div>}
            {error  && <div className="alert-error">{error}</div>}

            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 4 }}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
            </button>

          </form>
        </div>
      </main>

    </div>
  )
}

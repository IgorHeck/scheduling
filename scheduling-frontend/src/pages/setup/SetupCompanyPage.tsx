import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createCompany } from '../../api/companies'
import { getMe } from '../../api/auth'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'

const schema = z.object({
  name:        z.string().min(2, 'Nome muito curto'),
  description: z.string().optional(),
  address:     z.string().optional(),
  phone:       z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function SetupCompanyPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })
  const { setUser } = useAuthStore()

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await createCompany(data)
      // Backend vinculou o criador à empresa — busca o user atualizado
      const updatedUser = await getMe()
      setUser(updatedUser)
      navigate(`/${updatedUser.companyId}/dashboard`)
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setError(msg || 'Erro ao criar empresa. Tente novamente.')
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
      <div className="card card-pad" style={{ width: '100%', maxWidth: 480 }}>

        <div style={{ marginBottom: 24 }}>
          <div className="h-page" style={{ marginBottom: 6 }}>Configurar empresa</div>
          <div className="text-meta">Antes de continuar, preencha os dados da sua empresa.</div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div className="field">
            <label>Nome da empresa <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              {...register('name')}
              type="text"
              placeholder="Ex: Clínica Silva"
              className="input"
            />
            {errors.name && <div className="error">{errors.name.message}</div>}
          </div>

          <div className="field">
            <label>Descrição</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Descreva brevemente sua empresa..."
              className="input"
              style={{ resize: 'none', minHeight: 80 }}
            />
          </div>

          <div className="field">
            <label>Endereço</label>
            <input
              {...register('address')}
              type="text"
              placeholder="Rua, número, cidade"
              className="input"
            />
          </div>

          <div className="field">
            <label>Telefone</label>
            <input
              {...register('phone')}
              type="tel"
              placeholder="(48) 99999-9999"
              className="input"
            />
          </div>

          {error && <div className="alert-error">{error}</div>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 4 }}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar e continuar'}
          </button>

        </form>
      </div>
    </div>
  )
}

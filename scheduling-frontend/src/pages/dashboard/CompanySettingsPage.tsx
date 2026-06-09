import { useState, useEffect, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'react-router-dom'
import { Copy, Lock, Moon, Sun } from 'lucide-react'
import {
  getCompanyById,
  updateCompany,
  updateCompanySettings,
  uploadCompanyLogo,
  type CompanyResponse,
} from '../../api/companies'
import { accentKey, DEFAULT_ACCENT } from '../../hooks/useAccentColor'

const ACCENT_OPTIONS = [
  { name: 'Mint',  value: '#69d3a7' },
  { name: 'Lilás', value: '#b8a8ff' },
  { name: 'Azul',  value: '#7aa9ff' },
  { name: 'Âmbar', value: '#f0a868' },
  { name: 'Coral', value: '#e98c8c' },
]

const schema = z.object({
  name:        z.string().min(2, 'Nome muito curto'),
  description: z.string().optional(),
  address:     z.string().optional(),
  phone:       z.string().optional(),
})
type FormData = z.infer<typeof schema>

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--surface-2)', color: 'var(--ink)',
  border: '1px solid var(--border)', borderRadius: 10,
  padding: '10px 12px', font: 'inherit', fontSize: 13.5,
}

function SettingCard({
  title, sub, children, full, danger,
}: {
  title: string; sub?: string; children: React.ReactNode; full?: boolean; danger?: boolean
}) {
  return (
    <div
      className="card card-pad"
      style={{
        gridColumn: full ? '1 / -1' : undefined,
        borderColor: danger ? 'color-mix(in oklch, var(--danger) 30%, transparent)' : undefined,
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <div className="h-card" style={{ color: danger ? 'var(--danger)' : undefined }}>{title}</div>
        {sub && <div className="text-meta" style={{ marginTop: 3 }}>{sub}</div>}
      </div>
      {children}
    </div>
  )
}

function Switch({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <div
      className={`switch${on ? ' on' : ''}`}
      onClick={!disabled ? onClick : undefined}
      role="switch"
      aria-checked={on}
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    />
  )
}

function SettingRow({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="setting-row">
      <div className="label-group">
        <div className="label">{label}</div>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {children}
    </div>
  )
}

function applyTheme(dark: boolean) {
  if (dark) {
    document.documentElement.classList.remove('light')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.add('light')
    localStorage.setItem('theme', 'light')
  }
}

export function CompanySettingsPage() {
  const { companyId } = useParams<{ companyId: string }>()
  const [company, setCompany]             = useState<CompanyResponse | null>(null)
  const [loading, setLoading]             = useState(true)
  const [savingInfo, setSavingInfo]       = useState(false)
  const [savingBooking, setSavingBooking] = useState(false)
  const [savingActive, setSavingActive]   = useState(false)
  const [successInfo, setSuccessInfo]     = useState(false)
  const [error, setError]                 = useState('')
  const [linkCopied, setLinkCopied]       = useState(false)
  const [logoFile, setLogoFile]           = useState<File | null>(null)
  const [logoPreview, setLogoPreview]     = useState<string | null>(null)
  const [darkMode, setDarkMode]           = useState(() => localStorage.getItem('theme') === 'dark')

  /* ── Accent color ── */
  const savedAccentRef  = useRef<string>(DEFAULT_ACCENT)
  const [pendingAccent, setPendingAccent] = useState<string>(DEFAULT_ACCENT)
  const accentDirty = pendingAccent !== savedAccentRef.current

  const handleToggleTheme = () => {
    const next = !darkMode
    setDarkMode(next)
    applyTheme(next)
  }

  const handleSwatchClick = (color: string) => {
    setPendingAccent(color)
    document.documentElement.style.setProperty('--accent', color)
  }

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!companyId) return
    getCompanyById(Number(companyId))
      .then(c => {
        setCompany(c)
        reset({ name: c.name, description: c.description ?? '', address: c.address ?? '', phone: c.phone ?? '' })
        // Load saved accent for this company
        const saved = localStorage.getItem(accentKey(Number(companyId))) ?? DEFAULT_ACCENT
        savedAccentRef.current = saved
        setPendingAccent(saved)
      })
      .finally(() => setLoading(false))
  }, [companyId])

  // Revert accent preview on unmount
  useEffect(() => {
    return () => {
      document.documentElement.style.setProperty('--accent', savedAccentRef.current)
    }
  }, [])

  const onSubmitInfo = async (data: FormData) => {
    if (!company) return
    setSavingInfo(true); setError(''); setSuccessInfo(false)
    try {
      let updated = await updateCompany(company.id, data)
      if (logoFile) {
        updated = await uploadCompanyLogo(company.id, logoFile)
        setLogoFile(null)
      }
      setCompany(updated)
      reset({ name: updated.name, description: updated.description ?? '', address: updated.address ?? '', phone: updated.phone ?? '' })
      // Persist accent color selection
      if (accentDirty) {
        localStorage.setItem(accentKey(company.id), pendingAccent)
        savedAccentRef.current = pendingAccent
        document.documentElement.style.setProperty('--accent', pendingAccent)
      }
      setSuccessInfo(true)
      setTimeout(() => setSuccessInfo(false), 3000)
    } catch { setError('Erro ao salvar. Tente novamente.') }
    finally { setSavingInfo(false) }
  }

  const handleToggleBooking = async () => {
    if (!company) return
    setSavingBooking(true)
    try {
      const updated = await updateCompanySettings(company.id, { allowClientBooking: !company.allowClientBooking })
      setCompany(updated)
    } catch { setError('Erro ao alterar configuração.') }
    finally { setSavingBooking(false) }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    setError('')
  }

  const bookingUrl = company ? `${window.location.origin}/${company.id}/booking` : ''

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(bookingUrl).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
    })
  }, [bookingUrl])

  const handleToggleActive = async () => {
    if (!company) return
    if (!company.active && !confirm('Reativar a empresa?')) return
    if (company.active && !confirm('Desativar a empresa?')) return
    setSavingActive(true)
    try {
      const updated = await updateCompanySettings(company.id, { active: !company.active })
      setCompany(updated)
    } catch { setError('Erro ao alterar status da empresa.') }
    finally { setSavingActive(false) }
  }

  if (loading) return <div className="page"><div className="loading">Carregando...</div></div>
  if (!company) return <div className="page"><div className="loading">Empresa não encontrada.</div></div>

  const companyInitials = company.name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="h-page">Configurações</div>
          <div className="sub">Empresa, agendamento público e identidade visual</div>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSubmit(onSubmitInfo)}
          disabled={savingInfo || (!isDirty && !accentDirty && !logoFile)}
        >
          {savingInfo ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {successInfo && <div className="alert-success">✓ Salvo com sucesso!</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Logo + identidade */}
        <SettingCard title="Identidade" sub="Logo e nome exibidos no agendamento público">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{
              width: 88, height: 88, borderRadius: 18,
              border: '1px dashed var(--border-strong)',
              background: 'linear-gradient(140deg, color-mix(in oklch, var(--accent) 20%, var(--surface-2)), var(--surface-2))',
              display: 'grid', placeItems: 'center',
              color: 'var(--accent)', fontWeight: 700, fontSize: 26,
              overflow: 'hidden', flexShrink: 0,
            }}>
              {logoPreview || company.logoUrl ? (
                <img
                  src={logoPreview ?? `${import.meta.env.VITE_API_URL}${company.logoUrl}`}
                  alt="Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : companyInitials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>{company.name}</div>
              <div className="text-meta" style={{ marginBottom: 10 }}>
                {logoFile ? 'Clique em "Salvar alterações" para aplicar' : 'PNG, JPG ou WebP — até 5 MB'}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <label
                  className="btn btn-subtle btn-sm"
                  style={{ cursor: savingInfo ? 'not-allowed' : 'pointer', opacity: savingInfo ? 0.5 : 1 }}
                >
                  <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} disabled={savingInfo} onChange={handleLogoChange} />
                  {logoFile ? 'Imagem selecionada' : 'Trocar imagem'}
                </label>
              </div>
            </div>
          </div>
        </SettingCard>

        {/* Aparência: tema + cor de destaque */}
        <SettingCard title="Aparência" sub="Tema da interface e cor de destaque">
          {/* Tema */}
          <SettingRow
            label="Tema escuro"
            sub={darkMode ? 'Interface no tema escuro' : 'Interface no tema claro (padrão)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: darkMode ? 'var(--ink-3)' : 'var(--accent)' }}>
                <Sun size={15} />
              </span>
              <Switch on={darkMode} onClick={handleToggleTheme} />
              <span style={{ color: darkMode ? 'var(--accent)' : 'var(--ink-3)' }}>
                <Moon size={15} />
              </span>
            </div>
          </SettingRow>

          {/* Cor de destaque */}
          <div style={{ paddingTop: 14, marginTop: 14, borderTop: '1px solid var(--border)' }}>
            <div className="label" style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>Cor de destaque</div>
            <div className="text-meta" style={{ marginBottom: 12 }}>Aparece em botões, badges e elementos interativos</div>

            {/* Swatches */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {ACCENT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className="swatch-btn"
                  aria-label={opt.name}
                  aria-pressed={pendingAccent === opt.value}
                  onClick={() => handleSwatchClick(opt.value)}
                  style={{
                    background: opt.value,
                    boxShadow: pendingAccent === opt.value
                      ? `0 0 0 2px var(--surface-1), 0 0 0 4px ${opt.value}`
                      : undefined,
                  }}
                  title={opt.name}
                />
              ))}
            </div>

            {/* Live preview */}
            <div style={{
              padding: '14px 16px',
              borderRadius: 10,
              background: 'color-mix(in oklch, var(--accent) 8%, var(--surface-2))',
              border: '1px solid color-mix(in oklch, var(--accent) 25%, transparent)',
              display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: 11, color: 'var(--ink-3)', flexBasis: '100%', marginBottom: -4 }}>
                Pré-visualização
              </span>
              <button
                className="btn btn-primary btn-sm"
                style={{ pointerEvents: 'none', fontSize: 12 }}
                tabIndex={-1}
              >
                Confirmar
              </button>
              <span className="badge st-confirmed">Confirmado</span>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '5px 10px', borderRadius: 7,
                background: 'color-mix(in oklch, var(--accent) 12%, transparent)',
                borderLeft: '2px solid var(--accent)',
                fontSize: 12.5, color: 'var(--ink-2)',
              }}>
                Agendamentos
              </div>
            </div>

            <div className="text-meta" style={{ marginTop: 10 }}>
              Clique em "Salvar alterações" para aplicar.
            </div>
          </div>
        </SettingCard>

        {/* Booking link */}
        <SettingCard title="Link de agendamento público" sub="Compartilhe com os clientes para receberem agendamentos">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10,
            background: 'var(--surface-2)', marginBottom: 12,
          }}>
            <span style={{ color: 'var(--ink-4)', fontSize: 12 }}>↗</span>
            <span className="text-mono" style={{ fontSize: 12.5, flex: 1, color: 'var(--accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {bookingUrl}
            </span>
            <button
              className="btn btn-subtle btn-sm"
              onClick={handleCopyLink}
              style={linkCopied ? { color: 'var(--accent)', borderColor: 'var(--border-accent)' } : undefined}
            >
              <Copy size={12} /> {linkCopied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <SettingRow label="Permitir agendamentos pelo link público" sub="Clientes podem se cadastrar e marcar horários">
            <Switch on={company.allowClientBooking} onClick={handleToggleBooking} disabled={savingBooking} />
          </SettingRow>
        </SettingCard>

        {/* General info */}
        <SettingCard title="Informações gerais" sub="Dados que aparecem no perfil público" full>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { id: 'name', label: 'Nome da empresa', placeholder: 'Nome da empresa' },
              { id: 'phone', label: 'Telefone', placeholder: '(48) 99999-9999' },
              { id: 'address', label: 'Endereço', placeholder: 'Rua, número, cidade' },
              { id: 'description', label: 'Descrição', placeholder: 'Descreva brevemente...' },
            ].map(f => (
              <div key={f.id} className="field">
                <label>{f.label}</label>
                <input
                  {...register(f.id as keyof FormData)}
                  type="text"
                  placeholder={f.placeholder}
                  style={inputStyle}
                />
                {errors[f.id as keyof typeof errors] && (
                  <div className="error">{(errors[f.id as keyof typeof errors] as any)?.message}</div>
                )}
              </div>
            ))}
          </div>
        </SettingCard>

        {/* Status */}
        <SettingCard title="Status da empresa" sub="Empresas inativas não aparecem para clientes nem aceitam agendamentos">
          <SettingRow
            label="Empresa ativa"
            sub={company.active
              ? 'Visível para clientes e aceitando agendamentos'
              : 'Oculta — nenhum agendamento poderá ser feito'}
          >
            <Switch on={company.active} onClick={handleToggleActive} disabled={savingActive} />
          </SettingRow>
          <div style={{ paddingTop: 12, marginTop: 8, borderTop: '1px solid var(--border)' }}>
            <div className="text-meta">
              Criada em {new Date(company.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </div>
          </div>
        </SettingCard>

        {/* Danger zone */}
        <SettingCard title="Zona de risco" sub="Ações irreversíveis" danger>
          <SettingRow label="Excluir empresa permanentemente" sub="Remove todos os agendamentos, grades e bloqueios">
            <button className="btn btn-danger btn-sm"><Lock size={12} /> Excluir empresa</button>
          </SettingRow>
        </SettingCard>

      </div>
    </div>
  )
}

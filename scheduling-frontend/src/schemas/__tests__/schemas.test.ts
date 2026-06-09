import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema, resetPasswordSchema } from '../auth'
import { rescheduleSchema } from '../appointment'

// ---------------------------------------------------------------------------
// loginSchema
// ---------------------------------------------------------------------------
describe('loginSchema', () => {
  it('accepts valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'abc123' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'abc123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const emails = result.error.issues.filter(i => i.path[0] === 'email')
      expect(emails.length).toBeGreaterThan(0)
      expect(emails[0].message).toBe('Email inválido')
    }
  })

  it('rejects password shorter than 6 characters', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '12345' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const passwords = result.error.issues.filter(i => i.path[0] === 'password')
      expect(passwords.length).toBeGreaterThan(0)
      expect(passwords[0].message).toBe('Mínimo 6 caracteres')
    }
  })

  it('rejects missing fields', () => {
    const result = loginSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// registerSchema
// ---------------------------------------------------------------------------
describe('registerSchema', () => {
  const valid = {
    name: 'João Silva',
    email: 'joao@example.com',
    password: 'senha123',
    confirmPassword: 'senha123',
  }

  it('accepts valid data without phone', () => {
    const result = registerSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts valid data with phone', () => {
    const result = registerSchema.safeParse({ ...valid, phone: '(48) 99999-9999' })
    expect(result.success).toBe(true)
  })

  it('rejects name shorter than 2 characters', () => {
    const result = registerSchema.safeParse({ ...valid, name: 'A' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const names = result.error.issues.filter(i => i.path[0] === 'name')
      expect(names[0].message).toBe('Nome muito curto')
    }
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({ ...valid, email: 'bad-email' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const emails = result.error.issues.filter(i => i.path[0] === 'email')
      expect(emails[0].message).toBe('Email inválido')
    }
  })

  it('rejects password shorter than 6 characters', () => {
    const result = registerSchema.safeParse({ ...valid, password: '123', confirmPassword: '123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const passwords = result.error.issues.filter(i => i.path[0] === 'password')
      expect(passwords[0].message).toBe('Mínimo 6 caracteres')
    }
  })

  it('rejects when passwords do not match', () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: 'different' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const confirm = result.error.issues.filter(i => i.path[0] === 'confirmPassword')
      expect(confirm[0].message).toBe('As senhas não coincidem')
    }
  })

  it('accepts when passwords match exactly', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'abc123', confirmPassword: 'abc123' })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// resetPasswordSchema
// ---------------------------------------------------------------------------
describe('resetPasswordSchema', () => {
  const valid = { newPassword: 'newpass1', confirmPassword: 'newpass1' }

  it('accepts matching passwords of valid length', () => {
    const result = resetPasswordSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects newPassword shorter than 6 characters', () => {
    const result = resetPasswordSchema.safeParse({ newPassword: '12345', confirmPassword: '12345' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const newPwd = result.error.issues.filter(i => i.path[0] === 'newPassword')
      expect(newPwd[0].message).toBe('Mínimo 6 caracteres')
    }
  })

  it('rejects when passwords do not match', () => {
    const result = resetPasswordSchema.safeParse({ ...valid, confirmPassword: 'other' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const confirm = result.error.issues.filter(i => i.path[0] === 'confirmPassword')
      expect(confirm[0].message).toBe('As senhas não coincidem')
    }
  })

  it('rejects missing fields', () => {
    const result = resetPasswordSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// rescheduleSchema
// ---------------------------------------------------------------------------
describe('rescheduleSchema', () => {
  it('accepts valid ISO strings', () => {
    const result = rescheduleSchema.safeParse({
      newStartAt: '2026-06-01T09:00:00',
      newEndAt:   '2026-06-01T09:30:00',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty newStartAt', () => {
    const result = rescheduleSchema.safeParse({ newStartAt: '', newEndAt: '2026-06-01T09:30:00' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const field = result.error.issues.filter(i => i.path[0] === 'newStartAt')
      expect(field[0].message).toBe('Horário de início obrigatório')
    }
  })

  it('rejects empty newEndAt', () => {
    const result = rescheduleSchema.safeParse({ newStartAt: '2026-06-01T09:00:00', newEndAt: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const field = result.error.issues.filter(i => i.path[0] === 'newEndAt')
      expect(field[0].message).toBe('Horário de fim obrigatório')
    }
  })

  it('rejects missing fields', () => {
    const result = rescheduleSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

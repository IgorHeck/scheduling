import { api } from './axios'
import type { User, CreateManagerRequest } from '../types/auth.types'

export interface UpdateMeRequest {
  name?: string
  phone?: string
}

export const getMe = () =>
  api.get<User>('/users/me').then(r => r.data)

export const updateMe = (data: UpdateMeRequest) =>
  api.put<User>('/users/me', data).then(r => r.data)

export const getUsersByCompany = (companyId: number) =>
  api.get<User[]>('/users', { params: { companyId } }).then(r => r.data)

export const createManager = (data: CreateManagerRequest) =>
  api.post<User>('/users', data).then(r => r.data)

export const createQuickClient = (data: {
  name: string
  email: string
  phone?: string
  password: string
}) => api.post<User>('/auth/register', data).then(r => r.data)

/** Vincula (ou desvincula) um usuário a uma empresa. companyId=null desvincula. */
export const assignUserCompany = (userId: number, companyId: number | null) =>
  api.put<User>(`/users/${userId}/company`, { companyId }).then(r => r.data)

/** Remove usuário de uma empresa específica (conta permanece ativa). */
export const removeUserFromCompany = (userId: number, companyId: number) =>
  api.delete(`/users/${userId}/companies/${companyId}`)

/** Atualiza dados de um usuário (ADMIN). */
export const updateUserById = (userId: number, data: { phone?: string; professional?: boolean }) =>
  api.put<User>(`/users/${userId}`, data).then(r => r.data)

/** Soft-delete (desativação) de usuário por ADMIN. */
export const deleteUser = (userId: number) =>
  api.delete(`/users/${userId}`)

/** Lista profissionais de atendimento de uma empresa. */
export const getProfessionals = (companyId: number) =>
  api.get<User[]>('/users/professionals', { params: { companyId } }).then(r => r.data)
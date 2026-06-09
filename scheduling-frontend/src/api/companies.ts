import { api } from './axios'

export interface CompanyRequest {
  name: string
  description?: string
  address?: string
  phone?: string
}

export interface CompanyResponse {
  id: number
  name: string
  description?: string
  address?: string
  phone?: string
  logoUrl?: string | null
  allowClientBooking: boolean
  active: boolean
  createdAt: string
}

export const createCompany = (data: CompanyRequest) =>
  api.post<CompanyResponse>('/companies', data).then(r => r.data)

export const getMyCompany = () =>
  api.get<CompanyResponse[]>('/companies').then(r => r.data[0] ?? null)

export const getCompanyById = (id: number) =>
  api.get<CompanyResponse>(`/companies/${id}`).then(r => r.data)

export const listCompanies = () =>
  api.get<CompanyResponse[]>('/companies').then(r => r.data)

export const updateCompany = (id: number, data: CompanyRequest) =>
  api.put<CompanyResponse>(`/companies/${id}`, data).then(r => r.data)

export const updateCompanySettings = (id: number, data: { allowClientBooking?: boolean; active?: boolean }) =>
  api.put<CompanyResponse>(`/companies/${id}/settings`, data).then(r => r.data)

export const getMyCompanies = () =>
  api.get<CompanyResponse[]>('/users/me/companies').then(r => r.data)

export const uploadCompanyLogo = (id: number, file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post<CompanyResponse>(`/companies/${id}/logo`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}
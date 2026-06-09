import { api } from './axios'
import type { AppointmentResponse, CalendarDayResponse, PageResponse } from '../types/appointment.types'

export interface CreateAppointmentRequest {
  companyId: number
  professionalId: number
  clientId?: number
  startAt: string
  endAt: string
  notes?: string
}

export interface QuickClientRequest {
  name: string
  email: string
  phone?: string
  password: string
}

export const getCalendarMonth = (companyId: number, month: string) =>
  api.get<CalendarDayResponse[]>('/appointments/calendar', { params: { companyId, month } }).then(r => r.data)

export const getPendingAppointments = (companyId: number, professionalId?: number) =>
  api.get<AppointmentResponse[]>(`/appointments/company/${companyId}/pending`, {
    params: professionalId ? { professionalId } : undefined,
  }).then(r => r.data)

export const getCompanyAppointments = (
  companyId: number,
  start: string,
  end: string,
  page = 0,
  size = 10,
  professionalId?: number,
) =>
  api
    .get<PageResponse<AppointmentResponse>>(`/appointments/company/${companyId}`, {
      params: { start, end, page, size, ...(professionalId ? { professionalId } : {}) },
    })
    .then(r => r.data)

export const createAppointment = (data: CreateAppointmentRequest) =>
  api.post<AppointmentResponse>('/appointments', data).then(r => r.data)

export const confirmAppointment = (id: number) =>
  api.put<AppointmentResponse>(`/appointments/${id}/confirm`).then(r => r.data)

export const completeAppointment = (id: number) =>
  api.put<AppointmentResponse>(`/appointments/${id}/complete`).then(r => r.data)

export const cancelAppointment = (id: number, reason?: string) =>
  api.put<AppointmentResponse>(`/appointments/${id}/cancel`, null, { params: { reason } }).then(r => r.data)

export const getMyAppointments = (page = 0, size = 10) =>
  api
    .get<PageResponse<AppointmentResponse>>('/appointments', { params: { page, size } })
    .then(r => r.data)

export const getAppointmentById = (id: number) =>
  api.get<AppointmentResponse>(`/appointments/${id}`).then(r => r.data)

export interface RescheduleRequest {
  newStartAt: string
  newEndAt: string
}

export const rescheduleAppointment = (id: number, data: RescheduleRequest) =>
  api.put<AppointmentResponse>(`/appointments/${id}/reschedule`, data).then(r => r.data)

// ── Dashboard helpers — fetches a large single page for metric calculations ──

export const getTodayAppointments = (companyId: number, professionalId?: number): Promise<AppointmentResponse[]> => {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  const end   = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString()
  return api
    .get<PageResponse<AppointmentResponse>>(`/appointments/company/${companyId}`, {
      params: { start, end, size: 1000, ...(professionalId ? { professionalId } : {}) },
    })
    .then(r => r.data.content)
}

export const getMonthAppointments = (companyId: number, professionalId?: number): Promise<AppointmentResponse[]> => {
  const now   = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
  return api
    .get<PageResponse<AppointmentResponse>>(`/appointments/company/${companyId}`, {
      params: { start, end, size: 1000, ...(professionalId ? { professionalId } : {}) },
    })
    .then(r => r.data.content)
}

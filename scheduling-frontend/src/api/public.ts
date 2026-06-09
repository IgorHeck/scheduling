import axios from 'axios'
import type { CalendarDayResponse } from '../types/appointment.types'
import type { CompanyResponse } from './companies'

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

export const getPublicCompany = (companyId: number) =>
  publicApi.get<CompanyResponse>(`/companies/${companyId}`).then(r => r.data)

export const getPublicCalendar = (companyId: number, month: string) =>
  publicApi.get<CalendarDayResponse[]>('/appointments/calendar', {
    params: { companyId, month },
  }).then(r => r.data)

export const getPublicSlots = (companyId: number, date: string) =>
  publicApi.get('/schedules/available', { params: { companyId, date } }).then(r => r.data)

export const createPublicAppointment = (data: {
  companyId: number
  professionalId: number
  startAt: string
  endAt: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  notes?: string
}) => publicApi.post('/appointments/public', data).then(r => r.data)
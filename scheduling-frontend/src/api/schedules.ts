import { api } from './axios'
import type { DayOfWeek } from '../types/schedule.types'

export interface ScheduleRequest {
  companyId: number
  professionalId: number
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  lunchStart?: string
  lunchEnd?: string
  slotDurationMinutes: number
}

export interface ScheduleResponse {
  id: number
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  lunchStart?: string
  lunchEnd?: string
  slotDurationMinutes: number
  active: boolean
  professional: { id: number; name: string }
}

export interface BlockRequest {
  companyId: number
  startAt: string
  endAt: string
  reason?: string
  professionalId?: number | null
}

export interface BlockResponse {
  id: number
  startAt: string
  endAt: string
  reason?: string
  professionalId?: number | null
  professionalName?: string | null
}

export const getCompanySchedules = (companyId: number) =>
  api.get<ScheduleResponse[]>(`/schedules/company/${companyId}`).then(r => r.data)

export const createSchedule = (data: ScheduleRequest) => {
  const payload = {
    ...data,
    startTime:   data.startTime  + ':00',
    endTime:     data.endTime    + ':00',
    lunchStart:  data.lunchStart ? data.lunchStart + ':00' : undefined,
    lunchEnd:    data.lunchEnd   ? data.lunchEnd   + ':00' : undefined,
  }
  return api.post<ScheduleResponse>('/schedules', payload).then(r => r.data)
}

export const updateSchedule = (id: number, data: ScheduleRequest) => {
  const payload = {
    ...data,
    startTime:   data.startTime  + ':00',
    endTime:     data.endTime    + ':00',
    lunchStart:  data.lunchStart ? data.lunchStart + ':00' : undefined,
    lunchEnd:    data.lunchEnd   ? data.lunchEnd   + ':00' : undefined,
  }
  return api.put<ScheduleResponse>(`/schedules/${id}`, payload).then(r => r.data)
}

export const deleteSchedule = (id: number) =>
  api.delete(`/schedules/${id}`)

export const getAvailableSlots = (companyId: number, date: string) =>
  api.get('/schedules/available', { params: { companyId, date } }).then(r => r.data)

export const createBlock = (data: BlockRequest) =>
  api.post<BlockResponse>('/schedules/blocks', data).then(r => r.data)

export const getBlocks = (companyId: number, professionalId?: number) =>
  api.get<BlockResponse[]>('/schedules/blocks', {
    params: { companyId, ...(professionalId ? { professionalId } : {}) },
  }).then(r => r.data)

export const deleteBlock = (id: number) =>
  api.delete(`/schedules/blocks/${id}`)
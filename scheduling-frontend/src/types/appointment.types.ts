export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW'

export interface AppointmentResponse {
  id: number
  companyId: number
  companyName: string
  clientId: number
  clientName: string
  professionalId: number
  professionalName: string
  startAt: string
  endAt: string
  status: AppointmentStatus
  notes?: string
  createdAt: string
}

export interface CalendarDayResponse {
  date: string
  status: 'available' | 'partial' | 'full'
  totalAppointments: number
}

export interface PageResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  number: number       // current page index (0-based)
  size: number
  first: boolean
  last: boolean
}
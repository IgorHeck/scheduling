import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCalendarMonth,
  getPendingAppointments,
  getCompanyAppointments,
  getMyAppointments,
  getAppointmentById,
  confirmAppointment,
  completeAppointment,
  cancelAppointment,
  rescheduleAppointment,
} from '../api/appointments'
import type { RescheduleRequest } from '../api/appointments'
import { useCompanyId } from './useCompanyId'

export const useCalendarMonth = (month: string) => {
  const companyId = useCompanyId()
  return useQuery({
    queryKey: ['calendar', companyId, month],
    queryFn:  () => getCalendarMonth(companyId!, month),
    enabled:  !!companyId,
    staleTime: 1000 * 60 * 5,
  })
}

export const usePendingAppointments = (professionalId?: number | null) => {
  const companyId = useCompanyId()
  return useQuery({
    queryKey: ['appointments', 'pending', companyId, professionalId ?? null],
    queryFn:  () => getPendingAppointments(companyId!, professionalId ?? undefined),
    enabled:  !!companyId,
    refetchInterval: 30000,
  })
}

export const useCompanyAppointments = (start: string, end: string, page = 0, size = 10, professionalId?: number | null) => {
  const companyId = useCompanyId()
  return useQuery({
    queryKey: ['appointments', 'company', companyId, start, end, page, size, professionalId ?? null],
    queryFn:  () => getCompanyAppointments(companyId!, start, end, page, size, professionalId ?? undefined),
    enabled:  !!companyId,
    placeholderData: (prev) => prev,
  })
}

export const useMyAppointments = (page = 0, size = 10) => {
  return useQuery({
    queryKey: ['my-appointments', page, size],
    queryFn:  () => getMyAppointments(page, size),
    placeholderData: (prev) => prev,
  })
}

export const useConfirmAppointment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => confirmAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
    },
  })
}

export const useCompleteAppointment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => completeAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
    },
  })
}

export const useCancelAppointment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      cancelAppointment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
    },
  })
}

export const useRescheduleAppointment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RescheduleRequest }) =>
      rescheduleAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
    },
  })
}

export const useAppointmentById = (id: number | null) =>
  useQuery({
    queryKey: ['appointment', id],
    queryFn:  () => getAppointmentById(id!),
    enabled:  id !== null,
    staleTime: 30_000,
  })

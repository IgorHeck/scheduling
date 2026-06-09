import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsersByCompany, createManager, removeUserFromCompany, updateUserById, getProfessionals } from '../api/users'
import type { CreateManagerRequest } from '../types/auth.types'

export function useListUsers(companyId: number) {
  return useQuery({
    queryKey: ['users', companyId],
    queryFn: () => getUsersByCompany(companyId),
    enabled: !!companyId,
  })
}

export function useCreateManager(companyId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateManagerRequest) => createManager(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', companyId] })
    },
  })
}

export function useRemoveFromCompany(companyId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => removeUserFromCompany(userId, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', companyId] })
    },
  })
}

export function useProfessionals(companyId: number | null | undefined) {
  return useQuery({
    queryKey: ['professionals', companyId],
    queryFn: () => getProfessionals(companyId!),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateUserPhone(companyId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, phone, professional }: { userId: number; phone: string; professional?: boolean }) =>
      updateUserById(userId, { phone, professional }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', companyId] })
      queryClient.invalidateQueries({ queryKey: ['professionals'] })
    },
  })
}

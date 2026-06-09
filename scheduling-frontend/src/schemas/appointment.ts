import { z } from 'zod'

export const rescheduleSchema = z.object({
  newStartAt: z.string().min(1, 'Horário de início obrigatório'),
  newEndAt: z.string().min(1, 'Horário de fim obrigatório'),
})

export type RescheduleFormData = z.infer<typeof rescheduleSchema>

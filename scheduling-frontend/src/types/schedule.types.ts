export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY:    'Segunda-feira',
  TUESDAY:   'Terça-feira',
  WEDNESDAY: 'Quarta-feira',
  THURSDAY:  'Quinta-feira',
  FRIDAY:    'Sexta-feira',
  SATURDAY:  'Sábado',
  SUNDAY:    'Domingo',
}
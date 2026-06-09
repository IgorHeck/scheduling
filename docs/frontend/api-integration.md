# Integração com a API — scheduling-frontend

Relacionados: [[overview]] · [[backend/endpoints|backend/endpoints]] · [[frontend/pages|pages]] · [[frontend/components|components]] · [[frontend/progress|progress]]

Base URL configurada via `VITE_API_URL` no `.env`. Todos os arquivos de integração ficam em `src/api/`.

---

## Auth (`src/api/auth.ts`)

| Endpoint | Método | Arquivo front | Onde é usado |
|---|---|---|---|
| `POST /auth/login` | público | `login()` | `LoginPage` |
| `POST /auth/register` | público | `register()` | `RegisterPage`, `SlotPanel` (criar cliente rápido) |
| `POST /auth/logout` | autenticado | `logout()` | `Sidebar`, `MyAppointmentsPage` |
| `GET /users/me` | autenticado | `getMe()` | `LoginPage`, `RegisterPage` (após autenticar) |
| `POST /auth/refresh` | público | interceptor Axios | Automático ao receber 401 |

---

## Usuários (`src/api/users.ts`)

| Endpoint | Método | Arquivo front | Onde é usado |
|---|---|---|---|
| `GET /users` | ADMIN | `getAllUsers()` | `SlotPanel` (busca de cliente existente) |

**Não integrado ainda:**
- `PUT /users/me` — atualização de perfil do usuário logado.
- `GET /users/{id}` — detalhe por ID.
- `DELETE /users/{id}` — desativação de usuário (admin).

---

## Empresas (`src/api/companies.ts`)

| Endpoint | Método | Arquivo front | Onde é usado |
|---|---|---|---|
| `POST /companies` | ADMIN | `createCompany()` | `SetupCompanyPage` |
| `GET /companies` | público | `getMyCompany()` | `useCompanyId` (hook) |
| `GET /companies/{id}` | público | `getPublicCompany()` | `BookingPage` |
| `PUT /companies/{id}` | ADMIN/MANAGER | `updateCompany()` | `CompanySettingsPage` |
| `PUT /companies/{id}/settings` | ADMIN/MANAGER | `updateCompanySettings()` | `CompanySettingsPage` |

---

## Grades de horário (`src/api/schedules.ts`)

| Endpoint | Método | Arquivo front | Onde é usado |
|---|---|---|---|
| `GET /schedules/company/{id}` | autenticado | `getCompanySchedules()` | `SchedulesPage` |
| `POST /schedules` | ADMIN/MANAGER | `createSchedule()` | `SchedulesPage` |
| `PUT /schedules/{id}` | ADMIN/MANAGER | `updateSchedule()` | `SchedulesPage` |
| `DELETE /schedules/{id}` | ADMIN/MANAGER | `deleteSchedule()` | `SchedulesPage` |
| `GET /schedules/available` | público | `getAvailableSlots()` | `SlotPanel` (dashboard) |
| `GET /schedules/available` | público | `getPublicSlots()` | `BookingPage` |
| `POST /schedules/blocks` | ADMIN/MANAGER | `createBlock()` | `SchedulesPage` |
| `GET /schedules/blocks` | ADMIN/MANAGER | `getBlocks()` | `SchedulesPage` |
| `DELETE /schedules/blocks/{id}` | ADMIN/MANAGER | `deleteBlock()` | `SchedulesPage` |

---

## Agendamentos (`src/api/appointments.ts` e `src/api/public.ts`)

| Endpoint | Método | Arquivo front | Onde é usado |
|---|---|---|---|
| `POST /appointments` | autenticado | `createAppointment()` | `SlotPanel` (dashboard) |
| `POST /appointments/public` | público | `createPublicAppointment()` | `BookingPage` |
| `GET /appointments` | autenticado | `getMyAppointments()` | `MyAppointmentsPage` |
| `PUT /appointments/{id}/confirm` | ADMIN/MANAGER | `confirmAppointment()` | `PendingList`, `PendingPage`, `AppointmentsPage` |
| `PUT /appointments/{id}/cancel` | autenticado | `cancelAppointment()` | `PendingList`, `PendingPage`, `AppointmentsPage`, `MyAppointmentsPage` |
| `GET /appointments/company/{id}` | ADMIN/MANAGER | `getCompanyAppointments()` | `AppointmentsPage` |
| `GET /appointments/company/{id}` | ADMIN/MANAGER | `getTodayAppointments()` | `DashboardHome` |
| `GET /appointments/company/{id}` | ADMIN/MANAGER | `getMonthAppointments()` | `DashboardHome` |
| `GET /appointments/company/{id}/pending` | ADMIN/MANAGER | `getPendingAppointments()` | `PendingList`, `PendingPage` |
| `GET /appointments/calendar` | público | `getCalendarMonth()` | `CalendarView` (dashboard) |
| `GET /appointments/calendar` | público | `getPublicCalendar()` | `BookingPage` |

**Não integrado ainda:**
- `GET /appointments/{id}` — detalhe de um agendamento específico.
- `PUT /appointments/{id}/reschedule` — remarcação de agendamento (endpoint existe no backend, sem tela correspondente no front).

---

## Resumo de cobertura

| Domínio | Endpoints no backend | Integrados | Pendentes |
|---|---|---|---|
| Auth | 4 | 4 | 0 |
| Usuários | 5 | 2 | 3 |
| Empresas | 5 | 5 | 0 |
| Grades | 8 | 8 | 0 |
| Agendamentos | 10 | 9 | 1 (`reschedule`) |

O endpoint `PUT /appointments/{id}/reschedule` existe no backend mas não possui tela no frontend. Os endpoints de usuário não cobertos (`PUT /users/me`, `GET /users/{id}`, `DELETE /users/{id}`) também não têm páginas correspondentes.

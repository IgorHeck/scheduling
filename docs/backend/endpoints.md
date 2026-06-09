# Endpoints — scheduling-api

Relacionados: [[overview]] · [[backend/architecture|architecture]] · [[backend/database|database]] · [[backend/progress|progress]] · [[backend/swagger|swagger]] · [[frontend/api-integration|api-integration]]

Base URL: `http://localhost:8080/api/v1`

Rotas marcadas como **público** não exigem Authorization header. Todas as demais requerem `Authorization: Bearer <access_token>`.

> **Documentação interativa:** Swagger UI em `/swagger-ui.html`. A documentação de cada endpoint
> vive em interfaces `*ControllerDoc` no pacote `doc` — ao mexer em qualquer rota, atualize a
> interface correspondente **e** esta tabela. Detalhes do padrão em [[backend/swagger|swagger]].

---

## Auth — `/auth`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/auth/register` | público | Cadastra usuário; role fixada em CLIENT; retorna access + refresh token |
| POST | `/auth/login` | público | Autentica por email/senha; retorna access + refresh token |
| POST | `/auth/refresh` | público | Troca refresh token por novo par de tokens (o antigo é revogado) |
| POST | `/auth/logout` | autenticado | Revoga todos os refresh tokens do usuário logado |

**TokenResponse** (retorno de register/login/refresh):
```json
{ "accessToken": "...", "refreshToken": "...", "tokenType": "Bearer", "expiresIn": 900 }
```

---

## Usuários — `/users`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/users/me` | autenticado | Retorna perfil do usuário logado |
| GET | `/users/me/companies` | autenticado | Lista as empresas às quais o usuário logado está vinculado |
| PUT | `/users/me` | autenticado | Atualiza nome, telefone do próprio perfil (flag `professional` ignorada) |
| POST | `/users` | ADMIN ou MANAGER | Cria colaborador MANAGER ou PROFESSIONAL; retorna 201 com UserResponse. ADMIN cria ambos; MANAGER só cria PROFESSIONAL |
| GET | `/users` | ADMIN ou MANAGER | Lista usuários da empresa (staff + clientes com agendamento); `?companyId=` |
| GET | `/users/professionals?companyId=` | ADMIN, MANAGER, PROFESSIONAL | Lista profissionais de atendimento da empresa (role PROFESSIONAL ou flag `professional=true`) |
| GET | `/users/{id}` | autenticado | Busca usuário por ID |
| PUT | `/users/{id}` | ADMIN | Atualiza usuário; pode alterar nome, telefone e a flag `professional` |
| DELETE | `/users/{id}/companies/{companyId}` | ADMIN | Remove usuário de uma empresa específica (sem desativar a conta) |
| DELETE | `/users/{id}` | ADMIN | Desativa usuário (soft delete) |
| PUT | `/users/{id}/company` | ADMIN | Vincula ou desvincula usuário de uma empresa; body `{ "companyId": Long \| null }` |

**CreateManagerRequest** (POST `/users`):
```json
{ "name": "", "email": "", "password": "", "phone": "", "companyId": null, "role": "MANAGER", "professional": false }
```
- `companyId` é opcional; quando informado, associa o colaborador à empresa.
- `role`: `"MANAGER"` (padrão) ou `"PROFESSIONAL"`. MANAGER só pode criar PROFESSIONAL.
- `professional`: quando `role=MANAGER`, indica que ele também atende; com `role=PROFESSIONAL` é forçado para `true`.

**UpdateUserRequest** (PUT `/users/me` e PUT `/users/{id}`):
```json
{ "name": "", "phone": "", "professional": true }
```
- Em `/users/me` o campo `professional` é ignorado; só o ADMIN altera a flag via `/users/{id}`.

---

## Empresas — `/companies`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/companies` | ADMIN | Cria empresa e vincula automaticamente o criador à empresa |
| GET | `/companies` | público | Lista empresas ativas |
| GET | `/companies/{id}` | público | Detalha empresa |
| PUT | `/companies/{id}` | ADMIN ou MANAGER | Atualiza dados da empresa |
| PUT | `/companies/{id}/settings` | ADMIN ou MANAGER | Ativa/desativa agendamento público (`allowClienteBooking`) e suspende empresa (`active`) |
| POST | `/companies/{id}/logo` | ADMIN ou MANAGER | Upload de logo (multipart/form-data, campo `file`; JPEG/PNG/WebP, máx 5 MB); salva em disco e retorna `CompanyResponse` com `logoUrl` |

**CompanyRequest** (create/update):
```json
{ "name": "", "description": "", "address": "", "phone": "" }
```

**CompanySettingsRequest**:
```json
{ "allowClienteBooking": true, "active": true }
```

---

## Grades de horário — `/schedules`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/schedules/available?companyId=&date=` | público | Slots disponíveis de um dia (retorna todos os slots, marcando `available: true/false`) |
| GET | `/schedules/company/{companyId}` | autenticado | Grade de horários ativa da empresa |
| POST | `/schedules` | ADMIN ou MANAGER | Cria grade para um profissional |
| PUT | `/schedules/{id}` | ADMIN ou MANAGER | Edita grade |
| DELETE | `/schedules/{id}` | ADMIN ou MANAGER | Remove grade |
| POST | `/schedules/blocks` | ADMIN ou MANAGER | Bloqueia faixa de horário. `professionalId` no body: null = bloqueio global; informado = só daquele profissional |
| GET | `/schedules/blocks?companyId=&professionalId=` | ADMIN, MANAGER, PROFESSIONAL | Lista bloqueios. Com `professionalId`, retorna os dele + os globais |
| DELETE | `/schedules/blocks/{id}` | ADMIN ou MANAGER | Remove bloqueio |

**ScheduleRequest**:
```json
{ "companyId": 1, "professionalId": 2, "dayOfWeek": "MONDAY", "startTime": "08:00", "endTime": "18:00", "lunchStart": "12:00", "lunchEnd": "13:00", "slotDurationMinutes": 60 }
```

**ScheduleBlockRequest**:
```json
{ "companyId": 1, "startAt": "2025-06-19T00:00:00", "endAt": "2025-06-19T23:59:59", "reason": "Feriado", "professionalId": null }
```
- `professionalId` null = bloqueia para todos os profissionais da empresa.

**AvailableSlotResponse**:
```json
{ "startAt": "2025-06-10T08:00", "endAt": "2025-06-10T09:00", "professionalId": 2, "professionalName": "...", "available": true }
```

---

## Agendamentos — `/appointments`

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/appointments` | autenticado | Cria agendamento; CLIENT → PENDING, ADMIN/MANAGER → CONFIRMED |
| POST | `/appointments/public` | público | Agendamento sem login; cria conta CLIENT automaticamente se e-mail não existir |
| GET | `/appointments` | autenticado | Lista agendamentos do usuário logado (ordenado por data desc) |
| GET | `/appointments/{id}` | autenticado | Detalha agendamento |
| PUT | `/appointments/{id}/confirm` | ADMIN ou MANAGER | Confirma agendamento PENDING |
| PUT | `/appointments/{id}/complete` | ADMIN ou MANAGER | Marca agendamento CONFIRMED como COMPLETED |
| PUT | `/appointments/{id}/cancel?reason=` | autenticado | Cancela agendamento (não permite se COMPLETED). PROFESSIONAL não pode |
| PUT | `/appointments/{id}/reschedule` | autenticado | Remarcar; verifica conflito, volta para PENDING. PROFESSIONAL não pode |
| GET | `/appointments/company/{companyId}?start=&end=&professionalId=` | ADMIN, MANAGER, PROFESSIONAL | Agenda da empresa em um período (ISO datetime), paginada. `professionalId` opcional filtra por profissional; PROFESSIONAL recebe só os próprios |
| GET | `/appointments/company/{companyId}/pending?professionalId=` | ADMIN, MANAGER, PROFESSIONAL | Fila de pendentes da empresa. `professionalId` opcional; PROFESSIONAL recebe só os próprios |
| GET | `/appointments/calendar?companyId=&month=` | público | Resumo do mês (YYYY-MM); retorna status por dia: `available`, `partial`, `full` |

**CreateAppointmentRequest**:
```json
{ "companyId": 1, "professionalId": 2, "clientId": null, "startAt": "2025-06-10T09:00", "endAt": "2025-06-10T10:00", "notes": "" }
```

**PublicAppointmentRequest**:
```json
{ "companyId": 1, "professionalId": 2, "clientName": "", "clientEmail": "", "clientPhone": "", "startAt": "...", "endAt": "...", "notes": "" }
```

**RescheduleRequest**:
```json
{ "newStartAt": "...", "newEndAt": "..." }
```

**CalendarDayResponse**:
```json
{ "date": "2025-06-10", "totalAppointments": 3, "status": "partial" }
```

---

## Status de agendamento (enum `AppointmentStatus`)

`PENDING` → `CONFIRMED` → `COMPLETED` | `CANCELLED`

- Confirmação manual obrigatória para agendamentos de CLIENT.
- Cancelamento bloqueado se status for `COMPLETED`.
- Remarcação retorna o status para `PENDING`.
- `PROFESSIONAL` apenas visualiza a própria agenda — não cria, confirma, cancela ou remarca.

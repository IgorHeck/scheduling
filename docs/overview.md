# Overview — Sistema de Agendamento

Relacionados: [[backend/architecture|backend/architecture]] · [[backend/endpoints|backend/endpoints]] · [[backend/database|backend/database]] · [[backend/progress|backend/progress]] · [[backend/tests|backend/tests]] · [[frontend/architecture|frontend/architecture]] · [[frontend/pages|frontend/pages]] · [[frontend/components|frontend/components]] · [[frontend/api-integration|frontend/api-integration]] · [[frontend/progress|frontend/progress]]

> **Guia para agentes:** Este arquivo é a entrada obrigatória antes de qualquer tarefa. Leia-o inteiro antes de explorar código. Se a tarefa tocar em contratos entre front e back (endpoints, DTOs, tipos, status enum), **coordene com o agente do outro projeto** antes de implementar.

---

## Repositórios

| Projeto | Caminho local | Stack principal | Porta |
|---|---|---|---|
| **scheduling-api** (backend) | `C:\Users\Usuario\Documents\Projetos\scheduling\scheduling-api` | Java 21 + Spring Boot 3.3 + PostgreSQL | 8080 |
| **scheduling-frontend** (frontend) | `C:\Users\Usuario\Documents\Projetos\scheduling\scheduling-frontend` | React 19 + TypeScript + Vite | 5173 |

Base URL da API consumida pelo frontend: `http://localhost:8080/api/v1` (via `VITE_API_URL`).

CORS configurado no backend para aceitar apenas `http://localhost:5173`.

---

## Documentação detalhada

### Backend (`docs/backend/`)
- [[backend/architecture|architecture]] — stack, pacotes, variáveis de ambiente, decisões técnicas
- [[backend/endpoints|endpoints]] — todas as rotas com método, auth, payloads e exemplos JSON
- [[backend/database|database]] — schema completo, migrações Flyway, relacionamentos
- [[backend/progress|progress]] — funcionalidades implementadas e pendentes

### Frontend (`docs/frontend/`)
- [[frontend/architecture|architecture]] — stack, estrutura de pastas, padrões, interceptors JWT
- [[frontend/pages|pages]] — todas as páginas com rota, papel (role) e comportamento
- [[frontend/components|components]] — componentes reutilizáveis e hooks customizados
- [[frontend/api-integration|api-integration]] — mapeamento completo endpoint ↔ função ↔ página
- [[frontend/progress|progress]] — funcionalidades implementadas e pendentes

---

## Visão geral do sistema

Sistema de agendamento multi-tenant com três papéis: `ADMIN`, `MANAGER` e `CLIENT`.

```
[BookingPage / público]  ──POST /appointments/public──▶  backend cria conta CLIENT se necessário
[LoginPage]              ──POST /auth/login──────────▶  JWT access (15min) + refresh (7 dias)
[DashboardHome]          ──GET  /appointments/calendar──▶  CalendarView + SlotPanel
[SchedulesPage]          ──CRUD /schedules────────────▶  grade por profissional/dia
[PendingPage]            ──GET  /appointments/.../pending  + confirm/cancel
[AppointmentsPage]       ──GET  /appointments/company/{id}?start=&end=
[MyAppointmentsPage]     ──GET  /appointments (cliente logado)
[CompanySettingsPage]    ──PUT  /companies/{id}/settings
```

---

## Papéis e acesso

| Role | Acesso no frontend | Restrições no backend |
|---|---|---|
| `ADMIN` | Dashboard completo | Todos os endpoints; cria empresas; desativa usuários |
| `MANAGER` | Dashboard completo | Gerencia apenas a própria empresa (validação pendente no back) |
| `CLIENT` | `/my-appointments` + `/:companyId/booking` | Sem `company_id` vinculado. Escolhe a clínica no modal de "Novo agendamento". Cria agendamentos como PENDING; cancela os próprios. |
| (público) | `/:companyId/booking`, `/login`, `/register` | Apenas rotas marcadas como público |

---

## Fluxo de autenticação

1. Login → `POST /auth/login` → `{ accessToken, refreshToken, expiresIn: 900 }`
2. Frontend persiste tokens no `authStore` (Zustand + localStorage).
3. Toda requisição autenticada: `Authorization: Bearer <accessToken>`.
4. Access expirado → interceptor Axios chama `POST /auth/refresh` → novo par de tokens.
5. Refresh inválido → logout automático → redirect `/login`.
6. Logout → `POST /auth/logout` → backend revoga todos os refresh tokens do usuário.

---

## Domínios e contratos críticos

### Auth (`/auth`)
| Ação | Endpoint | Quem usa no front |
|---|---|---|
| Register | `POST /auth/register` | `RegisterPage`, `SlotPanel` (cliente rápido) |
| Login | `POST /auth/login` | `LoginPage` |
| Refresh | `POST /auth/refresh` | Interceptor automático |
| Logout | `POST /auth/logout` | `Sidebar`, `MyAppointmentsPage` |

### Empresas (`/companies`)
| Ação | Endpoint | Quem usa no front |
|---|---|---|
| Criar | `POST /companies` | `SetupCompanyPage` |
| Listar (hook companyId) | `GET /companies` | `useCompanyId` |
| Detalhe público | `GET /companies/{id}` | `BookingPage` |
| Atualizar | `PUT /companies/{id}` | `CompanySettingsPage` |
| Configurações | `PUT /companies/{id}/settings` | `CompanySettingsPage` (toggles allowClientBooking e active) |

### Grades de horário (`/schedules`)
| Ação | Endpoint | Quem usa no front |
|---|---|---|
| Listar da empresa | `GET /schedules/company/{id}` | `SchedulesPage` |
| Criar | `POST /schedules` | `SchedulesPage` |
| Editar | `PUT /schedules/{id}` | `SchedulesPage` |
| Deletar | `DELETE /schedules/{id}` | `SchedulesPage` |
| Slots disponíveis | `GET /schedules/available?companyId=&date=` | `SlotPanel`, `BookingPage` |
| Criar bloqueio | `POST /schedules/blocks` | `SchedulesPage` |
| Listar bloqueios | `GET /schedules/blocks?companyId=` | `SchedulesPage` |
| Deletar bloqueio | `DELETE /schedules/blocks/{id}` | `SchedulesPage` |

### Agendamentos (`/appointments`)
| Ação                 | Endpoint                                       | Quem usa no front                                                      |
| -------------------- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| Criar (autenticado)  | `POST /appointments`                           | `SlotPanel`                                                            |
| Criar (público)      | `POST /appointments/public`                    | `BookingPage`                                                          |
| Meus agendamentos    | `GET /appointments`                            | `MyAppointmentsPage`                                                   |
| Da empresa           | `GET /appointments/company/{id}?start=&end=`   | `AppointmentsPage`, `DashboardHome`                                    |
| Pendentes da empresa | `GET /appointments/company/{id}/pending`       | `PendingList`, `PendingPage`                                           |
| Calendário mensal    | `GET /appointments/calendar?companyId=&month=` | `CalendarView`, `BookingPage`                                          |
| Confirmar            | `PUT /appointments/{id}/confirm`               | `PendingList`, `PendingPage`, `AppointmentsPage`                       |
| Cancelar             | `PUT /appointments/{id}/cancel?reason=`        | `PendingList`, `PendingPage`, `AppointmentsPage`, `MyAppointmentsPage` |
| **Remarcar**         | `PUT /appointments/{id}/reschedule`            | **Sem tela no front — não integrado**                                  |

---

## Status de agendamento

```
PENDING ──[ADMIN/MANAGER confirma]──▶ CONFIRMED ──[automático/manual]──▶ COMPLETED
   │                                      │
   └──[qualquer autenticado cancela]──▶ CANCELLED
```

- CLIENT cria sempre como `PENDING`.
- ADMIN/MANAGER criam diretamente como `CONFIRMED`.
- Cancelamento bloqueado se status for `COMPLETED`.
- Remarcação retorna para `PENDING`.
- Transição para `COMPLETED` **não está implementada** (sem endpoint nem job).

---

## Gaps e itens pendentes

### Endpoints existentes no backend sem tela no frontend
| Endpoint | Situação |
|---|---|
| `PUT /appointments/{id}/reschedule` | Backend pronto, frontend sem página |
| `PUT /users/me` | Backend pronto, frontend sem página |
| `GET /users/{id}` | Backend pronto, frontend sem uso |
| `DELETE /users/{id}` | Backend pronto, frontend sem uso |

### Limitações conhecidas
- Redis em uso: cache de slots (TTL 2 min, `@Cacheable`/`@CacheEvict`) e blacklist de access tokens no logout.
- Spring Mail configurado mas sem `MailService` implementado (sem e-mails de confirmação/cancelamento).
- Sem transição automática para `COMPLETED`.
- Testes de integração (Testcontainers) prontos mas requerem TCP habilitado no Docker Desktop no Windows (ver [[backend/tests|tests]]).
- Typo no banco: duas colunas similares em `companies` (`allow_client_booking` V2 + `allow_cliente_booking` V7). O Java usa a da V7.
- Validação de que o profissional pertence à empresa não feita no backend.
- MANAGER pode gerenciar qualquer empresa (autorização granular pendente).

---

## Protocolo de coordenação entre agentes

> Siga estas regras sempre que a tarefa tocar na fronteira entre projetos.

### Quando o agente do BACKEND deve avisar o agente do FRONTEND

- Adição, remoção ou renomeação de endpoint.
- Mudança em campos de request ou response (nomes, tipos, obrigatoriedade).
- Mudança no enum `AppointmentStatus` ou em qualquer outro enum exposto.
- Nova regra de autorização que altere qual role pode chamar um endpoint.
- Mudança no formato do JWT ou nos campos do token.
- Alteração no contrato de erro (`GlobalExceptionHandler`) que o front interprete.

**Ação:** inclua no seu output uma seção `## Frontend — ação necessária` descrevendo exatamente o que o agente do frontend precisa alterar e em qual arquivo (`src/api/`, `src/types/`, `src/pages/`).

### Quando o agente do FRONTEND deve avisar o agente do BACKEND

- Necessidade de novo campo em um response existente.
- Necessidade de novo endpoint (nova funcionalidade de tela).
- Identificação de bug em contrato (campo ausente, tipo errado, status HTTP inesperado).
- Mudança de fluxo que exija nova regra de negócio no back.

**Ação:** inclua no seu output uma seção `## Backend — ação necessária` descrevendo o endpoint afetado, a mudança esperada e o arquivo Java relevante (`controller`, `service`, `dto`).

### Documentação após cada tarefa

- Agente do backend: atualize apenas a seção alterada em [[backend/architecture|architecture]], [[backend/endpoints|endpoints]], [[backend/database|database]] ou [[backend/progress|progress]].
- Agente do frontend: atualize apenas a seção alterada em [[frontend/architecture|architecture]], [[frontend/pages|pages]], [[frontend/components|components]], [[frontend/api-integration|api-integration]] ou [[frontend/progress|progress]].
- Ambos: se o gap/limitação for resolvido, remova-o da seção correspondente neste arquivo ([[overview]]).
- **Nunca reescreva o arquivo inteiro** — atualize só a seção alterada.
- **Sempre inclua wiki links** (`[[caminho/arquivo|alias]]`) ao referenciar qualquer outro arquivo do vault — seja em seções de relacionados, no corpo do texto, ou ao criar novos arquivos.
	
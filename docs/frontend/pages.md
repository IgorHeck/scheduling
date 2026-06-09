# Páginas — scheduling-frontend

Relacionados: [[overview]] · [[frontend/architecture|architecture]] · [[frontend/components|components]] · [[frontend/api-integration|api-integration]] · [[frontend/progress|progress]] · [[backend/endpoints|backend/endpoints]]

Rotas definidas em `src/router/index.tsx`.

> **Multi-tenancy por company:** Todas as rotas de dashboard ficam sob `/:companyId/` (ex: `/1/dashboard`). O `companyId` vem do campo `user.companyId` do backend. O `useCompanyId()` lê esse valor direto da URL via `useParams()`.

---

## Autenticação

### `/login` — `LoginPage`
Formulário de email/senha. Após login bem-sucedido chama `getMe()`, persiste tokens e user no authStore e redireciona:
- CLIENT → `/my-appointments`
- ADMIN/MANAGER com empresa → `/{companyId}/dashboard`
- ADMIN sem empresa → `/setup/company`
- MANAGER sem empresa → `/no-company`

### `/register` — `RegisterPage`
Cadastro de novo usuário (name, email, phone opcional, password, confirmPassword). Cria conta com role CLIENT. Redireciona para `/booking` após registro.

---

## Setup

### `/setup/company` — `SetupCompanyPage`
Formulário para criar a empresa do gestor recém-registrado (name, description, address, phone). Só acessível para ADMIN/MANAGER. Ao salvar, armazena `companyId` no authStore e redireciona para `/dashboard`.

---

## Dashboard (ADMIN / MANAGER)

Todas as rotas abaixo ficam sob `/:companyId/dashboard` e são protegidas por `ProtectedRoute` com `requireCompany=true`, que:
- Redireciona para `/setup/company` (ADMIN) ou `/no-company` (MANAGER) se `user.companyId` for nulo.
- Redireciona para `/{user.companyId}/dashboard` se o companyId da URL divergir do usuário.
- Renderiza `DashboardLayout` com topbar (nome da empresa no canto superior direito) + Sidebar + `<Outlet>`.

### `/:companyId/dashboard` — `DashboardHome`
Visão geral. Exibe quatro cards de métricas (agendamentos de hoje, pendentes, mês atual, taxa de confirmação), um `CalendarView` com `SlotPanel` para criar agendamentos diretamente, e um `PendingList` lateral. Destaca o próximo agendamento do dia.

### `/:companyId/dashboard/schedules` — `SchedulesPage`
CRUD completo de grades de horário. Permite criar horários em múltiplos dias de uma vez, editar cada dia individualmente e gerenciar bloqueios temporários (data/hora + motivo). Slots configuráveis em 15/30/45/60/90/120 min com intervalo de almoço opcional.

### `/:companyId/dashboard/pending` — `PendingPage`
Lista detalhada de todos os agendamentos com status PENDING da empresa. Cards com informações do cliente, profissional, horário e duração. Botões para confirmar ou recusar cada item.

### `/:companyId/dashboard/appointments` — `AppointmentsPage`
Listagem completa de agendamentos da empresa com navegação por mês. Filtros por status (TODOS, PENDING, CONFIRMED, CANCELLED, COMPLETED) e busca por nome de cliente ou profissional. Cards de resumo com totais por categoria. Ações contextuais (confirmar/cancelar) por status.

### `/:companyId/dashboard/users` — `UsersPage`
Acessível somente para ADMIN. Lista todos os usuários em cards com nome, e-mail, empresa vinculada, badge de role e status. Dois modais:
- **Criar Manager**: Nome*, E-mail*, Senha*, Telefone opcional, Empresa opcional (dropdown). Validação Zod + RHF. Erro 400 exibido inline.
- **Vincular empresa**: Aparece em botão "Vincular empresa" / "Alterar empresa" em cada usuário ADMIN/MANAGER. Dropdown de empresas → chama `PUT /users/{id}/company`; null desvincula.

### `/:companyId/dashboard/settings` — `CompanySettingsPage`
Seções em ordem:
1. **Logo da empresa**: preview (80×80 px) + input `<file>` (JPEG/PNG/WebP, máx 5 MB). Selecionar o arquivo apenas o **prepara** (mostra preview local e habilita o botão "Salvar alterações"); o envio para `POST /companies/{id}/logo` acontece junto com o submit em **"Salvar alterações"**, não na hora da escolha. Iniciais da empresa como placeholder.
2. **Informações gerais**: edição de name, description, address, phone.
3. **Agendamento público**: toggle `allowClientBooking`.
4. **Link de agendamento**: URL `{origin}/{companyId}/booking` com botão Copiar (feedback "✓ Copiado!"); bloco cinza quando booking desativado.
5. **Status da empresa**: toggle `active`.

---

## Cliente

### `/my-appointments` — `MyAppointmentsPage`
Protegida para qualquer usuário autenticado (sem `requireCompany`). Lista os agendamentos do cliente logado. Destaca o próximo agendamento. Filtros por status. Permite cancelar agendamentos futuros com confirmação. Botão de logout. CLIENT **não tem `company_id` vinculado** — ao clicar em "+ Novo agendamento", abre modal que lista todas as clínicas com `allowClientBooking = true` (via `GET /companies`). Selecionar uma clínica navega para `/{companyId}/booking`. Cada agendamento exibe o nome da clínica (`🏢 companyName`).

---

## Público (sem login)

### `/:companyId/booking` — `BookingPage`
Fluxo multi-step para agendamento público:
1. Selecionar dia no calendário (status visual por dia).
2. Selecionar slot de horário disponível.
3. Preencher dados pessoais (nome, email, telefone, notas).
4. Tela de sucesso com opção de novo agendamento.

Não exige autenticação. `companyId` vem do parâmetro de rota (`useParams()`). Cria automaticamente uma conta CLIENT se o e-mail ainda não existir (feito pelo backend).

### `/no-company` — `NoCompanyPage`
Exibida quando o usuário está autenticado mas não tem empresa vinculada. ADMIN vê link para criar empresa. MANAGER vê mensagem orientando a contatar o administrador.

### `/setup/company` — `SetupCompanyPage`
Somente ADMIN. Cria a primeira empresa. O backend vincula automaticamente o criador à empresa via `company_id`. Após criação, chama `getMe()` para atualizar o user no store e redireciona para `/{companyId}/dashboard`.

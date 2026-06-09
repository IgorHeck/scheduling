# Componentes — scheduling-frontend

Relacionados: [[overview]] · [[frontend/architecture|architecture]] · [[frontend/pages|pages]] · [[frontend/api-integration|api-integration]] · [[frontend/progress|progress]]

Componentes reutilizáveis em `src/components/`.

---

## `ProtectedRoute`

Wrapper de rota que verifica autenticação (`isAuthenticated()`) e, opcionalmente, um array de `allowedRoles`. Redireciona para `/login` se não autenticado, ou para `/unauthorized` se o role não bate. Usado no router para proteger grupos de rotas.

---

## `Sidebar`

Navegação lateral do dashboard. Exibe links para Visão Geral, Horários, Pendentes, Agendamentos e Configurações. Mostra o nome do usuário logado e botão de logout (chama `logout()` do authStore e navega para `/login`).

---

## `CalendarView`

Grid mensal navegável (prev/next mês). Cada célula de dia exibe:
- Indicador de status colorido (verde = disponível, amarelo = parcial, vermelho = lotado).
- Contador de agendamentos do dia.
- Dias passados desabilitados para clique.

Props: `onDayClick(date)`, `selectedDate`. Consome o hook `useCalendarMonth` internamente para buscar o resumo do mês.

---

## `PendingList`

Lista de agendamentos com status PENDING. Exibe badge com contagem, informações de cliente/profissional/horário e botões Confirmar e Recusar. Usa `usePendingAppointments` (polling a cada 30s) e as mutations `useConfirmAppointment` / `useCancelAppointment`.

---

## `SlotPanel`

Painel lateral/modal ativado ao selecionar um dia no `CalendarView`. Exibe grid de slots disponíveis para a data selecionada. Ao clicar em um slot, abre um modal de criação de agendamento com duas opções:
- **Buscar cliente existente**: campo de busca com dropdown dos usuários cadastrados.
- **Criar cliente rápido**: formulário inline (nome, email, telefone) que cadastra o usuário via `POST /auth/register`.

Após salvar, invalida as query keys de agendamentos e calendário.

---

## Hooks (`src/hooks/`)

### `useAppointments`
Agrupa todas as queries e mutations relacionadas a agendamentos:
- `useCalendarMonth(month)` — resumo mensal para o calendário.
- `usePendingAppointments()` — fila de pendentes com refetch a cada 30s.
- `useCompanyAppointments(start, end)` — agendamentos em um range de datas.
- `useConfirmAppointment()` — mutation de confirmação.
- `useCancelAppointment()` — mutation de cancelamento.

### `useCompanyId`
Efeito que verifica se o `companyId` está no authStore. Se o usuário for ADMIN/MANAGER e o ID não estiver disponível, chama `GET /companies` para obtê-lo e persiste via `authStore.setCompanyId`.

### `useUsers` (`src/hooks/useUsers.ts`)
- `useListUsers()` — query `['users']` para GET /users (ADMIN only).
- `useCreateManager()` — mutation para POST /users; invalida `['users']` no onSuccess.
- `useCompanies()` — query `['companies']` para GET /companies (público); usado no dropdown do modal de criação de manager.

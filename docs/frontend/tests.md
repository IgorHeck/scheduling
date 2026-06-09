# Testes — scheduling-frontend

Relacionados: [[overview]] · [[frontend/architecture|architecture]] · [[frontend/progress|progress]]

Última atualização: 2026-05-24

---

## Visão geral

O projeto usa **Vitest** como runner de testes e **Testing Library** para renderização de componentes/hooks.

| Camada | Ferramenta | Necessita servidor? | Tempo médio |
|---|---|---|---|
| Unitário (schemas) | Vitest + Zod | Não | < 1 s |
| Unitário (hooks) | Vitest + `renderHook` + jsdom | Não | < 5 s |
| E2E | Cypress + `cy.intercept` | **Sim** (apenas `vite dev` — sem backend real) | ~30–60 s |

**Status atual:** 38 testes unitários passando. 6 arquivos E2E implementados com mocks de API via `cy.intercept`.

---

## Dependências de teste instaladas

```json
"devDependencies": {
  "vitest": "^4.1.7",
  "@testing-library/react": "^16.3.2",
  "@testing-library/user-event": "^14.6.1",
  "@testing-library/jest-dom": "^6.9.1",
  "@vitest/coverage-v8": "^4.1.7",
  "jsdom": "^29.1.1"
}
```

---

## Configuração

### `vite.config.ts`

```ts
/// <reference types="vitest/config" />
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    globals: false,
  },
})
```

### `src/test/setup.ts`

```ts
import '@testing-library/jest-dom/vitest'
```

Importa os matchers customizados do jest-dom para Vitest (ex.: `toBeInTheDocument`, `toHaveValue`, etc.).

### `.env.test`

```env
VITE_API_URL=http://localhost:8080
```

---

## Como executar

### Vitest (unitários)

```bash
# Todos os testes (modo run — executa e encerra)
npm test

# Modo watch (executa ao salvar — ideal durante desenvolvimento)
npm run test:watch

# Com cobertura de código
npm run test:coverage
```

### Cypress (E2E)

> Requer o servidor de desenvolvimento rodando (`npm run dev` em outro terminal).
> Não requer o backend real — toda a API é mockada via `cy.intercept`.

```bash
# Headless (CI)
npm run e2e

# Com UI interativa (modo open — para depuração)
npm run e2e:open
```

---

## Estrutura dos arquivos de teste

```
src/
├── schemas/
│   ├── auth.ts                          # loginSchema, registerSchema, resetPasswordSchema
│   ├── appointment.ts                   # rescheduleSchema
│   └── __tests__/
│       └── schemas.test.ts             # Testes unitários de todos os schemas Zod
└── hooks/
    ├── useNotifications.ts
    ├── useSSENotifications.ts
    └── __tests__/
        ├── useNotifications.test.ts    # Testa requestPermission e notify
        └── useSSENotifications.test.ts # Testa abertura, eventos e fechamento do SSE

cypress/
├── tsconfig.json                        # TypeScript config exclusivo do Cypress
├── support/
│   ├── commands.ts                      # cy.loginAs(role, url)
│   └── e2e.ts                           # importa commands + suprime erros de SSE
├── fixtures/
│   ├── auth/admin.json · manager.json · client.json
│   ├── appointments/list.json · pending.json · single.json
│   ├── companies/company.json · inactive.json · no-booking.json
│   ├── calendar/month.json
│   ├── slots/available.json · empty.json
│   └── users/list.json
└── e2e/
    ├── 01-auth.cy.ts        # Login, logout, proteção de rota, forgot/reset password
    ├── 02-booking.cy.ts     # Guards, fluxo multi-step, slots vazios
    ├── 03-appointments.cy.ts # Lista, filtros, busca, confirmar, cancelar, remarcar, paginação
    ├── 04-dashboard.cy.ts   # Métricas, CalendarView, SlotPanel, PendingList
    ├── 05-client.cy.ts      # MyAppointmentsPage, cancelar, remarcar, modal de clínica
    └── 06-users.cy.ts       # Lista, busca, filtro por role, inativos, criar manager, desativar
```

---

## O que cada teste verifica

### `schemas.test.ts` (14 testes)

Testa os schemas Zod exportados de `src/schemas/`. Todos os schemas são puros (sem side effects ou dependências de browser), então os testes rodam sincronamente chamando `.safeParse()`.

#### `loginSchema` (4 testes)

| Cenário | O que verifica |
|---|---|
| Email e senha válidos | `success === true` |
| Email inválido | `success === false`, mensagem `'Email inválido'` no campo `email` |
| Senha < 6 caracteres | `success === false`, mensagem `'Mínimo 6 caracteres'` no campo `password` |
| Campos ausentes | `success === false` |

#### `registerSchema` (7 testes)

| Cenário | O que verifica |
|---|---|
| Dados válidos sem telefone | `success === true` |
| Dados válidos com telefone | `success === true` |
| Nome < 2 caracteres | `success === false`, mensagem `'Nome muito curto'` |
| Email inválido | `success === false`, mensagem `'Email inválido'` |
| Senha < 6 caracteres | `success === false`, mensagem `'Mínimo 6 caracteres'` |
| Senhas não coincidem | `success === false`, mensagem `'As senhas não coincidem'` em `confirmPassword` |
| Senhas coincidem exatamente | `success === true` |

#### `resetPasswordSchema` (4 testes)

| Cenário | O que verifica |
|---|---|
| Senhas válidas e iguais | `success === true` |
| `newPassword` < 6 caracteres | `success === false`, mensagem `'Mínimo 6 caracteres'` |
| Senhas não coincidem | `success === false`, mensagem `'As senhas não coincidem'` |
| Campos ausentes | `success === false` |

#### `rescheduleSchema` (4 testes)

| Cenário | O que verifica |
|---|---|
| Strings ISO válidas | `success === true` |
| `newStartAt` vazia | `success === false`, mensagem `'Horário de início obrigatório'` |
| `newEndAt` vazia | `success === false`, mensagem `'Horário de fim obrigatório'` |
| Campos ausentes | `success === false` |

---

### `useNotifications.test.ts` (8 testes)

Testa o hook `useNotifications` via `renderHook`. Usa `vi.stubGlobal` e `delete (globalThis).Notification` para simular browsers com e sem suporte à API de Notificações.

#### `requestPermission` (4 testes)

| Cenário | O que verifica |
|---|---|
| API não suportada (`'Notification' in window === false`) | Retorna `'denied'` sem lançar exceção |
| Permissão já `'granted'` | Retorna `'granted'` sem chamar `requestPermission()` do browser |
| Permissão `'default'` | Chama `Notification.requestPermission()` uma vez; retorna `'granted'` |
| Permissão `'denied'` | Retorna `'denied'` sem chamar `requestPermission()` do browser |

#### `notify` (4 testes)

| Cenário | O que verifica |
|---|---|
| API não suportada | Não lança exceção |
| Permissão não `'granted'` | Construtor `Notification` não é chamado |
| Permissão `'granted'` + título e corpo | `new Notification(title, { body, icon, tag })` chamado com valores corretos |
| Permissão `'granted'` sem corpo | `new Notification(title, { body: undefined, icon, tag })` |

> **Por que deletar a propriedade e não usar `vi.stubGlobal('Notification', undefined)`?**
> `vi.stubGlobal` seta o valor para `undefined` mas mantém a chave em `window`, então
> `'Notification' in window` continua retornando `true`, o que faz a guarda do hook não funcionar.
> A solução é `delete (globalThis as Record<string, unknown>).Notification` para remover a propriedade completamente.

---

### `useSSENotifications.test.ts` (9 testes)

Testa o hook `useSSENotifications`. Usa uma `FakeEventSource` em vez do `EventSource` real para controlar eventos SSE. Moca `useAuthStore` e `useNotifications` com `vi.mock`.

O hook é renderizado dentro de `QueryClientProvider` (necessário porque chama `useQueryClient()`).

| Cenário | O que verifica |
|---|---|
| Sem `accessToken` | Nenhum `EventSource` é criado |
| Com `accessToken` | `EventSource` é criado com `?token=<encodedToken>` na URL |
| Unmount | `EventSource.close()` é chamado |
| Registro de listeners | Os 4 tipos de evento (`NEW_PENDING`, `APPOINTMENT_CONFIRMED`, `APPOINTMENT_CANCELLED`, `APPOINTMENT_RESCHEDULED`) têm listeners registrados |
| Evento chega | `queryClient.invalidateQueries` é chamado 3 vezes (`appointments`, `my-appointments`, `calendar`) |
| `NEW_PENDING` | `notify('📅 Novo agendamento pendente', message)` |
| `APPOINTMENT_CONFIRMED` | `notify('✅ Agendamento confirmado', message)` |
| `APPOINTMENT_CANCELLED` | `notify('❌ Agendamento cancelado', message)` |
| `APPOINTMENT_RESCHEDULED` | `notify('🔄 Agendamento remarcado', message)` |
| Payload JSON inválido | Não lança exceção; `notify` não é chamado |
| Token muda | Primeiro `EventSource` fechado; novo criado com novo token |

> **Por que usar `FakeEventSource` em vez de `vi.stubGlobal('EventSource', ...)`?**
> O `EventSource` real abre conexões HTTP reais. A `FakeEventSource` é uma classe que implementa
> apenas o que o hook usa (`addEventListener`, `close`) e permite disparar eventos controlados via
> `es.emit(type, data)`, mantendo o teste rápido e determinístico.

---

## Testes E2E (Cypress)

### Convenções gerais

- **`cy.loginAs(role, url)`** — injeta o `auth-storage` no `localStorage` via `onBeforeLoad` antes de visitar a URL, simulando um usuário autenticado sem passar pela tela de login.
- **`cy.intercept`** — toda requisição à API é interceptada e retorna fixtures JSON ou payloads inline. O backend real não é necessário.
- **Fixtures** usadas como fonte de dados: `cypress/fixtures/auth/`, `appointments/`, `companies/`, `slots/`, `calendar/`, `users/`.
- **SSE**: `GET /notifications/subscribe` é sempre interceptado retornando `{ statusCode: 200, body: '' }` para evitar conexões pendentes.
- **`cy.clearLocalStorage()`** é chamado no `beforeEach` dos testes de auth para garantir estado limpo.

### `01-auth.cy.ts`

| Cenário | O que verifica |
|---|---|
| Login válido | Redireciona para `/dashboard`; topbar exibe o nome do usuário |
| Login inválido | Exibe "Email ou senha incorretos"; permanece em `/login` |
| Formulário vazio | Não submete; permanece em `/login` |
| Logout (Sidebar) | Chama `POST /auth/logout`; redireciona para `/login`; `accessToken` vira null |
| Acesso sem auth | `/1/dashboard` → redireciona para `/login` |
| CLIENT em rota ADMIN | `/1/dashboard/users` → redireciona para `/unauthorized` |
| Forgot password | Submete e-mail → exibe "Verifique seu e-mail" |
| Forgot password email inválido | HTML5 validation impede submissão |
| Reset password com token | Formulário de nova senha visível |
| Reset password sem token | Exibe "Link inválido" |
| Reset password sucesso | Exibe "Senha redefinida!" |
| Reset password token inválido | Exibe mensagem de erro da API |

### `02-booking.cy.ts`

| Cenário | O que verifica |
|---|---|
| `companyId` = `abc` | Exibe "Link inválido" (guard de NaN) |
| Empresa 404 | Exibe "Empresa não encontrada" |
| Empresa `active: false` | Exibe "Empresa temporariamente indisponível" |
| `allowClientBooking: false` | Exibe "Agendamentos desativados" |
| Nome da empresa no header | Exibe `company.name` |
| Fluxo completo | Calendário → clica dia → seleciona slot → preenche dados → "Solicitação enviada!" |
| Slots vazios | Após selecionar dia → exibe "Nenhum horário disponível" |
| Navegação de mês | Clica "›" → mês do cabeçalho muda |

### `03-appointments.cy.ts`

| Cenário | O que verifica |
|---|---|
| Lista do mês | Exibe nomes de clientes e badges de status |
| Filtro PENDING | Mostra só agendamentos pendentes |
| Filtro CONFIRMED | Mostra só confirmados |
| Filtro CANCELLED | Mostra só cancelados |
| Filtro Todos | Volta a mostrar tudo |
| Busca por cliente | Filtra por `clientName` |
| Busca por profissional | Filtra por `professionalName` |
| Busca sem resultado | Exibe "Nenhum agendamento encontrado" |
| Confirmar PENDING | `PUT /appointments/101/confirm` → badge muda para Confirmado |
| Cancelar CONFIRMED | `PUT /appointments/102/cancel` → badge muda para Cancelado |
| Botão "🏁 Concluir" | Aparece apenas para CONFIRMED com `endAt` no passado |
| Remarcar | Abre `RescheduleModal`; fecha ao clicar ✕ |
| Ver detalhes | Abre `AppointmentDetailModal`; fecha ao clicar Fechar |
| Paginação | Clica "Próxima →" → requisição com `page=1` |

### `04-dashboard.cy.ts`

| Cenário | O que verifica |
|---|---|
| Cards de métricas | Exibe "Hoje", "Pendentes", "Mês atual", "Taxa de confirmação" |
| Contagem de hoje | Exibe valor numérico não-zero dos stubs |
| Grid do calendário | Células com números de dias presentes |
| Navegar mês | Clica "›" → cabeçalho do mês muda |
| Abrir SlotPanel | Clica dia disponível → slots aparecem |
| PendingList | Exibe nomes dos clientes pendentes |
| Confirmar da PendingList | `PUT /confirm` → item desaparece da fila |

### `05-client.cy.ts`

| Cenário | O que verifica |
|---|---|
| Cabeçalho | Exibe "Meus agendamentos" |
| Lista de agendamentos | Exibe empresa e profissional |
| Próximo agendamento | Bloco azul "Próximo agendamento" visível |
| Filtro Confirmados | Mostra só CONFIRMED |
| Filtro Pendentes | Mostra só PENDING |
| Cancelar (inline confirm) | Exibe "Confirmar cancelamento?" → Sim → badge Cancelado |
| Cancelar → Voltar | Fecha o prompt de confirmação |
| Remarcar | Abre `RescheduleModal`; fecha ao clicar ✕ |
| Ver detalhes | Abre `AppointmentDetailModal`; fecha ao clicar Fechar |
| Novo agendamento | Abre modal "Escolha a clínica" com lista de empresas |
| Selecionar clínica | Navega para `/:id/booking` |
| Sem clínicas disponíveis | Exibe "Nenhuma clínica disponível" |

### `06-users.cy.ts`

| Cenário | O que verifica |
|---|---|
| Lista | Exibe todos os usuários ativos |
| Inativos ocultos | `Cliente Inativo` não aparece por padrão |
| Busca por nome | Filtra usuários |
| Busca por email | Filtra usuários |
| Busca sem resultado | Exibe "Nenhum usuário encontrado" |
| Filtro Manager | Mostra só MANAGERs |
| Filtro Admin | Mostra só ADMINs |
| Filtro Cliente | Mostra só CLIENTs |
| Toggle inativos | Exibe usuários inativos com badge "Inativo" |
| Abrir modal criar Manager | Formulário visível |
| Fechar modal | Clica Cancelar → formulário desaparece |
| Criar Manager (sucesso) | `POST /users` → exibe "Manager criado com sucesso!" |
| Criar Manager (e-mail duplicado) | 400 da API → exibe mensagem de erro |
| Botão Desativar — ADMIN | Não aparece para usuários ADMIN |
| Botão Desativar — self | Não aparece para o próprio usuário logado |
| Desativar (sucesso) | `DELETE /users/2` → prompt → Sim → usuário vira inativo |
| Desativar → Não | Fecha o prompt sem desativar |

---

## Decisões técnicas

### Por que schemas separados em `src/schemas/`?

Os schemas Zod estavam definidos inline nas páginas (`LoginPage`, `RegisterPage`, `ResetPasswordPage`). Extraí-los para `src/schemas/auth.ts` e `src/schemas/appointment.ts` permite:
1. Testá-los de forma isolada (sem renderizar componentes)
2. Reutilizá-los em outros contextos (ex.: validação em API calls)
3. Manter as páginas menores

### Por que `globals: false` no `vite.config.ts`?

Com `globals: false`, as funções do Vitest (`describe`, `it`, `expect`, etc.) precisam ser importadas explicitamente. Isso torna os testes auto-documentados e evita erros de TypeScript sem configuração extra.

### Por que jsdom e não happy-dom?

`jsdom` é a implementação mais completa e é o padrão da maioria das ferramentas do ecossistema React. `happy-dom` é mais rápido mas tem APIs menos completas — jsdom é preferível para testes que usam APIs do browser como `Notification` e `EventSource`.

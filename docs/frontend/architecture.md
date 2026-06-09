# Arquitetura — scheduling-frontend

Relacionados: [[overview]] · [[frontend/pages|pages]] · [[frontend/components|components]] · [[frontend/api-integration|api-integration]] · [[frontend/progress|progress]] · [[backend/architecture|backend/architecture]]

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 19 + TypeScript 6 |
| Bundler | Vite 8 |
| Estilo | CSS tokens globais (`src/index.css`) — design system próprio com paleta dark mint, portado do `design_handoff_visual_refresh`. Tailwind CSS removido completamente (ver [[frontend/visual-refresh-2026\|visual-refresh-2026]]). |
| Roteamento | React Router DOM 7 |
| Estado global | Zustand 5 (persistido em localStorage) |
| Dados assíncronos | TanStack React Query 5 |
| Formulários | React Hook Form 7 + Zod 4 |
| HTTP | Axios 1 |

---

## Estrutura de pastas (`src/`)

```
src/
├── api/          # Funções de requisição HTTP, uma por domínio
├── components/   # Componentes reutilizáveis entre páginas
├── hooks/        # Hooks customizados (React Query wraps + lógica de domínio)
├── pages/        # Páginas agrupadas por contexto (auth, dashboard, booking, client, setup)
├── router/       # Definição de rotas com React Router
├── store/        # Stores Zustand
├── types/        # Interfaces e enums TypeScript
└── main.tsx      # Entry point, QueryClientProvider, RouterProvider
```

---

## Padrões adotados

**Separação de responsabilidades por camada**
- `api/` contém apenas chamadas HTTP — sem lógica de negócio.
- `hooks/` encapsula React Query (queries e mutations) — as páginas não chamam Axios diretamente.
- `store/` guarda somente estado de sessão (tokens, user, companyId).

**Autenticação via JWT com refresh automático**
- `api/axios.ts` possui dois interceptors: o de request injeta o Bearer token; o de response captura 401, chama `/auth/refresh`, reenvia a requisição original e, se falhar, faz logout e redireciona.

**Proteção de rotas por role**
- `ProtectedRoute` verifica `isAuthenticated()` e valida o array `allowedRoles`. Rotas públicas (`/booking`, `/login`, `/register`) ficam fora desse wrapper.

**Validação de formulários com Zod**
- Schemas Zod são definidos inline nos arquivos de página e passados ao `resolver` do React Hook Form. Não há validação manual de campos.

**Invalidação de cache granular**
- Mutations (confirmar, cancelar, criar agendamento) invalidam apenas as query keys afetadas (`appointments`, `calendar`), evitando refetch global.

**Polling seletivo**
- `usePendingAppointments` usa `refetchInterval: 30000` para manter a fila de pendentes atualizada sem WebSocket.

---

## Variáveis de ambiente

| Variável | Uso |
|---|---|
| `VITE_API_URL` | Base URL da API (injetada na instância Axios) |

---

## Multi-tenancy por company

O sistema é multi-tenant por empresa. Todas as rotas de dashboard ficam sob `/:companyId/` (ex: `/1/dashboard`). O hook `useCompanyId()` lê o parâmetro da URL via `useParams()`. O `ProtectedRoute` com `requireCompany=true` garante que o usuário tenha empresa e que o companyId da URL bata com o seu. O `DashboardLayout` exibe o nome da empresa no topbar (canto superior direito). A `BookingPage` também usa `/:companyId/booking`, eliminando o COMPANY_ID hardcoded.

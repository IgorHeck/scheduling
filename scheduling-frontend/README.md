# Scheduling Frontend

Interface web do sistema de agendamento, construída com React 18 + Vite + TypeScript. Permite que donos de empresa gerenciem agendamentos via painel administrativo e que clientes solicitem horários via página pública.

## Tecnologias

| Tecnologia | Uso |
|---|---|
| React 18 + Vite | Framework e bundler |
| TypeScript | Tipagem estática |
| Tailwind CSS v4 | Estilização |
| React Router v6 | Roteamento com rotas protegidas |
| Zustand | Estado global (auth, token) |
| TanStack Query | Cache e sincronização com a API |
| Axios | HTTP client com interceptors JWT |
| React Hook Form | Gerenciamento de formulários |
| Zod | Validação de schemas |

## Pré-requisitos

- Node.js 18+
- Backend rodando em `http://localhost:8080` — veja o [repositório da API](https://github.com/IgorHeck/scheduling-api)

## Instalação

```bash
# Clone o repositório
git clone https://github.com/IgorHeck/scheduling-frontend.git
cd scheduling-frontend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.development
```

## Variáveis de ambiente

Crie `.env.development` na raiz do projeto:

```env
VITE_API_URL=http://localhost:8080
```

Em produção, crie `.env.production` apontando para a URL do servidor.

## Rodando o projeto

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

A aplicação sobe em `http://localhost:5173`.

## Estrutura de pastas

```
src/
├── api/                  # Funções de comunicação com o backend
│   ├── axios.ts          # Instância base + interceptors JWT automáticos
│   ├── auth.ts           # login, logout, getMe
│   ├── appointments.ts   # calendário, pendentes, confirmar, cancelar
│   └── schedules.ts      # slots disponíveis
│
├── store/                # Estado global com Zustand
│   └── authStore.ts      # token, usuário, login/logout persistidos
│
├── hooks/                # React Query encapsulado por domínio
│   └── useAppointments.ts
│
├── components/           # Componentes reutilizáveis
│   ├── Sidebar.tsx       # Navegação lateral
│   ├── CalendarView.tsx  # Calendário com dias pintados por status
│   ├── PendingList.tsx   # Fila de solicitações pendentes
│   └── ProtectedRoute.tsx
│
├── pages/
│   ├── auth/
│   │   └── LoginPage.tsx
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx
│   │   └── DashboardHome.tsx
│   └── booking/
│       └── BookingPage.tsx
│
├── types/                # Tipos TypeScript espelhando os DTOs da API
│   ├── auth.types.ts
│   └── appointment.types.ts
│
└── router/
    └── index.tsx         # Declaração de todas as rotas
```

## Fluxo de autenticação

1. Usuário faz login → API retorna `accessToken` (JWT 15min) + `refreshToken` (7 dias)
2. Zustand persiste os tokens no `localStorage` via middleware `persist`
3. Axios injeta o `Bearer token` automaticamente em todo request via interceptor
4. Se o request retornar `401`, o interceptor renova o token com o `refreshToken` e reexecuta a chamada original
5. Se o refresh falhar, redireciona para `/login`

## Roles e rotas

| Role | Acesso |
|---|---|
| `ADMIN` | `/dashboard` — painel completo, confirmar/cancelar agendamentos, bloquear horários |
| `MANAGER` | `/dashboard` — mesmas permissões do ADMIN na empresa vinculada |
| `CLIENT` | `/booking` — página pública para visualizar disponibilidade e solicitar agendamento |

Rotas protegidas por `ProtectedRoute` que verifica o token e a role antes de renderizar.

## Calendário

O componente `CalendarView` funciona em duas etapas:

1. **Visão mensal** — chama `GET /api/v1/appointments/calendar?companyId=1&month=2025-06` e pinta cada dia com uma cor:
   - 🟢 Verde — dias com slots disponíveis
   - 🟡 Amarelo — parcialmente ocupado
   - 🔴 Vermelho — lotado

2. **Ao clicar num dia** — chama `GET /api/v1/schedules/available?companyId=1&date=2025-06-10` e exibe os slots horários daquele dia

## Scripts disponíveis

```bash
npm run dev       # Inicia em modo desenvolvimento com HMR
npm run build     # Build de produção (output em /dist)
npm run preview   # Serve o build localmente
npm run lint      # Verifica o código com ESLint
```

## Configuração do backend (CORS)

O backend Spring Boot precisa estar configurado para aceitar requisições de `http://localhost:5173`. Certifique-se de que o `SecurityConfig.java` contém:

```java
config.setAllowedOrigins(List.of("http://localhost:5173"));
```

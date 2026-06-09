# Testes — scheduling-api

Relacionados: [[overview]] · [[backend/architecture|architecture]] · [[backend/progress|progress]]

Última atualização: 2026-05-24

---

## Visão geral

O projeto usa três camadas de testes:

| Camada | Ferramenta | Necessita Docker? | Tempo médio |
|---|---|---|---|
| Unitário | JUnit 5 + Mockito | Não | ~15 s |
| Slice (`@WebMvcTest`) | MockMvc + Spring Security Test | Não | ~20 s |
| Integração (IT) | Testcontainers + PostgreSQL + Redis | **Sim** | ~2–4 min |

**Status atual:** 67 testes unitários/slice passando. Integração requer configuração do Docker no Windows (ver seção abaixo).

---

## Como executar

### Apenas unitários e slice (sem Docker)

```bash
# Da raiz do projeto scheduling-api/
mvn test -Dtest="AppointmentServiceTest,NotificationServiceTest,JwtAuthFilterTest,PasswordResetServiceTest,AuthControllerTest,AppointmentControllerTest,NotificationControllerTest"
```

Ou via Maven sem os testes de integração:
```bash
mvn test -Dexclude="**/integration/**"
```

### Apenas testes de integração (requer Docker)

```bash
mvn test -Dtest="AuthFlowIT,AppointmentFlowIT,RateLimitIT"
```

### Todos os testes de uma vez

```bash
mvn test
```

### Via IDE (IntelliJ IDEA)
- Clique com botão direito na pasta `src/test/java` → **Run All Tests**
- Para rodar apenas unitários: botão direito em cada classe
- Para testes de integração: certifique-se que o Docker Desktop está ativo e configurado (ver abaixo)

---

## Configuração do Docker para testes de integração (Windows)

Os testes de integração usam **Testcontainers** que sobe containers reais de PostgreSQL e Redis durante a execução. No Windows com Docker Desktop 4.34+, é necessário expor a API TCP:

### Passo a passo

1. Abra o **Docker Desktop**
2. Vá em **Settings → General**
3. Marque **"Expose daemon on tcp://localhost:2375 without TLS"**
4. Clique em **Apply & Restart**
5. Verifique que o arquivo `~/.testcontainers.properties` contém:
   ```properties
   docker.host=tcp://localhost:2375
   ```

> **Por que isso é necessário?** Docker Desktop 4.34+ mudou como expõe a API Docker no Windows — as named pipes (`npipe://./pipe/docker_engine`) retornam HTTP 400 para a Java Docker Client Library usada pelo Testcontainers. O socket TCP é a alternativa estável.

---

## Estrutura dos arquivos de teste

```
src/test/java/com/scheduling/api/
├── appointment/
│   ├── controller/
│   │   └── AppointmentControllerTest.java   # @WebMvcTest — camada HTTP
│   └── service/
│       └── AppointmentServiceTest.java      # @ExtendWith(Mockito) — lógica de negócio
├── auth/
│   ├── controller/
│   │   └── AuthControllerTest.java          # @WebMvcTest — endpoints de auth
│   ├── filter/
│   │   └── JwtAuthFilterTest.java           # Mockito — comportamento do filtro JWT
│   └── service/
│       └── PasswordResetServiceTest.java    # Mockito — reset de senha + Redis
├── notification/
│   ├── NotificationControllerTest.java      # @WebMvcTest — SSE endpoint
│   └── NotificationServiceTest.java         # Mockito — pool de emitters
└── integration/
    ├── BaseIntegrationTest.java             # Classe base com Testcontainers
    ├── AuthFlowIT.java                      # Fluxo completo de autenticação
    ├── AppointmentFlowIT.java               # Fluxo de agendamentos end-to-end
    └── RateLimitIT.java                     # Rate limiting por IP/minuto
```

---

## O que cada teste verifica

### `AppointmentServiceTest` (12 testes)

Testa a lógica de negócio do `AppointmentService` com mocks de repositório, SSE e e-mail.

| Método | Cenário | O que verifica |
|---|---|---|
| `create()` | CLIENT | Status PENDING, SSE `NEW_PENDING` ao staff, sem `notifyUser` |
| `create()` | ADMIN/MANAGER | Status CONFIRMED, SSE `APPOINTMENT_CONFIRMED` ao cliente |
| `create()` | Conflito de horário | Lança `BusinessException`, sem persistir, sem SSE |
| `create()` | Profissional de outra empresa | Lança `BusinessException`, sem persistir |
| `confirm()` | PENDING → CONFIRMED | Status atualizado, e-mail + SSE ao cliente |
| `confirm()` | Já CONFIRMED | Lança `BusinessException` ("PENDENTES") |
| `cancel()` | Por ADMIN | Status CANCELLED, SSE `APPOINTMENT_CANCELLED` ao cliente |
| `cancel()` | Por CLIENT (próprio) | Status CANCELLED, sem SSE (actor = CLIENT) |
| `cancel()` | Agendamento COMPLETED | Lança `BusinessException` ("concluídos não podem ser cancelados") |
| `cancel()` | CLIENT em agendamento alheio | Lança `AccessDeniedException` |
| `cancel()` | MANAGER de outra empresa | Lança `AccessDeniedException` |
| `reschedule()` | Por ADMIN | Status PENDING, SSE `NEW_PENDING` + `APPOINTMENT_RESCHEDULED` |
| `reschedule()` | Por CLIENT | SSE `NEW_PENDING` ao staff, sem `APPOINTMENT_RESCHEDULED` para si |
| `reschedule()` | Com conflito | Lança `BusinessException` |
| `autoComplete()` | Há expirados | Salva todos com status COMPLETED, retorna contagem |
| `autoComplete()` | Nenhum expirado | Não chama `saveAll`, retorna 0 |

### `NotificationServiceTest` (10 testes)

Testa o pool de SSE emitters sem infraestrutura real.

| Cenário | O que verifica |
|---|---|
| `subscribe()` | Retorna emitter não-nulo |
| `subscribe()` duas vezes | Retorna emitters distintos |
| `notifyUser()` sem subscribers | Não lança exceção |
| `notifyUser()` com emitter morto | Remove o emitter do pool graciosamente |
| `notifyUser()` após cleanup | Não lança exceção com pool vazio |
| `notifyCompanyStaff()` | Chama `findActiveStaffForCompany` com ID correto |
| `notifyCompanyStaff()` sem staff | Não lança exceção |
| `heartbeat()` com pool vazio | Não lança exceção |
| `heartbeat()` com subscribers ativos | Não lança exceção |
| `heartbeat()` com emitter morto | Remove o morto e não lança exceção |

### `PasswordResetServiceTest` (5 testes)

Testa o fluxo de recuperação de senha via Redis.

| Cenário | O que verifica |
|---|---|
| `requestReset()` e-mail existente | Salva UUID no Redis com TTL 1h, chama `MailService` |
| `requestReset()` e-mail inexistente | Não lança exceção, sem interação com mail |
| `resetPassword()` token válido | Atualiza senha (BCrypt), deleta chave Redis |
| `resetPassword()` token inválido | Lança `BusinessException` ("inválido ou expirado") |
| `resetPassword()` usuário deletado | Lança `BusinessException` ("não encontrado") |

### `JwtAuthFilterTest` (7 testes)

Testa o filtro JWT em cenários de header vs query param.

| Cenário | O que verifica |
|---|---|
| Bearer token válido | Autenticação bem-sucedida no SecurityContext |
| Token expirado/inválido | SecurityContext permanece vazio, chain continua |
| Token na blacklist | SecurityContext permanece vazio |
| Sem token em rota pública | Passa sem autenticação, sem chamar `UserDetailsService` |
| `?token=` no endpoint SSE | Autenticação bem-sucedida |
| `?token=` com Bearer header no SSE | Query param tem prioridade; Bearer é ignorado |
| `?token=` em rota não-SSE | Ignorado — sem autenticação por query param |

### `AuthControllerTest` (11 testes — `@WebMvcTest`)

Testa a camada HTTP do `AuthController` sem banco real.

| Endpoint | Cenário | HTTP esperado |
|---|---|---|
| `POST /auth/register` | Request válido | 200 com `TokenResponse` |
| `POST /auth/register` | E-mail duplicado | 400 com `message` |
| `POST /auth/register` | E-mail ausente | 400 (Bean Validation) |
| `POST /auth/login` | Credenciais corretas | 200 com `accessToken` |
| `POST /auth/login` | Senha errada | 400 |
| `POST /auth/logout` | Autenticado | 204, `authService.logout()` chamado |
| `POST /auth/logout` | Sem autenticação | 401 |
| `POST /auth/forgot-password` | Qualquer e-mail | 204 |
| `POST /auth/forgot-password` | E-mail malformado | 400 |
| `POST /auth/reset-password` | Token válido | 204 |
| `POST /auth/reset-password` | Token inválido | 400 com `message` |

### `AppointmentControllerTest` (14 testes — `@WebMvcTest`)

Testa autorizações e mapeamento HTTP do `AppointmentController`.

| Endpoint | Cenário | HTTP esperado |
|---|---|---|
| `POST /appointments` | CLIENT autenticado | 200 PENDING |
| `POST /appointments` | Sem autenticação | 401/403 |
| `POST /appointments` | Conflito de horário | 400 |
| `POST /appointments/public` | Sem auth | 200 PENDING |
| `GET /appointments/{id}` | ADMIN | 200 |
| `GET /appointments` | CLIENT | 200 paginado |
| `GET /appointments/company/{id}` | ADMIN | 200 |
| `GET /appointments/company/{id}` | CLIENT | **403** |
| `GET /appointments/company/{id}/pending` | ADMIN | 200 |
| `PUT /appointments/{id}/confirm` | ADMIN | 200 CONFIRMED |
| `PUT /appointments/{id}/confirm` | CLIENT | **403** |
| `PUT /appointments/{id}/cancel` | ADMIN | 200 CANCELLED |
| `PUT /appointments/{id}/complete` | ADMIN | 200 COMPLETED |
| `PUT /appointments/{id}/complete` | CLIENT | **403** |
| `PUT /appointments/{id}/reschedule` | ADMIN | 200 PENDING |

### `NotificationControllerTest` (3 testes — `@WebMvcTest`)

Testa o endpoint SSE.

| Cenário | O que verifica |
|---|---|
| Autenticado (CLIENT) | Async iniciado, `notificationService.subscribe("user@...")` chamado |
| Sem autenticação | 401/403 |
| Autenticado (ADMIN) | `notificationService.subscribe("admin@...")` chamado |

---

## Testes de integração (Testcontainers)

> Esses testes requerem Docker. Veja a seção de configuração acima.

### `AuthFlowIT` (9 testes)

Sobe PostgreSQL + Redis reais via Testcontainers e testa o fluxo completo de auth.

| Cenário |
|---|
| Registro de novo usuário → 200 com tokens |
| Registro com e-mail duplicado → 400 |
| Login com credenciais corretas → 200 |
| Login com senha errada → 4xx |
| Acesso a rota protegida com token → 200 |
| Acesso sem token → 401/403 |
| Logout → acesso com mesmo token → 401 (blacklist) |
| `forgot-password` com qualquer e-mail → 204 |

### `AppointmentFlowIT` (5 testes)

Testa fluxos de empresa e agendamento com banco real.

| Cenário |
|---|
| Criar empresa como ADMIN → 200 com ID |
| Criar empresa sem auth → 401/403 |
| Desabilitar booking público → tentativa de agendamento → 400 |
| Listar empresas (público) → 200 |
| Registrar cliente → buscar perfil → 200 |

### `RateLimitIT` (2 testes)

Testa o rate limiting por IP usando Redis real.

| Cenário |
|---|
| `POST /auth/register` 5×: passa; 6ª → **429** |
| `POST /appointments/public` 10×: passa; 11ª → **429** |

> **Nota:** os testes de rate limit são **sequenciais dentro do mesmo método** para evitar interferência de estado entre testes (o IP é compartilhado — todos os testes rodam com `127.0.0.1`).

---

## Decisões técnicas relevantes

### Por que `@WebMvcTest` precisa do `SecurityConfig` importado?
O `SecurityConfig` define o filtro JWT, o `UserDetailsService` e a cadeia de autorização. Sem ele, `@WebMvcTest` cria um contexto de segurança padrão diferente do de produção.

### Por que o `StringRedisTemplate` precisa ser configurado nos testes slice?
O `RateLimitFilter` é um `@Component` e é carregado automaticamente no contexto do `@WebMvcTest`. Ele chama `redisTemplate.opsForValue().increment(key)` em cada POST nos endpoints limitados. O `@MockBean StringRedisTemplate` retorna `null` para `opsForValue()` por padrão — o `@BeforeEach` nos testes de controller configura isso explicitamente.

### Por que o `NotificationControllerTest` não usa `asyncDispatch`?
`SseEmitter` abre uma conexão long-lived que nunca "completa" em contexto de teste sem HTTP real. O `asyncDispatch(result)` com `timeToWait=0` falha porque o resultado async nunca é definido. Em vez disso, verificamos apenas que o processamento async foi iniciado (`asyncStarted()`) e que o serviço foi chamado.

### Por que o `GlobalExceptionHandler` tinha um bug com 403?
O `@ExceptionHandler(Exception.class)` capturava `AccessDeniedException` (que estende `RuntimeException`) antes do `ExceptionTranslationFilter` do Spring Security processá-la, retornando 500. Corrigido adicionando `@ExceptionHandler(AccessDeniedException.class)` → 403 antes do handler genérico.

# Architecture — scheduling-api

Relacionados: [[overview]] · [[backend/endpoints|endpoints]] · [[backend/database|database]] · [[backend/progress|progress]] · [[backend/swagger|swagger]]

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Java 21 |
| Framework | Spring Boot 3.3.0 |
| Persistência | Spring Data JPA + Hibernate (PostgreSQL dialect) |
| Banco | PostgreSQL |
| Migrações | Flyway (classpath:db/migration) |
| Autenticação | Spring Security + JWT (jjwt 0.12.5) |
| Cache / Session | Redis (spring-data-redis) — configurado mas não em uso ativo no código atual |
| E-mail | Spring Mail — configurado mas sem envio implementado |
| Docs | SpringDoc OpenAPI 2.5 / Swagger UI |
| Mapeamento | Lombok + MapStruct 1.5.5 |
| Build | Maven |

## Decisões técnicas

- **Sessão stateless**: JWT de curta duração (15 min) + refresh token em banco com revogação explícita (7 dias). Cada login invalida o refresh anterior.
- **Roles**: `ADMIN`, `MANAGER`, `PROFESSIONAL`, `CLIENT`. Guardas via `@PreAuthorize` por método; role injetada no JWT como `ROLE_*`. Um MANAGER pode também atender (flag `professional = true`); `PROFESSIONAL` vê apenas a própria agenda.
- **Documentação OpenAPI separada do controller**: toda a anotação Swagger (`@Operation`, `@ApiResponse`, exemplos) vive em interfaces `*ControllerDoc` no pacote `doc`; o controller só as implementa. Padrão e regras de manutenção em [[backend/swagger|swagger]].
- **Agendamento público**: clientes sem conta podem criar agendamentos via `/appointments/public`; o sistema cria o usuário automaticamente com senha aleatória se o e-mail não existir.
- **Status de agendamento**: CLIENT cria como `PENDING`; ADMIN/MANAGER criam diretamente como `CONFIRMED`.
- **Conflito de horário**: verificado na camada de serviço antes de persistir, sem lock otimista.
- **Soft delete**: usuários são desativados (`active = false`), não removidos.
- **ddl-auto: validate**: o schema é gerido 100% pelo Flyway; o Hibernate apenas valida.
- **CORS**: allowedOrigins fixo em `http://localhost:5173` (dev frontend Vite).

## Estrutura de pacotes

```
com.scheduling.api
├── appointment        — agendamentos (controller, service, repository, model, dto)
├── auth               — autenticação JWT (controller, service, filter, model)
├── company            — empresas (controller, service, repository, model, dto)
├── config             — SecurityConfig, SwaggerConfig
├── doc                — interfaces *ControllerDoc com toda a documentação Swagger/OpenAPI
├── exception          — BusinessException, ResourceNotFoundException, GlobalExceptionHandler
├── notification       — notificações em tempo real (SSE)
├── scheduling         — grades de horário e disponibilidade (controller, service, repository, model, dto)
└── user               — usuários (controller, service, repository, model, dto)
```

Cada domínio é auto-contido: controller → service → repository → model. Dependências cruzadas entre serviços existem (ex.: `AppointmentService` depende de `CompanyService`, `UserService` e `AvaliabilityService`).

## Configuração de ambiente

Variáveis de ambiente esperadas (com defaults para dev):

```
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS
REDIS_HOST, REDIS_PORT
MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS
JWT_SECRET
```

Porta padrão: **8080**. Swagger disponível em `/swagger-ui.html` — ver [[backend/swagger|swagger]] para o padrão de documentação.

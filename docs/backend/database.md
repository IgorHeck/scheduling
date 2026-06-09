# Database — scheduling-api

Relacionados: [[overview]] · [[backend/architecture|architecture]] · [[backend/endpoints|endpoints]] · [[backend/progress|progress]]

Banco: **PostgreSQL**. Migrações geridas por **Flyway** (`classpath:db/migration`). O Hibernate opera com `ddl-auto: validate` — nunca altera o schema.

---

## Tabelas

### `users`
Representa todos os atores do sistema (clientes, profissionais, admins).

| Coluna | Tipo | Notas |
|---|---|---|
| id | BIGSERIAL PK | |
| name | VARCHAR(120) | obrigatório |
| email | VARCHAR(180) UNIQUE | obrigatório |
| password | VARCHAR(255) | hash BCrypt |
| phone | VARCHAR(20) | opcional |
| role | VARCHAR(20) | `ADMIN`, `MANAGER`, `CLIENT` |
| active | BOOLEAN | soft delete; default true |
| company_id | BIGINT FK → companies | adicionado na V8; nullable |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### `companies`
Representa uma empresa/estabelecimento que oferece serviços.

| Coluna | Tipo | Notas |
|---|---|---|
| id | BIGSERIAL PK | |
| name | VARCHAR(150) | obrigatório |
| description | TEXT | |
| address | VARCHAR(255) | |
| phone | VARCHAR(20) | |
| allow_client_booking | BOOLEAN | habilita agendamento público; default true |
| allow_cliente_booking | BOOLEAN | coluna duplicada adicionada na V7 (typo na migração) |
| active | BOOLEAN | suspende a empresa; default true |
| owner_id | BIGINT FK → users | |
| created_at | TIMESTAMP | |

> **Nota:** há duas colunas similares (`allow_client_booking` criada na V2 e `allow_cliente_booking` adicionada na V7). O modelo Java usa `allowClienteBooking`, que mapeia para a coluna da V7.

---

### `schedules`
Grade de disponibilidade de um profissional em um dia da semana.

| Coluna | Tipo | Notas |
|---|---|---|
| id | BIGSERIAL PK | |
| company_id | BIGINT FK → companies | obrigatório |
| professional_id | BIGINT FK → users | obrigatório |
| day_of_week | VARCHAR(15) | ex: `MONDAY`, `FRIDAY` |
| start_time | TIME | início do expediente |
| end_time | TIME | fim do expediente |
| lunch_start | TIME | adicionado na V9; nullable |
| lunch_end | TIME | adicionado na V9; nullable |
| slot_duration_minutes | INT | duração de cada slot; default 60 |
| active | BOOLEAN | default true |

---

### `schedule_blocks`
Bloqueios manuais de um período (feriados, férias, etc.).

| Coluna | Tipo | Notas |
|---|---|---|
| id | BIGSERIAL PK | |
| company_id | BIGINT FK → companies | |
| start_at | TIMESTAMP | início do bloqueio |
| end_at | TIMESTAMP | fim do bloqueio |
| reason | VARCHAR(255) | motivo opcional |

---

### `appointments`
Agendamentos realizados entre cliente e profissional.

| Coluna | Tipo | Notas |
|---|---|---|
| id | BIGSERIAL PK | |
| company_id | BIGINT FK → companies | |
| client_id | BIGINT FK → users | |
| professional_id | BIGINT FK → users | |
| start_at | TIMESTAMP | |
| end_at | TIMESTAMP | |
| status | VARCHAR(20) | `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED` |
| notes | TEXT | observações do cliente |
| cancel_reason | VARCHAR(255) | preenchido ao cancelar |
| created_at | TIMESTAMP | |

Índices: `company_id`, `client_id`, `start_at`.

---

### `refresh_tokens`
Tokens de renovação de sessão JWT.

| Coluna | Tipo | Notas |
|---|---|---|
| id | BIGSERIAL PK | |
| token | VARCHAR(255) UNIQUE | UUID gerado no login/register |
| user_id | BIGINT FK → users | CASCADE DELETE |
| expires_at | TIMESTAMP | expiração: 7 dias |
| revoked | BOOLEAN | default false; marcado true no uso ou logout |

---

## Relacionamentos

```
companies ──< users          (members; company_id em users)
companies ──< schedules      (company_id em schedules)
companies ──< schedule_blocks
companies ──< appointments

users ──< appointments       (como client_id)
users ──< appointments       (como professional_id)
users ──< schedules          (como professional_id)
users ──< refresh_tokens
```

---

## Histórico de migrações Flyway

| Versão | Arquivo | O que faz |
|---|---|---|
| V1 | `create_users` | Cria tabela `users` |
| V2 | `create_companies` | Cria tabela `companies` com `allow_client_booking` |
| V3 | `create_schedules` | Cria tabelas `schedules` e `schedule_blocks` |
| V4 | `create_appointments` | Cria tabela `appointments` com índices |
| V5 | `create_refresh_tokens` | Cria tabela `refresh_tokens` |
| V6 | `seed_admin` | Insere usuário admin padrão (`admin@scheduling.com` / `password`) |
| V7 | `add_allow_cliente_booking` | Adiciona coluna `allow_cliente_booking` em companies (typo) |
| V8 | `add_company_id` | Adiciona coluna `company_id` em users |
| V9 | `add_schedule_lunch_break` | Adiciona `lunch_start` e `lunch_end` em schedules |
| V10 | `link_existing_users_to_company` | `UPDATE users SET company_id = 1 WHERE company_id IS NULL` — vincula usuários legados à company 1 |
| V11 | `clear_client_company` | `UPDATE users SET company_id = NULL WHERE role = 'CLIENT'` — clientes não têm company vinculada; escolhem a clínica no momento do agendamento |

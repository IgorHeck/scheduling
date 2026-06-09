# 03 — Segurança

Relacionados: [overview](00-overview.md) · [ci-cd](04-ci-cd.md) · [observabilidade](02-observabilidade.md) · [roadmap](07-roadmap.md)

## Filosofia

Segurança aqui é dividida em duas camadas:

1. **App-level** — boa parte **já existe** no backend. Esta doc cataloga o que há e o que
   falta endurecer.
2. **Plataforma / supply chain** — scanning de dependências, imagens e segredos no CI/CD.
   É o maior ganho de portfólio e quase tudo é configuração, não código.

## O que já existe (app-level)

| Controle | Estado | Onde |
|----------|--------|------|
| Autenticação JWT (access 15 min + refresh 7 dias) | ✅ | `auth` |
| Refresh token com revogação explícita | ✅ | `refresh_tokens` |
| Blacklist de access token no logout (Redis + TTL) | ✅ | `TokenBlacklistService` |
| Senhas com BCrypt | ✅ | |
| Rate limiting por IP (register, booking público) | ✅ | `RateLimitFilter` (Redis) |
| Autorização granular por role (`@PreAuthorize`, `assertCompanyAccess`) | ✅ | services |
| Reset de senha com token de uso único (Redis TTL 1h) | ✅ | `PasswordResetService` |
| CORS restrito a `localhost:5173` | ✅ | `SecurityConfig` |
| Validação de input (Bean Validation) | ✅ | DTOs |

## Mapa OWASP Top 10 (2021) — estado e ações

| # | Risco | Estado | Ação proposta |
|---|-------|--------|---------------|
| A01 | Broken Access Control | 🟡 parcial | Já há `@PreAuthorize` + `assertCompanyAccess`. Adicionar testes de autorização negativa no CI (já existem vários `403` em `@WebMvcTest`). |
| A02 | Cryptographic Failures | 🟢 ok | BCrypt + JWT assinado. **Ação:** tirar o `JWT_SECRET` default do `application.yml`; obrigar via env/secret. |
| A03 | Injection | 🟢 ok | JPA/queries parametrizadas. Manter; SpotBugs/Find-Sec-Bugs vigia no CI. |
| A04 | Insecure Design | 🟡 | Rate limit e fluxos de estado já desenhados. Documentar threat model resumido aqui. |
| A05 | Security Misconfiguration | 🟡 | Adicionar **security headers** (abaixo) e revisar exposição do Actuator (não expor tudo publicamente). |
| A06 | Vulnerable Components | 🔴 falta | **OWASP Dependency-Check** (Java) + **npm audit** (front) + **Trivy** no CI. |
| A07 | Identification & Auth Failures | 🟢 ok | JWT + refresh + blacklist + rate limit no login/register. |
| A08 | Software & Data Integrity | 🟡 | Assinar/escanear imagens Docker (**Trivy**); fixar versões de base image. |
| A09 | Logging & Monitoring Failures | 🟡 | Resolvido junto com [02-observabilidade.md](02-observabilidade.md) (logs JSON + tracing + alertas). |
| A10 | SSRF | 🟢 baixo risco | App não faz requisições a URLs informadas pelo usuário. Revisar se surgir webhook. |

## Hardening proposto

### 1. Secrets fora do versionamento

- Hoje há `.env` na raiz e um `JWT_SECRET` com default no `application.yml`. **Ação:**
  - garantir que `.env` está no `.gitignore` (conferir);
  - remover o default do `JWT_SECRET` e falhar o boot se ausente;
  - no CI/CD, segredos via **GitHub Actions Secrets**;
  - documentar rotação de segredo.

### 2. Security headers

No `SecurityConfig` (backend) e/ou no `nginx.conf` (frontend):

- `Content-Security-Policy`
- `Strict-Transport-Security` (quando houver HTTPS)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer`

### 3. Exposição do Actuator

Expor apenas `health`/`info` publicamente; `prometheus`/`metrics` só na rede interna de
infra (ou protegido). Ver [02](02-observabilidade.md).

## Camada de plataforma / supply chain (no CI)

Tudo isto roda no GitHub Actions (detalhe em [04-ci-cd.md](04-ci-cd.md)):

| Scanner | Alvo | Quando |
|---------|------|--------|
| **OWASP Dependency-Check** | dependências Java (CVE) | PR + agendado |
| **npm audit** | dependências do frontend | PR |
| **Trivy** (fs + image) | filesystem e imagens Docker | build de imagem |
| **gitleaks** | segredos acidentalmente commitados | todo push |
| **SpotBugs + Find-Sec-Bugs** | bugs de segurança no bytecode Java | PR |
| **CodeQL** (opcional) | análise semântica (Java + JS/TS) | PR + agendado |

## OAuth2 / login social (opcional, fase futura)

Adicionar **Spring Security OAuth2 Client** para login com Google. Cobre o item "OAuth" da
vaga de forma concreta. Fica como **opcional** porque o fluxo JWT próprio já atende; entra só
para demonstração. Mudança seria no `scheduling-api` (`SecurityConfig` + handler que emite o
JWT interno após o OAuth) e um botão no `scheduling-frontend`.

## O que mexer onde

| Onde | Mudança |
|------|---------|
| `scheduling-api/SecurityConfig` | security headers; remover default do JWT_SECRET; restringir Actuator; (opcional) OAuth2 client |
| `scheduling-api/pom.xml` | plugin dependency-check, spotbugs + find-sec-bugs |
| `scheduling-frontend/nginx.conf` | headers de resposta |
| `.github/workflows/` (cada repo) | jobs de scanning (Trivy, gitleaks, audit, dependency-check) |
| raiz / `.gitignore` | garantir `.env` ignorado; documentar secrets |
| vault | `backend/architecture.md` (seção segurança) |

# 08 — Mapa: requisitos da vaga × projeto

Relacionados: [overview](00-overview.md) · [roadmap](07-roadmap.md)

Tabela de rastreabilidade entre cada requisito da vaga e como o projeto de agendamento o
cobre. Legenda do estado:

- 🟢 **já no projeto** (antes desta camada de infra)
- 🔵 **planejado** nesta camada de infra (com link)
- ⚪ **opcional / demonstração**
- ⚫ **fora de escopo** (com justificativa)

| Requisito da vaga | Estado | Como o projeto cobre |
|-------------------|--------|----------------------|
| Frameworks backend (Spring Boot, Quarkus...) | 🟢 | Spring Boot 3.3 + Java 21 |
| Frameworks frontend (React, Angular...) | 🟢 | React 19 + TypeScript + Vite |
| Containers (Docker, Docker Compose) | 🟢 | Dockerfiles multi-stage + compose; ampliado em [05](05-orquestracao.md) |
| Web (CSS, HTML, DOM, HTTP, WebSocket) | 🟢 | SPA React; HTTP/JSON; **SSE** (real-time) — WebSocket é o primo próximo |
| Boas práticas (OOP, Clean Code, Design Patterns) | 🟢 | domínios auto-contidos, DTO/MapStruct, filtros, services |
| Programação Reativa | 🟡/🔵 | SSE + assíncrono hoje; eventos com RabbitMQ em [01](01-mensageria.md) |
| Versionamento (Git/GitHub) | 🟢 | dois repos no GitHub |
| Segurança (cripto, auth, OAuth, OWASP) | 🟢/🔵 | JWT, BCrypt, rate limit, blacklist (já); OWASP/scanning/OAuth em [03](03-seguranca.md) |
| Qualidade (testes unit, reviews, análise estática) | 🟢/🔵 | suíte unit+slice+IT (já); SpotBugs/JaCoCo/Sonar em [04](04-ci-cd.md) |
| Frameworks de testes | 🟢 | JUnit 5, Mockito, Testcontainers, Vitest, Cypress |
| Troubleshooting / depuração | 🔵 | logs JSON + tracing + dashboards em [02](02-observabilidade.md) |
| APIs (REST, Swagger, Postman) | 🟢 | REST + SpringDoc/Swagger UI |
| Integração de sistemas (mensageria, RabbitMQ, SQS/SNS...) | 🔵 | **RabbitMQ** em [01](01-mensageria.md); SQS/SNS mapeados em [06](06-cloud-iac.md) |
| Monitoramento/Observabilidade (Grafana, Prometheus, ELK...) | 🔵 | Prometheus+Grafana+Loki+Tempo em [02](02-observabilidade.md) |
| Entrega/Integração contínua (CI, Terraform, Liquibase) | 🔵 | GitHub Actions em [04](04-ci-cd.md); Flyway no lugar do Liquibase; Terraform em [06](06-cloud-iac.md) |
| Orquestradores (Kubernetes, Helm) | ⚪ | K8s + Helm (kind/minikube) em [05](05-orquestracao.md) |
| Banco de dados (relacional/NoSQL) | 🟢 | PostgreSQL + Redis; Flyway |
| Performance (DB tuning, caching, escalabilidade) | 🟢/🔵 | cache Redis de slots (já); métricas + trade-offs de escala em [02](02-observabilidade.md)/[01](01-mensageria.md) |
| Cloud pública (AWS/Azure/GCP) | ⚪ | design AWS + LocalStack em [06](06-cloud-iac.md) |
| Linguagens (Java, JS, TS, Python) | 🟢/⚪ | Java + TS no projeto; Python p/ scripts de automação |
| Automação (Shell, PowerShell, Python) | 🔵 | scripts de pipeline/infra em [04](04-ci-cd.md) e [05](05-orquestracao.md) |
| Modelos arquitetura backend (DDD, Event-Driven, Hexagonal, CQRS...) | 🟢/🔵 | domínios por pacote (já); **Event-Driven** com RabbitMQ em [01](01-mensageria.md) |
| Modelos arquitetura frontend (SPA, MVVM, Microfrontends) | 🟢 | SPA React com stores Zustand |
| Engenharia de requisitos / UML | 🟢 | documentação no `docs/` (fluxos, contratos) |
| AI-Augmented Development | 🟢 | projeto desenvolvido com assistência de IA (Claude Code) — documentável |
| Serviços cognitivos / LLMs | ⚪ | possível feature futura isolada (ex.: resumo/assistente); não é foco de infra |
| Serverless (Lambda, DynamoDB, API Gateway) | ⚫ | **fora**: monólito stateful (SSE/JPA) não encaixa — análise em [06](06-cloud-iac.md) |
| Big Data | ⚫ | **fora**: volume não justifica |
| Kafka | ⚫ | **fora**: sem streaming/replay — RabbitMQ cobre mensageria ([01](01-mensageria.md)) |
| ELK | ⚫ | **fora**: pesado; Loki cobre logs ([02](02-observabilidade.md)) |
| New Relic / CloudWatch | ⚫ | **fora**: SaaS pago/cloud — stack Grafana cobre |
| Docker Swarm / Mesos | ⚫ | **fora**: Kubernetes é o padrão; um basta |
| Metodologias ágeis (Scrum, Kanban) | ⚪ | processo, não código — roadmap em fases ([07](07-roadmap.md)) pode virar board |
| UX (usabilidade, acessibilidade) | 🟡 | frontend existente; fora do escopo desta camada de infra |
| Modernização de legado | 🟡 | a migração de notificações síncronas → eventos ([01](01-mensageria.md)) é um exemplo de evolução segura |

## Como usar este mapa

- **Na candidatura:** mostra cobertura ampla e, principalmente, **critério** — o que ficou de
  fora tem justificativa, o que sinaliza maturidade de arquitetura.
- **No projeto:** conforme as fases do [roadmap](07-roadmap.md) forem entregues, trocar 🔵 →
  🟢 e linkar o commit/PR correspondente.

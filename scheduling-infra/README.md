# scheduling-infra

Camada de **infraestrutura e plataforma** do sistema de agendamento. Esta pasta é um
"sistema" à parte do `scheduling-api` (backend) e do `scheduling-frontend` (frontend):
ela concentra tudo que é **transversal** — mensageria, observabilidade, segurança de
plataforma, CI/CD e orquestração.

> ⚠️ **Status atual: planejamento.** Nada aqui foi implementado ainda. Estes documentos
> descrevem *o que* será feito, *por quê*, *com quais tecnologias* e *em qual sistema cada
> mudança entra*. Nenhum arquivo de backend/frontend foi alterado.

## Para que serve esta pasta

- Manter o backend e o frontend focados em domínio, sem poluí-los com YAML de infra.
- Ter um único lugar para a stack de plataforma (`docker-compose` de infra, dashboards,
  manifests, pipelines).
- Servir de **vitrine de portfólio**: cada documento explica decisões de arquitetura e
  trade-offs, não só "como rodar".

## Índice da documentação

| # | Documento | Assunto |
|---|-----------|---------|
| 00 | [docs/00-overview.md](docs/00-overview.md) | Visão geral, escopo, **o que entra e o que NÃO entra** (com justificativa) |
| 01 | [docs/01-mensageria.md](docs/01-mensageria.md) | RabbitMQ: eventos, filas, DLQ e **o que mexer no backend** |
| 02 | [docs/02-observabilidade.md](docs/02-observabilidade.md) | Prometheus + Grafana + Loki + Tempo (métricas, logs, tracing) |
| 03 | [docs/03-seguranca.md](docs/03-seguranca.md) | OWASP Top 10, scanning, secrets, headers, OAuth2 opcional |
| 04 | [docs/04-ci-cd.md](docs/04-ci-cd.md) | GitHub Actions: build, testes, scan, imagens |
| 05 | [docs/05-orquestracao.md](docs/05-orquestracao.md) | Docker Compose de infra + Kubernetes/Helm (opcional) |
| 06 | [docs/06-cloud-iac.md](docs/06-cloud-iac.md) | Terraform e cloud-alvo (AWS) — ilustrativo/opcional |
| 07 | [docs/07-roadmap.md](docs/07-roadmap.md) | Fases priorizadas, esforço e dependências |
| 08 | [docs/08-mapa-requisitos-vaga.md](docs/08-mapa-requisitos-vaga.md) | Requisito da vaga → como o projeto cobre (ou por que não) |

## Estrutura prevista (quando implementado)

```
scheduling-infra/
├── README.md
├── CLAUDE.md
├── docs/                      # toda a documentação (esta pasta)
├── compose/                   # docker-compose.*.yml por stack (infra, observability, messaging)
├── observability/
│   ├── prometheus/            # prometheus.yml, regras de alerta
│   ├── grafana/               # dashboards e datasources provisionados
│   ├── loki/ · tempo/ · alloy/
├── k8s/                       # manifests + Helm chart (fase opcional)
└── terraform/                 # IaC (fase opcional, ilustrativa)
```

> As pastas acima ainda **não existem** — serão criadas na implementação, fase a fase,
> conforme [docs/07-roadmap.md](docs/07-roadmap.md).

## Relação com os outros sistemas

- **scheduling-api** (backend): recebe a maior parte das mudanças de código — publisher/
  consumers de RabbitMQ, exporters de métricas, tracing, headers de segurança.
- **scheduling-frontend**: quase não muda. CI próprio e (opcional) coleta de Web Vitals.
- **docs**: documentação de *domínio* continua lá. Esta pasta documenta
  *plataforma*. Os dois se referenciam, mas não se sobrepõem.

# 05 — Orquestração e composição

Relacionados: [overview](00-overview.md) · [mensageria](01-mensageria.md) · [observabilidade](02-observabilidade.md) · [cloud/iac](06-cloud-iac.md) · [roadmap](07-roadmap.md)

## Estado atual

Existe um único `docker-compose.yml` na **raiz** do projeto com: frontend, backend, postgres,
redis, mailhog. Funciona, mas mistura **aplicação** e **plataforma** num arquivo só.

## Proposta: separar app de plataforma

Manter o compose de **aplicação** na raiz (como está) e criar composes de **plataforma**
nesta pasta, combináveis por sobreposição:

```
scheduling-infra/compose/
├── docker-compose.messaging.yml       # rabbitmq (+ management UI)
├── docker-compose.observability.yml   # prometheus, grafana, loki, tempo, alloy
└── docker-compose.infra.yml           # atalho que inclui as duas acima
```

Uso (exemplo):

```bash
# app + mensageria + observabilidade
docker compose \
  -f docker-compose.yml \
  -f scheduling-infra/compose/docker-compose.messaging.yml \
  -f scheduling-infra/compose/docker-compose.observability.yml \
  up -d
```

Vantagens: liga/desliga a stack pesada quando quiser; mantém a raiz enxuta; deixa claro o que
é domínio e o que é plataforma. Todos na mesma `scheduling-net` que já existe.

> Alternativa mais simples: jogar tudo no compose da raiz. Aceitável, mas perde a separação.
> Recomendação: **composes separados**.

## Serviços de plataforma a adicionar

| Serviço | Imagem | Portas | Doc |
|---------|--------|--------|-----|
| RabbitMQ | `rabbitmq:3-management` | 5672, 15672 (UI) | [01](01-mensageria.md) |
| Prometheus | `prom/prometheus` | 9090 | [02](02-observabilidade.md) |
| Grafana | `grafana/grafana` | 3000 | [02](02-observabilidade.md) |
| Loki | `grafana/loki` | 3100 | [02](02-observabilidade.md) |
| Tempo | `grafana/tempo` | 3200 / 4318 (OTLP) | [02](02-observabilidade.md) |
| Alloy | `grafana/alloy` | — | [02](02-observabilidade.md) |

Datasources e dashboards do Grafana **provisionados como código** (arquivos versionados em
`scheduling-infra/observability/grafana/`), não configurados na mão.

## Kubernetes + Helm (fase opcional)

Item da vaga ("Orquestradores: K8s, Helm"). Como o sistema **não vai rodar em produção**,
entra como **demonstração local** em `kind` ou `minikube`, não como ambiente real.

```
scheduling-infra/k8s/
├── base/                     # Deployment, Service, ConfigMap, Secret, Ingress (Kustomize)
└── chart/                    # Helm chart: scheduling (api + front + deps)
```

O que demonstra bem:

- **Probes** de liveness/readiness usando o `/actuator/health` (já preparado em [02](02-observabilidade.md)).
- **ConfigMap/Secret** para env e segredos.
- **HPA** (autoscaling) ilustrando o trade-off do SSE stateful descrito em [01](01-mensageria.md).
- **Helm values** parametrizando ambientes.
- Operadores prontos (kube-prometheus-stack) para a observabilidade.

> Prioridade **baixa**. Só faz sentido depois que mensageria + observabilidade + CI/CD
> estiverem prontos. Docker Swarm/Mesos ficam de fora — Kubernetes é o padrão; um só basta.

## Decisões de orquestração

- **Healthchecks** em todos os serviços do compose (postgres já tem; replicar no backend
  usando o health endpoint do Actuator).
- **`depends_on` com `condition: service_healthy`** para ordem de subida (já usado com o
  postgres).
- **Volumes nomeados** para dados que precisam persistir (postgres já; Grafana/Prometheus
  também).
- **Recursos** (limites de CPU/memória) documentados — útil para a conversa de trade-offs
  custo × performance da vaga.

## O que mexer onde

| Onde | Mudança |
|------|---------|
| `scheduling-infra/compose/` | composes de mensageria e observabilidade |
| `scheduling-infra/observability/` | configs e dashboards provisionados |
| `scheduling-infra/k8s/` | manifests + Helm chart (fase opcional) |
| raiz `docker-compose.yml` | adicionar healthcheck no backend; manter como compose de app |
| vault | `overview.md` (como rodar a stack completa) |

# Documentação Swagger / OpenAPI — scheduling-api

Relacionados: [[overview]] · [[backend/architecture|architecture]] · [[backend/endpoints|endpoints]] · [[backend/progress|progress]]

Como a documentação da API é estruturada, onde fica e como mantê-la.

---

## Onde acessar

| Recurso | URL |
|---|---|
| Swagger UI | `http://localhost:8080/swagger-ui.html` |
| OpenAPI JSON | `http://localhost:8080/v3/api-docs` |
| OpenAPI YAML | `http://localhost:8080/v3/api-docs.yaml` |

Stack: **SpringDoc OpenAPI 2.5** (`springdoc-openapi-starter-webmvc-ui`). Configuração base
(título, versão, contato, esquema de segurança `bearerAuth`) em `config/SwaggerConfig.java`.
Os caminhos públicos do Swagger são liberados no `config/SecurityConfig.java`
(`/swagger-ui.html`, `/swagger-ui/**`, `/v3/api-docs/**`, `/v3/api-docs.yaml`).

---

## Princípio: documentação separada do controller

**Toda a documentação Swagger fica em interfaces dedicadas no pacote `com.scheduling.api.doc`,
nunca dentro do controller.** O controller apenas implementa a interface.

- A **interface `*ControllerDoc`** concentra: `@Tag`, `@Operation`, `@ApiResponse`,
  `@Parameter`, exemplos de request/response (`@ExampleObject`), descrições detalhadas.
- O **controller** fica limpo: apenas `@RestController`, `@RequestMapping`, mapeamentos
  (`@GetMapping`…), segurança (`@PreAuthorize`) e binding (`@RequestBody`, `@PathVariable`,
  `@RequestParam`, `@Valid`, `@AuthenticationPrincipal`).

O SpringDoc lê as anotações herdadas da interface e as mescla com as anotações de binding/rota
do controller. Não é preciso repetir nada.

### Mapeamento interface ↔ controller

| Interface (`doc/`) | Controller | Tag |
|---|---|---|
| `AuthControllerDoc` | `auth/controller/AuthController` | Autenticação |
| `UserControllerDoc` | `user/controller/UserController` | Usuários |
| `CompanyControllerDoc` | `company/controller/CompanyController` | Empresas |
| `AppointmentControllerDoc` | `appointment/controller/AppointmentController` | Agendamentos |
| `ScheduleControllerDoc` | `scheduling/controller/ScheduleController` | Horários e disponibilidade |

> `notification/NotificationController` (SSE) não tem interface de doc — é um endpoint técnico
> de streaming (`text/event-stream`), não faz parte do contrato REST documentado.

---

## Regras obrigatórias de manutenção

> **Sempre que mexer em qualquer endpoint, ajuste a documentação na mesma tarefa.** Não deixe para depois.

Ao **criar, alterar ou remover** um endpoint:

1. **Interface de doc** (`doc/*ControllerDoc.java`) — crie/edite/remova o método correspondente
   com toda a documentação (ver checklist abaixo). A assinatura do método na interface deve
   bater **exatamente** com a do controller (mesmo nome, tipo de retorno e tipos de parâmetro),
   senão o `implements` quebra a compilação.
2. **`backend/endpoints.md`** — atualize a tabela de rotas (método, path, auth, descrição) e
   os exemplos de payload.
3. **`backend/swagger.md`** (este arquivo) — só se mudar o padrão/estrutura (novo controller,
   nova interface, mudança de convenção).
4. **`backend/progress.md`** — se o endpoint representa funcionalidade nova ou removida.

Se a mudança envolveu novo controller, adicione a interface na tabela de mapeamento acima.

---

## Checklist de documentação por endpoint

Cada método na interface deve ter:

- [ ] `@Operation(summary = ..., description = ...)` — `summary` curto; `description` rica,
      com regras de negócio, permissões por role e comportamentos especiais (usar text block `"""`).
- [ ] `@ApiResponse` para **cada** código de status relevante (200/201/204/400/401/403/404/409…),
      com `description` clara.
- [ ] Exemplos de **response** via `@Content` + `@Schema(implementation = ...)` + `@ExampleObject`
      com JSON realista.
- [ ] Para endpoints com corpo: `@io.swagger.v3.oas.annotations.parameters.RequestBody`
      (a anotação de **documentação**, não a de binding) com `@ExampleObject`. Use **múltiplos**
      `@ExampleObject` quando houver variações relevantes (ex.: criar MANAGER vs PROFESSIONAL).
- [ ] `@Parameter(description = ..., example = ...)` em path/query params.
- [ ] `@Parameter(hidden = true)` em parâmetros que não fazem parte do contrato público
      (`UserDetails principal`, `HttpServletRequest`).

### Cuidado com as duas anotações `RequestBody`

São coisas diferentes — não confundir:

- `org.springframework.web.bind.annotation.RequestBody` → **binding** do corpo. Fica **no controller**.
- `io.swagger.v3.oas.annotations.parameters.RequestBody` → **documentação** do corpo. Fica **na interface**.

---

## Esqueleto de uma interface de doc

```java
package com.scheduling.api.doc;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;

@Tag(name = "Exemplo", description = """
        Descrição rica do módulo: conceitos, papéis envolvidos, regras gerais.
        """)
public interface ExemploControllerDoc {

    @Operation(
            summary = "Ação curta",
            description = """
                    Explicação detalhada: o que faz, permissões, efeitos colaterais,
                    transições de estado.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AlgumRequest.class),
                            examples = @ExampleObject(value = """
                                    { "campo": "valor" }
                                    """))
            ),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Sucesso",
                            content = @Content(schema = @Schema(implementation = AlgumResponse.class))),
                    @ApiResponse(responseCode = "403", description = "Sem permissão")
            }
    )
    ResponseEntity<AlgumResponse> acao(
            AlgumRequest req,
            @Parameter(hidden = true) UserDetails principal);
}
```

E no controller:

```java
@RestController
@RequestMapping("/api/v1/exemplo")
@RequiredArgsConstructor
public class ExemploController implements ExemploControllerDoc {

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AlgumResponse> acao(
            @RequestBody @Valid AlgumRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        // ...
    }
}
```

---

## Convenções adotadas

- Textos em **português**, alinhados ao domínio (clínica, profissional, cliente).
- `description` usa **text blocks** (`"""`) para listas e parágrafos legíveis no Swagger UI.
- Documentar sempre as **permissões por role** (`ADMIN`, `MANAGER`, `PROFESSIONAL`, `CLIENT`).
- Exemplos de data/hora no padrão ISO-8601 sem timezone (`yyyy-MM-dd'T'HH:mm:ss`).
- Respostas de erro seguem o formato de `exception/ErrorResponse` (status, error, message, details).

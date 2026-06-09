package com.scheduling.api.doc;

import com.scheduling.api.appointment.dto.AppointmentResponse;
import com.scheduling.api.appointment.dto.CalendarDayResponse;
import com.scheduling.api.appointment.dto.CreateAppointmentRequest;
import com.scheduling.api.appointment.dto.PublicAppointmentRequest;
import com.scheduling.api.appointment.dto.RescheduleRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.List;

@Tag(
        name = "Agendamentos",
        description = """
                Criação, consulta e ciclo de vida dos agendamentos.

                **Status (enum AppointmentStatus):**
                `PENDING` → `CONFIRMED` → `COMPLETED` | `CANCELLED` | `NO_SHOW`

                - Agendamentos criados por **CLIENT** entram como `PENDING` (precisam de confirmação manual).
                - Agendamentos criados por **ADMIN/MANAGER** já entram como `CONFIRMED`.
                - **PROFESSIONAL** não cria/confirma/cancela — apenas visualiza a própria agenda.
                - Remarcar (`reschedule`) sempre devolve o agendamento ao status `PENDING`.
                - Agendamentos `COMPLETED` não podem ser cancelados.

                **Filtro por profissional:** os endpoints de empresa aceitam `professionalId` opcional.
                Quem está logado como `PROFESSIONAL` sempre recebe apenas os próprios agendamentos,
                independentemente do parâmetro.

                Datas seguem o padrão ISO-8601 sem timezone (`yyyy-MM-dd'T'HH:mm:ss`).
                """
)
public interface AppointmentControllerDoc {

    @Operation(
            summary = "Criar agendamento (autenticado)",
            description = """
                    Cria um agendamento. O status inicial depende de quem cria:
                    - **CLIENT** → `PENDING`
                    - **ADMIN/MANAGER** → `CONFIRMED`

                    `clientId` é opcional: se omitido, usa o próprio usuário logado (caso CLIENT).
                    ADMIN/MANAGER informam o `clientId` do cliente atendido.

                    O servidor valida conflito de horário para o profissional antes de salvar.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = CreateAppointmentRequest.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "companyId": 1,
                                      "professionalId": 8,
                                      "clientId": 12,
                                      "startAt": "2026-06-10T09:00:00",
                                      "endAt": "2026-06-10T10:00:00",
                                      "notes": "Primeira sessão de avaliação"
                                    }
                                    """))
            ),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Agendamento criado",
                            content = @Content(schema = @Schema(implementation = AppointmentResponse.class),
                                    examples = @ExampleObject(value = """
                                            {
                                              "id": 101,
                                              "companyId": 1,
                                              "companyName": "Clínica Saúde Plena",
                                              "clientId": 12,
                                              "clientName": "Maria Oliveira",
                                              "professionalId": 8,
                                              "professionalName": "Dr. Rafael Costa",
                                              "startAt": "2026-06-10T09:00:00",
                                              "endAt": "2026-06-10T10:00:00",
                                              "status": "CONFIRMED",
                                              "notes": "Primeira sessão de avaliação",
                                              "createdAt": "2026-06-01T14:20:00"
                                            }
                                            """))),
                    @ApiResponse(responseCode = "400", description = "Horário indisponível ou dados inválidos"),
                    @ApiResponse(responseCode = "403", description = "PROFESSIONAL não pode criar agendamentos")
            }
    )
    ResponseEntity<AppointmentResponse> create(
            CreateAppointmentRequest req,
            @Parameter(hidden = true) UserDetails principal);

    @Operation(
            summary = "Criar agendamento público (sem login)",
            description = """
                    Cria um agendamento a partir da página pública, **sem autenticação**.
                    Sempre entra como `PENDING`.

                    Se o e-mail informado ainda não existir, uma conta `CLIENT` é criada
                    automaticamente com senha aleatória. Só funciona se a empresa tiver
                    `allowClientBooking = true`.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = PublicAppointmentRequest.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "companyId": 1,
                                      "professionalId": 8,
                                      "startAt": "2026-06-12T15:00:00",
                                      "endAt": "2026-06-12T16:00:00",
                                      "clientName": "João da Silva",
                                      "clientEmail": "joao.silva@email.com",
                                      "clientPhone": "(48) 99999-2222",
                                      "notes": "Indicação de um amigo"
                                    }
                                    """))
            ),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Solicitação registrada (PENDING)",
                            content = @Content(schema = @Schema(implementation = AppointmentResponse.class))),
                    @ApiResponse(responseCode = "400",
                            description = "Empresa não aceita agendamento público ou horário indisponível")
            }
    )
    ResponseEntity<AppointmentResponse> createPublic(PublicAppointmentRequest req);

    @Operation(
            summary = "Meus agendamentos (paginado)",
            description = """
                    Lista os agendamentos do usuário logado (como cliente), ordenados por data
                    decrescente. Suporta paginação via `page`, `size` e `sort`.
                    """,
            responses = @ApiResponse(responseCode = "200", description = "Página de agendamentos do usuário")
    )
    ResponseEntity<Page<AppointmentResponse>> myAppointments(
            @Parameter(hidden = true) UserDetails principal,
            @Parameter(description = "Paginação (page, size, sort)") Pageable pageable);

    @Operation(
            summary = "Detalhar agendamento",
            description = "Retorna os dados completos de um agendamento pelo ID.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Agendamento encontrado",
                            content = @Content(schema = @Schema(implementation = AppointmentResponse.class))),
                    @ApiResponse(responseCode = "404", description = "Agendamento não encontrado")
            }
    )
    ResponseEntity<AppointmentResponse> findById(
            @Parameter(description = "ID do agendamento", example = "101") Long id);

    @Operation(
            summary = "Agenda da empresa por período (paginado)",
            description = """
                    Lista os agendamentos de uma empresa dentro de um intervalo de datas.
                    Restrito a `ADMIN`, `MANAGER` e `PROFESSIONAL`.

                    - `professionalId` (opcional) filtra por um profissional específico.
                    - Usuários `PROFESSIONAL` recebem **apenas os próprios** agendamentos,
                      ignorando o parâmetro.
                    """,
            responses = {
                    @ApiResponse(responseCode = "200", description = "Página de agendamentos"),
                    @ApiResponse(responseCode = "403", description = "Sem acesso a esta empresa")
            }
    )
    ResponseEntity<Page<AppointmentResponse>> byCompany(
            @Parameter(description = "ID da empresa", example = "1") Long companyId,
            @Parameter(description = "Início do intervalo (ISO)", example = "2026-06-01T00:00:00") LocalDateTime start,
            @Parameter(description = "Fim do intervalo (ISO)", example = "2026-06-30T23:59:59") LocalDateTime end,
            @Parameter(description = "Filtrar por profissional (opcional)", example = "8") Long professionalId,
            @Parameter(description = "Paginação (page, size, sort)") Pageable pageable,
            @Parameter(hidden = true) UserDetails principal);

    @Operation(
            summary = "Fila de pendentes da empresa",
            description = """
                    Retorna todos os agendamentos com status `PENDING` da empresa, aguardando
                    confirmação. Restrito a `ADMIN`, `MANAGER` e `PROFESSIONAL`.

                    Aceita `professionalId` opcional; `PROFESSIONAL` recebe apenas os próprios.
                    """,
            responses = @ApiResponse(responseCode = "200", description = "Lista de pendentes",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = AppointmentResponse.class))))
    )
    ResponseEntity<List<AppointmentResponse>> pending(
            @Parameter(description = "ID da empresa", example = "1") Long companyId,
            @Parameter(description = "Filtrar por profissional (opcional)", example = "8") Long professionalId,
            @Parameter(hidden = true) UserDetails principal);

    @Operation(
            summary = "Resumo mensal do calendário",
            description = """
                    Retorna, para cada dia do mês informado, a contagem de agendamentos e um
                    `status` agregado de disponibilidade: `available`, `partial` ou `full`.
                    **Público** — usado pelo calendário visual.

                    O parâmetro `month` segue o formato `YYYY-MM`.
                    """,
            responses = @ApiResponse(responseCode = "200", description = "Resumo por dia",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = CalendarDayResponse.class)),
                            examples = @ExampleObject(value = """
                                    [
                                      { "date": "2026-06-10", "status": "partial", "totalAppointments": 3 },
                                      { "date": "2026-06-11", "status": "full", "totalAppointments": 8 },
                                      { "date": "2026-06-12", "status": "available", "totalAppointments": 0 }
                                    ]
                                    """)))
    )
    ResponseEntity<List<CalendarDayResponse>> calendar(
            @Parameter(description = "ID da empresa", example = "1") Long companyId,
            @Parameter(description = "Mês no formato YYYY-MM", example = "2026-06") String month);

    @Operation(
            summary = "Confirmar agendamento",
            description = """
                    Confirma um agendamento `PENDING`, mudando seu status para `CONFIRMED` e
                    notificando o cliente. Restrito a `ADMIN` ou `MANAGER`.
                    Só funciona se o agendamento estiver atualmente `PENDING`.
                    """,
            responses = {
                    @ApiResponse(responseCode = "200", description = "Agendamento confirmado",
                            content = @Content(schema = @Schema(implementation = AppointmentResponse.class))),
                    @ApiResponse(responseCode = "400", description = "Agendamento não está PENDING"),
                    @ApiResponse(responseCode = "403", description = "Sem permissão")
            }
    )
    ResponseEntity<AppointmentResponse> confirm(
            @Parameter(description = "ID do agendamento", example = "101") Long id,
            @Parameter(hidden = true) UserDetails principal);

    @Operation(
            summary = "Concluir agendamento",
            description = """
                    Marca um agendamento `CONFIRMED` como `COMPLETED`. Restrito a `ADMIN` ou
                    `MANAGER`. Só funciona se o agendamento estiver `CONFIRMED`.
                    """,
            responses = {
                    @ApiResponse(responseCode = "200", description = "Agendamento concluído",
                            content = @Content(schema = @Schema(implementation = AppointmentResponse.class))),
                    @ApiResponse(responseCode = "400", description = "Agendamento não está CONFIRMED"),
                    @ApiResponse(responseCode = "403", description = "Sem permissão")
            }
    )
    ResponseEntity<AppointmentResponse> complete(
            @Parameter(description = "ID do agendamento", example = "101") Long id,
            @Parameter(hidden = true) UserDetails principal);

    @Operation(
            summary = "Cancelar agendamento",
            description = """
                    Cancela um agendamento, definindo o status `CANCELLED` e registrando o motivo.

                    **Permissões:**
                    - `CLIENT` só cancela os próprios agendamentos.
                    - `MANAGER` cancela agendamentos da própria empresa.
                    - `ADMIN` cancela qualquer um.
                    - `PROFESSIONAL` **não pode** cancelar.

                    Agendamentos já `COMPLETED` não podem ser cancelados. Quando cancelado por
                    ADMIN/MANAGER, o cliente é notificado.
                    """,
            responses = {
                    @ApiResponse(responseCode = "200", description = "Agendamento cancelado",
                            content = @Content(schema = @Schema(implementation = AppointmentResponse.class))),
                    @ApiResponse(responseCode = "400", description = "Agendamento já concluído"),
                    @ApiResponse(responseCode = "403", description = "Sem permissão para cancelar este agendamento")
            }
    )
    ResponseEntity<AppointmentResponse> cancel(
            @Parameter(description = "ID do agendamento", example = "101") Long id,
            @Parameter(description = "Motivo do cancelamento (opcional)", example = "Cliente solicitou remarcação") String reason,
            @Parameter(hidden = true) UserDetails principal);

    @Operation(
            summary = "Remarcar agendamento",
            description = """
                    Altera a data/hora de um agendamento. Após remarcar, o status volta para
                    `PENDING` (exige nova confirmação). O servidor valida conflito de horário
                    no novo período.

                    **Permissões:**
                    - `CLIENT` só remarca os próprios.
                    - `MANAGER` remarca os da própria empresa.
                    - `PROFESSIONAL` **não pode** remarcar.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = RescheduleRequest.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "newStartAt": "2026-06-15T11:00:00",
                                      "newEndAt": "2026-06-15T12:00:00"
                                    }
                                    """))
            ),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Agendamento remarcado (volta a PENDING)",
                            content = @Content(schema = @Schema(implementation = AppointmentResponse.class))),
                    @ApiResponse(responseCode = "400", description = "Novo horário indisponível"),
                    @ApiResponse(responseCode = "403", description = "Sem permissão")
            }
    )
    ResponseEntity<AppointmentResponse> reschedule(
            @Parameter(description = "ID do agendamento", example = "101") Long id,
            RescheduleRequest req,
            @Parameter(hidden = true) UserDetails principal);
}

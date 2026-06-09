package com.scheduling.api.doc;

import com.scheduling.api.scheduling.dto.AvailableSlotResponse;
import com.scheduling.api.scheduling.dto.ScheduleBlockRequest;
import com.scheduling.api.scheduling.dto.ScheduleBlockResponse;
import com.scheduling.api.scheduling.dto.ScheduleRequest;
import com.scheduling.api.scheduling.dto.ScheduleResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.util.List;

@Tag(
        name = "Horários e disponibilidade",
        description = """
                Grade de horários dos profissionais, bloqueios pontuais e cálculo de
                disponibilidade.

                **Grade (schedule):** define, por dia da semana, o expediente de um profissional
                (início, fim, intervalo de almoço opcional e duração de cada slot). Os slots
                disponíveis são derivados dessa grade descontando agendamentos e bloqueios.

                **Bloqueio (block):** indisponibiliza uma faixa de data/hora específica
                (feriado, reunião, ausência). Pode ser:
                - **global** (`professionalId = null`) → vale para todos os profissionais da empresa;
                - **individual** (`professionalId` informado) → vale só para aquele profissional.

                **Disponibilidade:** `GET /available` é público e retorna todos os slots do dia
                marcando cada um como `available: true/false`.
                """
)
public interface ScheduleControllerDoc {

    @Operation(
            summary = "Slots disponíveis de um dia",
            description = """
                    Retorna todos os slots de atendimento de uma empresa em uma data, cada um
                    marcado como disponível ou não. **Público** — base para a tela de seleção de
                    horário no agendamento.

                    Os slots são calculados a partir da grade dos profissionais, descontando
                    agendamentos existentes e bloqueios (globais e individuais).
                    """,
            responses = @ApiResponse(responseCode = "200", description = "Lista de slots do dia",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = AvailableSlotResponse.class)),
                            examples = @ExampleObject(value = """
                                    [
                                      {
                                        "startAt": "2026-06-10T09:00:00",
                                        "endAt": "2026-06-10T10:00:00",
                                        "professionalId": 8,
                                        "professionalName": "Dr. Rafael Costa",
                                        "available": true
                                      },
                                      {
                                        "startAt": "2026-06-10T10:00:00",
                                        "endAt": "2026-06-10T11:00:00",
                                        "professionalId": 8,
                                        "professionalName": "Dr. Rafael Costa",
                                        "available": false
                                      }
                                    ]
                                    """)))
    )
    ResponseEntity<List<AvailableSlotResponse>> getAvaliable(
            @Parameter(description = "ID da empresa", example = "1") Long companyId,
            @Parameter(description = "Data no formato YYYY-MM-DD", example = "2026-06-10") LocalDate date);

    @Operation(
            summary = "Grade de horários da empresa",
            description = """
                    Lista todas as grades de horário ativas da empresa, com o profissional
                    de cada uma. Usado na tela de configuração de horários.
                    """,
            responses = @ApiResponse(responseCode = "200", description = "Grades ativas",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ScheduleResponse.class)),
                            examples = @ExampleObject(value = """
                                    [
                                      {
                                        "id": 20,
                                        "dayOfWeek": "MONDAY",
                                        "startTime": "08:00:00",
                                        "endTime": "18:00:00",
                                        "lunchStart": "12:00:00",
                                        "lunchEnd": "13:00:00",
                                        "slotDurationMinutes": 60,
                                        "active": true,
                                        "professional": { "id": 8, "name": "Dr. Rafael Costa" }
                                      }
                                    ]
                                    """)))
    )
    ResponseEntity<List<ScheduleResponse>> getByCompany(
            @Parameter(description = "ID da empresa", example = "1") Long companyId);

    @Operation(
            summary = "Criar grade de horários",
            description = """
                    Cria uma grade de horários para um profissional em um dia da semana.
                    Restrito a `ADMIN` ou `MANAGER` da própria empresa.

                    - `dayOfWeek` aceita `MONDAY`..`SUNDAY`.
                    - `startTime`/`endTime`/`lunchStart`/`lunchEnd` no formato `HH:mm` ou `HH:mm:ss`.
                    - `slotDurationMinutes` mínimo de 15 (ex.: 15/30/45/60/90/120).
                    - Intervalo de almoço (`lunchStart`/`lunchEnd`) é opcional.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ScheduleRequest.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "companyId": 1,
                                      "professionalId": 8,
                                      "dayOfWeek": "MONDAY",
                                      "startTime": "08:00",
                                      "endTime": "18:00",
                                      "lunchStart": "12:00",
                                      "lunchEnd": "13:00",
                                      "slotDurationMinutes": 60
                                    }
                                    """))
            ),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Grade criada",
                            content = @Content(schema = @Schema(implementation = ScheduleResponse.class))),
                    @ApiResponse(responseCode = "403", description = "Sem permissão sobre esta empresa")
            }
    )
    ResponseEntity<ScheduleResponse> create(
            ScheduleRequest req,
            @Parameter(hidden = true) UserDetails principal);

    @Operation(
            summary = "Editar grade de horários",
            description = """
                    Atualiza os horários de uma grade existente (início, fim, almoço, duração do
                    slot). Restrito a `ADMIN` ou `MANAGER` da própria empresa.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ScheduleRequest.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "companyId": 1,
                                      "professionalId": 8,
                                      "dayOfWeek": "MONDAY",
                                      "startTime": "09:00",
                                      "endTime": "17:00",
                                      "slotDurationMinutes": 30
                                    }
                                    """))
            ),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Grade atualizada",
                            content = @Content(schema = @Schema(implementation = ScheduleResponse.class))),
                    @ApiResponse(responseCode = "403", description = "Sem permissão"),
                    @ApiResponse(responseCode = "404", description = "Grade não encontrada")
            }
    )
    ResponseEntity<ScheduleResponse> update(
            @Parameter(description = "ID da grade", example = "20") Long id,
            ScheduleRequest req,
            @Parameter(hidden = true) UserDetails principal);

    @Operation(
            summary = "Remover grade de horários",
            description = """
                    Remove (desativa) uma grade de horários. Restrito a `ADMIN` ou `MANAGER` da
                    própria empresa.
                    """,
            responses = {
                    @ApiResponse(responseCode = "204", description = "Grade removida"),
                    @ApiResponse(responseCode = "403", description = "Sem permissão"),
                    @ApiResponse(responseCode = "404", description = "Grade não encontrada")
            }
    )
    ResponseEntity<Void> delete(
            @Parameter(description = "ID da grade", example = "20") Long id,
            @Parameter(hidden = true) UserDetails principal);

    @Operation(
            summary = "Criar bloqueio de horário",
            description = """
                    Bloqueia uma faixa de data/hora. Restrito a `ADMIN` ou `MANAGER`.

                    - `professionalId = null` → bloqueio **global** (todos os profissionais).
                    - `professionalId` informado → bloqueio só daquele profissional.

                    O bloqueio remove os slots correspondentes do cálculo de disponibilidade.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ScheduleBlockRequest.class),
                            examples = {
                                    @ExampleObject(name = "Bloqueio global (feriado)", value = """
                                            {
                                              "companyId": 1,
                                              "startAt": "2026-06-19T00:00:00",
                                              "endAt": "2026-06-19T23:59:59",
                                              "reason": "Feriado - Corpus Christi"
                                            }
                                            """),
                                    @ExampleObject(name = "Bloqueio de um profissional", value = """
                                            {
                                              "companyId": 1,
                                              "professionalId": 8,
                                              "startAt": "2026-06-10T14:00:00",
                                              "endAt": "2026-06-10T16:00:00",
                                              "reason": "Consulta médica pessoal"
                                            }
                                            """)
                            })
            ),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Bloqueio criado",
                            content = @Content(schema = @Schema(implementation = ScheduleBlockResponse.class))),
                    @ApiResponse(responseCode = "403", description = "Sem permissão")
            }
    )
    ResponseEntity<ScheduleBlockResponse> createBlock(
            ScheduleBlockRequest req,
            @Parameter(hidden = true) UserDetails principal);

    @Operation(
            summary = "Listar bloqueios ativos",
            description = """
                    Lista os bloqueios de uma empresa. Acessível a `ADMIN`, `MANAGER` e
                    `PROFESSIONAL`.

                    Quando `professionalId` é informado, retorna os bloqueios daquele profissional
                    **mais** os bloqueios globais (que valem para todos).
                    """,
            responses = @ApiResponse(responseCode = "200", description = "Lista de bloqueios",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ScheduleBlockResponse.class)),
                            examples = @ExampleObject(value = """
                                    [
                                      {
                                        "id": 30,
                                        "startAt": "2026-06-19T00:00:00",
                                        "endAt": "2026-06-19T23:59:59",
                                        "reason": "Feriado - Corpus Christi",
                                        "professionalId": null,
                                        "professionalName": null
                                      }
                                    ]
                                    """)))
    )
    ResponseEntity<List<ScheduleBlockResponse>> listBlocks(
            @Parameter(description = "ID da empresa", example = "1") Long companyId,
            @Parameter(description = "Filtrar por profissional (opcional)", example = "8") Long professionalId,
            @Parameter(hidden = true) UserDetails principal);

    @Operation(
            summary = "Remover bloqueio",
            description = "Remove um bloqueio de horário pelo ID. Restrito a `ADMIN` ou `MANAGER`.",
            responses = {
                    @ApiResponse(responseCode = "204", description = "Bloqueio removido"),
                    @ApiResponse(responseCode = "403", description = "Sem permissão"),
                    @ApiResponse(responseCode = "404", description = "Bloqueio não encontrado")
            }
    )
    ResponseEntity<Void> deleteBlock(
            @Parameter(description = "ID do bloqueio", example = "30") Long id,
            @Parameter(hidden = true) UserDetails principal);
}

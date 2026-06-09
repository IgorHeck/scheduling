package com.scheduling.api.doc;

import com.scheduling.api.company.dto.CompanyRequest;
import com.scheduling.api.company.dto.CompanyResponse;
import com.scheduling.api.company.dto.CompanySettingsRequest;
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
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Tag(
        name = "Empresas",
        description = """
                Cadastro e configuração de empresas (clínicas/estabelecimentos).

                **Conceitos:**
                - Uma empresa é criada por um `ADMIN`, que é automaticamente vinculado a ela.
                - `allowClientBooking` controla se a página pública de agendamento está ativa.
                - `active` permite suspender temporariamente toda a operação da empresa.
                - A logo é servida em `/uploads/logos/**` (acesso público).

                **Endpoints públicos:** listagem (`GET /companies`) e detalhe (`GET /companies/{id}`)
                — necessários para a página pública de agendamento. Os demais exigem autenticação.
                """
)
public interface CompanyControllerDoc {

    @Operation(
            summary = "Criar empresa (ADMIN)",
            description = """
                    Cria uma nova empresa. Restrito a `ADMIN`. O criador é automaticamente
                    vinculado à empresa recém-criada (passa a ser membro dela).

                    Após criar, o ADMIN normalmente é redirecionado ao painel da nova empresa.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = CompanyRequest.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "name": "Clínica Saúde Plena",
                                      "description": "Clínica de fisioterapia e bem-estar",
                                      "phone": "(48) 3333-4444",
                                      "address": "Rua das Flores, 100 - Centro, Florianópolis/SC"
                                    }
                                    """))
            ),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Empresa criada",
                            content = @Content(schema = @Schema(implementation = CompanyResponse.class),
                                    examples = @ExampleObject(value = """
                                            {
                                              "id": 1,
                                              "name": "Clínica Saúde Plena",
                                              "description": "Clínica de fisioterapia e bem-estar",
                                              "address": "Rua das Flores, 100 - Centro, Florianópolis/SC",
                                              "phone": "(48) 3333-4444",
                                              "logoUrl": null,
                                              "allowClientBooking": true,
                                              "active": true,
                                              "createdAt": "2026-02-01T10:00:00"
                                            }
                                            """))),
                    @ApiResponse(responseCode = "400", description = "Nome obrigatório ausente"),
                    @ApiResponse(responseCode = "403", description = "Apenas ADMIN")
            }
    )
    ResponseEntity<CompanyResponse> create(
            CompanyRequest req,
            @Parameter(hidden = true) UserDetails principal);

    @Operation(
            summary = "Listar empresas ativas",
            description = """
                    Lista todas as empresas ativas. **Público** — usado pela tela de seleção de
                    clínica no fluxo de agendamento do cliente.
                    """,
            responses = @ApiResponse(responseCode = "200", description = "Lista de empresas",
                    content = @Content(mediaType = "application/json",
                            array = @ArraySchema(schema = @Schema(implementation = CompanyResponse.class))))
    )
    ResponseEntity<List<CompanyResponse>> findAll();

    @Operation(
            summary = "Detalhar empresa",
            description = "Retorna os dados completos de uma empresa pelo ID. **Público**.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Empresa encontrada",
                            content = @Content(schema = @Schema(implementation = CompanyResponse.class))),
                    @ApiResponse(responseCode = "404", description = "Empresa não encontrada")
            }
    )
    ResponseEntity<CompanyResponse> findById(
            @Parameter(description = "ID da empresa", example = "1") Long id);

    @Operation(
            summary = "Atualizar dados da empresa",
            description = """
                    Atualiza nome, descrição, telefone e endereço da empresa.
                    Restrito a `ADMIN` ou `MANAGER` da própria empresa.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = CompanyRequest.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "name": "Clínica Saúde Plena",
                                      "description": "Fisioterapia, pilates e RPG",
                                      "phone": "(48) 3333-5555",
                                      "address": "Av. Beira-Mar, 2000 - Florianópolis/SC"
                                    }
                                    """))
            ),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Empresa atualizada",
                            content = @Content(schema = @Schema(implementation = CompanyResponse.class))),
                    @ApiResponse(responseCode = "403", description = "Sem permissão sobre esta empresa"),
                    @ApiResponse(responseCode = "404", description = "Empresa não encontrada")
            }
    )
    ResponseEntity<CompanyResponse> update(
            @Parameter(description = "ID da empresa", example = "1") Long id,
            CompanyRequest req);

    @Operation(
            summary = "Alterar configurações da empresa",
            description = """
                    Liga/desliga o agendamento público (`allowClientBooking`) e ativa/suspende a
                    empresa (`active`). Restrito a `ADMIN` ou `MANAGER`. Envie apenas os campos
                    que deseja alterar.

                    - `allowClientBooking = false` → a página pública de agendamento fica indisponível.
                    - `active = false` → suspende toda a operação da empresa.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = CompanySettingsRequest.class),
                            examples = {
                                    @ExampleObject(name = "Desativar agendamento público", value = """
                                            { "allowClientBooking": false }
                                            """),
                                    @ExampleObject(name = "Suspender empresa", value = """
                                            { "active": false }
                                            """),
                                    @ExampleObject(name = "Reativar tudo", value = """
                                            { "allowClientBooking": true, "active": true }
                                            """)
                            })
            ),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Configurações atualizadas",
                            content = @Content(schema = @Schema(implementation = CompanyResponse.class))),
                    @ApiResponse(responseCode = "403", description = "Sem permissão"),
                    @ApiResponse(responseCode = "404", description = "Empresa não encontrada")
            }
    )
    ResponseEntity<CompanyResponse> updateSettings(
            @Parameter(description = "ID da empresa", example = "1") Long id,
            CompanySettingsRequest req);

    @Operation(
            summary = "Upload da logo da empresa",
            description = """
                    Envia a imagem da logo via `multipart/form-data` (campo `file`).
                    Restrito a `ADMIN` ou `MANAGER`.

                    **Restrições:**
                    - Formatos aceitos: JPEG, PNG, WebP.
                    - Tamanho máximo: 5 MB.

                    A imagem é salva em disco e a URL pública é retornada no campo `logoUrl`
                    da empresa (servida em `/uploads/logos/**`).
                    """,
            responses = {
                    @ApiResponse(responseCode = "200", description = "Logo enviada; empresa atualizada",
                            content = @Content(schema = @Schema(implementation = CompanyResponse.class))),
                    @ApiResponse(responseCode = "400", description = "Arquivo inválido (formato ou tamanho)"),
                    @ApiResponse(responseCode = "403", description = "Sem permissão"),
                    @ApiResponse(responseCode = "404", description = "Empresa não encontrada")
            }
    )
    ResponseEntity<CompanyResponse> uploadLogo(
            @Parameter(description = "ID da empresa", example = "1") Long id,
            @Parameter(description = "Arquivo de imagem (JPEG/PNG/WebP, máx 5 MB)") MultipartFile file);
}

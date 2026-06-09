package com.scheduling.api.doc;

import com.scheduling.api.company.dto.CompanyResponse;
import com.scheduling.api.user.dto.AssignCompanyRequest;
import com.scheduling.api.user.dto.CreateManagerRequest;
import com.scheduling.api.user.dto.UpdateUserRequest;
import com.scheduling.api.user.dto.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;

@Tag(
        name = "Usuários",
        description = """
                Gestão de usuários da plataforma.

                **Papéis (roles):**
                - `ADMIN` — dono da plataforma; acesso total, cria empresas e managers.
                - `MANAGER` — gestor/recepcionista de uma empresa; gerencia agendamentos e profissionais.
                - `PROFESSIONAL` — profissional de atendimento; vê apenas a própria agenda.
                - `CLIENT` — cliente final; solicita agendamentos.

                **Flag `professional`:** um MANAGER pode também ser profissional de atendimento
                (`professional = true`). Nesse caso ele aparece como opção nas grades de horário
                e agendamentos, além de manter os poderes de gestor.

                A maioria dos endpoints exige `Authorization: Bearer <accessToken>`.
                """
)
public interface UserControllerDoc {

    @Operation(
            summary = "Perfil do usuário logado",
            description = """
                    Retorna os dados do usuário autenticado, extraídos a partir do token JWT.
                    Útil logo após o login para descobrir o papel (role), a empresa vinculada e
                    decidir o redirecionamento na interface.
                    """,
            responses = {
                    @ApiResponse(responseCode = "200", description = "Perfil retornado com sucesso",
                            content = @Content(mediaType = "application/json",
                                    schema = @Schema(implementation = UserResponse.class),
                                    examples = @ExampleObject(value = """
                                            {
                                              "id": 5,
                                              "name": "Carla Mendes",
                                              "email": "carla@clinica.com",
                                              "phone": "(48) 98888-0000",
                                              "role": "MANAGER",
                                              "professional": true,
                                              "active": true,
                                              "companyId": 1,
                                              "companyName": "Clínica Saúde Plena",
                                              "createdAt": "2026-01-15T09:30:00"
                                            }
                                            """))),
                    @ApiResponse(responseCode = "401", description = "Token ausente ou inválido")
            }
    )
    ResponseEntity<UserResponse> me(@Parameter(hidden = true) UserDetails principal);

    @Operation(
            summary = "Empresas do usuário logado",
            description = """
                    Lista todas as empresas às quais o usuário autenticado está vinculado,
                    ordenadas por nome. Usado para o seletor de empresas no painel (um ADMIN ou
                    MANAGER pode pertencer a mais de uma empresa).
                    """,
            responses = @ApiResponse(responseCode = "200", description = "Lista de empresas vinculadas",
                    content = @Content(mediaType = "application/json",
                            array = @io.swagger.v3.oas.annotations.media.ArraySchema(
                                    schema = @Schema(implementation = CompanyResponse.class))))
    )
    ResponseEntity<List<CompanyResponse>> myCompanies(@Parameter(hidden = true) UserDetails principal);

    @Operation(
            summary = "Atualizar o próprio perfil",
            description = """
                    Permite que o usuário autenticado atualize seus próprios dados básicos
                    (nome e telefone). O campo `professional` é **ignorado** neste endpoint —
                    a flag de profissional só pode ser alterada por um ADMIN via `PUT /users/{id}`.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Campos a atualizar (envie apenas os que deseja alterar)",
                    required = true,
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = UpdateUserRequest.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "name": "Carla Mendes Souza",
                                      "phone": "(48) 98888-1111"
                                    }
                                    """))
            ),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Perfil atualizado",
                            content = @Content(schema = @Schema(implementation = UserResponse.class))),
                    @ApiResponse(responseCode = "401", description = "Não autenticado")
            }
    )
    ResponseEntity<UserResponse> updateMe(
            @Parameter(hidden = true) UserDetails principal,
            UpdateUserRequest req);

    @Operation(
            summary = "Criar colaborador (MANAGER ou PROFESSIONAL)",
            description = """
                    Cria um novo colaborador vinculado a uma empresa.

                    **Permissões:**
                    - `ADMIN` pode criar tanto **MANAGER** quanto **PROFESSIONAL**.
                    - `MANAGER` pode criar **apenas PROFESSIONAL**.

                    **Campos:**
                    - `role` — `"MANAGER"` (padrão) ou `"PROFESSIONAL"`.
                    - `professional` — quando `role = MANAGER`, indica que ele também atende clientes.
                      Quando `role = PROFESSIONAL`, é forçado para `true` automaticamente.
                    - `companyId` — empresa à qual o colaborador será vinculado.

                    A senha é definida no momento da criação (mínimo 6 caracteres).
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = CreateManagerRequest.class),
                            examples = {
                                    @ExampleObject(name = "Manager (recepcionista)", value = """
                                            {
                                              "name": "João Recepção",
                                              "email": "joao@clinica.com",
                                              "password": "senha123",
                                              "phone": "(48) 97777-0000",
                                              "companyId": 1,
                                              "role": "MANAGER",
                                              "professional": false
                                            }
                                            """),
                                    @ExampleObject(name = "Manager que também atende", value = """
                                            {
                                              "name": "Dra. Paula Lima",
                                              "email": "paula@clinica.com",
                                              "password": "senha123",
                                              "companyId": 1,
                                              "role": "MANAGER",
                                              "professional": true
                                            }
                                            """),
                                    @ExampleObject(name = "Profissional puro", value = """
                                            {
                                              "name": "Dr. Rafael Costa",
                                              "email": "rafael@clinica.com",
                                              "password": "senha123",
                                              "companyId": 1,
                                              "role": "PROFESSIONAL"
                                            }
                                            """)
                            })
            ),
            responses = {
                    @ApiResponse(responseCode = "201", description = "Colaborador criado",
                            content = @Content(schema = @Schema(implementation = UserResponse.class))),
                    @ApiResponse(responseCode = "400",
                            description = "Dados inválidos ou MANAGER tentando criar role não permitido"),
                    @ApiResponse(responseCode = "403", description = "Sem permissão para criar este tipo de usuário"),
                    @ApiResponse(responseCode = "409", description = "E-mail já cadastrado")
            }
    )
    ResponseEntity<UserResponse> createManager(
            CreateManagerRequest req,
            @Parameter(hidden = true) UserDetails principal);

    @Operation(
            summary = "Listar profissionais de uma empresa",
            description = """
                    Lista os profissionais de atendimento ativos de uma empresa — ou seja,
                    usuários com `role = PROFESSIONAL` **ou** com a flag `professional = true`.

                    Usado para popular seletores de profissional (grade de horários, criação de
                    agendamento, filtro da agenda).
                    """,
            responses = @ApiResponse(responseCode = "200", description = "Lista de profissionais",
                    content = @Content(mediaType = "application/json",
                            array = @io.swagger.v3.oas.annotations.media.ArraySchema(
                                    schema = @Schema(implementation = UserResponse.class))))
    )
    ResponseEntity<List<UserResponse>> findProfessionals(
            @Parameter(description = "ID da empresa", example = "1") Long companyId);

    @Operation(
            summary = "Listar usuários da empresa",
            description = """
                    Lista todos os usuários ligados a uma empresa: o staff vinculado
                    (ADMIN/MANAGER/PROFESSIONAL) somado aos clientes que já realizaram ao menos
                    um agendamento nessa empresa. Resultado ordenado por nome.

                    Restrito a `ADMIN` e `MANAGER`.
                    """,
            responses = @ApiResponse(responseCode = "200", description = "Lista de usuários",
                    content = @Content(mediaType = "application/json",
                            array = @io.swagger.v3.oas.annotations.media.ArraySchema(
                                    schema = @Schema(implementation = UserResponse.class))))
    )
    ResponseEntity<List<UserResponse>> findAll(
            @Parameter(description = "ID da empresa", example = "1") Long companyId);

    @Operation(
            summary = "Buscar usuário por ID",
            description = "Retorna os dados de um usuário específico pelo seu identificador.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Usuário encontrado",
                            content = @Content(schema = @Schema(implementation = UserResponse.class))),
                    @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
            }
    )
    ResponseEntity<UserResponse> findById(
            @Parameter(description = "ID do usuário", example = "5") Long id);

    @Operation(
            summary = "Atualizar usuário (ADMIN)",
            description = """
                    Atualiza os dados de um usuário qualquer. Restrito a `ADMIN`.

                    Diferente de `PUT /users/me`, aqui o ADMIN **pode** alterar a flag
                    `professional`, marcando ou desmarcando um MANAGER como profissional de
                    atendimento. Envie apenas os campos que deseja modificar.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = UpdateUserRequest.class),
                            examples = {
                                    @ExampleObject(name = "Marcar como profissional", value = """
                                            { "professional": true }
                                            """),
                                    @ExampleObject(name = "Atualizar contato", value = """
                                            {
                                              "name": "Novo Nome",
                                              "phone": "(48) 96666-0000"
                                            }
                                            """)
                            })
            ),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Usuário atualizado",
                            content = @Content(schema = @Schema(implementation = UserResponse.class))),
                    @ApiResponse(responseCode = "403", description = "Apenas ADMIN"),
                    @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
            }
    )
    ResponseEntity<UserResponse> updateUser(
            @Parameter(description = "ID do usuário", example = "5") Long id,
            UpdateUserRequest req);

    @Operation(
            summary = "Vincular/desvincular empresa (ADMIN)",
            description = """
                    Vincula um usuário a uma empresa ou o desvincula. Restrito a `ADMIN`.

                    - Para **vincular**, envie `companyId` com o ID da empresa.
                    - Para **desvincular**, envie `companyId: null`.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = AssignCompanyRequest.class),
                            examples = {
                                    @ExampleObject(name = "Vincular", value = "{ \"companyId\": 1 }"),
                                    @ExampleObject(name = "Desvincular", value = "{ \"companyId\": null }")
                            })
            ),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Vínculo atualizado",
                            content = @Content(schema = @Schema(implementation = UserResponse.class))),
                    @ApiResponse(responseCode = "403", description = "Apenas ADMIN"),
                    @ApiResponse(responseCode = "404", description = "Usuário ou empresa não encontrados")
            }
    )
    ResponseEntity<UserResponse> assignCompany(
            @Parameter(description = "ID do usuário", example = "5") Long id,
            AssignCompanyRequest req);

    @Operation(
            summary = "Remover usuário de uma empresa (ADMIN)",
            description = """
                    Remove o vínculo de um usuário com uma empresa específica **sem desativar a
                    conta** — o usuário continua existindo e pode estar ligado a outras empresas.
                    Restrito a `ADMIN`.
                    """,
            responses = {
                    @ApiResponse(responseCode = "204", description = "Vínculo removido"),
                    @ApiResponse(responseCode = "403", description = "Apenas ADMIN"),
                    @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
            }
    )
    ResponseEntity<Void> removeFromCompany(
            @Parameter(description = "ID do usuário", example = "5") Long id,
            @Parameter(description = "ID da empresa", example = "1") Long companyId);

    @Operation(
            summary = "Desativar usuário (ADMIN)",
            description = """
                    Desativa um usuário via **soft delete** (`active = false`). A conta não é
                    removida do banco — apenas marcada como inativa, impedindo login e novas ações.
                    Restrito a `ADMIN`.
                    """,
            responses = {
                    @ApiResponse(responseCode = "204", description = "Usuário desativado"),
                    @ApiResponse(responseCode = "403", description = "Apenas ADMIN"),
                    @ApiResponse(responseCode = "404", description = "Usuário não encontrado")
            }
    )
    ResponseEntity<Void> deactivate(
            @Parameter(description = "ID do usuário", example = "5") Long id);
}

package com.scheduling.api.doc;

import com.scheduling.api.auth.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;

@Tag(
        name = "Autenticação",
        description = """
                Endpoints de autenticação e gerenciamento de sessão.

                **Fluxo principal:**
                1. `POST /register` → cria conta com role CLIENT e retorna tokens
                2. `POST /login` → autentica e retorna `accessToken` (15 min) + `refreshToken` (7 dias)
                3. `POST /refresh` → troca um refresh token válido por novos tokens (o antigo é revogado)
                4. `POST /logout` → revoga todos os refresh tokens + adiciona o access token à blacklist

                **Recuperação de senha:**
                1. `POST /forgot-password` → envia link por e-mail (sempre retorna 204, não revela se o e-mail existe)
                2. `POST /reset-password` → redefine a senha usando o token recebido por e-mail

                Todos os endpoints deste grupo são **públicos** (não exigem `Authorization` header),
                exceto `/logout` que requer o `Bearer <accessToken>`.
                """
)
public interface AuthControllerDoc {

    @Operation(
            summary = "Registrar novo usuário",
            description = """
                    Cria uma nova conta com role **CLIENT**. Após o registro, tokens de acesso são
                    retornados imediatamente — não é necessário fazer login separado.

                    **Regras:**
                    - E-mail deve ser único; caso já cadastrado retorna 409.
                    - Senha mínima de 6 caracteres.
                    - Telefone é opcional.
                    - O campo `role` é fixado em `CLIENT` pelo servidor; qualquer valor enviado é ignorado.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    description = "Dados de cadastro do novo usuário",
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = RegisterRequest.class),
                            examples = @ExampleObject(
                                    name = "Cadastro completo",
                                    value = """
                                            {
                                              "name": "Maria Oliveira",
                                              "email": "maria.oliveira@email.com",
                                              "password": "senha123",
                                              "phone": "(48) 99999-1234"
                                            }
                                            """
                            )
                    )
            ),
            responses = {
                    @ApiResponse(
                            responseCode = "200",
                            description = "Usuário criado com sucesso. Tokens retornados.",
                            content = @Content(
                                    mediaType = "application/json",
                                    schema = @Schema(implementation = TokenResponse.class),
                                    examples = @ExampleObject(value = """
                                            {
                                              "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
                                              "refreshToken": "c3f4e2d1-...",
                                              "tokenType": "Bearer",
                                              "expiresIn": 900
                                            }
                                            """)
                            )
                    ),
                    @ApiResponse(
                            responseCode = "400",
                            description = "Dados inválidos (e-mail malformado, senha curta, campos obrigatórios ausentes)",
                            content = @Content(mediaType = "application/json",
                                    examples = @ExampleObject(value = """
                                            {
                                              "status": 400,
                                              "error": "Bad Request",
                                              "message": "Validation failed",
                                              "details": ["email: deve ser um endereço de email válido", "password: tamanho mínimo é 6"]
                                            }
                                            """))
                    ),
                    @ApiResponse(
                            responseCode = "409",
                            description = "E-mail já cadastrado na plataforma",
                            content = @Content(mediaType = "application/json",
                                    examples = @ExampleObject(value = """
                                            {
                                              "status": 409,
                                              "error": "Conflict",
                                              "message": "Email já cadastrado"
                                            }
                                            """))
                    )
            }
    )
    ResponseEntity<TokenResponse> register(RegisterRequest req);

    @Operation(
            summary = "Autenticar usuário",
            description = """
                    Autentica por e-mail e senha. Retorna um `accessToken` de curta duração (15 min)
                    e um `refreshToken` de longa duração (7 dias).

                    **Importante:** cada login invalida o refresh token anterior do usuário.

                    O `accessToken` deve ser enviado no header `Authorization: Bearer <token>` em
                    todas as requisições autenticadas.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = LoginRequest.class),
                            examples = @ExampleObject(
                                    name = "Login padrão",
                                    value = """
                                            {
                                              "email": "admin@scheduling.com",
                                              "password": "password"
                                            }
                                            """
                            )
                    )
            ),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Autenticação bem-sucedida",
                            content = @Content(mediaType = "application/json",
                                    schema = @Schema(implementation = TokenResponse.class),
                                    examples = @ExampleObject(value = """
                                            {
                                              "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
                                              "refreshToken": "a1b2c3d4-e5f6-...",
                                              "tokenType": "Bearer",
                                              "expiresIn": 900
                                            }
                                            """))),
                    @ApiResponse(responseCode = "401",
                            description = "Credenciais inválidas (e-mail não encontrado ou senha incorreta)",
                            content = @Content(mediaType = "application/json",
                                    examples = @ExampleObject(value = """
                                            {
                                              "status": 401,
                                              "error": "Unauthorized",
                                              "message": "Credenciais inválidas"
                                            }
                                            """)))
            }
    )
    ResponseEntity<TokenResponse> login(LoginRequest req);

    @Operation(
            summary = "Renovar access token",
            description = """
                    Troca um `refreshToken` válido e não revogado por um novo par de tokens.
                    O token antigo é **imediatamente revogado** após o uso — não reutilize.

                    Utilize este endpoint quando receber `401 Unauthorized` em outras chamadas,
                    indicando que o `accessToken` expirou.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "refreshToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                                    }
                                    """)
                    )
            ),
            responses = {
                    @ApiResponse(responseCode = "200", description = "Tokens renovados com sucesso",
                            content = @Content(mediaType = "application/json",
                                    schema = @Schema(implementation = TokenResponse.class))),
                    @ApiResponse(responseCode = "401",
                            description = "Refresh token inválido, expirado ou já revogado",
                            content = @Content(mediaType = "application/json",
                                    examples = @ExampleObject(value = """
                                            {
                                              "status": 401,
                                              "error": "Unauthorized",
                                              "message": "Refresh token inválido ou expirado"
                                            }
                                            """)))
            }
    )
    ResponseEntity<TokenResponse> refresh(RefreshTokenRequest req);

    @Operation(
            summary = "Encerrar sessão (logout)",
            description = """
                    Revoga todos os refresh tokens do usuário autenticado e adiciona o `accessToken`
                    atual à blacklist, invalidando-o imediatamente.

                    **Requer:** `Authorization: Bearer <accessToken>` no header.

                    Após o logout, qualquer requisição com o token revogado receberá `401`.
                    """,
            responses = {
                    @ApiResponse(responseCode = "204", description = "Logout realizado com sucesso"),
                    @ApiResponse(responseCode = "401", description = "Token ausente ou inválido")
            }
    )
    ResponseEntity<Void> logout(
            @Parameter(hidden = true) HttpServletRequest request,
            @Parameter(hidden = true) UserDetails principal
    );

    @Operation(
            summary = "Solicitar redefinição de senha",
            description = """
                    Envia um link de redefinição de senha para o e-mail informado.

                    **Sempre retorna 204**, independentemente de o e-mail existir ou não na base,
                    para não revelar quais e-mails estão cadastrados (proteção contra enumeração).

                    O link enviado por e-mail contém um token com validade de **30 minutos**.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    { "email": "maria.oliveira@email.com" }
                                    """))
            ),
            responses = {
                    @ApiResponse(responseCode = "204", description = "Solicitação processada (e-mail enviado se o endereço existir)"),
                    @ApiResponse(responseCode = "400", description = "E-mail com formato inválido")
            }
    )
    ResponseEntity<Void> forgotPassword(ForgotPasswordRequest req);

    @Operation(
            summary = "Redefinir senha",
            description = """
                    Redefine a senha do usuário usando o token recebido por e-mail via `/forgot-password`.

                    O token é de uso **único** — após ser utilizado com sucesso, não pode ser reutilizado.
                    Tokens expiram em 30 minutos.

                    **Regras:** nova senha deve ter no mínimo 6 caracteres.
                    """,
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(mediaType = "application/json",
                            examples = @ExampleObject(value = """
                                    {
                                      "token": "abc123def456...",
                                      "newPassword": "novaSenha456"
                                    }
                                    """))
            ),
            responses = {
                    @ApiResponse(responseCode = "204", description = "Senha redefinida com sucesso"),
                    @ApiResponse(responseCode = "400",
                            description = "Token inválido/expirado ou nova senha muito curta",
                            content = @Content(mediaType = "application/json",
                                    examples = @ExampleObject(value = """
                                            {
                                              "status": 400,
                                              "error": "Bad Request",
                                              "message": "Token de redefinição inválido ou expirado"
                                            }
                                            """)))
            }
    )
    ResponseEntity<Void> resetPassword(ResetPasswordRequest req);
}

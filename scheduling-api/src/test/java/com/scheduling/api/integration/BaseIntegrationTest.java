package com.scheduling.api.integration;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;

import com.scheduling.api.mail.MailService;

/**
 * Base para testes de integração com Testcontainers.
 *
 * Requer Docker em execução. Os containers seguem o padrão "singleton container": sobem uma única
 * vez para toda a execução e são compartilhados por todas as classes de teste. Assim o contexto do
 * Spring, que fica em cache entre as classes, sempre aponta para containers vivos.
 * O MailService é mockado para evitar necessidade de servidor SMTP.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

    // ── Containers (singleton, parados pelo Ryuk ao fim da JVM) ──────────────

    @SuppressWarnings("resource")
    static final PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:16-alpine")
                    .withDatabaseName("scheduling_test")
                    .withUsername("test")
                    .withPassword("test");

    @SuppressWarnings("resource")
    static final GenericContainer<?> redis =
            new GenericContainer<>("redis:7-alpine")
                    .withExposedPorts(6379);

    static {
        postgres.start();
        redis.start();
    }

    @DynamicPropertySource
    static void configure(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",      postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.data.redis.host",     redis::getHost);
        registry.add("spring.data.redis.port",     () -> redis.getMappedPort(6379));
    }

    // ── Injeções ──────────────────────────────────────────────────────────────

    @LocalServerPort
    protected int port;

    @Autowired
    protected TestRestTemplate restTemplate;

    @Autowired
    private StringRedisTemplate redisTemplate;

    /** Mockado para que nenhum teste necessite de servidor SMTP real. */
    @MockBean
    protected MailService mailService;

    /**
     * Zera o Redis antes de cada teste: contadores de rate limit, blacklist de tokens e cache de
     * slots não vazam de um teste para outro (ex.: o 6º cadastro seguido seria bloqueado com 429).
     */
    @BeforeEach
    void resetRedis() {
        redisTemplate.getConnectionFactory().getConnection().serverCommands().flushAll();
    }

    // ── Utilitários ───────────────────────────────────────────────────────────

    protected String baseUrl(String path) {
        return "http://localhost:" + port + path;
    }
}

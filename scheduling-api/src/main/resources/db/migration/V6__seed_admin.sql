
-- aplicamos um cadastro admin padrão para sempre iniciar o projeto ser criado, utilizado para facilitar testes.

INSERT INTO users (name, email, password, role, active)
VALUES (
           'Admin',
           'admin@scheduling.com',
           '$2a$12$O7R8okVZAmRUTzh2p.bZ7un9MgA6GDZL7PuyNjhMoETbZnVOHiia2', -- senha: password
           'ADMIN',
           true
       ) ON CONFLICT (email) DO NOTHING;
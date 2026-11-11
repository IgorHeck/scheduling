-- Tabela de associação N:N entre usuários e empresas (suporte a múltiplas empresas por usuário)
CREATE TABLE user_companies (
    user_id    BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, company_id),
    CONSTRAINT fk_uc_user    FOREIGN KEY (user_id)    REFERENCES users(id)     ON DELETE CASCADE,
    CONSTRAINT fk_uc_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Migrar associações existentes de users.company_id para a nova tabela.
-- O JOIN ignora vínculos para empresas que não existem: num banco novo a V10 aponta
-- o admin para a company 1 antes de qualquer empresa ser criada.
INSERT INTO user_companies (user_id, company_id)
SELECT u.id, u.company_id
FROM users u
JOIN companies c ON c.id = u.company_id
WHERE u.company_id IS NOT NULL;

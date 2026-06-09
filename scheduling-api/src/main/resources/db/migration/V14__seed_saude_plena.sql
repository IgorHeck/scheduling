-- V14__seed_saude_plena.sql
-- Seed de dados realistas para a Clínica Saúde Plena.
-- Senha de todos os usuários criados: password (mesmo hash do admin padrão, BCrypt $2a$12$)
-- Hoje (referência): 2026-05-29 (quinta-feira)

DO $$
DECLARE
  v_co   BIGINT;  -- company id

  -- profissionais
  v_rafael   BIGINT;
  v_carla    BIGINT;
  v_bruno    BIGINT;

  -- clientes
  v_ana      BIGINT;
  v_pedro    BIGINT;
  v_juliana  BIGINT;
  v_lucas    BIGINT;
  v_fernanda BIGINT;
  v_carlos   BIGINT;
  v_mariana  BIGINT;
  v_roberto  BIGINT;
  v_patricia BIGINT;
  v_diego    BIGINT;
  v_camila   BIGINT;
  v_andre    BIGINT;
  v_beatriz  BIGINT;
  v_felipe   BIGINT;
  v_isabela  BIGINT;

  PWD CONSTANT TEXT := '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

BEGIN

  -- ════════════════════════════════════════════════════════════
  -- 0. Localiza a empresa
  -- ════════════════════════════════════════════════════════════
  SELECT id INTO v_co FROM companies WHERE name ILIKE '%Sa_de Plena%' LIMIT 1;
  IF v_co IS NULL THEN
    SELECT id INTO v_co FROM companies WHERE name ILIKE '%saude plena%' LIMIT 1;
  END IF;
  IF v_co IS NULL THEN
    RAISE EXCEPTION 'Empresa Clínica Saúde Plena não encontrada. Verifique o nome no banco.';
  END IF;

  -- ════════════════════════════════════════════════════════════
  -- 1. Profissionais (MANAGER vinculados à clínica)
  -- ════════════════════════════════════════════════════════════
  INSERT INTO users (name, email, password, phone, role, active, company_id, created_at, updated_at)
  VALUES ('Dr. Rafael Mendes', 'rafael.mendes@saudeplena.com', PWD, '(11) 99100-0101', 'MANAGER', true, v_co, NOW() - INTERVAL '8 months', NOW())
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO v_rafael FROM users WHERE email = 'rafael.mendes@saudeplena.com';

  INSERT INTO users (name, email, password, phone, role, active, company_id, created_at, updated_at)
  VALUES ('Dra. Carla Souza', 'carla.souza@saudeplena.com', PWD, '(11) 99100-0102', 'MANAGER', true, v_co, NOW() - INTERVAL '8 months', NOW())
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO v_carla FROM users WHERE email = 'carla.souza@saudeplena.com';

  INSERT INTO users (name, email, password, phone, role, active, company_id, created_at, updated_at)
  VALUES ('Dr. Bruno Lima', 'bruno.lima@saudeplena.com', PWD, '(11) 99100-0103', 'MANAGER', true, v_co, NOW() - INTERVAL '8 months', NOW())
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO v_bruno FROM users WHERE email = 'bruno.lima@saudeplena.com';

  -- Vincula profissionais na tabela user_companies
  INSERT INTO user_companies (user_id, company_id) VALUES (v_rafael, v_co) ON CONFLICT DO NOTHING;
  INSERT INTO user_companies (user_id, company_id) VALUES (v_carla,  v_co) ON CONFLICT DO NOTHING;
  INSERT INTO user_companies (user_id, company_id) VALUES (v_bruno,  v_co) ON CONFLICT DO NOTHING;

  -- ════════════════════════════════════════════════════════════
  -- 2. Clientes (CLIENT — sem company_id)
  -- ════════════════════════════════════════════════════════════
  INSERT INTO users (name, email, password, phone, role, active, created_at, updated_at) VALUES
    ('Ana Costa',          'ana.costa@email.com',      PWD, '(11) 98000-0001', 'CLIENT', true, NOW()-INTERVAL '4 months', NOW()),
    ('Pedro Oliveira',     'pedro.oliveira@email.com', PWD, '(11) 98000-0002', 'CLIENT', true, NOW()-INTERVAL '4 months', NOW()),
    ('Juliana Ferreira',   'juliana.f@email.com',      PWD, '(11) 98000-0003', 'CLIENT', true, NOW()-INTERVAL '3 months', NOW()),
    ('Lucas Martins',      'lucas.martins@email.com',  PWD, '(11) 98000-0004', 'CLIENT', true, NOW()-INTERVAL '3 months', NOW()),
    ('Fernanda Rocha',     'fernanda.rocha@email.com', PWD, '(11) 98000-0005', 'CLIENT', true, NOW()-INTERVAL '3 months', NOW()),
    ('Carlos Eduardo',     'carlos.edu@email.com',     PWD, '(11) 98000-0006', 'CLIENT', true, NOW()-INTERVAL '2 months', NOW()),
    ('Mariana Alves',      'mariana.alves@email.com',  PWD, '(11) 98000-0007', 'CLIENT', true, NOW()-INTERVAL '2 months', NOW()),
    ('Roberto Santos',     'roberto.s@email.com',      PWD, '(11) 98000-0008', 'CLIENT', true, NOW()-INTERVAL '2 months', NOW()),
    ('Patrícia Lima',      'patricia.lima@email.com',  PWD, '(11) 98000-0009', 'CLIENT', true, NOW()-INTERVAL '5 months', NOW()),
    ('Diego Henrique',     'diego.h@email.com',        PWD, '(11) 98000-0010', 'CLIENT', true, NOW()-INTERVAL '1 month',  NOW()),
    ('Camila Torres',      'camila.torres@email.com',  PWD, '(11) 98000-0011', 'CLIENT', true, NOW()-INTERVAL '1 month',  NOW()),
    ('André Figueiredo',   'andre.fig@email.com',      PWD, '(11) 98000-0012', 'CLIENT', true, NOW()-INTERVAL '6 weeks',  NOW()),
    ('Beatriz Campos',     'beatriz.c@email.com',      PWD, '(11) 98000-0013', 'CLIENT', true, NOW()-INTERVAL '6 weeks',  NOW()),
    ('Felipe Nunes',       'felipe.nunes@email.com',   PWD, '(11) 98000-0014', 'CLIENT', true, NOW()-INTERVAL '3 weeks',  NOW()),
    ('Isabela Ramos',      'isabela.ramos@email.com',  PWD, '(11) 98000-0015', 'CLIENT', true, NOW()-INTERVAL '2 weeks',  NOW())
  ON CONFLICT (email) DO NOTHING;

  SELECT id INTO v_ana      FROM users WHERE email = 'ana.costa@email.com';
  SELECT id INTO v_pedro    FROM users WHERE email = 'pedro.oliveira@email.com';
  SELECT id INTO v_juliana  FROM users WHERE email = 'juliana.f@email.com';
  SELECT id INTO v_lucas    FROM users WHERE email = 'lucas.martins@email.com';
  SELECT id INTO v_fernanda FROM users WHERE email = 'fernanda.rocha@email.com';
  SELECT id INTO v_carlos   FROM users WHERE email = 'carlos.edu@email.com';
  SELECT id INTO v_mariana  FROM users WHERE email = 'mariana.alves@email.com';
  SELECT id INTO v_roberto  FROM users WHERE email = 'roberto.s@email.com';
  SELECT id INTO v_patricia FROM users WHERE email = 'patricia.lima@email.com';
  SELECT id INTO v_diego    FROM users WHERE email = 'diego.h@email.com';
  SELECT id INTO v_camila   FROM users WHERE email = 'camila.torres@email.com';
  SELECT id INTO v_andre    FROM users WHERE email = 'andre.fig@email.com';
  SELECT id INTO v_beatriz  FROM users WHERE email = 'beatriz.c@email.com';
  SELECT id INTO v_felipe   FROM users WHERE email = 'felipe.nunes@email.com';
  SELECT id INTO v_isabela  FROM users WHERE email = 'isabela.ramos@email.com';

  -- ════════════════════════════════════════════════════════════
  -- 3. Grades de horário — Seg a Sex, 08:00-18:00, almoço 12-13, slots de 30 min
  -- ════════════════════════════════════════════════════════════
  INSERT INTO schedules (company_id, professional_id, day_of_week, start_time, end_time, lunch_start, lunch_end, slot_duration_minutes, active) VALUES
    -- Dr. Rafael Mendes
    (v_co, v_rafael, 'MONDAY',    '08:00', '18:00', '12:00', '13:00', 30, true),
    (v_co, v_rafael, 'TUESDAY',   '08:00', '18:00', '12:00', '13:00', 30, true),
    (v_co, v_rafael, 'WEDNESDAY', '08:00', '18:00', '12:00', '13:00', 30, true),
    (v_co, v_rafael, 'THURSDAY',  '08:00', '18:00', '12:00', '13:00', 30, true),
    (v_co, v_rafael, 'FRIDAY',    '08:00', '17:00', '12:00', '13:00', 30, true),
    -- Dra. Carla Souza
    (v_co, v_carla,  'MONDAY',    '08:00', '18:00', '12:00', '13:00', 30, true),
    (v_co, v_carla,  'TUESDAY',   '08:00', '18:00', '12:00', '13:00', 30, true),
    (v_co, v_carla,  'WEDNESDAY', '08:00', '18:00', '12:00', '13:00', 30, true),
    (v_co, v_carla,  'THURSDAY',  '08:00', '18:00', '12:00', '13:00', 30, true),
    (v_co, v_carla,  'FRIDAY',    '08:00', '17:00', '12:00', '13:00', 30, true),
    -- Dr. Bruno Lima
    (v_co, v_bruno,  'MONDAY',    '09:00', '18:00', '12:00', '13:00', 30, true),
    (v_co, v_bruno,  'WEDNESDAY', '09:00', '18:00', '12:00', '13:00', 30, true),
    (v_co, v_bruno,  'FRIDAY',    '09:00', '17:00', '12:00', '13:00', 30, true);

  -- ════════════════════════════════════════════════════════════
  -- 4. Agendamentos
  -- Legenda de status: COMPLETED=passado confirmado, CONFIRMED=futuro confirmado,
  --                    PENDING=aguardando confirmação, CANCELLED=cancelado
  -- ════════════════════════════════════════════════════════════

  INSERT INTO appointments (company_id, client_id, professional_id, start_at, end_at, status, notes, created_at) VALUES

  -- ── MARÇO 2026 — COMPLETED ─────────────────────────────────
  (v_co, v_ana,      v_rafael, '2026-03-02 08:00', '2026-03-02 08:30', 'COMPLETED', 'Consulta de rotina',            '2026-02-28 10:00'),
  (v_co, v_pedro,    v_carla,  '2026-03-02 09:00', '2026-03-02 09:30', 'COMPLETED', null,                            '2026-02-28 11:00'),
  (v_co, v_juliana,  v_bruno,  '2026-03-04 09:00', '2026-03-04 09:30', 'COMPLETED', 'Dor no joelho',                 '2026-03-01 09:00'),
  (v_co, v_lucas,    v_rafael, '2026-03-04 10:00', '2026-03-04 10:30', 'COMPLETED', null,                            '2026-03-01 14:00'),
  (v_co, v_fernanda, v_carla,  '2026-03-05 08:30', '2026-03-05 09:00', 'COMPLETED', 'Retorno pediatria',             '2026-03-02 08:00'),
  (v_co, v_carlos,   v_rafael, '2026-03-05 11:00', '2026-03-05 11:30', 'COMPLETED', null,                            '2026-03-03 09:00'),
  (v_co, v_mariana,  v_carla,  '2026-03-06 09:00', '2026-03-06 09:30', 'COMPLETED', 'Primeira consulta',             '2026-03-03 16:00'),
  (v_co, v_roberto,  v_bruno,  '2026-03-06 10:00', '2026-03-06 10:30', 'COMPLETED', 'Avaliação coluna',              '2026-03-04 10:00'),
  (v_co, v_patricia, v_rafael, '2026-03-09 08:00', '2026-03-09 08:30', 'COMPLETED', null,                            '2026-03-06 09:00'),
  (v_co, v_ana,      v_carla,  '2026-03-09 14:00', '2026-03-09 14:30', 'COMPLETED', 'Acompanhamento',                '2026-03-06 10:00'),
  (v_co, v_diego,    v_rafael, '2026-03-11 09:00', '2026-03-11 09:30', 'COMPLETED', null,                            '2026-03-08 09:00'),
  (v_co, v_camila,   v_carla,  '2026-03-11 10:30', '2026-03-11 11:00', 'COMPLETED', 'Exame de rotina',               '2026-03-08 14:00'),
  (v_co, v_andre,    v_bruno,  '2026-03-13 09:00', '2026-03-13 09:30', 'COMPLETED', 'Lesão no ombro',                '2026-03-10 11:00'),
  (v_co, v_beatriz,  v_rafael, '2026-03-13 14:00', '2026-03-13 14:30', 'COMPLETED', null,                            '2026-03-10 15:00'),
  (v_co, v_felipe,   v_carla,  '2026-03-16 08:00', '2026-03-16 08:30', 'COMPLETED', 'Retorno',                       '2026-03-13 09:00'),
  (v_co, v_isabela,  v_rafael, '2026-03-16 09:30', '2026-03-16 10:00', 'COMPLETED', null,                            '2026-03-13 10:00'),
  (v_co, v_pedro,    v_bruno,  '2026-03-18 10:00', '2026-03-18 10:30', 'COMPLETED', 'Fisioterapia avaliação',        '2026-03-15 09:00'),
  (v_co, v_lucas,    v_carla,  '2026-03-18 11:00', '2026-03-18 11:30', 'COMPLETED', null,                            '2026-03-15 14:00'),
  (v_co, v_fernanda, v_rafael, '2026-03-19 08:30', '2026-03-19 09:00', 'COMPLETED', 'Check-up anual',                '2026-03-16 08:00'),
  (v_co, v_mariana,  v_bruno,  '2026-03-20 09:00', '2026-03-20 09:30', 'COMPLETED', null,                            '2026-03-17 10:00'),

  -- ── ABRIL 2026 — COMPLETED e CANCELLED ──────────────────────
  (v_co, v_carlos,   v_carla,  '2026-04-01 08:00', '2026-04-01 08:30', 'COMPLETED', 'Consulta clínica geral',        '2026-03-28 09:00'),
  (v_co, v_roberto,  v_rafael, '2026-04-01 10:00', '2026-04-01 10:30', 'COMPLETED', null,                            '2026-03-28 11:00'),
  (v_co, v_patricia, v_bruno,  '2026-04-02 09:00', '2026-04-02 09:30', 'COMPLETED', 'Ortopedia — quadril',           '2026-03-30 09:00'),
  (v_co, v_ana,      v_rafael, '2026-04-03 08:00', '2026-04-03 08:30', 'COMPLETED', null,                            '2026-03-31 08:00'),
  (v_co, v_diego,    v_carla,  '2026-04-03 14:00', '2026-04-03 14:30', 'COMPLETED', 'Pediatria retorno',             '2026-03-31 14:00'),
  (v_co, v_camila,   v_rafael, '2026-04-06 09:00', '2026-04-06 09:30', 'COMPLETED', null,                            '2026-04-03 09:00'),
  (v_co, v_andre,    v_carla,  '2026-04-07 10:00', '2026-04-07 10:30', 'COMPLETED', 'Exames',                        '2026-04-04 10:00'),
  (v_co, v_beatriz,  v_bruno,  '2026-04-08 09:00', '2026-04-08 09:30', 'COMPLETED', 'Coluna — acompanhamento',       '2026-04-05 09:00'),
  (v_co, v_juliana,  v_rafael, '2026-04-09 08:30', '2026-04-09 09:00', 'COMPLETED', null,                            '2026-04-06 08:00'),
  (v_co, v_lucas,    v_bruno,  '2026-04-10 10:00', '2026-04-10 10:30', 'COMPLETED', 'Dor nas costas',                '2026-04-07 10:00'),
  -- CANCELLED em abril
  (v_co, v_felipe,   v_rafael, '2026-04-14 09:00', '2026-04-14 09:30', 'CANCELLED', null,                            '2026-04-11 09:00'),
  (v_co, v_isabela,  v_carla,  '2026-04-15 14:00', '2026-04-15 14:30', 'CANCELLED', null,                            '2026-04-12 10:00'),
  (v_co, v_pedro,    v_rafael, '2026-04-13 08:00', '2026-04-13 08:30', 'COMPLETED', null,                            '2026-04-10 08:00'),
  (v_co, v_mariana,  v_carla,  '2026-04-14 10:00', '2026-04-14 10:30', 'COMPLETED', 'Retorno pós exames',            '2026-04-11 10:00'),
  (v_co, v_fernanda, v_bruno,  '2026-04-16 09:00', '2026-04-16 09:30', 'COMPLETED', null,                            '2026-04-13 09:00'),
  (v_co, v_carlos,   v_rafael, '2026-04-17 08:00', '2026-04-17 08:30', 'COMPLETED', 'Pressão alta — acompanhamento', '2026-04-14 08:00'),
  (v_co, v_roberto,  v_carla,  '2026-04-20 09:00', '2026-04-20 09:30', 'COMPLETED', null,                            '2026-04-17 09:00'),
  (v_co, v_patricia, v_rafael, '2026-04-21 10:30', '2026-04-21 11:00', 'COMPLETED', 'Triagem',                       '2026-04-18 10:00'),
  (v_co, v_ana,      v_bruno,  '2026-04-22 09:00', '2026-04-22 09:30', 'COMPLETED', 'Joelho — retorno',              '2026-04-19 09:00'),
  (v_co, v_diego,    v_rafael, '2026-04-23 08:00', '2026-04-23 08:30', 'COMPLETED', null,                            '2026-04-20 08:00'),
  (v_co, v_camila,   v_carla,  '2026-04-24 14:00', '2026-04-24 14:30', 'COMPLETED', 'Resultado exames',              '2026-04-21 14:00'),
  (v_co, v_andre,    v_rafael, '2026-04-27 09:00', '2026-04-27 09:30', 'COMPLETED', null,                            '2026-04-24 09:00'),
  (v_co, v_beatriz,  v_carla,  '2026-04-28 10:00', '2026-04-28 10:30', 'COMPLETED', 'Consulta preventiva',           '2026-04-25 10:00'),
  (v_co, v_felipe,   v_bruno,  '2026-04-29 09:00', '2026-04-29 09:30', 'COMPLETED', 'Tornozelo',                     '2026-04-26 09:00'),
  (v_co, v_isabela,  v_rafael, '2026-04-30 08:30', '2026-04-30 09:00', 'COMPLETED', null,                            '2026-04-27 08:00'),

  -- ── MAIO 2026 — passado COMPLETED e CANCELLED ────────────────
  (v_co, v_lucas,    v_carla,  '2026-05-02 08:00', '2026-05-02 08:30', 'COMPLETED', null,                            '2026-04-29 08:00'),
  (v_co, v_fernanda, v_rafael, '2026-05-04 09:00', '2026-05-04 09:30', 'COMPLETED', 'Check-up semestral',            '2026-05-01 09:00'),
  (v_co, v_carlos,   v_bruno,  '2026-05-06 10:00', '2026-05-06 10:30', 'COMPLETED', null,                            '2026-05-03 10:00'),
  (v_co, v_mariana,  v_rafael, '2026-05-07 08:00', '2026-05-07 08:30', 'COMPLETED', 'Gripe — acompanhamento',        '2026-05-04 08:00'),
  (v_co, v_roberto,  v_carla,  '2026-05-08 09:30', '2026-05-08 10:00', 'COMPLETED', null,                            '2026-05-05 09:00'),
  (v_co, v_patricia, v_bruno,  '2026-05-09 09:00', '2026-05-09 09:30', 'COMPLETED', 'Pós-cirúrgico ombro',           '2026-05-06 09:00'),
  -- CANCELLED em maio
  (v_co, v_ana,      v_carla,  '2026-05-12 14:00', '2026-05-12 14:30', 'CANCELLED', null,                            '2026-05-09 14:00'),
  (v_co, v_diego,    v_bruno,  '2026-05-13 09:00', '2026-05-13 09:30', 'CANCELLED', null,                            '2026-05-10 09:00'),
  (v_co, v_camila,   v_rafael, '2026-05-12 09:00', '2026-05-12 09:30', 'COMPLETED', null,                            '2026-05-09 09:00'),
  (v_co, v_andre,    v_carla,  '2026-05-13 10:00', '2026-05-13 10:30', 'COMPLETED', 'Revisão anual',                 '2026-05-10 10:00'),
  (v_co, v_beatriz,  v_rafael, '2026-05-14 08:00', '2026-05-14 08:30', 'COMPLETED', null,                            '2026-05-11 08:00'),
  (v_co, v_felipe,   v_carla,  '2026-05-15 09:30', '2026-05-15 10:00', 'COMPLETED', 'Retorno pós exames',            '2026-05-12 09:00'),
  (v_co, v_isabela,  v_bruno,  '2026-05-15 10:00', '2026-05-15 10:30', 'COMPLETED', 'Joelho — fisio avaliação',      '2026-05-12 10:00'),
  (v_co, v_pedro,    v_rafael, '2026-05-19 08:30', '2026-05-19 09:00', 'COMPLETED', null,                            '2026-05-16 08:00'),
  (v_co, v_juliana,  v_carla,  '2026-05-20 09:00', '2026-05-20 09:30', 'COMPLETED', 'Consulta de rotina',            '2026-05-17 09:00'),
  (v_co, v_lucas,    v_rafael, '2026-05-21 10:00', '2026-05-21 10:30', 'COMPLETED', null,                            '2026-05-18 10:00'),
  (v_co, v_fernanda, v_carla,  '2026-05-22 08:00', '2026-05-22 08:30', 'COMPLETED', 'Resultado exames',              '2026-05-19 08:00'),
  (v_co, v_carlos,   v_rafael, '2026-05-26 09:00', '2026-05-26 09:30', 'COMPLETED', null,                            '2026-05-23 09:00'),
  (v_co, v_mariana,  v_bruno,  '2026-05-26 10:00', '2026-05-26 10:30', 'COMPLETED', 'Ombro — retorno',               '2026-05-23 10:00'),
  (v_co, v_roberto,  v_rafael, '2026-05-27 08:00', '2026-05-27 08:30', 'COMPLETED', null,                            '2026-05-24 08:00'),
  (v_co, v_patricia, v_carla,  '2026-05-28 09:30', '2026-05-28 10:00', 'COMPLETED', 'Acompanhamento trimestral',     '2026-05-25 09:00'),
  (v_co, v_ana,      v_rafael, '2026-05-28 11:00', '2026-05-28 11:30', 'COMPLETED', null,                            '2026-05-25 11:00'),

  -- ── HOJE — 2026-05-29 (quinta) ──────────────────────────────
  -- manhã: já aconteceu → COMPLETED
  (v_co, v_diego,    v_rafael, '2026-05-29 08:00', '2026-05-29 08:30', 'COMPLETED', null,                            '2026-05-26 08:00'),
  (v_co, v_camila,   v_carla,  '2026-05-29 08:30', '2026-05-29 09:00', 'COMPLETED', 'Retorno',                       '2026-05-26 08:30'),
  (v_co, v_andre,    v_rafael, '2026-05-29 09:00', '2026-05-29 09:30', 'COMPLETED', null,                            '2026-05-26 09:00'),
  (v_co, v_beatriz,  v_carla,  '2026-05-29 10:00', '2026-05-29 10:30', 'COMPLETED', 'Exame preventivo',              '2026-05-26 10:00'),
  (v_co, v_felipe,   v_rafael, '2026-05-29 11:00', '2026-05-29 11:30', 'COMPLETED', null,                            '2026-05-26 11:00'),
  -- tarde: ainda vai acontecer → CONFIRMED e PENDING
  (v_co, v_isabela,  v_carla,  '2026-05-29 13:00', '2026-05-29 13:30', 'CONFIRMED', 'Consulta pediátrica',           '2026-05-26 13:00'),
  (v_co, v_pedro,    v_rafael, '2026-05-29 14:00', '2026-05-29 14:30', 'CONFIRMED', null,                            '2026-05-26 14:00'),
  (v_co, v_juliana,  v_bruno,  '2026-05-29 14:00', '2026-05-29 14:30', 'CONFIRMED', 'Joelho — acompanhamento',       '2026-05-26 14:00'),
  (v_co, v_lucas,    v_carla,  '2026-05-29 15:00', '2026-05-29 15:30', 'PENDING',   null,                            '2026-05-28 09:00'),
  (v_co, v_fernanda, v_rafael, '2026-05-29 15:30', '2026-05-29 16:00', 'PENDING',   'Dor de cabeça frequente',       '2026-05-28 10:00'),
  (v_co, v_carlos,   v_carla,  '2026-05-29 16:00', '2026-05-29 16:30', 'PENDING',   null,                            '2026-05-28 11:00'),

  -- ── AMANHÃ — 2026-05-30 (sexta) ─────────────────────────────
  (v_co, v_mariana,  v_rafael, '2026-05-30 08:00', '2026-05-30 08:30', 'CONFIRMED', null,                            '2026-05-27 08:00'),
  (v_co, v_roberto,  v_carla,  '2026-05-30 09:00', '2026-05-30 09:30', 'CONFIRMED', 'Resultado de exame',            '2026-05-27 09:00'),
  (v_co, v_patricia, v_bruno,  '2026-05-30 09:00', '2026-05-30 09:30', 'CONFIRMED', null,                            '2026-05-27 09:00'),
  (v_co, v_ana,      v_rafael, '2026-05-30 10:30', '2026-05-30 11:00', 'PENDING',   'Renovação receita',             '2026-05-28 10:00'),
  (v_co, v_diego,    v_carla,  '2026-05-30 14:00', '2026-05-30 14:30', 'PENDING',   null,                            '2026-05-28 11:00'),

  -- ── PRÓXIMA SEMANA — 2026-06-01 a 05 ────────────────────────
  (v_co, v_camila,   v_rafael, '2026-06-01 08:00', '2026-06-01 08:30', 'CONFIRMED', null,                            '2026-05-28 08:00'),
  (v_co, v_andre,    v_carla,  '2026-06-01 09:30', '2026-06-01 10:00', 'CONFIRMED', 'Consulta de rotina',            '2026-05-28 09:00'),
  (v_co, v_beatriz,  v_bruno,  '2026-06-02 10:00', '2026-06-02 10:30', 'CONFIRMED', 'Coluna — retorno',              '2026-05-28 10:00'),
  (v_co, v_felipe,   v_rafael, '2026-06-02 14:00', '2026-06-02 14:30', 'CONFIRMED', null,                            '2026-05-28 14:00'),
  (v_co, v_isabela,  v_carla,  '2026-06-03 08:30', '2026-06-03 09:00', 'CONFIRMED', 'Pediatria — retorno',           '2026-05-29 08:00'),
  (v_co, v_pedro,    v_rafael, '2026-06-03 10:00', '2026-06-03 10:30', 'PENDING',   null,                            '2026-05-29 09:00'),
  (v_co, v_juliana,  v_carla,  '2026-06-04 09:00', '2026-06-04 09:30', 'CONFIRMED', 'Acompanhamento',                '2026-05-29 09:00'),
  (v_co, v_lucas,    v_rafael, '2026-06-04 11:00', '2026-06-04 11:30', 'PENDING',   null,                            '2026-05-29 10:00'),
  (v_co, v_fernanda, v_bruno,  '2026-06-04 10:00', '2026-06-04 10:30', 'CONFIRMED', 'Ombro — avaliação',             '2026-05-29 10:00'),
  (v_co, v_carlos,   v_carla,  '2026-06-05 08:00', '2026-06-05 08:30', 'CONFIRMED', null,                            '2026-05-29 08:00'),
  (v_co, v_mariana,  v_rafael, '2026-06-05 09:00', '2026-06-05 09:30', 'PENDING',   'Pressão alta',                  '2026-05-29 09:00'),

  -- ── JUNHO 2026 — meio do mês ─────────────────────────────────
  (v_co, v_roberto,  v_rafael, '2026-06-08 08:00', '2026-06-08 08:30', 'CONFIRMED', null,                            '2026-05-29 08:00'),
  (v_co, v_patricia, v_carla,  '2026-06-08 09:00', '2026-06-08 09:30', 'CONFIRMED', 'Retorno pós exames',            '2026-05-29 09:00'),
  (v_co, v_ana,      v_bruno,  '2026-06-09 10:00', '2026-06-09 10:30', 'CONFIRMED', 'Joelho',                        '2026-05-29 10:00'),
  (v_co, v_diego,    v_rafael, '2026-06-10 14:00', '2026-06-10 14:30', 'CONFIRMED', null,                            '2026-05-29 14:00'),
  (v_co, v_camila,   v_carla,  '2026-06-10 15:00', '2026-06-10 15:30', 'PENDING',   'Resultado de exame',            '2026-05-29 15:00'),
  (v_co, v_andre,    v_rafael, '2026-06-11 08:30', '2026-06-11 09:00', 'CONFIRMED', null,                            '2026-05-29 08:00'),
  (v_co, v_beatriz,  v_carla,  '2026-06-11 10:00', '2026-06-11 10:30', 'PENDING',   'Consulta preventiva',           '2026-05-29 10:00'),
  (v_co, v_felipe,   v_bruno,  '2026-06-12 09:00', '2026-06-12 09:30', 'CONFIRMED', 'Tornozelo — retorno',           '2026-05-29 09:00'),
  (v_co, v_isabela,  v_rafael, '2026-06-15 08:00', '2026-06-15 08:30', 'CONFIRMED', null,                            '2026-05-29 08:00'),
  (v_co, v_pedro,    v_carla,  '2026-06-15 09:30', '2026-06-15 10:00', 'PENDING',   'Pediatria filha',               '2026-05-29 09:00'),
  (v_co, v_juliana,  v_rafael, '2026-06-16 10:00', '2026-06-16 10:30', 'CONFIRMED', null,                            '2026-05-29 10:00'),
  (v_co, v_lucas,    v_carla,  '2026-06-17 08:00', '2026-06-17 08:30', 'PENDING',   'Dor abdominal',                 '2026-05-29 08:00'),
  (v_co, v_fernanda, v_rafael, '2026-06-18 09:00', '2026-06-18 09:30', 'CONFIRMED', null,                            '2026-05-29 09:00'),
  (v_co, v_carlos,   v_bruno,  '2026-06-18 10:00', '2026-06-18 10:30', 'PENDING',   'Coluna — primeira vez',         '2026-05-29 10:00'),
  (v_co, v_mariana,  v_carla,  '2026-06-19 14:00', '2026-06-19 14:30', 'CONFIRMED', 'Retorno consulta',              '2026-05-29 14:00'),
  (v_co, v_roberto,  v_rafael, '2026-06-22 08:30', '2026-06-22 09:00', 'CONFIRMED', null,                            '2026-05-29 08:00'),
  (v_co, v_patricia, v_bruno,  '2026-06-23 10:00', '2026-06-23 10:30', 'PENDING',   'Quadril — avaliação',           '2026-05-29 10:00'),
  (v_co, v_ana,      v_carla,  '2026-06-24 09:00', '2026-06-24 09:30', 'CONFIRMED', null,                            '2026-05-29 09:00'),
  (v_co, v_diego,    v_rafael, '2026-06-25 08:00', '2026-06-25 08:30', 'PENDING',   'Consulta geral',                '2026-05-29 08:00'),
  (v_co, v_camila,   v_carla,  '2026-06-26 10:00', '2026-06-26 10:30', 'CONFIRMED', 'Revisão anual',                 '2026-05-29 10:00'),
  (v_co, v_andre,    v_rafael, '2026-06-29 09:00', '2026-06-29 09:30', 'PENDING',   null,                            '2026-05-29 09:00'),
  (v_co, v_beatriz,  v_carla,  '2026-06-30 08:00', '2026-06-30 08:30', 'CONFIRMED', 'Último dia do mês',             '2026-05-29 08:00'),

  -- ── JULHO 2026 — solicitações (PENDING) ──────────────────────
  (v_co, v_felipe,   v_rafael, '2026-07-01 08:00', '2026-07-01 08:30', 'PENDING',   null,                            '2026-05-29 09:00'),
  (v_co, v_isabela,  v_carla,  '2026-07-01 09:00', '2026-07-01 09:30', 'PENDING',   'Retorno pediátrico',            '2026-05-29 09:00'),
  (v_co, v_pedro,    v_rafael, '2026-07-02 10:00', '2026-07-02 10:30', 'PENDING',   null,                            '2026-05-29 10:00'),
  (v_co, v_juliana,  v_bruno,  '2026-07-03 09:00', '2026-07-03 09:30', 'PENDING',   'Joelho pós-cirúrgico',          '2026-05-29 10:00'),
  (v_co, v_lucas,    v_rafael, '2026-07-06 08:00', '2026-07-06 08:30', 'PENDING',   null,                            '2026-05-29 10:00'),
  (v_co, v_fernanda, v_carla,  '2026-07-07 09:30', '2026-07-07 10:00', 'PENDING',   'Consulta de rotina',            '2026-05-29 10:00'),
  (v_co, v_carlos,   v_rafael, '2026-07-08 10:00', '2026-07-08 10:30', 'PENDING',   null,                            '2026-05-29 10:00'),
  (v_co, v_mariana,  v_carla,  '2026-07-09 08:30', '2026-07-09 09:00', 'PENDING',   'Acompanhamento mensal',         '2026-05-29 10:00'),
  (v_co, v_roberto,  v_bruno,  '2026-07-10 09:00', '2026-07-10 09:30', 'PENDING',   null,                            '2026-05-29 10:00'),
  (v_co, v_patricia, v_rafael, '2026-07-13 08:00', '2026-07-13 08:30', 'PENDING',   'Check-up trimestral',           '2026-05-29 10:00');

END $$;

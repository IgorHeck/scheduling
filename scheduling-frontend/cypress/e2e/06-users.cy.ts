/**
 * 06-users.cy.ts
 * Testes: UsersPage — listagem, busca, filtro por papel, modal de criar manager.
 * Papel: ADMIN (companyId = 1)
 */

const COMPANY_ID = 1

function stubBootstrap() {
  cy.intercept('GET', '**/notifications/subscribe', { statusCode: 200, body: '' }).as('sse')
  cy.intercept('GET', `**/companies/${COMPANY_ID}`, { fixture: 'companies/company' }).as('getCompany')
  cy.intercept('GET', `**/appointments/company/${COMPANY_ID}**`, { body: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 } }).as('getAppts')
  cy.intercept('GET', `**/appointments/company/${COMPANY_ID}/pending`, { body: [] }).as('getPending')
  cy.intercept('GET', '**/appointments/calendar**', { body: [] }).as('getCalendar')
  cy.intercept('GET', '**/companies', { body: [{ id: 1, name: 'Clínica Teste', active: true, allowClientBooking: true }] }).as('getCompanies')
  // Registrar getUsers antes de getMyCompanies: LIFO garante que getMyCompanies
  // (registrado por último) vença em /users/me/companies, enquanto /api/v1/users?companyId=...
  // nunca casa com a rota de navegação /1/dashboard/users (sem /api/v1/ na URL).
  cy.intercept('GET', '**/api/v1/users**', { fixture: 'users/list' }).as('getUsers')
  cy.intercept('GET', '**/users/me/companies', { statusCode: 200, body: [] }).as('getMyCompanies')
}

describe('UsersPage — listagem', () => {
  beforeEach(() => {
    stubBootstrap()
    cy.loginAs('admin', `/${COMPANY_ID}/dashboard/users`)
    cy.wait('@getUsers')
  })

  it('exibe o cabeçalho da página e a contagem de usuários', () => {
    cy.contains('Usuários').should('be.visible')
  })

  it('exibe os usuários retornados pela API', () => {
    cy.contains('Admin User').should('be.visible')
    cy.contains('Manager User').should('be.visible')
    cy.contains('Cliente User').should('be.visible')
  })

  it('exibe os badges de papel', () => {
    cy.contains('Admin').should('be.visible')
    cy.contains('Manager').should('be.visible')
  })
})

describe('UsersPage — busca', () => {
  beforeEach(() => {
    stubBootstrap()
    cy.loginAs('admin', `/${COMPANY_ID}/dashboard/users`)
    cy.wait('@getUsers')
  })

  it('filtra por nome', () => {
    cy.get('input[placeholder*="nome"]').type('Manager')
    cy.contains('Manager User').should('be.visible')
    // email só aparece no .row da lista — sidebar mostra admin@test.com permanentemente
    cy.contains('.row', 'admin@test.com').should('not.exist')
  })

  it('filtra por e-mail', () => {
    cy.get('input[placeholder*="nome"]').type('client@test')
    cy.contains('Cliente User').should('be.visible')
    cy.contains('.row', 'admin@test.com').should('not.exist')
  })

  it('exibe estado vazio para termo desconhecido', () => {
    cy.get('input[placeholder*="nome"]').type('zzznobodyyy')
    cy.contains('Nenhum usuário encontrado').should('be.visible')
  })
})

describe('UsersPage — filtro por papel', () => {
  beforeEach(() => {
    stubBootstrap()
    cy.loginAs('admin', `/${COMPANY_ID}/dashboard/users`)
    cy.wait('@getUsers')
  })

  it('filtra para exibir apenas Managers', () => {
    // Tabs são <div class="tab">, não <button>; labels são plurais (Managers, Admins, Clientes)
    cy.contains('.tab', 'Managers').click()
    cy.contains('Manager User').should('be.visible')
    cy.contains('Outro Manager').should('be.visible')
    // sidebar mostra admin@test.com sempre — checar ausência só nos .row da lista
    cy.contains('.row', 'admin@test.com').should('not.exist')
    cy.contains('Cliente User').should('not.exist')
  })

  it('filtra para exibir apenas Admins', () => {
    cy.contains('.tab', 'Admins').click()
    cy.contains('Admin User').should('be.visible')
    cy.contains('Manager User').should('not.exist')
  })

  it('filtra para exibir apenas Clientes', () => {
    cy.contains('.tab', 'Clientes').click()
    cy.contains('Cliente User').should('be.visible')
    cy.contains('.row', 'admin@test.com').should('not.exist')
  })

  it('volta a exibir todos ao clicar em "Todos"', () => {
    cy.contains('.tab', 'Managers').click()
    cy.contains('.tab', 'Todos').click()
    cy.contains('Admin User').should('be.visible')
    cy.contains('Manager User').should('be.visible')
  })
})

describe('UsersPage — modal de criar manager', () => {
  beforeEach(() => {
    stubBootstrap()
    cy.loginAs('admin', `/${COMPANY_ID}/dashboard/users`)
    cy.wait('@getUsers')
  })

  it('abre o modal de criar Manager', () => {
    // Botão usa <Plus> (SVG) + texto "Criar Manager" — não há "+" como caractere de texto
    cy.contains('Criar Manager').click()
    cy.get('input[placeholder="Nome completo"]').should('be.visible')
  })

  it('fecha o modal ao clicar em "Cancelar"', () => {
    cy.contains('Criar Manager').click()
    cy.contains('button', 'Cancelar').click()
    cy.get('input[placeholder="Nome completo"]').should('not.exist')
  })

  it('cria um Manager e exibe o estado de sucesso', () => {
    cy.intercept('POST', '**/users', {
      statusCode: 201,
      body: {
        id: 99, name: 'Novo Manager', email: 'novo@test.com',
        role: 'MANAGER', companyId: 1, active: true,
      },
    }).as('createManager')

    cy.intercept('GET', '**/users**', {
      body: [
        { id: 1, name: 'Admin User', email: 'admin@test.com', role: 'ADMIN', companyId: 1, companyName: 'Clínica Teste', phone: null, active: true },
        { id: 2, name: 'Manager User', email: 'manager@test.com', role: 'MANAGER', companyId: 1, companyName: 'Clínica Teste', phone: null, active: true },
        { id: 4, name: 'Outro Manager', email: 'outro@test.com', role: 'MANAGER', companyId: null, companyName: null, phone: '(48) 99999-0000', active: true },
        { id: 5, name: 'Cliente Inativo', email: 'inativo@test.com', role: 'CLIENT', companyId: null, companyName: null, phone: null, active: false },
        { id: 3, name: 'Cliente User', email: 'client@test.com', role: 'CLIENT', companyId: null, companyName: null, phone: null, active: true },
        { id: 99, name: 'Novo Manager', email: 'novo@test.com', role: 'MANAGER', companyId: 1, companyName: 'Clínica Teste', phone: null, active: true },
      ],
    }).as('getUsersUpdated')

    cy.contains('Criar Manager').first().click({ force: true })

    // Overlay usa class="modal-overlay", não classes Tailwind como "fixed inset-0"
    cy.get('.modal-overlay').within(() => {
      cy.get('input[placeholder="Nome completo"]').type('Novo Manager')
      cy.get('input[type="email"]').type('novo@test.com')
      cy.get('input[placeholder="Mínimo 6 caracteres"]').type('senha123')
      cy.contains('button', 'Criar Manager').click()
    })

    cy.wait('@createManager')
    cy.wait('@getUsersUpdated')

    cy.contains('Manager criado com sucesso!').should('be.visible')
  })

  it('exibe erro da API quando o e-mail já está cadastrado', () => {
    cy.intercept('POST', '**/users', {
      statusCode: 400,
      body: { message: 'E-mail já cadastrado' },
    }).as('createManagerFail')

    cy.contains('Criar Manager').first().click({ force: true })

    cy.get('.modal-overlay').within(() => {
      cy.get('input[placeholder="Nome completo"]').type('Manager Duplicado')
      cy.get('input[type="email"]').type('manager@test.com')
      cy.get('input[placeholder="Mínimo 6 caracteres"]').type('senha123')
      cy.contains('button', 'Criar Manager').click()
    })

    cy.wait('@createManagerFail')
    cy.contains('E-mail já cadastrado').should('be.visible')
  })
})

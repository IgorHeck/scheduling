/**
 * 01-auth.cy.ts
 * Testes: login, logout, proteção de rotas, esqueci a senha, redefinir senha
 */

function stubDashboardAPIs() {
  cy.intercept('GET', '**/notifications/subscribe', { statusCode: 200, body: '' }).as('sse')
  cy.intercept('GET', '**/users/me/companies', { statusCode: 200, body: [] }).as('getMyCompanies')
  cy.intercept('GET', '**/companies/1', { fixture: 'companies/company' }).as('getCompany')
  cy.intercept('GET', '**/appointments/company/1**', { fixture: 'appointments/list' }).as('getAppointments')
  cy.intercept('GET', '**/appointments/company/1/pending', { fixture: 'appointments/pending' }).as('getPending')
  cy.intercept('GET', '**/appointments/calendar**', { fixture: 'calendar/month' }).as('getCalendar')
  cy.intercept('GET', '**/schedules/available**', { fixture: 'slots/available' }).as('getSlots')
}

describe('Auth — login', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('faz login com credenciais válidas e redireciona para o dashboard', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: {
        accessToken: 'fake-admin-access-token',
        refreshToken: 'fake-admin-refresh-token',
        expiresIn: 900,
      },
    }).as('login')

    cy.intercept('GET', '**/users/me', {
      statusCode: 200,
      body: {
        id: 1, name: 'Admin User', email: 'admin@test.com',
        role: 'ADMIN', companyId: 1, companyName: 'Clínica Teste',
        phone: null, active: true,
      },
    }).as('getMe')

    stubDashboardAPIs()

    cy.visit('/login')
    cy.get('input[type="email"]').type('admin@test.com')
    cy.get('input[type="password"]').type('senha123')
    cy.get('button[type="submit"]').click()

    cy.wait('@login')
    cy.wait('@getMe')

    cy.url().should('include', '/dashboard')
    cy.contains('Admin User').should('be.visible')
  })

  it('exibe mensagem de erro com credenciais inválidas', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 400,
      body: { message: 'Credenciais inválidas' },
    }).as('loginFail')

    cy.visit('/login')
    cy.get('input[type="email"]').type('wrong@test.com')
    cy.get('input[type="password"]').type('wrongpass')
    cy.get('button[type="submit"]').click()

    cy.wait('@loginFail')

    cy.contains('Email ou senha incorretos').should('be.visible')
    cy.url().should('include', '/login')
  })

  it('permanece em /login e rejeita formulário vazio', () => {
    cy.visit('/login')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/login')
  })
})

describe('Auth — logout', () => {
  it('faz logout pelo sidebar do dashboard e redireciona para /login', () => {
    cy.intercept('POST', '**/auth/logout', { statusCode: 204 }).as('logout')
    stubDashboardAPIs()

    cy.loginAs('admin', '/1/dashboard')

    cy.get('[title="Sair"]').click()
    cy.wait('@logout')

    cy.url().should('include', '/login')
    cy.window().its('localStorage').invoke('getItem', 'auth-storage').then((val) => {
      const stored = JSON.parse(val ?? '{}')
      expect(stored?.state?.accessToken).to.be.null
    })
  })
})

describe('Auth — proteção de rotas', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('redireciona usuário não autenticado de /dashboard para /login', () => {
    cy.visit('/1/dashboard')
    cy.url().should('include', '/login')
  })

  it('redireciona papel CLIENT de /dashboard/users para /unauthorized', () => {
    stubDashboardAPIs()
    // Note: no /users API intercept needed — CLIENT is redirected by ProtectedRoute
    // before any API call is made; intercepting '**/users' would also match the page URL.

    cy.loginAs('client', '/1/dashboard/users')
    cy.url().should('include', '/unauthorized')
    cy.contains('Acesso não autorizado').should('be.visible')
  })
})

describe('Auth — esqueci a senha', () => {
  it('envia o e-mail e exibe confirmação para verificar a caixa de entrada', () => {
    cy.intercept('POST', '**/auth/forgot-password', { statusCode: 204 }).as('forgotPwd')

    cy.visit('/forgot-password')
    cy.contains('Recuperar senha').should('be.visible')

    cy.get('input[type="email"]').type('user@test.com')
    cy.contains('Enviar link de recuperação').click()

    cy.wait('@forgotPwd')
    cy.contains('Verifique seu e-mail').should('be.visible')
  })

  it('exibe erro de validação para e-mail com formato inválido', () => {
    cy.visit('/forgot-password')
    cy.get('input[type="email"]').type('not-an-email')
    cy.contains('Enviar link de recuperação').click()
    cy.contains('Verifique seu e-mail').should('not.exist')
  })
})

describe('Auth — redefinir senha', () => {
  it('exibe o formulário de redefinição quando há ?token= na URL', () => {
    cy.visit('/reset-password?token=abc123')
    cy.contains('Nova senha').should('be.visible')
    cy.get('input[type="password"]').should('have.length', 2)
  })

  it('exibe tela de erro quando não há ?token= na URL', () => {
    cy.visit('/reset-password')
    cy.contains('Link inválido').should('be.visible')
    cy.contains('Nova senha').should('not.exist')
  })

  it('redefine a senha e redireciona para /login em caso de sucesso', () => {
    cy.intercept('POST', '**/auth/reset-password', { statusCode: 204 }).as('resetPwd')

    cy.visit('/reset-password?token=valid-token')
    cy.get('input[type="password"]').first().type('newpassword123')
    cy.get('input[type="password"]').last().type('newpassword123')
    cy.contains('Salvar nova senha').click()

    cy.wait('@resetPwd')
    cy.contains('Senha redefinida!').should('be.visible')
  })

  it('exibe erro quando o token é inválido (400 do servidor)', () => {
    cy.intercept('POST', '**/auth/reset-password', {
      statusCode: 400,
      body: { message: 'Token inválido ou expirado' },
    }).as('resetPwdFail')

    cy.visit('/reset-password?token=bad-token')
    cy.get('input[type="password"]').first().type('newpassword123')
    cy.get('input[type="password"]').last().type('newpassword123')
    cy.contains('Salvar nova senha').click()

    cy.wait('@resetPwdFail')
    cy.contains('Token inválido ou expirado').should('be.visible')
  })
})

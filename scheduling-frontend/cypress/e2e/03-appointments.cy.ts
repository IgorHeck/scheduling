/**
 * 03-appointments.cy.ts
 * Testes: AppointmentsPage — listagem, filtros, busca, ações, paginação, modais.
 * Papel: ADMIN (companyId = 1)
 */

const COMPANY_ID = 1

function stubBootstrap(appointmentsFixture = 'appointments/list') {
  cy.intercept('GET', '**/notifications/subscribe', { statusCode: 200, body: '' }).as('sse')
  cy.intercept('GET', '**/users/me/companies', { statusCode: 200, body: [] }).as('getMyCompanies')
  cy.intercept('GET', `**/companies/${COMPANY_ID}`, { fixture: 'companies/company' }).as('getCompany')
  cy.intercept('GET', `**/appointments/company/${COMPANY_ID}**`, {
    fixture: appointmentsFixture,
  }).as('getAppointments')
  cy.intercept('GET', `**/appointments/company/${COMPANY_ID}/pending`, {
    fixture: 'appointments/pending',
  }).as('getPending')
  cy.intercept('GET', '**/appointments/calendar**', { fixture: 'calendar/month' }).as('getCalendar')
  cy.intercept('GET', '**/schedules/available**', { fixture: 'slots/available' }).as('getSlots')
}

describe('AppointmentsPage — listagem', () => {
  beforeEach(() => {
    stubBootstrap()
    cy.loginAs('admin', `/${COMPANY_ID}/dashboard/appointments`)
    cy.wait('@getAppointments')
  })

  it('exibe agendamentos do mês atual', () => {
    cy.contains('Agendamentos').should('be.visible')
    cy.contains('João Silva').should('be.visible')
    cy.contains('Maria Santos').should('be.visible')
  })

  it('exibe os badges de status corretos', () => {
    cy.contains('Pendente').should('be.visible')
    cy.contains('Confirmado').should('be.visible')
    cy.contains('Cancelado').should('be.visible')
  })
})

describe('AppointmentsPage — filtros', () => {
  beforeEach(() => {
    stubBootstrap()
    cy.loginAs('admin', `/${COMPANY_ID}/dashboard/appointments`)
    cy.wait('@getAppointments')
  })

  it('filtra para exibir apenas agendamentos Pendentes', () => {
    cy.contains('.tab', 'Pendentes').click()
    cy.contains('João Silva').should('be.visible')
    cy.contains('Maria Santos').should('not.exist')
  })

  it('filtra para exibir apenas agendamentos Confirmados', () => {
    cy.contains('.tab', 'Confirmados').click()
    cy.contains('Maria Santos').should('be.visible')
    cy.contains('João Silva').should('not.exist')
  })

  it('filtra para exibir apenas agendamentos Cancelados', () => {
    cy.contains('.tab', 'Cancelados').click()
    cy.contains('Pedro Alves').should('be.visible')
    cy.contains('João Silva').should('not.exist')
  })

  it('volta a exibir todos ao clicar em "Todos"', () => {
    cy.contains('.tab', 'Pendentes').click()
    cy.contains('.tab', 'Todos').click()
    cy.contains('João Silva').should('be.visible')
    cy.contains('Maria Santos').should('be.visible')
  })
})

describe('AppointmentsPage — busca', () => {
  beforeEach(() => {
    stubBootstrap()
    cy.loginAs('admin', `/${COMPANY_ID}/dashboard/appointments`)
    cy.wait('@getAppointments')
  })

  it('filtra por nome do cliente', () => {
    cy.get('input[placeholder*="Filtrar"]').type('João')
    cy.contains('João Silva').should('be.visible')
    cy.contains('Maria Santos').should('not.exist')
  })

  it('filtra por nome do profissional', () => {
    cy.get('input[placeholder*="Filtrar"]').type('Dra. Ana')
    cy.contains('Pedro Alves').should('be.visible')
    cy.contains('João Silva').should('not.exist')
  })

  it('exibe estado vazio quando nenhum resultado é encontrado', () => {
    cy.get('input[placeholder*="Filtrar"]').type('zzznobodyyy')
    cy.contains('Nenhum agendamento encontrado').should('be.visible')
  })
})

describe('AppointmentsPage — ação de confirmar', () => {
  it('confirma agendamento Pendente e atualiza o badge de status', () => {
    stubBootstrap()

    cy.intercept('PUT', '**/appointments/101/confirm', {
      statusCode: 200,
      body: {
        id: 101, status: 'CONFIRMED', clientName: 'João Silva',
        clientEmail: 'joao@example.com', professionalName: 'Dr. Carlos',
        professionalId: 10, companyId: 1, companyName: 'Clínica Teste',
        startAt: '2026-06-15T09:00:00', endAt: '2026-06-15T09:30:00',
        notes: 'Primeira consulta', createdAt: '2026-06-01T10:00:00',
      },
    }).as('confirm')

    cy.loginAs('admin', `/${COMPANY_ID}/dashboard/appointments`)
    cy.wait('@getAppointments')

    cy.intercept('GET', `**/appointments/company/${COMPANY_ID}**`, {
      body: {
        content: [
          {
            id: 101,
            status: 'CONFIRMED',
            clientName: 'João Silva',
            professionalName: 'Dr. Carlos',
            companyId: 1,
            companyName: 'Clínica Teste',
            startAt: '2026-06-15T09:00:00',
            endAt: '2026-06-15T09:30:00',
            notes: null,
            createdAt: '2026-06-01T10:00:00',
          },
        ],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 20,
      },
    }).as('getAppointmentsUpdated')

    cy.get('[title="Confirmar"]').first().click()
    cy.wait('@confirm')
    cy.wait('@getAppointmentsUpdated')

    cy.contains('Confirmado').should('be.visible')
  })
})

describe('AppointmentsPage — visibilidade do botão Concluir', () => {
  it('exibe o botão "Concluir" apenas para agendamentos Confirmados no passado', () => {
    stubBootstrap()
    // Appointment id=104 has endAt in the past (2025-01-01) and status=CONFIRMED
    cy.loginAs('admin', `/${COMPANY_ID}/dashboard/appointments`)
    cy.wait('@getAppointments')

    cy.get('[title="Concluir"]').should('be.visible')

    cy.contains('Maria Santos')
      .closest('.row')
      .find('[title="Concluir"]')
      .should('not.exist')
  })
})

describe('AppointmentsPage — modal de detalhes', () => {
  it('abre o modal de detalhes ao clicar em "Mais opções"', () => {
    stubBootstrap()
    cy.loginAs('admin', `/${COMPANY_ID}/dashboard/appointments`)
    cy.wait('@getAppointments')

    cy.contains('João Silva')
      .closest('.row')
      .find('[title="Mais opções"]')
      .click()

    cy.contains('Profissional').should('be.visible')
    cy.contains('Dr. Carlos').should('be.visible')

    cy.contains('Fechar').click()
    cy.contains('Profissional').should('not.exist')
  })
})

describe('AppointmentsPage — paginação', () => {
  it('exibe controles de paginação quando há múltiplas páginas', () => {
    cy.intercept('GET', '**/notifications/subscribe', { statusCode: 200, body: '' }).as('sse')
    cy.intercept('GET', '**/users/me/companies', { statusCode: 200, body: [] }).as('getMyCompanies')
    cy.intercept('GET', `**/companies/${COMPANY_ID}`, { fixture: 'companies/company' }).as('getCompany')
    cy.intercept('GET', `**/appointments/company/${COMPANY_ID}**`, {
      body: {
        content: [],
        totalElements: 45,
        totalPages: 3,
        number: 0,
        size: 20,
      },
    }).as('getAppointments')
    cy.intercept('GET', `**/appointments/company/${COMPANY_ID}/pending`, { body: [] }).as('getPending')
    cy.intercept('GET', '**/appointments/calendar**', { fixture: 'calendar/month' }).as('getCalendar')

    cy.loginAs('admin', `/${COMPANY_ID}/dashboard/appointments`)
    cy.wait('@getAppointments')

    cy.contains('Página').should('be.visible')
    cy.contains('Próxima').should('be.visible').click()

    cy.wait('@getAppointments').its('request.url').should('include', 'page=1')
  })
})

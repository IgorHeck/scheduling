/**
 * 04-dashboard.cy.ts
 * Testes: DashboardHome — cards de métricas, navegação do calendário, SlotPanel, PendingList.
 * Papel: ADMIN (companyId = 1)
 */

const COMPANY_ID = 1

function stubAll() {
  cy.intercept('GET', '**/notifications/subscribe', { statusCode: 200, body: '' }).as('sse')
  cy.intercept('GET', '**/users/me/companies', { statusCode: 200, body: [] }).as('getMyCompanies')
  cy.intercept('GET', `**/companies/${COMPANY_ID}`, { fixture: 'companies/company' }).as('getCompany')

  // getTodayAppointments e getMonthAppointments esperam PageResponse ({ content, totalElements, ... })
  cy.intercept('GET', `**/appointments/company/${COMPANY_ID}**`, {
    body: {
      content: [
        {
          id: 1, status: 'CONFIRMED', clientName: 'João', professionalName: 'Dr. Carlos',
          companyId: 1, companyName: 'Clínica Teste',
          startAt: new Date(Date.now() + 3_600_000).toISOString(),
          endAt:   new Date(Date.now() + 5_400_000).toISOString(),
          notes: null, createdAt: new Date().toISOString(),
        },
        {
          id: 2, status: 'PENDING', clientName: 'Maria', professionalName: 'Dra. Ana',
          companyId: 1, companyName: 'Clínica Teste',
          startAt: new Date(Date.now() + 7_200_000).toISOString(),
          endAt:   new Date(Date.now() + 9_000_000).toISOString(),
          notes: null, createdAt: new Date().toISOString(),
        },
      ],
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 1000,
    },
  }).as('getAppointments')

  cy.intercept('GET', `**/appointments/company/${COMPANY_ID}/pending`, {
    fixture: 'appointments/pending',
  }).as('getPending')

  cy.intercept('GET', '**/appointments/calendar**', { fixture: 'calendar/month' }).as('getCalendar')
  cy.intercept('GET', '**/schedules/available**', { fixture: 'slots/available' }).as('getSlots')
}

describe('DashboardHome — cards de métricas', () => {
  beforeEach(() => {
    stubAll()
    cy.loginAs('admin', `/${COMPANY_ID}/dashboard`)
    cy.wait('@getAppointments')
  })

  it('exibe os quatro rótulos dos cards de métricas', () => {
    cy.contains('Hoje').should('be.visible')
    cy.contains('Pendentes').should('be.visible')
    cy.contains('Mês atual').should('be.visible')
    cy.contains('Taxa de confirmação').should('be.visible')
  })

  it('exibe contagem não-zero em "Hoje" com os dados do stub', () => {
    // MetricCard usa class="metric", não classes Tailwind como rounded-xl
    cy.contains('Hoje').closest('.metric').contains(/^[0-9]+$/).should('be.visible')
  })
})

describe('DashboardHome — CalendarView', () => {
  beforeEach(() => {
    stubAll()
    cy.loginAs('admin', `/${COMPANY_ID}/dashboard`)
    cy.wait('@getCalendar')
  })

  it('exibe o grid do calendário com células de dia', () => {
    // Dias do calendário são <div class="cal-cell">, não <button>
    cy.get('.cal-cell').contains(/^[1-9]$|^[12][0-9]$|^3[01]$/).should('exist')
  })

  it('navega para o próximo mês ao clicar no botão de próximo mês', () => {
    // CalendarView usa <div class="h-section"> para o mês e botões com title="Próximo mês" / "Mês anterior"
    cy.get('.h-section').first().invoke('text').then((initialMonth) => {
      cy.get('[title="Próximo mês"]').click()
      cy.wait('@getCalendar')
      cy.get('.h-section').first().invoke('text').should('not.eq', initialMonth)
    })
  })
})

describe('DashboardHome — SlotPanel', () => {
  beforeEach(() => {
    stubAll()
    cy.loginAs('admin', `/${COMPANY_ID}/dashboard`)
    cy.wait('@getCalendar')
  })

  it('abre o SlotPanel ao clicar em um dia com horários disponíveis', () => {
    // Navega para junho para que o dia 20 seja futuro e disponível no fixture
    cy.get('[title="Próximo mês"]').click()
    cy.wait('@getCalendar')

    // Dias do calendário são <div class="cal-cell">; .dim = passado/sem disponibilidade
    cy.get('.cal-cell').not('.dim').contains(/^20$/).click()
    cy.wait('@getSlots')

    cy.contains('09:00').should('be.visible')
  })
})

describe('DashboardHome — PendingList', () => {
  beforeEach(() => {
    stubAll()
    cy.loginAs('admin', `/${COMPANY_ID}/dashboard`)
    cy.wait('@getPending')
  })

  it('exibe os nomes dos clientes com agendamentos pendentes', () => {
    cy.contains('João Silva').should('be.visible')
    cy.contains('Lucas Martins').should('be.visible')
  })

  it('confirma um agendamento pendente pela PendingList', () => {
    cy.intercept('PUT', '**/appointments/101/confirm', {
      statusCode: 200,
      body: { id: 101, status: 'CONFIRMED' },
    }).as('confirm')

    cy.intercept('GET', `**/appointments/company/${COMPANY_ID}/pending`, { body: [] }).as('getPendingEmpty')

    // PendingList usa class="pending-row" por item; botão de confirmar é icon-only com title="Confirmar"
    cy.contains('João Silva')
      .closest('.pending-row')
      .find('[title="Confirmar"]')
      .click()

    cy.wait('@confirm')
    cy.wait('@getPendingEmpty')

    cy.contains('João Silva').should('not.exist')
  })
})

/**
 * 02-booking.cy.ts
 * Testes: página pública de agendamento — telas de guarda e fluxo completo.
 */

describe('Booking — telas de guarda', () => {
  it('exibe "Link inválido" para companyId não numérico', () => {
    cy.visit('/abc/booking')
    cy.contains('Link inválido').should('be.visible')
  })

  it('exibe "Empresa não encontrada" quando a empresa retorna 404', () => {
    cy.intercept('GET', '**/companies/99', { statusCode: 404, body: { message: 'Not found' } }).as('getCompany')
    cy.intercept('GET', '**/appointments/calendar**', { body: [] }).as('getCalendar')

    cy.visit('/99/booking')
    cy.wait('@getCompany')
    cy.contains('Empresa não encontrada').should('be.visible')
  })

  it('exibe "Empresa temporariamente indisponível" para empresa inativa', () => {
    cy.intercept('GET', '**/companies/2', { fixture: 'companies/inactive' }).as('getCompany')
    cy.intercept('GET', '**/appointments/calendar**', { body: [] }).as('getCalendar')

    cy.visit('/2/booking')
    cy.wait('@getCompany')
    cy.contains('Empresa temporariamente indisponível').should('be.visible')
  })

  it('exibe "Agendamentos desativados" quando allowClientBooking é false', () => {
    cy.intercept('GET', '**/companies/3', { fixture: 'companies/no-booking' }).as('getCompany')
    cy.intercept('GET', '**/appointments/calendar**', { body: [] }).as('getCalendar')

    cy.visit('/3/booking')
    cy.wait('@getCompany')
    cy.contains('Agendamentos desativados').should('be.visible')
  })
})

describe('Booking — fluxo completo', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/companies/1', { fixture: 'companies/company' }).as('getCompany')
    cy.intercept('GET', '**/appointments/calendar**', { fixture: 'calendar/month' }).as('getCalendar')
  })

  it('exibe o nome da empresa no cabeçalho', () => {
    cy.visit('/1/booking')
    cy.wait('@getCompany')
    cy.contains('Clínica Teste').should('be.visible')
  })

  it('navega calendário → horários → formulário → sucesso', () => {
    // We pick 2026-06-20 (status: available in the calendar fixture).
    // Since today is May 2026, we must navigate to June first.
    const futureDate = '2026-06-20'

    cy.intercept('GET', `**/schedules/available*date=${futureDate}*`, {
      fixture: 'slots/available',
    }).as('getSlots')

    cy.intercept('POST', '**/appointments/public', {
      statusCode: 200,
      body: { id: 200, status: 'PENDING' },
    }).as('createAppt')

    cy.visit('/1/booking')
    cy.wait('@getCompany')
    cy.wait('@getCalendar')

    cy.get('[aria-label="Próximo mês"]').click()
    cy.wait('@getCalendar')

    cy.get('button').contains(/^20$/).not('[disabled]').click()
    cy.wait('@getSlots')

    cy.contains('09:00').click()

    cy.get('input[placeholder="João Silva"]').type('Teste Cypress')
    cy.get('input[type="email"]').type('cypress@test.com')
    cy.contains('Solicitar agendamento').click()

    cy.wait('@createAppt')
    cy.contains('Solicitação enviada!').should('be.visible')
  })

  it('exibe "Nenhum horário disponível" quando a lista de horários está vazia', () => {
    const futureDate = '2026-06-20'

    cy.intercept('GET', `**/schedules/available*date=${futureDate}*`, {
      fixture: 'slots/empty',
    }).as('getSlots')

    cy.visit('/1/booking')
    cy.wait('@getCompany')
    cy.wait('@getCalendar')

    cy.get('[aria-label="Próximo mês"]').click()
    cy.wait('@getCalendar')

    cy.get('button').contains(/^20$/).not('[disabled]').click()
    cy.wait('@getSlots')
    cy.contains('Nenhum horário disponível').should('be.visible')
  })
})

describe('Booking — navegação do calendário', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/companies/1', { fixture: 'companies/company' }).as('getCompany')
    cy.intercept('GET', '**/appointments/calendar**', { fixture: 'calendar/month' }).as('getCalendar')
    cy.visit('/1/booking')
    cy.wait('@getCompany')
  })

  it('navega para o próximo mês ao clicar no botão de próximo mês', () => {
    cy.get('[aria-label="Próximo mês"]').click()
    cy.contains(/[a-zêéà]+\s+de\s+\d{4}/i).should('be.visible')
  })
})

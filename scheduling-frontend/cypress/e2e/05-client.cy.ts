/**
 * 05-client.cy.ts
 * Testes: MyAppointmentsPage — listagem, próximo agendamento, filtros, cancelar, remarcar, detalhes, modal de clínica.
 * Papel: CLIENT
 */

const MY_APPOINTMENTS_PAGE = {
  content: [
    {
      id: 201,
      status: 'CONFIRMED',
      clientName: 'Cliente User',
      clientEmail: 'client@test.com',
      professionalName: 'Dr. Carlos',
      professionalId: 10,
      companyId: 1,
      companyName: 'Clínica Teste',
      startAt: new Date(Date.now() + 24 * 3_600_000).toISOString(),
      endAt:   new Date(Date.now() + 24 * 3_600_000 + 1_800_000).toISOString(),
      notes: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 202,
      status: 'PENDING',
      clientName: 'Cliente User',
      clientEmail: 'client@test.com',
      professionalName: 'Dra. Ana',
      professionalId: 11,
      companyId: 1,
      companyName: 'Clínica Teste',
      startAt: new Date(Date.now() + 48 * 3_600_000).toISOString(),
      endAt:   new Date(Date.now() + 48 * 3_600_000 + 1_800_000).toISOString(),
      notes: 'Trazer documentos',
      createdAt: new Date().toISOString(),
    },
  ],
  totalElements: 2,
  totalPages: 1,
  number: 0,
  size: 10,
}

function stubMyAppointments(fixture = MY_APPOINTMENTS_PAGE) {
  // Usar **/api/v1/appointments** para casar URLs com query params como ?page=0&size=10
  cy.intercept('GET', '**/api/v1/appointments**', { body: fixture }).as('getMyAppts')
  cy.intercept('GET', '**/notifications/subscribe', { statusCode: 200, body: '' }).as('sse')
}

describe('MyAppointmentsPage — listagem', () => {
  beforeEach(() => {
    stubMyAppointments()
    cy.loginAs('client', '/my-appointments')
    cy.wait('@getMyAppts')
  })

  it('exibe o cabeçalho da página', () => {
    cy.contains('Meus agendamentos').should('be.visible')
  })

  it('lista os agendamentos do cliente', () => {
    cy.contains('Clínica Teste').should('be.visible')
    cy.contains('Dr. Carlos').should('be.visible')
  })

  it('destaca o próximo agendamento no topo em azul', () => {
    cy.contains('Próximo agendamento').should('be.visible')
    cy.contains('Confirmado').should('be.visible')
  })
})

describe('MyAppointmentsPage — filtros', () => {
  beforeEach(() => {
    stubMyAppointments()
    cy.loginAs('client', '/my-appointments')
    cy.wait('@getMyAppts')
  })

  it('exibe todos os agendamentos por padrão', () => {
    cy.contains('Dr. Carlos').should('be.visible')
    cy.contains('Dra. Ana').should('be.visible')
  })

  it('filtra para exibir apenas agendamentos Confirmados', () => {
    cy.contains('button', 'Confirmados').click()
    cy.contains('Dr. Carlos').should('be.visible')
    cy.contains('Dra. Ana').should('not.exist')
  })

  it('filtra para exibir apenas agendamentos Pendentes', () => {
    cy.contains('button', 'Pendentes').click()
    cy.contains('Dra. Ana').should('be.visible')
    // O card "Próximo agendamento" sempre exibe o próximo upcoming (Dr. Carlos, CONFIRMED)
    // independentemente do filtro ativo, portanto a verificação é restrita aos cards da lista
    cy.get('.card').contains('Dr. Carlos').should('not.exist')
  })
})

describe('MyAppointmentsPage — cancelamento', () => {
  it('exibe confirmação inline e cancela o agendamento', () => {
    stubMyAppointments()

    cy.intercept('PUT', '**/appointments/201/cancel**', {
      statusCode: 200,
      body: { id: 201, status: 'CANCELLED' },
    }).as('cancel')

    cy.loginAs('client', '/my-appointments')
    cy.wait('@getMyAppts')

    cy.intercept('GET', '**/api/v1/appointments**', {
      body: {
        ...MY_APPOINTMENTS_PAGE,
        content: [
          { ...MY_APPOINTMENTS_PAGE.content[0], status: 'CANCELLED' },
          MY_APPOINTMENTS_PAGE.content[1],
        ],
      },
    }).as('getMyApptsCancelled')

    cy.contains('Cancelar agendamento').first().click()
    cy.contains('Confirmar cancelamento?').should('be.visible')

    cy.contains('Sim, cancelar').click()
    cy.wait('@cancel')
    cy.wait('@getMyApptsCancelled')

    cy.contains('Cancelado').should('be.visible')
  })

  it('descarta a confirmação ao clicar em "Voltar"', () => {
    stubMyAppointments()
    cy.loginAs('client', '/my-appointments')
    cy.wait('@getMyAppts')

    cy.contains('Cancelar agendamento').first().click()
    cy.contains('Confirmar cancelamento?').should('be.visible')
    cy.contains('Voltar').click()
    cy.contains('Confirmar cancelamento?').should('not.exist')
  })
})

describe('MyAppointmentsPage — modal de remarcar', () => {
  it('abre e fecha o modal de remarcar', () => {
    stubMyAppointments()
    cy.intercept('GET', '**/schedules/available**', { fixture: 'slots/available' }).as('getSlots')

    cy.loginAs('client', '/my-appointments')
    cy.wait('@getMyAppts')

    cy.contains('Remarcar').first().click()
    cy.contains('Remarcar agendamento').should('be.visible')

    // Fechar via botão "Cancelar" no footer do modal (o X do header é ícone SVG sem texto)
    cy.get('.modal').contains('Cancelar').click()
    cy.contains('Remarcar agendamento').should('not.exist')
  })
})

describe('MyAppointmentsPage — modal de detalhes', () => {
  it('abre o modal de detalhes com os dados do agendamento', () => {
    stubMyAppointments()
    cy.loginAs('client', '/my-appointments')
    cy.wait('@getMyAppts')

    cy.contains('Ver detalhes').first().click()
    cy.contains('Profissional').should('be.visible')
    cy.contains('Dr. Carlos').should('be.visible')

    cy.contains('Fechar').click()
    cy.contains('Profissional').should('not.exist')
  })
})

describe('MyAppointmentsPage — novo agendamento (modal de seleção de clínica)', () => {
  it('abre o modal de seleção de clínica ao clicar em "Novo agendamento"', () => {
    stubMyAppointments()
    cy.intercept('GET', '**/companies', {
      body: [{ id: 1, name: 'Clínica Teste', active: true, allowClientBooking: true }],
    }).as('getCompanies')

    cy.loginAs('client', '/my-appointments')
    cy.wait('@getMyAppts')

    cy.contains('Novo agendamento').click()
    cy.wait('@getCompanies')

    cy.contains('Escolha a clínica').should('be.visible')
    cy.contains('Clínica Teste').should('be.visible')
  })

  it('navega para a página de agendamento ao selecionar uma clínica', () => {
    stubMyAppointments()
    cy.intercept('GET', '**/companies', {
      body: [{ id: 1, name: 'Clínica Teste', active: true, allowClientBooking: true, address: null, phone: null }],
    }).as('getCompanies')

    cy.loginAs('client', '/my-appointments')
    cy.wait('@getMyAppts')

    cy.contains('Novo agendamento').click()
    cy.wait('@getCompanies')

    cy.get('.modal').contains('Clínica Teste').click()
    cy.url().should('include', '/1/booking')
  })

  it('exibe estado vazio quando nenhuma clínica aceita agendamentos', () => {
    stubMyAppointments()
    cy.intercept('GET', '**/companies', {
      body: [{ id: 4, name: 'Clínica Fechada', active: false, allowClientBooking: false }],
    }).as('getCompanies')

    cy.loginAs('client', '/my-appointments')
    cy.wait('@getMyAppts')

    cy.contains('Novo agendamento').click()
    cy.wait('@getCompanies')

    cy.contains('Nenhuma clínica disponível').should('be.visible')
  })
})

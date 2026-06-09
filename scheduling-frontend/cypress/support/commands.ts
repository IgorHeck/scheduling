/// <reference types="cypress" />

/**
 * cy.loginAs(role)
 *
 * Writes the Zustand 'auth-storage' key into localStorage (via onBeforeLoad)
 * and visits `url` so the app initialises already authenticated.
 *
 * Usage:
 *   cy.loginAs('admin', '/1/dashboard')
 *   cy.loginAs('client', '/my-appointments')
 */
Cypress.Commands.add('loginAs', (role: 'admin' | 'manager' | 'client', url = '/') => {
  cy.fixture(`auth/${role}`).then((auth: { accessToken: string; refreshToken: string; user: object }) => {
    const stored = JSON.stringify({
      state: {
        accessToken:  auth.accessToken,
        refreshToken: auth.refreshToken,
        user:         auth.user,
      },
      version: 0,
    })

    cy.visit(url, {
      onBeforeLoad(win) {
        win.localStorage.setItem('auth-storage', stored)
      },
    })
  })
})

// ─── TypeScript declarations ─────────────────────────────────────────────────
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Log in as the given role by injecting auth-storage into localStorage
       * before visiting `url` (default: '/').
       */
      loginAs(role: 'admin' | 'manager' | 'client', url?: string): Chainable<void>
    }
  }
}

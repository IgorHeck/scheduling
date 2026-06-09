// Import jest-dom matchers (optional — gives .toBeVisible(), etc. in cy assertions)
import './commands'

// Silence SSE EventSource errors in the Cypress command log
// (the app opens a persistent SSE connection that Cypress sees as an error when it closes)
Cypress.on('uncaught:exception', (err) => {
  // EventSource reconnect errors and React Query retries are expected in tests
  if (
    err.message.includes('EventSource') ||
    err.message.includes('ResizeObserver') ||
    err.message.includes('Network Error')
  ) {
    return false // prevent failing the test
  }
  return true
})

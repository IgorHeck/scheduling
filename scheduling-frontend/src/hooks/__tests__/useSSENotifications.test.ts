import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// ---------------------------------------------------------------------------
// Mocks — must come before importing the hook so Vitest hoists them
// ---------------------------------------------------------------------------

vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('../useNotifications', () => ({
  useNotifications: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Now import the items we mocked so we can configure them per-test
// ---------------------------------------------------------------------------
import { useAuthStore } from '../../store/authStore'
import { useNotifications } from '../useNotifications'
import { useSSENotifications } from '../useSSENotifications'

// ---------------------------------------------------------------------------
// Fake EventSource
// ---------------------------------------------------------------------------
class FakeEventSource {
  static instance: FakeEventSource | null = null
  url: string
  listeners: Map<string, Array<(e: MessageEvent) => void>> = new Map()
  closed = false

  constructor(url: string) {
    this.url = url
    FakeEventSource.instance = this
  }

  addEventListener(type: string, listener: (e: MessageEvent) => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, [])
    this.listeners.get(type)!.push(listener)
  }

  emit(type: string, data: unknown) {
    const handlers = this.listeners.get(type) ?? []
    const event = { data: JSON.stringify(data) } as MessageEvent
    handlers.forEach(h => h(event))
  }

  close() {
    this.closed = true
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function wrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

function mockAuthStore(accessToken: string | null, userId?: number) {
  vi.mocked(useAuthStore).mockReturnValue({
    accessToken,
    user: accessToken ? { id: userId ?? 1, email: 'user@test.com', name: 'User', role: 'CLIENT', companyId: null } : null,
  } as ReturnType<typeof useAuthStore>)
}

const mockNotify = vi.fn()

beforeEach(() => {
  FakeEventSource.instance = null
  vi.stubGlobal('EventSource', FakeEventSource)
  vi.mocked(useNotifications).mockReturnValue({
    requestPermission: vi.fn(),
    notify: mockNotify,
  })
  mockNotify.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('useSSENotifications', () => {
  it('does NOT open EventSource when there is no access token', () => {
    mockAuthStore(null)
    const qc = makeQueryClient()
    renderHook(() => useSSENotifications(), { wrapper: wrapper(qc) })
    expect(FakeEventSource.instance).toBeNull()
  })

  it('opens EventSource with token encoded in the URL', () => {
    mockAuthStore('my-token')
    const qc = makeQueryClient()
    renderHook(() => useSSENotifications(), { wrapper: wrapper(qc) })
    expect(FakeEventSource.instance).not.toBeNull()
    expect(FakeEventSource.instance!.url).toContain('?token=')
    expect(FakeEventSource.instance!.url).toContain(encodeURIComponent('my-token'))
  })

  it('closes the EventSource on unmount', () => {
    mockAuthStore('my-token')
    const qc = makeQueryClient()
    const { unmount } = renderHook(() => useSSENotifications(), { wrapper: wrapper(qc) })
    const es = FakeEventSource.instance!
    unmount()
    expect(es.closed).toBe(true)
  })

  it('registers listeners for all 4 SSE event types', () => {
    mockAuthStore('my-token')
    const qc = makeQueryClient()
    renderHook(() => useSSENotifications(), { wrapper: wrapper(qc) })
    const es = FakeEventSource.instance!
    const eventTypes = ['NEW_PENDING', 'APPOINTMENT_CONFIRMED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_RESCHEDULED']
    eventTypes.forEach(type => {
      expect(es.listeners.has(type)).toBe(true)
    })
  })

  it('invalidates React Query keys when an SSE event arrives', () => {
    mockAuthStore('my-token')
    const qc = makeQueryClient()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')
    renderHook(() => useSSENotifications(), { wrapper: wrapper(qc) })

    FakeEventSource.instance!.emit('NEW_PENDING', {
      type: 'NEW_PENDING',
      message: 'Novo agendamento',
      appointmentId: 42,
    })

    // Should invalidate: appointments, my-appointments, calendar
    expect(invalidateSpy).toHaveBeenCalledTimes(3)
    const calledKeys = invalidateSpy.mock.calls.map(c => (c[0] as { queryKey: unknown[] }).queryKey)
    expect(calledKeys).toContainEqual(['appointments'])
    expect(calledKeys).toContainEqual(['my-appointments'])
    expect(calledKeys).toContainEqual(['calendar'])
  })

  it.each([
    ['NEW_PENDING',             '📅 Novo agendamento pendente'],
    ['APPOINTMENT_CONFIRMED',   '✅ Agendamento confirmado'],
    ['APPOINTMENT_CANCELLED',   '❌ Agendamento cancelado'],
    ['APPOINTMENT_RESCHEDULED', '🔄 Agendamento remarcado'],
  ])('fires notify with correct title for %s', (eventType, expectedTitle) => {
    mockAuthStore('my-token')
    const qc = makeQueryClient()
    renderHook(() => useSSENotifications(), { wrapper: wrapper(qc) })

    FakeEventSource.instance!.emit(eventType, {
      type: eventType,
      message: 'Mensagem de teste',
      appointmentId: 1,
    })

    expect(mockNotify).toHaveBeenCalledWith(expectedTitle, 'Mensagem de teste')
  })

  it('does not throw on malformed SSE payload (invalid JSON)', () => {
    mockAuthStore('my-token')
    const qc = makeQueryClient()
    renderHook(() => useSSENotifications(), { wrapper: wrapper(qc) })

    const es = FakeEventSource.instance!
    const handlers = es.listeners.get('NEW_PENDING')!
    const badEvent = { data: 'this is not json' } as MessageEvent

    // Should not throw
    expect(() => handlers.forEach(h => h(badEvent))).not.toThrow()
    expect(mockNotify).not.toHaveBeenCalled()
  })

  it('reopens EventSource when the access token changes', () => {
    mockAuthStore('token-v1')
    const qc = makeQueryClient()
    const { rerender } = renderHook(() => useSSENotifications(), { wrapper: wrapper(qc) })
    const firstEs = FakeEventSource.instance

    // Simulate token rotation
    mockAuthStore('token-v2', 1)
    rerender()

    const secondEs = FakeEventSource.instance
    expect(firstEs).not.toBe(secondEs)
    expect(firstEs!.closed).toBe(true)
    expect(secondEs!.url).toContain(encodeURIComponent('token-v2'))
  })
})

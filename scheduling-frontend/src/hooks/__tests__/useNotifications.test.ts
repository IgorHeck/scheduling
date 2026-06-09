import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNotifications } from '../useNotifications'

// ---------------------------------------------------------------------------
// Helpers — replace the global Notification API with configurable stubs
// ---------------------------------------------------------------------------

// Keep a reference to the real Notification so we can restore it after tests
// that remove it from the global scope.
const realNotification = globalThis.Notification

function mockNotificationApi(opts: {
  supported?: boolean
  permission?: NotificationPermission
}) {
  const { supported = true, permission = 'default' } = opts

  if (!supported) {
    // Delete the property entirely so that `'Notification' in window` is false
    delete (globalThis as Record<string, unknown>).Notification
    return
  }

  const NotificationMock = vi.fn() as unknown as typeof Notification & {
    new (title: string, options?: NotificationOptions): Notification
  }
  Object.defineProperty(NotificationMock, 'permission', {
    value: permission,
    writable: true,
    configurable: true,
  })
  NotificationMock.requestPermission = vi.fn().mockResolvedValue('granted')

  vi.stubGlobal('Notification', NotificationMock)
}

beforeEach(() => {
  // Make sure Notification is present before each test (some tests delete it)
  vi.stubGlobal('Notification', realNotification)
})

afterEach(() => {
  // Restore the real Notification in case a test deleted it
  vi.stubGlobal('Notification', realNotification)
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// requestPermission
// ---------------------------------------------------------------------------
describe('useNotifications — requestPermission', () => {
  it('returns "denied" when Notification API is not supported', async () => {
    mockNotificationApi({ supported: false })
    const { result } = renderHook(() => useNotifications())
    const perm = await act(() => result.current.requestPermission())
    expect(perm).toBe('denied')
  })

  it('returns "granted" immediately when permission is already granted', async () => {
    mockNotificationApi({ permission: 'granted' })
    const { result } = renderHook(() => useNotifications())
    const perm = await act(() => result.current.requestPermission())
    expect(perm).toBe('granted')
    expect(Notification.requestPermission).not.toHaveBeenCalled()
  })

  it('calls Notification.requestPermission() when permission is "default"', async () => {
    mockNotificationApi({ permission: 'default' })
    const { result } = renderHook(() => useNotifications())
    const perm = await act(() => result.current.requestPermission())
    expect(Notification.requestPermission).toHaveBeenCalledOnce()
    expect(perm).toBe('granted')
  })

  it('returns current permission without calling requestPermission() when already "denied"', async () => {
    mockNotificationApi({ permission: 'denied' })
    const { result } = renderHook(() => useNotifications())
    const perm = await act(() => result.current.requestPermission())
    expect(perm).toBe('denied')
    expect(Notification.requestPermission).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// notify
// ---------------------------------------------------------------------------
describe('useNotifications — notify', () => {
  it('does nothing when Notification API is not supported', () => {
    mockNotificationApi({ supported: false })
    const { result } = renderHook(() => useNotifications())
    // Should not throw
    expect(() => result.current.notify('Test', 'body')).not.toThrow()
  })

  it('does nothing when permission is not granted', () => {
    mockNotificationApi({ permission: 'default' })
    const { result } = renderHook(() => useNotifications())
    result.current.notify('Test', 'body')
    // Notification constructor must not be called
    expect(Notification).not.toHaveBeenCalled()
  })

  it('creates a Notification with correct title and body when permission is granted', () => {
    mockNotificationApi({ permission: 'granted' })
    const { result } = renderHook(() => useNotifications())
    result.current.notify('Título', 'Corpo da notificação')
    expect(Notification).toHaveBeenCalledOnce()
    expect(Notification).toHaveBeenCalledWith('Título', {
      body: 'Corpo da notificação',
      icon: '/favicon.ico',
      tag: 'scheduling-pending',
    })
  })

  it('creates a Notification without body when body is omitted', () => {
    mockNotificationApi({ permission: 'granted' })
    const { result } = renderHook(() => useNotifications())
    result.current.notify('Só o título')
    expect(Notification).toHaveBeenCalledWith('Só o título', {
      body: undefined,
      icon: '/favicon.ico',
      tag: 'scheduling-pending',
    })
  })
})

import { useEffect } from 'react'

export const DEFAULT_ACCENT = '#69d3a7'

/** localStorage key for a company's chosen accent color. */
export const accentKey = (companyId: number) => `companyAccent:${companyId}`

/**
 * Reads the saved accent for the given company from localStorage and applies it
 * to `--accent` on `:root`. Resets to the default mint on unmount (logout /
 * company switch).
 *
 * TODO: once the backend exposes `accentColor` on GET /companies/{id} and
 * PUT /companies/{id}/settings, replace localStorage read with
 * `company.accentColor ?? DEFAULT_ACCENT`.
 */
export function useAccentColor(companyId?: number | null) {
  useEffect(() => {
    const color =
      companyId
        ? (localStorage.getItem(accentKey(companyId)) ?? DEFAULT_ACCENT)
        : DEFAULT_ACCENT

    document.documentElement.style.setProperty('--accent', color)

    return () => {
      // Reset when DashboardLayout/BookingPage unmounts (logout or company switch)
      document.documentElement.style.setProperty('--accent', DEFAULT_ACCENT)
    }
  }, [companyId])
}

import { PUBLIC_SIERO_API_URL } from '$env/static/public'

/**
 * Utility functions for API route handlers
 * These routes act as proxies to the Rails API
 */

export const API_BASE = new URL(PUBLIC_SIERO_API_URL || 'http://localhost:3000').href

/**
 * Build a full URL for the Rails API
 */
export function buildApiUrl(path: string, params?: Record<string, any>): string {
  const url = new URL(path.startsWith('http') ? path : `${API_BASE}${path}`, API_BASE)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue
      if (Array.isArray(value)) {
        value.forEach((x) => url.searchParams.append(key, String(x)))
      } else {
        url.searchParams.set(key, String(value))
      }
    }
  }

  return url.toString()
}

/**
 * Extract headers that should be forwarded to the Rails API
 */
export function extractHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  const editKey = request.headers.get('X-Edit-Key')
  if (editKey) {
    headers['X-Edit-Key'] = editKey
  }

  return headers
}

/**
 * Common error handler for API routes
 */
export function handleApiError(error: any, action: string) {
  console.error(`Error ${action}:`, error)
  return {
    error: `Failed to ${action}`,
    details: error instanceof Error ? error.message : 'Unknown error'
  }
}
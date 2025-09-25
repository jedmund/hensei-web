# Direct API Architecture Plan v2

## Executive Summary

This document outlines a comprehensive plan to migrate from proxy-endpoint-based API calls to direct API calls in the Hensei SvelteKit application, with proper token lifecycle management, SSR support, and security hardening.

### Key Improvements in v2
- **Token Bootstrap**: Proper SSR token initialization via hooks and layout
- **Refresh Logic**: Single in-flight refresh with proper gating
- **Security**: CSP, short TTL tokens, proper CORS configuration
- **DX**: TanStack Query integration, proper error handling

## Architecture Overview

### Token Flow
```
1. Initial Load (SSR):
   hooks.server.ts → Read refresh cookie → Exchange for access token → Pass to client

2. Client Hydration:
   +layout.svelte → Receive token from SSR → Initialize auth store

3. API Calls:
   Adapter → Check token expiry → Use token or refresh → Retry on 401

4. Token Refresh:
   Single in-flight promise → Exchange refresh token → Update store
```

## Implementation Plan

### Phase 1: Core Authentication Infrastructure

#### 1.1 Auth Store with Refresh Management
`/src/lib/stores/auth.store.ts`:
```typescript
import { writable, get } from 'svelte/store'
import { goto } from '$app/navigation'
import { PUBLIC_SIERO_API_URL } from '$env/static/public'

interface AuthState {
  accessToken: string | null
  user: UserInfo | null
  expiresAt: Date | null
  refreshPromise: Promise<boolean> | null
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    accessToken: null,
    user: null,
    expiresAt: null,
    refreshPromise: null
  })

  const API = `${PUBLIC_SIERO_API_URL ?? 'http://localhost:3000'}/api/v1`

  return {
    subscribe,

    setAuth: (token: string, user: UserInfo, expiresAt: Date) => {
      set({
        accessToken: token,
        user,
        expiresAt,
        refreshPromise: null
      })
    },

    clearAuth: () => {
      set({
        accessToken: null,
        user: null,
        expiresAt: null,
        refreshPromise: null
      })
      goto('/login')
    },

    getToken: () => {
      const state = get(authStore)

      // Check if token needs refresh (60s buffer)
      if (state.expiresAt && state.accessToken) {
        const now = new Date()
        const buffer = new Date(state.expiresAt.getTime() - 60000)

        if (now >= buffer) {
          // Token expired or about to expire, trigger refresh
          return null
        }
      }

      return state.accessToken
    },

    async refreshToken(fetcher: typeof fetch = fetch): Promise<boolean> {
      return update(state => {
        // If refresh already in progress, return existing promise
        if (state.refreshPromise) {
          return state
        }

        // Create new refresh promise
        const promise = (async () => {
          try {
            const response = await fetcher(`${API}/auth/refresh`, {
              method: 'POST',
              credentials: 'include'
            })

            if (!response.ok) {
              this.clearAuth()
              return false
            }

            const { access_token, user, expires_in } = await response.json()
            const expiresAt = new Date(Date.now() + expires_in * 1000)

            this.setAuth(access_token, user, expiresAt)
            return true
          } catch {
            this.clearAuth()
            return false
          } finally {
            update(s => ({ ...s, refreshPromise: null }))
          }
        })()

        return { ...state, refreshPromise: promise }
      }).refreshPromise
    }
  }
}

export const authStore = createAuthStore()
```

#### 1.2 Server Hooks for SSR
`/src/hooks.server.ts`:
```typescript
import type { Handle, HandleFetch } from '@sveltejs/kit'
import { PRIVATE_SIERO_API_URL } from '$env/static/private'
import { REFRESH_COOKIE } from '$lib/auth/cookies'

const API_BASE = PRIVATE_SIERO_API_URL || 'http://localhost:3000'

export const handle: Handle = async ({ event, resolve }) => {
  // Initialize locals
  event.locals.user = null
  event.locals.accessToken = null
  event.locals.expiresAt = null

  // Check for refresh token
  const refreshToken = event.cookies.get(REFRESH_COOKIE)

  if (refreshToken) {
    try {
      // Bootstrap session - exchange refresh for access token
      const response = await fetch(`${API_BASE}/api/v1/auth/bootstrap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': event.request.headers.get('cookie') ?? ''
        },
        credentials: 'include'
      })

      if (response.ok) {
        const { access_token, user, expires_in } = await response.json()
        event.locals.user = user
        event.locals.accessToken = access_token
        event.locals.expiresAt = new Date(Date.now() + expires_in * 1000)
      }
    } catch (error) {
      console.error('Session bootstrap failed:', error)
    }
  }

  // Add CSP headers for security
  const response = await resolve(event)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' http://localhost:3000"
  )

  return response
}

export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
  // For SSR fetches to Rails API, attach access token
  const isApiCall = request.url.startsWith(API_BASE)

  if (isApiCall && event.locals?.accessToken) {
    const headers = new Headers(request.headers)
    headers.set('Authorization', `Bearer ${event.locals.accessToken}`)
    request = new Request(request, {
      headers,
      credentials: 'include'
    })
  }

  return fetch(request)
}
```

#### 1.3 Layout Server Load
`/src/routes/+layout.server.ts`:
```typescript
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    user: locals.user,
    accessToken: locals.accessToken,
    expiresAt: locals.expiresAt?.toISOString() ?? null
  }
}
```

#### 1.4 Layout Client Hydration
`/src/routes/+layout.svelte`:
```typescript
<script lang="ts">
  import { authStore } from '$lib/stores/auth.store'
  import { onMount } from 'svelte'

  export let data

  // Hydrate auth store on client
  onMount(() => {
    if (data?.accessToken && data?.user && data?.expiresAt) {
      authStore.setAuth(
        data.accessToken,
        data.user,
        new Date(data.expiresAt)
      )
    }
  })
</script>

<slot />
```

### Phase 2: Update Base Adapter with Smart Refresh

#### 2.1 Enhanced Base Adapter
`/src/lib/api/adapters/base.adapter.ts`:
```typescript
import { authStore } from '$lib/stores/auth.store'
import { get } from 'svelte/store'
import { PUBLIC_SIERO_API_URL } from '$env/static/public'
import { normalizeError, AdapterError } from './errors'

const API_BASE = `${PUBLIC_SIERO_API_URL ?? 'http://localhost:3000'}/api/v1`

interface RequestOptions extends RequestInit {
  retry?: boolean
  timeout?: number
  params?: Record<string, any>
}

export abstract class BaseAdapter {
  constructor(protected fetcher?: typeof fetch) {}

  protected async request<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { retry = false, timeout = 30000, params, ...init } = options

    // Build URL with params
    const url = this.buildUrl(path, params)

    // Get current token (checks expiry)
    let token = authStore.getToken()

    // If token is null (expired), try refresh
    if (!token && !retry) {
      const refreshed = await authStore.refreshToken(this.fetcher ?? fetch)
      if (refreshed) {
        token = authStore.getToken()
      }
    }

    // Use provided fetcher or global fetch
    const fetcher = this.fetcher ?? fetch

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetcher(url, {
        ...init,
        signal: controller.signal,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(init.headers ?? {})
        },
        body: this.prepareBody(init.body)
      })

      clearTimeout(timeoutId)

      // Handle 401 with single retry
      if (response.status === 401 && !retry) {
        const refreshed = await authStore.refreshToken(fetcher)
        if (refreshed) {
          return this.request<T>(path, { ...options, retry: true })
        }
        authStore.clearAuth()
        throw new AdapterError('Unauthorized', 401)
      }

      // Handle other error responses
      if (!response.ok) {
        const error = await this.parseErrorResponse(response)
        throw error
      }

      // Parse successful response
      const data = await response.json()
      return this.transformResponse<T>(data)

    } catch (error: any) {
      clearTimeout(timeoutId)

      // Handle abort
      if (error.name === 'AbortError') {
        throw new AdapterError('Request timeout', 0)
      }

      // Re-throw adapter errors
      if (error instanceof AdapterError) {
        throw error
      }

      // Normalize other errors
      throw normalizeError(error)
    }
  }

  private buildUrl(path: string, params?: Record<string, any>): string {
    const url = new URL(`${API_BASE}${path}`)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => url.searchParams.append(key, String(v)))
          } else {
            url.searchParams.set(key, String(value))
          }
        }
      })
    }

    return url.toString()
  }

  private prepareBody(body: any): BodyInit | null {
    if (body === null || body === undefined) {
      return null
    }

    if (typeof body === 'object' && !(body instanceof FormData)) {
      return JSON.stringify(this.transformRequest(body))
    }

    return body as BodyInit
  }

  private async parseErrorResponse(response: Response): Promise<AdapterError> {
    try {
      const data = await response.json()
      return new AdapterError(
        data.error || response.statusText,
        response.status,
        data.details
      )
    } catch {
      return new AdapterError(response.statusText, response.status)
    }
  }

  // Override in subclasses for custom transformations
  protected transformRequest(data: any): any {
    // Convert camelCase to snake_case
    return this.toSnakeCase(data)
  }

  protected transformResponse<T>(data: any): T {
    // Convert snake_case to camelCase
    return this.toCamelCase(data) as T
  }

  // Helper methods for case conversion
  private toSnakeCase(obj: any): any {
    if (obj === null || obj === undefined) return obj
    if (obj instanceof Date) return obj.toISOString()
    if (typeof obj !== 'object') return obj
    if (Array.isArray(obj)) return obj.map(v => this.toSnakeCase(v))

    const converted: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      converted[snakeKey] = this.toSnakeCase(value)
    }
    return converted
  }

  private toCamelCase(obj: any): any {
    if (obj === null || obj === undefined) return obj
    if (typeof obj !== 'object') return obj
    if (Array.isArray(obj)) return obj.map(v => this.toCamelCase(v))

    const converted: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      converted[camelKey] = this.toCamelCase(value)
    }
    return converted
  }
}
```

### Phase 3: Update Auth Endpoints

#### 3.1 Login Endpoint
`/src/routes/auth/login/+server.ts`:
```typescript
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { z } from 'zod'
import { setRefreshCookie } from '$lib/auth/cookies'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export const POST: RequestHandler = async ({ request, cookies, url, fetch }) => {
  const body = await request.json().catch(() => ({}))
  const parsed = LoginSchema.safeParse(body)

  if (!parsed.success) {
    return json({ error: 'Invalid credentials' }, { status: 400 })
  }

  try {
    // Call Rails OAuth endpoint
    const response = await fetch('http://localhost:3000/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...parsed.data,
        grant_type: 'password',
        client_id: process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET
      })
    })

    if (!response.ok) {
      return json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const oauth = await response.json()

    // Store refresh token in httpOnly cookie
    setRefreshCookie(cookies, oauth.refresh_token, {
      secure: url.protocol === 'https:',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })

    // Return access token and user info to client
    return json({
      access_token: oauth.access_token,
      user: oauth.user,
      expires_in: oauth.expires_in
    })
  } catch (error) {
    console.error('Login failed:', error)
    return json({ error: 'Login failed' }, { status: 500 })
  }
}
```

#### 3.2 Refresh Endpoint
`/src/routes/auth/refresh/+server.ts`:
```typescript
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { REFRESH_COOKIE, setRefreshCookie } from '$lib/auth/cookies'

export const POST: RequestHandler = async ({ cookies, url, fetch }) => {
  const refreshToken = cookies.get(REFRESH_COOKIE)

  if (!refreshToken) {
    return json({ error: 'No refresh token' }, { status: 401 })
  }

  try {
    const response = await fetch('http://localhost:3000/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET
      })
    })

    if (!response.ok) {
      // Clear invalid refresh token
      cookies.delete(REFRESH_COOKIE, { path: '/' })
      return json({ error: 'Invalid refresh token' }, { status: 401 })
    }

    const oauth = await response.json()

    // Update refresh token (rotation)
    if (oauth.refresh_token) {
      setRefreshCookie(cookies, oauth.refresh_token, {
        secure: url.protocol === 'https:',
        maxAge: 60 * 60 * 24 * 30
      })
    }

    return json({
      access_token: oauth.access_token,
      user: oauth.user,
      expires_in: oauth.expires_in
    })
  } catch (error) {
    console.error('Refresh failed:', error)
    return json({ error: 'Refresh failed' }, { status: 500 })
  }
}
```

#### 3.3 Logout Endpoint
`/src/routes/auth/logout/+server.ts`:
```typescript
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { REFRESH_COOKIE } from '$lib/auth/cookies'

export const POST: RequestHandler = async ({ cookies, fetch }) => {
  const refreshToken = cookies.get(REFRESH_COOKIE)

  // Revoke token on Rails side
  if (refreshToken) {
    try {
      await fetch('http://localhost:3000/oauth/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: refreshToken,
          token_type_hint: 'refresh_token',
          client_id: process.env.OAUTH_CLIENT_ID,
          client_secret: process.env.OAUTH_CLIENT_SECRET
        })
      })
    } catch (error) {
      console.error('Token revocation failed:', error)
    }
  }

  // Clear cookie regardless
  cookies.delete(REFRESH_COOKIE, { path: '/' })

  return json({ success: true })
}
```

### Phase 4: Fix Grid Adapter

#### 4.1 Corrected Grid Adapter Methods
`/src/lib/api/adapters/grid.adapter.ts` (key fixes):
```typescript
// Fix DELETE to include ID
async deleteWeapon(id: string): Promise<void> {
  return this.request<void>(`/grid_weapons/${id}`, {
    method: 'DELETE'
  })
}

// Fix position update URL
async updateWeaponPosition(params: UpdatePositionParams): Promise<GridWeapon> {
  const { id, position, container } = params
  return this.request<GridWeapon>(`/grid_weapons/${id}/update_position`, {
    method: 'POST',
    body: { position, container }
  })
}

// Fix swap URL (no partyId in path)
async swapWeapons(params: SwapPositionsParams): Promise<{
  source: GridWeapon
  target: GridWeapon
}> {
  return this.request('/grid_weapons/swap', {
    method: 'POST',
    body: params
  })
}

// Apply same patterns to characters and summons...
```

### Phase 5: Rails Configuration

#### 5.1 Update CORS Configuration
`config/initializers/cors.rb`:
```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(
      Rails.env.production? ?
        ['https://app.hensei.dev', 'https://hensei.dev'] :
        ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173']
    )

    resource '/api/*',
      headers: %w[Accept Authorization Content-Type X-Edit-Key],
      expose: %w[X-RateLimit-Limit X-RateLimit-Remaining X-RateLimit-Reset],
      methods: %i[get post put patch delete options head],
      credentials: true,
      max_age: 86400
  end
end
```

#### 5.2 Add Bootstrap Endpoint
`app/controllers/api/v1/auth_controller.rb`:
```ruby
def bootstrap
  # This is called by hooks.server.ts with refresh token in cookie
  refresh_token = cookies[:refresh_token]

  if refresh_token.blank?
    render json: { error: 'No refresh token' }, status: :unauthorized
    return
  end

  # Use Doorkeeper to validate and exchange
  token = Doorkeeper::AccessToken.by_refresh_token(refresh_token)

  if token.nil? || token.revoked?
    render json: { error: 'Invalid refresh token' }, status: :unauthorized
    return
  end

  # Create new access token
  new_token = Doorkeeper::AccessToken.create!(
    application: token.application,
    resource_owner_id: token.resource_owner_id,
    scopes: token.scopes,
    expires_in: 900, # 15 minutes
    use_refresh_token: false
  )

  user = User.find(new_token.resource_owner_id)

  render json: {
    access_token: new_token.token,
    user: UserBlueprint.render_as_hash(user, view: :auth),
    expires_in: new_token.expires_in
  }
end
```

### Phase 6: Add TanStack Query

#### 6.1 Install Dependencies
```bash
pnpm add @tanstack/svelte-query
```

#### 6.2 Setup Query Client
`/src/lib/query/client.ts`:
```typescript
import { QueryClient } from '@tanstack/svelte-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error: any) => {
        if (error?.status === 401) return false
        return failureCount < 3
      },
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: false
    }
  }
})
```

#### 6.3 Use in Components
```svelte
<script lang="ts">
  import { createQuery, createMutation } from '@tanstack/svelte-query'
  import { partyAdapter } from '$lib/api/adapters'

  const partyQuery = createQuery({
    queryKey: ['party', shortcode],
    queryFn: () => partyAdapter.getByShortcode(shortcode),
    enabled: !!shortcode
  })

  const updateMutation = createMutation({
    mutationFn: (data) => partyAdapter.update(shortcode, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['party', shortcode])
    }
  })
</script>

{#if $partyQuery.isLoading}
  <Loading />
{:else if $partyQuery.error}
  <Error message={$partyQuery.error.message} />
{:else if $partyQuery.data}
  <Party data={$partyQuery.data} />
{/if}
```

## Migration Timeline

### Day 0: Preparation
- [ ] Backup current state
- [ ] Review Rails CORS configuration
- [ ] Setup feature flags

### Day 1: Core Authentication
- [ ] Implement auth store with refresh logic
- [ ] Add hooks.server.ts and handleFetch
- [ ] Update layout server/client
- [ ] Create auth endpoints (login, refresh, logout)
- [ ] Test SSR token bootstrap

### Day 2: Adapter Updates
- [ ] Update BaseAdapter with smart refresh
- [ ] Fix GridAdapter URLs and methods
- [ ] Update adapter configuration
- [ ] Add TanStack Query
- [ ] Test with one adapter (PartyAdapter)

### Day 3: Complete Migration
- [ ] Update all remaining adapters
- [ ] Update all components to use adapters
- [ ] Remove all proxy endpoints
- [ ] Test all operations

### Day 4: Hardening & Cleanup
- [ ] Add CSP headers
- [ ] Configure token TTLs
- [ ] Add request timeouts
- [ ] Performance testing
- [ ] Documentation

## Testing Strategy

### Unit Tests
```typescript
// Test auth store refresh logic
test('refreshes token when expired', async () => {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      access_token: 'new_token',
      expires_in: 900
    })
  })

  authStore.setAuth('old_token', user, new Date(Date.now() - 1000))
  const token = await authStore.getToken()

  expect(mockFetch).toHaveBeenCalledWith(
    expect.stringContaining('/auth/refresh'),
    expect.objectContaining({ method: 'POST' })
  )
})
```

### E2E Tests (Playwright)
```typescript
test('grid operations work with auth', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('[name=email]', 'test@example.com')
  await page.fill('[name=password]', 'password')
  await page.click('button[type=submit]')

  // Navigate to party
  await page.goto('/teams/test-party')

  // Test grid operations
  await page.click('[data-testid=add-weapon]')
  await expect(page.locator('.weapon-grid')).toContainText('New Weapon')
})
```

## Security Checklist

- [ ] **CSP Headers**: Strict Content Security Policy
- [ ] **Token TTL**: 15-minute access tokens
- [ ] **Refresh Rotation**: New refresh token on each use
- [ ] **Revocation**: Proper logout with token revocation
- [ ] **CORS**: Explicit origins, no wildcards
- [ ] **HTTPS**: Secure cookies in production
- [ ] **XSS Protection**: No token in localStorage
- [ ] **CSRF**: Not needed with Bearer tokens

## Success Metrics

1. **No 401/404 Errors**: All API calls succeed
2. **SSR Works**: Server-rendered pages have data
3. **Fast Refresh**: < 100ms token refresh
4. **No Token Leaks**: Tokens not in localStorage/sessionStorage
5. **Performance**: 20% reduction in API latency

## Rollback Plan

If issues arise:
1. **Feature Flag**: Toggle `USE_DIRECT_API` env var
2. **Restore Proxies**: Git revert removal commit
3. **Switch Adapters**: Conditional logic in config.ts
4. **Monitor**: Check error rates in Sentry

---

*Document Version: 2.0*
*Updated with comprehensive token lifecycle, SSR support, and security improvements*
*Ready for Production Implementation*
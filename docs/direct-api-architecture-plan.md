# Direct API Architecture Plan

## Executive Summary

This document outlines a comprehensive plan to migrate from proxy-endpoint-based API calls to direct API calls in the Hensei SvelteKit application. This change will resolve current authentication and routing errors while simplifying the codebase and improving performance.

### Key Problems Being Solved
1. **404 Errors**: Grid operations failing due to missing/incorrect proxy endpoints
2. **401 Authentication Errors**: Cookie-based auth not working properly through proxies
3. **Complexity**: Maintaining duplicate routing logic in both adapters and proxy endpoints
4. **Performance**: Extra network hop through proxy adds latency
5. **Inconsistency**: Some operations use SSR, some use proxies, some try direct calls

### Solution
Implement direct API calls from the browser to the Rails API using Bearer token authentication, which is the standard approach for modern SvelteKit applications.

## Current Architecture Analysis

### What We Have Now

```
Browser → SvelteKit Proxy (/api/*) → Rails API (localhost:3000/api/v1/*)
```

#### Current Authentication Flow
1. User logs in via `/auth/login/+server.ts`
2. OAuth token received and stored in httpOnly cookies
3. Proxy endpoints read cookies and forward to Rails
4. Rails uses Doorkeeper OAuth to authenticate via Bearer token

#### Current Problems
- **Proxy Endpoints**: 20+ proxy files in `/src/routes/api/`
- **Adapter Configuration**: Uses `/api` in browser, expecting proxies that don't exist
- **Grid Operations**: Broken due to missing/incorrect proxy endpoints
- **URL Mismatches**: Grid adapter uses wrong URL patterns
- **Parameter Wrapping**: Inconsistent parameter structures

## Proposed Architecture

### Direct API Calls

```
Browser → Rails API (localhost:3000/api/v1/*)
```

#### New Authentication Flow
1. User logs in and receives OAuth token
2. Store access token in:
   - Server-side: httpOnly cookie (for SSR)
   - Client-side: Memory/store (for browser requests)
3. Include Bearer token in Authorization header for all API calls
4. Rails authenticates directly via Doorkeeper

#### CORS Configuration
Rails already has proper CORS configuration:
```ruby
origins %w[localhost:5173 127.0.0.1:5173]
credentials: true
methods: %i[get post put patch delete options head]
```

## Implementation Plan

### Phase 1: Update Authentication System

#### 1.1 Create Token Store
Create `/src/lib/stores/auth.store.ts`:
```typescript
import { writable, get } from 'svelte/store'

interface AuthState {
  accessToken: string | null
  user: UserInfo | null
  expiresAt: Date | null
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    accessToken: null,
    user: null,
    expiresAt: null
  })

  return {
    subscribe,
    setAuth: (token: string, user: UserInfo, expiresAt: Date) => {
      set({ accessToken: token, user, expiresAt })
    },
    clearAuth: () => {
      set({ accessToken: null, user: null, expiresAt: null })
    },
    getToken: () => get(authStore).accessToken
  }
}

export const authStore = createAuthStore()
```

#### 1.2 Update Login Handler
Modify `/src/routes/auth/login/+server.ts`:
- Continue setting httpOnly cookies for SSR
- Also return access token in response for client storage

#### 1.3 Update Root Layout
Modify `/src/routes/+layout.svelte`:
- Initialize auth store from page data
- Handle token refresh

### Phase 2: Update Adapter System

#### 2.1 Fix Adapter Configuration
Update `/src/lib/api/adapters/config.ts`:
```typescript
export function getApiBaseUrl(): string {
  // Always use direct API URL
  const base = PUBLIC_SIERO_API_URL || 'http://localhost:3000'
  return `${base}/api/v1`
}
```

#### 2.2 Update Base Adapter
Modify `/src/lib/api/adapters/base.adapter.ts`:
```typescript
protected async request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  // Add Bearer token from auth store
  const token = authStore.getToken()

  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include', // Still include for CORS
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  }

  // ... rest of implementation
}
```

### Phase 3: Fix Grid Adapter Issues

#### 3.1 Fix DELETE Methods
Update `/src/lib/api/adapters/grid.adapter.ts`:
```typescript
async deleteWeapon(params: { id: string; partyId: string }): Promise<void> {
  return this.request<void>(`/grid_weapons/${params.id}`, {
    method: 'DELETE'
  })
}
// Similar for deleteCharacter and deleteSummon
```

#### 3.2 Fix Position Update URLs
```typescript
async updateWeaponPosition(params: UpdatePositionParams): Promise<GridWeapon> {
  const { id, position, container } = params
  return this.request<GridWeapon>(`/grid_weapons/${id}/update_position`, {
    method: 'POST',
    body: { position, container }
  })
}
```

#### 3.3 Fix Swap URLs
```typescript
async swapWeapons(params: SwapPositionsParams): Promise<{
  source: GridWeapon
  target: GridWeapon
}> {
  return this.request('/grid_weapons/swap', {
    method: 'POST',
    body: params
  })
}
```

### Phase 4: Remove Proxy Endpoints

Delete the entire `/src/routes/api/` directory:
```bash
rm -rf /src/routes/api/
```

### Phase 5: Update Services

#### 5.1 Party Service
Update to pass auth token if needed for SSR:
```typescript
class PartyService {
  constructor(private fetch?: typeof window.fetch) {}

  async getByShortcode(shortcode: string): Promise<Party> {
    // On server, use fetch with cookies
    // On client, adapter will use auth store
    return partyAdapter.getByShortcode(shortcode)
  }
}
```

### Phase 6: Update Components

#### 6.1 Party Component
No changes needed - already uses services correctly

#### 6.2 Search Components
Update to use adapters directly instead of proxy endpoints

## Files to Change

### Core Authentication Files
1. `/src/lib/stores/auth.store.ts` - **CREATE** - Token storage
2. `/src/routes/auth/login/+server.ts` - Return token in response
3. `/src/routes/+layout.svelte` - Initialize auth store
4. `/src/routes/+layout.server.ts` - Pass token to client

### Adapter System Files
5. `/src/lib/api/adapters/config.ts` - Remove proxy logic
6. `/src/lib/api/adapters/base.adapter.ts` - Add Bearer token support
7. `/src/lib/api/adapters/grid.adapter.ts` - Fix all URL patterns and methods
8. `/src/lib/api/adapters/party.adapter.ts` - Ensure proper auth
9. `/src/lib/api/adapters/search.adapter.ts` - Ensure proper auth
10. `/src/lib/api/adapters/entity.adapter.ts` - Ensure proper auth
11. `/src/lib/api/adapters/user.adapter.ts` - Ensure proper auth

### Service Files (Minor Updates)
12. `/src/lib/services/grid.service.ts` - Already correct
13. `/src/lib/services/party.service.ts` - Already correct
14. `/src/lib/services/conflict.service.ts` - Already correct

### Component Files (No Changes)
- `/src/lib/components/party/Party.svelte` - Already uses services
- All grid components - Already use context correctly

### Files to DELETE
15. `/src/routes/api/` - **DELETE ENTIRE DIRECTORY**

### SSR Routes (No Changes Needed)
- `/src/routes/teams/[id]/+page.server.ts` - Keep as-is
- `/src/routes/teams/explore/+page.server.ts` - Keep as-is
- All other `+page.server.ts` files - Keep as-is

## Benefits of This Approach

### Performance
- **Eliminates proxy latency**: Direct calls are faster
- **Reduces server load**: No proxy processing
- **Better caching**: Browser can cache API responses directly

### Simplicity
- **Less code**: Remove 20+ proxy endpoint files
- **Single source of truth**: Adapters handle all API logic
- **Standard pattern**: Follows SvelteKit best practices

### Reliability
- **Fixes authentication**: Bearer tokens work consistently
- **Fixes routing**: Direct URLs eliminate 404 errors
- **Better error handling**: Errors come directly from API

### Developer Experience
- **Easier debugging**: Network tab shows actual API calls
- **Less complexity**: No proxy layer to understand
- **Industry standard**: What most SvelteKit apps do

## Trade-offs and Considerations

### Security Considerations
1. **API URL exposed**: Browser can see Rails API URL (acceptable)
2. **Token in memory**: XSS vulnerability (mitigated by httpOnly refresh token)
3. **CORS required**: Must trust frontend origin (already configured)

### Migration Risks
1. **Breaking change**: All API calls will change
2. **Testing required**: Need to test all operations
3. **Token management**: Need to handle expiry/refresh

### Mitigation Strategies
1. **Incremental rollout**: Can update adapters one at a time
2. **Feature flags**: Can toggle between old/new approach
3. **Comprehensive testing**: Test each operation before removing proxies

## Implementation Timeline

### Day 1: Authentication System
- Create auth store
- Update login flow
- Test authentication

### Day 2: Adapter Updates
- Update adapter configuration
- Add Bearer token support
- Fix Grid adapter URLs

### Day 3: Testing & Cleanup
- Test all grid operations
- Test search, favorites, etc.
- Remove proxy endpoints

### Day 4: Final Testing
- End-to-end testing
- Performance testing
- Documentation updates

## Success Criteria

1. **All grid operations work**: Add, update, delete, move, swap
2. **Authentication works**: Login, logout, refresh
3. **No 404 errors**: All API calls succeed
4. **No 401 errors**: Authentication works consistently
5. **Performance improvement**: Measurable latency reduction

## Conclusion

This migration to direct API calls will:
1. **Solve immediate problems**: Fix broken grid operations
2. **Improve architecture**: Align with SvelteKit best practices
3. **Reduce complexity**: Remove unnecessary proxy layer
4. **Improve performance**: Eliminate proxy latency
5. **Enhance maintainability**: Single source of truth for API logic

The approach is standard for modern SvelteKit applications and is what "9 out of 10 Svelte developers" would implement. It leverages the existing CORS configuration in Rails and uses industry-standard Bearer token authentication.

## Next Steps

1. Review and approve this plan
2. Create auth store implementation
3. Update adapters incrementally
4. Test thoroughly
5. Remove proxy endpoints
6. Deploy with confidence

---

*Document created: November 2024*
*Author: Claude Assistant*
*Status: Ready for Implementation*
# API Refactoring Plan: Server-Side Only Architecture

## Executive Summary
This document outlines the plan to refactor all Rails API calls in the hensei-svelte application to be server-side only, resolving authentication issues and improving security.

## Current Architecture Analysis

### API Layer (`/lib/api/`)
- **`core.ts`**: Basic fetch wrappers that accept a `FetchLike` function
- **`resources/`**: API endpoint functions (parties, grid, search, etc.)
- Functions accept `fetch` as a parameter to work both client and server-side

### Service Layer (`/lib/services/`)
- `PartyService`, `GridService`, `ConflictService`
- Services accept `fetch` in constructor and use API resources
- Currently used both client-side and server-side

### Authentication
- `hooks.server.ts` has `handleFetch` that adds Bearer token to server-side requests
- Client-side calls don't have access to the httpOnly auth token
- Edit keys for anonymous users are stored in localStorage (client-side)
- This is causing the 401 Unauthorized errors

## Problems with Current Approach

1. **Direct client API calls bypass authentication** - The `/teams/new/+page.svelte` directly imports and uses `gridApi` functions
2. **Security issue** - Client shouldn't directly call backend API
3. **Inconsistent authentication** - Only server-side fetch has the Bearer token
4. **Edit keys are client-side only** - Server can't access localStorage where edit keys are stored

## Proposed Solution: Server-Side API Proxy Routes

### Step 1: Create Generic API Proxy Routes

Create server endpoints that mirror the Rails API structure:

#### `/src/routes/api/parties/+server.ts`
- POST: Create new party
- Handles both authenticated and anonymous users

#### `/src/routes/api/parties/[id]/+server.ts`
- PUT: Update party details
- DELETE: Delete party
- Validates edit permissions (authenticated user or edit key)

#### `/src/routes/api/parties/[id]/weapons/+server.ts`
- POST: Add weapon to party
- PUT: Update weapon in party
- DELETE: Remove weapon from party

#### `/src/routes/api/parties/[id]/summons/+server.ts`
- POST: Add summon to party
- PUT: Update summon in party
- DELETE: Remove summon from party

#### `/src/routes/api/parties/[id]/characters/+server.ts`
- POST: Add character to party
- PUT: Update character in party
- DELETE: Remove character from party

### Step 2: Handle Edit Keys Properly

Since edit keys are in localStorage (client-side), we need to:
1. Pass edit key as a header from client to our proxy endpoints
2. Server proxy validates and forwards it to Rails API
3. Structure: Client → SvelteKit Server (with edit key) → Rails API

Example flow:

```javascript
// Client-side
const editKey = localStorage.getItem(`edit_key_${party.shortcode}`)
await fetch('/api/parties/123/weapons', {
  method: 'POST',
  headers: {
    'X-Edit-Key': editKey,  // Pass to our server
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({...})
})

// Server-side proxy
export async function POST({ request, params, fetch, locals }) {
  const editKey = request.headers.get('X-Edit-Key')
  const body = await request.json()

  // Server's fetch automatically adds Bearer token via handleFetch
  const response = await fetch(`${API_BASE}/weapons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(editKey ? { 'X-Edit-Key': editKey } : {})
    },
    body: JSON.stringify(body)
  })

  return response
}
```

### Step 3: Create a Unified API Client

Create `/src/lib/api/client.ts` that:
- Works only on client-side
- Automatically includes edit keys from localStorage
- Calls our SvelteKit proxy endpoints (not Rails directly)
- Can be used in both `/teams/new` and `/teams/[shortcode]`

```typescript
export class APIClient {
  private getEditKey(partyId: string): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(`edit_key_${partyId}`)
  }

  async addWeapon(partyId: string, weaponId: string, position: number, options?: any) {
    const editKey = this.getEditKey(partyId)
    const response = await fetch(`/api/parties/${partyId}/weapons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      },
      body: JSON.stringify({ weaponId, position, ...options })
    })

    if (!response.ok) throw new Error(`Failed to add weapon: ${response.statusText}`)
    return response.json()
  }

  // Similar methods for other operations...
}
```

### Step 4: Update Components

#### `/routes/teams/new/+page.svelte`
- Remove direct `gridApi` and `partiesApi` imports
- Use the new `APIClient` class
- Edit keys handled automatically by the client

#### `/routes/teams/[shortcode]/+page.svelte` (via Party component)
- Use the same `APIClient` for consistency
- Edit keys retrieved from localStorage when needed

#### Services (`PartyService`, `GridService`)
- Keep them server-side only
- Used in `+page.server.ts` files
- Client components use `APIClient` instead

### Step 5: Authentication Flow

#### Authenticated Users
1. Client → SvelteKit Server (no edit key needed)
2. SvelteKit Server → Rails API (with Bearer token from cookies)

#### Anonymous Users
1. Client → SvelteKit Server (with edit key from localStorage)
2. SvelteKit Server → Rails API (with edit key header)

## Benefits of This Approach

1. **Single API interface** - Same `APIClient` works for both new and existing parties
2. **Proper authentication** - Server-side requests include Bearer token
3. **Edit key support** - Anonymous users can still edit their parties
4. **Security** - Rails API never exposed to client
5. **Reusability** - Same code paths for `/teams/new` and `/teams/[shortcode]`
6. **Progressive enhancement** - Can still use form actions where appropriate

## Implementation Order

1. Create the API proxy routes in `/src/routes/api/`
2. Create the `APIClient` class
3. Update `/routes/teams/new/+page.svelte` to use `APIClient`
4. Update Party component to use `APIClient` for grid operations
5. Test both authenticated and anonymous user flows
6. Remove direct API imports from client components

## Testing Checklist

### Authenticated User Flow
- [ ] Can create new party
- [ ] Can add weapons/summons/characters to new party
- [ ] Can edit existing party they own
- [ ] Cannot edit party they don't own

### Anonymous User Flow
- [ ] Can create new party (receives edit key)
- [ ] Can add items to party using edit key
- [ ] Can edit party after page refresh (edit key persists)
- [ ] Cannot edit without valid edit key

### Error Handling
- [ ] 401 errors properly handled
- [ ] Network errors display user-friendly messages
- [ ] Invalid data errors show validation messages

## Migration Path

This refactor can be done incrementally:
1. Start with new proxy routes (doesn't break existing code)
2. Update one component at a time to use new API client
3. Gradually remove direct API imports
4. Finally remove unused code

## Notes

- The `account` cookie is httpOnly for security, which is why we need server-side proxy
- Edit keys must be passed from client since they're in localStorage
- All Rails API endpoints should remain unchanged
- This architecture follows SvelteKit best practices for API integration
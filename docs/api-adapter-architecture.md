# API Adapter Architecture

## Overview

This document defines the adapter pattern implementation for the Hensei API layer. The adapter pattern provides a consistent interface for all API operations while handling transformations, error handling, caching, and reactive state management through Runed.

## Current State Analysis

### Existing API Structure
```
/lib/api/
├── core.ts              # HTTP utilities (get, post, put, del)
├── client.ts            # APIClient class with edit key management
├── resources/           # Resource-specific functions
│   ├── search.ts        # Search functions (weapons, characters, summons)
│   ├── parties.ts       # Party CRUD operations
│   ├── weapons.ts       # Weapon entity operations
│   ├── characters.ts    # Character entity operations
│   ├── summons.ts       # Summon entity operations
│   └── grid.ts          # Grid management operations
└── schemas/
    ├── transforms.ts    # snake_case ↔ camelCase transformations
    └── party.ts         # Zod schemas for validation
```

### Key Issues to Address
1. **Inconsistent patterns**: Mix of functional and class-based approaches
2. **Repeated logic**: Error handling, transformations duplicated across resources
3. **Type safety gaps**: Some responses use `z.any()`, losing compile-time safety
4. **No cancellation support**: Missing AbortController integration
5. **No unified caching**: Each component manages its own caching logic
6. **Complex transformations**: The "object" → entity renaming is manual and error-prone

## Architecture Design

### Layer Structure
```
┌─────────────────────────────────────┐
│         UI Components               │
│  (SearchSidebar, PartyEditor, etc.) │
├─────────────────────────────────────┤
│         Runed Resources             │  ← Reactive state management
│    (createResource, useDebounce)    │
├─────────────────────────────────────┤
│           Adapters                  │  ← NEW LAYER
│  (SearchAdapter, PartyAdapter, etc.)│
├─────────────────────────────────────┤
│      Existing API Functions         │  ← Keep unchanged initially
│    (searchWeapons, getParty, etc.)  │
├─────────────────────────────────────┤
│         HTTP Client                 │
│          (core.ts)                  │
└─────────────────────────────────────┘
```

### Core Concepts

#### 1. Base Adapter
All adapters extend from a base class that provides:
- Response transformation (snake_case → camelCase)
- Error normalization
- Request cancellation
- Performance timing
- Debug logging

#### 2. Resource Adapters
Specialized adapters for each resource type:
- **SearchAdapter**: Unified search interface
- **PartyAdapter**: Party CRUD with edit key management
- **GridAdapter**: Grid operations with optimistic updates
- **EntityAdapter**: Characters, weapons, summons
- **UserAdapter**: Authentication and profile management

#### 3. Runed Integration
Reactive resources using Runed utilities:
- Automatic request cancellation
- Debounced inputs
- Loading states
- Error recovery
- Cache invalidation

---

## Testing Methodology

### Why Testing Matters for LLM Development
When Claude Code implements adapters, we need immediate verification that the code works without manual component testing. This section provides comprehensive testing strategies.

### Test Infrastructure Setup

#### 1. Install Testing Dependencies
```bash
# These should already be installed, but verify:
pnpm add -D vitest @vitest/ui msw @testing-library/svelte
```

#### 2. Test Configuration
```typescript
// vitest.config.adapter.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'adapters',
    include: ['src/lib/api/adapters/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['./src/lib/api/adapters/test-setup.ts'],
    testTimeout: 5000
  }
})
```

#### 3. Mock Server Setup
```typescript
// src/lib/api/adapters/test-setup.ts
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { beforeAll, afterAll, afterEach } from 'vitest'

export const mockServer = setupServer()

beforeAll(() => mockServer.listen({ onUnhandledRequest: 'error' }))
afterEach(() => mockServer.resetHandlers())
afterAll(() => mockServer.close())

// Helper to add mock handlers
export function mockAPI(path: string, response: any, status = 200) {
  mockServer.use(
    http.post(`*/api/v1${path}`, () => {
      return HttpResponse.json(response, { status })
    })
  )
}
```

### Test Categories

#### 1. Unit Tests (Adapter Logic)
Test adapters in isolation without real API calls.

```typescript
// src/lib/api/adapters/__tests__/base.adapter.test.ts
import { describe, it, expect, vi } from 'vitest'
import { BaseAdapter } from '../base.adapter'
import { mockAPI } from '../test-setup'

describe('BaseAdapter', () => {
  it('should transform snake_case to camelCase', async () => {
    mockAPI('/test', { user_name: 'test', created_at: '2024-01-01' })

    const adapter = new BaseAdapter()
    const result = await adapter.request('/test')

    expect(result).toEqual({
      userName: 'test',
      createdAt: '2024-01-01'
    })
  })

  it('should handle request cancellation', async () => {
    const adapter = new BaseAdapter()
    const controller = new AbortController()

    const promise = adapter.request('/slow', { signal: controller.signal })
    controller.abort()

    await expect(promise).rejects.toThrow('AbortError')
  })

  it('should normalize error responses', async () => {
    mockAPI('/error', { error: 'Invalid request' }, 400)

    const adapter = new BaseAdapter()

    await expect(adapter.request('/error')).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      status: 400,
      message: 'Invalid request'
    })
  })
})
```

#### 2. Integration Tests (With Mock API)
Test complete adapter flows with realistic responses.

```typescript
// src/lib/api/adapters/__tests__/search.adapter.test.ts
import { describe, it, expect } from 'vitest'
import { SearchAdapter } from '../search.adapter'
import { mockAPI } from '../test-setup'
import mockSearchResponse from '../__fixtures__/search-response.json'

describe('SearchAdapter', () => {
  it('should unify search responses across types', async () => {
    mockAPI('/search/weapons', mockSearchResponse.weapons)
    mockAPI('/search/characters', mockSearchResponse.characters)

    const adapter = new SearchAdapter()

    // Test weapon search
    const weapons = await adapter.search({
      type: 'weapon',
      query: 'eternals',
      filters: { element: [1, 2] }
    })

    expect(weapons).toMatchObject({
      items: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          type: 'weapon'
        })
      ]),
      hasMore: expect.any(Boolean),
      total: expect.any(Number)
    })
  })

  it('should handle pagination correctly', async () => {
    const adapter = new SearchAdapter()

    // First page
    mockAPI('/search/weapons', {
      results: Array(20).fill({ id: '1' }),
      total_pages: 3,
      page: 1
    })

    const page1 = await adapter.search({ type: 'weapon', page: 1 })
    expect(page1.hasMore).toBe(true)
    expect(page1.nextCursor).toBe(2)

    // Last page
    mockAPI('/search/weapons', {
      results: Array(5).fill({ id: '2' }),
      total_pages: 3,
      page: 3
    })

    const page3 = await adapter.search({ type: 'weapon', page: 3 })
    expect(page3.hasMore).toBe(false)
    expect(page3.nextCursor).toBeUndefined()
  })
})
```

#### 3. Contract Tests (Type Safety)
Ensure adapter outputs match expected TypeScript types.

```typescript
// src/lib/api/adapters/__tests__/types.test.ts
import { describe, it, expectTypeOf } from 'vitest'
import type { SearchResult, PartyData } from '$lib/types'
import { SearchAdapter, PartyAdapter } from '../index'

describe('Adapter Type Contracts', () => {
  it('SearchAdapter should return correct types', async () => {
    const adapter = new SearchAdapter()
    const result = await adapter.search({ type: 'weapon' })

    expectTypeOf(result).toMatchTypeOf<{
      items: SearchResult[]
      total: number
      hasMore: boolean
      nextCursor?: number
    }>()
  })

  it('PartyAdapter should return PartyData type', async () => {
    const adapter = new PartyAdapter()
    const result = await adapter.get('abc123')

    expectTypeOf(result).toMatchTypeOf<PartyData>()
  })
})
```

#### 4. Runed Integration Tests
Test reactive behavior with Runed utilities.

```typescript
// src/lib/api/adapters/__tests__/runed.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createSearchResource } from '../resources/search.resource'
import { tick } from 'svelte'

describe('Runed Resource Integration', () => {
  it('should debounce search input', async () => {
    const searchFn = vi.fn()
    const resource = createSearchResource('weapon', {
      debounce: 100,
      fetcher: searchFn
    })

    // Rapid input changes
    resource.setQuery('a')
    resource.setQuery('ab')
    resource.setQuery('abc')

    // Should not call immediately
    expect(searchFn).not.toHaveBeenCalled()

    // Wait for debounce
    await new Promise(r => setTimeout(r, 150))

    // Should call once with final value
    expect(searchFn).toHaveBeenCalledOnce()
    expect(searchFn).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'abc' })
    )
  })

  it('should cancel previous requests', async () => {
    const resource = createSearchResource('weapon')

    // Start first search
    const promise1 = resource.search('test1')

    // Immediately start second search (should cancel first)
    const promise2 = resource.search('test2')

    // First should be cancelled
    await expect(promise1).rejects.toThrow('AbortError')

    // Second should complete
    await expect(promise2).resolves.toBeDefined()
  })
})
```

### Test Fixtures

#### Mock Data Structure
```typescript
// src/lib/api/adapters/__fixtures__/search-response.json
{
  "weapons": {
    "results": [
      {
        "id": "1040019000",
        "granblue_id": "1040019000",
        "name": { "en": "Eternal Sword", "ja": "永遠の剣" },
        "element": 1,
        "rarity": 5,
        "proficiency1": 1,
        "uncap_level": 5,
        "transcendence_step": 5
      }
    ],
    "total": 150,
    "page": 1,
    "total_pages": 8
  },
  "characters": {
    "results": [
      {
        "id": "3040001000",
        "granblue_id": "3040001000",
        "name": { "en": "Katalina", "ja": "カタリナ" },
        "element": 3,
        "rarity": 3,
        "special": false
      }
    ],
    "total": 500,
    "page": 1,
    "total_pages": 25
  }
}
```

### Verification Scripts

#### Quick Smoke Test
```bash
# src/lib/api/adapters/smoke-test.js
#!/usr/bin/env node

import { SearchAdapter } from './search.adapter.js'

async function smokeTest() {
  console.log('🔥 Running adapter smoke tests...\n')

  const adapter = new SearchAdapter()

  try {
    // Test 1: Basic search
    console.log('Test 1: Basic search')
    const result = await adapter.search({
      type: 'weapon',
      query: 'sword'
    })
    console.assert(result.items, '✅ Returns items array')
    console.assert(typeof result.total === 'number', '✅ Returns total count')

    // Test 2: Cancellation
    console.log('\nTest 2: Request cancellation')
    const controller = new AbortController()
    const promise = adapter.search({
      type: 'weapon'
    }, controller.signal)
    controller.abort()

    try {
      await promise
      console.error('❌ Should have thrown AbortError')
    } catch (e) {
      console.assert(e.name === 'AbortError', '✅ Cancellation works')
    }

    console.log('\n✨ All smoke tests passed!')
  } catch (error) {
    console.error('❌ Smoke test failed:', error)
    process.exit(1)
  }
}

smokeTest()
```

### Testing Commands

Add to package.json:
```json
{
  "scripts": {
    "test:adapters": "vitest run --config vitest.config.adapter.ts",
    "test:adapters:watch": "vitest --config vitest.config.adapter.ts",
    "test:adapters:ui": "vitest --ui --config vitest.config.adapter.ts",
    "test:adapter:smoke": "node src/lib/api/adapters/smoke-test.js",
    "test:adapter:types": "tsc --noEmit -p src/lib/api/adapters/tsconfig.json"
  }
}
```

### LLM Testing Workflow

When implementing each adapter, follow this workflow:

1. **Implement the adapter**
2. **Run type checking**: `pnpm test:adapter:types`
3. **Run unit tests**: `pnpm test:adapters -- search.adapter`
4. **Run smoke tests**: `pnpm test:adapter:smoke`
5. **Run all tests**: `pnpm test:adapters`

Only proceed to the next adapter after all tests pass.

---

## Implementation Plan

### Phase 1: Base Infrastructure
**Goal**: Create the foundation that all adapters will use.

#### Tasks:
- [ ] Install Runed: `pnpm add runed`
- [ ] Create `/lib/api/adapters/` directory structure
- [ ] Implement `base.adapter.ts` with core functionality
- [ ] Create `types.ts` with common interfaces
- [ ] Setup `errors.ts` with normalized error classes
- [ ] Implement transformation utilities
- [ ] Add base adapter tests
- [ ] Verify with smoke tests

#### Base Adapter Implementation:
```typescript
// src/lib/api/adapters/base.adapter.ts
import { snakeToCamel, camelToSnake } from '../schemas/transforms'

export interface AdapterOptions {
  baseURL?: string
  timeout?: number
  retries?: number
  onError?: (error: AdapterError) => void
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, any>
  timeout?: number
  retries?: number
}

export class AdapterError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AdapterError'
  }
}

export abstract class BaseAdapter {
  protected abortControllers = new Map<string, AbortController>()

  constructor(protected options: AdapterOptions = {}) {}

  protected async request<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = this.buildURL(path, options.params)
    const requestId = this.generateRequestId(path)

    // Cancel any existing request to the same endpoint
    this.cancelRequest(requestId)

    // Create new abort controller
    const controller = new AbortController()
    this.abortControllers.set(requestId, controller)

    try {
      const response = await this.fetchWithRetry(url, {
        ...options,
        signal: controller.signal
      })

      if (!response.ok) {
        throw await this.handleErrorResponse(response)
      }

      const data = await response.json()
      return this.transformResponse(data)
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new AdapterError('CANCELLED', 0, 'Request was cancelled')
      }
      throw this.normalizeError(error)
    } finally {
      this.abortControllers.delete(requestId)
    }
  }

  protected transformResponse<T>(data: any): T {
    // Apply transformations (snake_case to camelCase, etc.)
    return snakeToCamel(data) as T
  }

  protected transformRequest(data: any): any {
    return camelToSnake(data)
  }

  protected cancelRequest(requestId: string): void {
    const controller = this.abortControllers.get(requestId)
    controller?.abort()
  }

  cancelAll(): void {
    this.abortControllers.forEach(controller => controller.abort())
    this.abortControllers.clear()
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt = 1
  ): Promise<Response> {
    try {
      return await fetch(url, options)
    } catch (error) {
      const maxRetries = this.options.retries ?? 3
      if (attempt < maxRetries && this.isRetryable(error)) {
        await this.delay(Math.pow(2, attempt) * 1000) // Exponential backoff
        return this.fetchWithRetry(url, options, attempt + 1)
      }
      throw error
    }
  }

  private isRetryable(error: any): boolean {
    return error.name === 'NetworkError' || error.code === 'ECONNRESET'
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private buildURL(path: string, params?: Record<string, any>): string {
    const url = new URL(path, this.options.baseURL ?? window.location.origin)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value))
        }
      })
    }
    return url.toString()
  }

  private generateRequestId(path: string): string {
    return `${this.constructor.name}:${path}`
  }

  private async handleErrorResponse(response: Response): Promise<AdapterError> {
    try {
      const error = await response.json()
      return new AdapterError(
        this.getErrorCode(response.status),
        response.status,
        error.message || error.error || response.statusText,
        error
      )
    } catch {
      return new AdapterError(
        this.getErrorCode(response.status),
        response.status,
        response.statusText
      )
    }
  }

  private getErrorCode(status: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMITED',
      500: 'SERVER_ERROR',
      503: 'SERVICE_UNAVAILABLE'
    }
    return codes[status] ?? 'UNKNOWN_ERROR'
  }

  private normalizeError(error: any): AdapterError {
    if (error instanceof AdapterError) return error

    return new AdapterError(
      'UNKNOWN_ERROR',
      0,
      error.message || 'An unknown error occurred',
      error
    )
  }
}
```

### Phase 2: Search Adapter
**Goal**: Unify search across weapons, characters, and summons.

#### Tasks:
- [ ] Create `search.adapter.ts`
- [ ] Implement unified search interface
- [ ] Add pagination support
- [ ] Add filter normalization
- [ ] Create search-specific tests
- [ ] Test with mock data
- [ ] Verify cancellation works

#### Search Adapter Implementation:
```typescript
// src/lib/api/adapters/search.adapter.ts
import { BaseAdapter } from './base.adapter'
import type { SearchFilters } from '$lib/types'

export interface SearchParams {
  type: 'weapon' | 'character' | 'summon'
  query?: string
  filters?: SearchFilters
  page?: number
  perPage?: number
  signal?: AbortSignal
}

export interface SearchResult<T = any> {
  items: T[]
  total: number
  page: number
  totalPages: number
  hasMore: boolean
  nextCursor?: number
}

export class SearchAdapter extends BaseAdapter {
  async search<T>(params: SearchParams): Promise<SearchResult<T>> {
    const endpoint = `/search/${params.type}s` // weapons, characters, summons

    const response = await this.request<any>(endpoint, {
      method: 'POST',
      body: JSON.stringify(this.transformRequest({
        query: params.query,
        filters: params.filters,
        page: params.page ?? 1,
        per: params.perPage ?? 20
      })),
      signal: params.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    return this.normalizeSearchResponse(response, params.page ?? 1)
  }

  async searchAll<T>(params: Omit<SearchParams, 'type'>): Promise<SearchResult<T>> {
    const response = await this.request<any>('/search/all', {
      method: 'POST',
      body: JSON.stringify(this.transformRequest({
        query: params.query,
        filters: params.filters,
        page: params.page ?? 1,
        per: params.perPage ?? 20
      })),
      signal: params.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    return this.normalizeSearchResponse(response, params.page ?? 1)
  }

  private normalizeSearchResponse(response: any, currentPage: number): SearchResult {
    // Handle different response formats from the API
    const results = response.results || response.items || []
    const total = response.total ?? response.totalCount ?? results.length
    const totalPages = response.totalPages ?? response.total_pages ?? Math.ceil(total / 20)
    const hasMore = currentPage < totalPages

    return {
      items: results.map(this.normalizeItem.bind(this)),
      total,
      page: currentPage,
      totalPages,
      hasMore,
      nextCursor: hasMore ? currentPage + 1 : undefined
    }
  }

  private normalizeItem(item: any): any {
    // Add type field based on searchable_type if present
    if (item.searchableType) {
      item.type = item.searchableType.toLowerCase()
    }

    // Normalize name field
    if (typeof item.name === 'object') {
      item.displayName = item.name.en || item.name.ja
    } else {
      item.displayName = item.name
    }

    return item
  }
}
```

### Phase 3: Party Adapter
**Goal**: Handle party CRUD with edit key management.

#### Tasks:
- [ ] Create `party.adapter.ts`
- [ ] Port edit key management from APIClient
- [ ] Implement optimistic updates
- [ ] Add conflict resolution
- [ ] Create party-specific tests
- [ ] Test CRUD operations
- [ ] Test edit key persistence

#### Party Adapter Implementation:
```typescript
// src/lib/api/adapters/party.adapter.ts
import { BaseAdapter } from './base.adapter'
import type { Party, PartyPayload } from '$lib/types'

export class PartyAdapter extends BaseAdapter {
  private editKeys = new Map<string, string>()

  constructor(options?: AdapterOptions) {
    super(options)
    this.loadEditKeys()
  }

  async get(idOrShortcode: string): Promise<Party> {
    return this.request(`/parties/${idOrShortcode}`)
  }

  async create(payload: PartyPayload): Promise<{ party: Party; editKey?: string }> {
    const response = await this.request<any>('/parties', {
      method: 'POST',
      body: JSON.stringify(this.transformRequest(payload)),
      headers: { 'Content-Type': 'application/json' }
    })

    if (response.editKey && response.party?.shortcode) {
      this.storeEditKey(response.party.shortcode, response.editKey)
    }

    return {
      party: this.normalizeParty(response.party),
      editKey: response.editKey
    }
  }

  async update(id: string, payload: Partial<PartyPayload>): Promise<Party> {
    const editKey = this.getEditKey(id)

    const response = await this.request<any>(`/parties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(this.transformRequest(payload)),
      headers: {
        'Content-Type': 'application/json',
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      }
    })

    return this.normalizeParty(response.party || response)
  }

  async delete(id: string): Promise<void> {
    const editKey = this.getEditKey(id)

    await this.request(`/parties/${id}`, {
      method: 'DELETE',
      headers: {
        ...(editKey ? { 'X-Edit-Key': editKey } : {})
      }
    })

    this.removeEditKey(id)
  }

  private normalizeParty(party: any): Party {
    // Transform "object" fields to proper entity names
    if (party.weapons) {
      party.weapons = party.weapons.map((item: any) => {
        if (item.object) {
          const { object, ...rest } = item
          return { ...rest, weapon: object }
        }
        return item
      })
    }

    if (party.characters) {
      party.characters = party.characters.map((item: any) => {
        if (item.object) {
          const { object, ...rest } = item
          return { ...rest, character: object }
        }
        return item
      })
    }

    if (party.summons) {
      party.summons = party.summons.map((item: any) => {
        if (item.object) {
          const { object, ...rest } = item
          return { ...rest, summon: object }
        }
        return item
      })
    }

    return party
  }

  private getEditKey(id: string): string | null {
    return this.editKeys.get(id) || null
  }

  private storeEditKey(id: string, key: string): void {
    this.editKeys.set(id, key)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`edit_key_${id}`, key)
    }
  }

  private removeEditKey(id: string): void {
    this.editKeys.delete(id)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`edit_key_${id}`)
    }
  }

  private loadEditKeys(): void {
    if (typeof window === 'undefined') return

    // Load all edit keys from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('edit_key_')) {
        const id = key.replace('edit_key_', '')
        const value = localStorage.getItem(key)
        if (value) this.editKeys.set(id, value)
      }
    }
  }
}
```

### Phase 4: Runed Integration
**Goal**: Create reactive resources using Runed.

#### Tasks:
- [ ] Create `/lib/api/adapters/resources/` directory
- [ ] Implement `createSearchResource` with Runed
- [ ] Add debouncing support
- [ ] Implement `createPartyResource`
- [ ] Add optimistic updates
- [ ] Create Runed-specific tests
- [ ] Test reactivity and cancellation

#### Runed Resource Implementation:
```typescript
// src/lib/api/adapters/resources/search.resource.ts
import { createResource, useDebounce } from 'runed'
import { SearchAdapter, type SearchParams, type SearchResult } from '../search.adapter'

export interface SearchResourceOptions {
  debounce?: number
  cacheTime?: number
  initialData?: SearchResult
}

export function createSearchResource(
  type: SearchParams['type'],
  options: SearchResourceOptions = {}
) {
  const adapter = new SearchAdapter()
  const cache = new Map<string, { data: SearchResult; timestamp: number }>()

  // Reactive state
  let query = $state('')
  let filters = $state<SearchParams['filters']>({})
  let page = $state(1)

  // Debounced query
  const debouncedQuery = useDebounce(() => query, options.debounce ?? 300)

  // Create resource
  const resource = createResource({
    keys: () => ({ type, query: debouncedQuery, filters, page }),
    fetcher: async ({ signal }) => {
      const cacheKey = JSON.stringify({ type, query: debouncedQuery, filters, page })

      // Check cache
      if (options.cacheTime) {
        const cached = cache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < options.cacheTime) {
          return cached.data
        }
      }

      // Fetch data
      const result = await adapter.search({
        type,
        query: debouncedQuery,
        filters,
        page,
        signal
      })

      // Update cache
      if (options.cacheTime) {
        cache.set(cacheKey, { data: result, timestamp: Date.now() })
      }

      return result
    },
    initialValue: options.initialData
  })

  // Computed values
  const items = $derived(resource.value?.items ?? [])
  const hasMore = $derived(resource.value?.hasMore ?? false)
  const total = $derived(resource.value?.total ?? 0)
  const isLoading = $derived(resource.loading)
  const error = $derived(resource.error)

  // Methods
  function setQuery(newQuery: string) {
    query = newQuery
    page = 1 // Reset page on new search
  }

  function setFilters(newFilters: SearchParams['filters']) {
    filters = newFilters
    page = 1 // Reset page on filter change
  }

  function loadMore() {
    if (hasMore && !isLoading) {
      page++
    }
  }

  function reset() {
    query = ''
    filters = {}
    page = 1
    cache.clear()
  }

  function refresh() {
    cache.clear()
    resource.refetch()
  }

  return {
    // State
    query: $derived(query),
    debouncedQuery,
    filters: $derived(filters),
    page: $derived(page),

    // Results
    items,
    hasMore,
    total,
    isLoading,
    error,

    // Methods
    setQuery,
    setFilters,
    loadMore,
    reset,
    refresh,

    // Direct resource access
    resource
  }
}
```

```typescript
// src/lib/api/adapters/resources/party.resource.ts
import { createResource } from 'runed'
import { PartyAdapter } from '../party.adapter'
import type { Party, PartyPayload } from '$lib/types'

export interface PartyResourceOptions {
  autoSave?: boolean
  autoSaveDelay?: number
  optimisticUpdates?: boolean
}

export function createPartyResource(
  partyId: string,
  options: PartyResourceOptions = {}
) {
  const adapter = new PartyAdapter()

  // State
  let localParty = $state<Party | null>(null)
  let pendingUpdates = $state<Partial<PartyPayload>>({})
  let saveTimer: NodeJS.Timeout | null = null

  // Load party
  const resource = createResource({
    keys: () => ({ id: partyId }),
    fetcher: async ({ signal }) => {
      const party = await adapter.get(partyId)
      localParty = party
      return party
    }
  })

  // Computed
  const party = $derived(options.optimisticUpdates ? localParty : resource.value)
  const isLoading = $derived(resource.loading)
  const isSaving = $state(false)
  const error = $derived(resource.error)

  // Methods
  async function update(updates: Partial<PartyPayload>) {
    if (options.optimisticUpdates && localParty) {
      // Apply optimistic update
      localParty = { ...localParty, ...updates }
    }

    // Accumulate pending updates
    pendingUpdates = { ...pendingUpdates, ...updates }

    // Auto-save logic
    if (options.autoSave) {
      if (saveTimer) clearTimeout(saveTimer)

      saveTimer = setTimeout(
        () => save(),
        options.autoSaveDelay ?? 1000
      )
    }
  }

  async function save() {
    if (Object.keys(pendingUpdates).length === 0) return

    isSaving = true

    try {
      const updated = await adapter.update(partyId, pendingUpdates)
      localParty = updated
      pendingUpdates = {}

      // Refresh from server to ensure consistency
      resource.refetch()
    } catch (error) {
      // Rollback optimistic update on error
      if (options.optimisticUpdates) {
        localParty = resource.value
      }
      throw error
    } finally {
      isSaving = false
    }
  }

  async function deleteParty() {
    await adapter.delete(partyId)
  }

  function refresh() {
    pendingUpdates = {}
    resource.refetch()
  }

  // Cleanup
  function cleanup() {
    if (saveTimer) {
      clearTimeout(saveTimer)
      save() // Save any pending changes
    }
  }

  return {
    // State
    party,
    isLoading,
    isSaving,
    error,
    hasPendingChanges: $derived(Object.keys(pendingUpdates).length > 0),

    // Methods
    update,
    save,
    delete: deleteParty,
    refresh,
    cleanup
  }
}
```

---

## Evolution Roadmap

### Stage 1: Foundation (Current)
- Basic CRUD operations
- Search functionality
- Error handling
- Edit key management

### Stage 2: Enhanced Features (3-6 months)
- **Spark Tracking**: CollectionAdapter for managing user collections
- **Guides**: GuideAdapter with rich text support
- **Batch Operations**: Bulk updates for collections

### Stage 3: Advanced Features (6-12 months)
- **Crew Management**: CrewAdapter with real-time updates
- **Moderation**: ModerationAdapter with audit logging
- **WebSocket Support**: Real-time data for Unite and Fight

### Stage 4: Performance & Scale (12+ months)
- **Offline Support**: IndexedDB caching
- **GraphQL Migration**: If backend adopts GraphQL
- **Federation**: Multiple API backends

---

## Migration Strategy

### Step 1: Parallel Implementation
Keep existing API functions working while building adapters:
```typescript
// Use adapter internally but maintain old interface
export async function searchWeapons(params: SearchParams) {
  const adapter = new SearchAdapter()
  return adapter.search({ ...params, type: 'weapon' })
}
```

### Step 2: Component Migration
Update components one at a time:
```svelte
<!-- Old -->
<script>
import { searchWeapons } from '$lib/api/resources/search'
const results = await searchWeapons({ query: 'sword' })
</script>

<!-- New -->
<script>
import { createSearchResource } from '$lib/api/adapters/resources'
const search = createSearchResource('weapon')
search.setQuery('sword')
</script>
```

### Step 3: Deprecation
Once all components migrated:
1. Mark old functions as deprecated
2. Add console warnings in development
3. Update documentation
4. Remove after grace period

---

## Performance Considerations

### Caching Strategy
```typescript
class CacheManager {
  private cache = new Map<string, { data: any; expires: number }>()

  set(key: string, data: any, ttl = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    })
  }

  get(key: string) {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clear(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }
}
```

### Request Deduplication
```typescript
class RequestDeduplicator {
  private pending = new Map<string, Promise<any>>()

  async dedupe<T>(
    key: string,
    factory: () => Promise<T>
  ): Promise<T> {
    const existing = this.pending.get(key)
    if (existing) return existing

    const promise = factory().finally(() => {
      this.pending.delete(key)
    })

    this.pending.set(key, promise)
    return promise
  }
}
```

---

## LLM Implementation Instructions

### For Claude Code

When implementing adapters, follow this exact sequence:

1. **Start with Base Adapter**
   ```bash
   # Create the file
   touch src/lib/api/adapters/base.adapter.ts

   # Implement the base adapter (copy from this doc)

   # Create test file
   touch src/lib/api/adapters/__tests__/base.adapter.test.ts

   # Run tests
   pnpm test:adapters -- base.adapter
   ```

2. **Verify Each Step**
   - After implementing each adapter, run its tests
   - Don't proceed until tests pass
   - If tests fail, check error messages and fix

3. **Common Pitfalls to Avoid**
   - Don't forget to transform responses (snake_case → camelCase)
   - Always handle request cancellation
   - Store edit keys in localStorage for parties
   - Clean up abort controllers after requests
   - Use proper TypeScript types (avoid `any` where possible)

4. **Testing Checklist**
   ```bash
   # Type checking
   pnpm test:adapter:types

   # Unit tests for specific adapter
   pnpm test:adapters -- [adapter-name]

   # Smoke tests
   pnpm test:adapter:smoke

   # All tests
   pnpm test:adapters
   ```

5. **Debug Failed Tests**
   - Check mock server handlers match expected endpoints
   - Verify transformation logic is correct
   - Ensure abort controllers are properly cleaned up
   - Check that cache keys are consistent

### Implementation Order

1. **Phase 1**: Base infrastructure (1-2 hours)
   - base.adapter.ts
   - errors.ts
   - types.ts
   - Base tests

2. **Phase 2**: Search adapter (1 hour)
   - search.adapter.ts
   - Search tests
   - Mock data fixtures

3. **Phase 3**: Party adapter (1-2 hours)
   - party.adapter.ts
   - Edit key management
   - Party tests

4. **Phase 4**: Runed resources (2 hours)
   - search.resource.ts
   - party.resource.ts
   - Integration tests

5. **Phase 5**: Additional adapters (as needed)
   - grid.adapter.ts
   - user.adapter.ts
   - entity.adapter.ts

### Verification Commands

After implementing everything, run this verification sequence:

```bash
# Install dependencies
pnpm add runed
pnpm add -D msw @testing-library/svelte

# Type checking
pnpm test:adapter:types

# Run all adapter tests
pnpm test:adapters

# Run smoke tests
pnpm test:adapter:smoke

# Check bundle size
pnpm build
ls -lh .svelte-kit/output/client/_app/immutable/chunks/
```

---

## Conclusion

This adapter architecture provides:
1. **Consistent API interface** across all resources
2. **Testable code** with comprehensive test coverage
3. **Type safety** with TypeScript
4. **Reactive state management** with Runed
5. **Progressive enhancement** - start simple, add complexity as needed

The testing methodology ensures that LLM implementations can be verified immediately without manual component testing, providing confidence that the code works correctly before integration.

Start with Phase 1 and progress through each phase only after tests pass. This incremental approach minimizes risk and ensures a solid foundation for future features.
# Migration Plan: Replace API Core with Adapters

## Overview
We need to migrate 32 files from using the old `$lib/api/core` to our new adapter system. The migration involves replacing direct API calls with adapter methods and updating imports.

## Progress Tracking

### Phase 1: Core API Resources (2 files) ✅ COMPLETED
- [x] **`lib/api/resources/parties.ts`** (1 import) - Uses get, post, put, del, buildUrl
  - ✅ Deleted - functionality moved to PartyAdapter
- [x] **`lib/api/resources/grid.ts`** (1 import) - Uses buildUrl
  - ✅ Deleted - functionality moved to GridAdapter

### Phase 2: Services (3 files) ✅ COMPLETED
- [x] **`lib/services/party.service.ts`** (1 import) - Uses FetchLike type
  - ✅ Updated to use PartyAdapter directly
- [x] **`lib/services/grid.service.ts`** (1 import) - Uses FetchLike type
  - ✅ Updated to use GridAdapter directly
- [x] **`lib/services/conflict.service.ts`** (1 import) - Uses FetchLike type
  - ✅ Updated to use GridAdapter conflict resolution methods

### Phase 3: API Route Handlers (20 files) ✅ COMPLETED

#### Party routes:
- [x] `routes/api/parties/+server.ts` - Create/list parties
  - ✅ Updated to use buildApiUrl utility
- [x] `routes/api/parties/[id]/+server.ts` - Update/delete party
  - ✅ Updated to use buildApiUrl utility

#### Grid weapon routes:
- [x] `routes/api/parties/[id]/grid_weapons/+server.ts`
  - ✅ Updated to use buildApiUrl utility
- [x] `routes/api/parties/[id]/grid_weapons/[weaponId]/position/+server.ts`
  - ✅ Updated to use buildApiUrl utility
- [x] `routes/api/parties/[id]/grid_weapons/swap/+server.ts`
  - ✅ Updated to use buildApiUrl utility
- [x] `routes/api/parties/[id]/weapons/+server.ts` (old endpoint)
  - ✅ Updated to use buildApiUrl utility
- [x] `routes/api/parties/[id]/weapons/[weaponId]/+server.ts` (old endpoint)
  - ✅ Updated to use buildApiUrl utility

#### Grid character routes:
- [x] `routes/api/parties/[id]/grid_characters/+server.ts`
  - ✅ Updated to use buildApiUrl utility
- [x] `routes/api/parties/[id]/grid_characters/[characterId]/position/+server.ts`
  - ✅ Updated to use buildApiUrl utility
- [x] `routes/api/parties/[id]/grid_characters/swap/+server.ts`
  - ✅ Updated to use buildApiUrl utility
- [x] `routes/api/parties/[id]/characters/+server.ts` (old endpoint)
  - ✅ Updated to use buildApiUrl utility
- [x] `routes/api/parties/[id]/characters/[characterId]/+server.ts` (old endpoint)
  - ✅ Updated to use buildApiUrl utility

#### Grid summon routes:
- [x] `routes/api/parties/[id]/grid_summons/+server.ts`
  - ✅ Updated to use buildApiUrl utility
- [x] `routes/api/parties/[id]/grid_summons/[summonId]/position/+server.ts`
  - ✅ Updated to use buildApiUrl utility
- [x] `routes/api/parties/[id]/grid_summons/swap/+server.ts`
  - ✅ Updated to use buildApiUrl utility
- [x] `routes/api/parties/[id]/summons/+server.ts` (old endpoint)
  - ✅ Updated to use buildApiUrl utility
- [x] `routes/api/parties/[id]/summons/[summonId]/+server.ts` (old endpoint)
  - ✅ Updated to use buildApiUrl utility

#### Uncap routes:
- [x] `routes/api/uncap/weapons/+server.ts`
  - ✅ Updated to use buildApiUrl utility
- [x] `routes/api/uncap/characters/+server.ts`
  - ✅ Updated to use buildApiUrl utility
- [x] `routes/api/uncap/summons/+server.ts`
  - ✅ Updated to use buildApiUrl utility

### Phase 4: Page Server Components (3 files) ✅ COMPLETED
- [x] **`routes/database/weapons/[id]/+page.server.ts`** - Uses get from api/core
  - ✅ Migrated to: EntityAdapter.getWeapon()
- [x] **`routes/database/characters/[id]/+page.server.ts`** - Uses get from api/core
  - ✅ Migrated to: EntityAdapter.getCharacter()
- [x] **`routes/database/summons/[id]/+page.server.ts`** - Uses get from api/core
  - ✅ Migrated to: EntityAdapter.getSummon()

### Phase 5: Utility & Support Files (4 files) ✅ COMPLETED
- [x] **`lib/api.ts`** (2 imports) - Helper for JSON fetching
  - ✅ Deleted - functionality inlined in about page
- [x] **`lib/server/detail/load.ts`** (2 imports) - Server-side detail loading
  - ✅ Deleted - no longer needed after migrating to EntityAdapter
- [x] **`lib/providers/DatabaseProvider.ts`** (1 import) - Uses API_BASE constant
  - ✅ Updated to import PUBLIC_SIERO_API_URL directly
- [x] **`lib/auth/oauth.ts`** (1 import) - Uses FetchLike type
  - ✅ Updated to use native fetch type

### Phase 1.5: Page Server Files Using Resources ✅ COMPLETED
- [x] **`routes/teams/explore/+page.server.ts`** - Uses parties resource
  - ✅ Updated to use partyAdapter.list() directly
- [x] **`routes/[username]/+page.server.ts`** - Uses users resource
  - ✅ Updated to use userAdapter.getProfile() and getFavorites()
- [x] **`lib/api/resources/users.ts`** - User resource facade
  - ✅ Deleted - functionality moved to UserAdapter (created new adapter)

## Migration Strategy

### Key Changes Per File Type

#### For API Resources:
```typescript
// Before
import { buildUrl, get } from '$lib/api/core'
const url = buildUrl('/parties')
const res = await fetch(url)

// After
import { partyAdapter } from '$lib/api/adapters'
const party = await partyAdapter.getByShortcode(shortcode)
```

#### For Services:
```typescript
// Before
constructor(private fetch: FetchLike) {}

// After
constructor(private adapter: PartyAdapter) {}
```

#### For API Routes:
```typescript
// Before
const response = await fetch(buildUrl(`/parties/${id}`))

// After
const party = await partyAdapter.getByShortcode(id)
return json(party)
```

#### For Page Server Components:
```typescript
// Before
import { get } from '$lib/api/core'
const character = await get(fetch, `/characters/${id}`)

// After
import { entityAdapter } from '$lib/api/adapters'
const character = await entityAdapter.getCharacter(id)
```

## Benefits
1. **Type Safety**: Adapters provide strong typing for all operations
2. **Consistency**: Unified API across all resource types
3. **Error Handling**: Centralized error handling with proper types
4. **Caching**: Built-in caching with TTL support
5. **Transformation**: Automatic snake_case/camelCase conversion
6. **Testing**: All adapters have comprehensive test coverage

## Execution Order
1. Start with Phase 1 (API Resources) as they're dependencies
2. Move to Phase 2 (Services)
3. Tackle Phase 3 (API Routes) in batches by resource type
4. Complete Phase 4 (Page Server)
5. Finish with Phase 5 (Utility files)

This migration will be done incrementally, ensuring each phase is complete and tested before moving to the next.
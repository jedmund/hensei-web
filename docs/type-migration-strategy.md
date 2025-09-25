# Type Migration Strategy: Existing Types vs New Architecture

## Current State Analysis

After examining the 35+ type definition files in `/src/lib/types/`, here's how they'll interact with the new architecture:

## Types to REPLACE

These types have direct conflicts with the new architecture and will be replaced:

### 1. Core Entity Types (Will be replaced with clean versions)
- **Party.d.ts** → New `Party` interface
  - Current uses snake_case (e.g., `full_auto`, `charge_attack`)
  - New version will use camelCase consistently
  - Will properly type grid items with named entities

- **GridWeapon.d.ts** → New `GridWeapon` interface
  - Current has `object: Weapon` (matching API's naming)
  - New version will have `weapon: Weapon` (semantic naming)

- **GridCharacter.d.ts** → New `GridCharacter` interface
  - Current has `object: Character`
  - New version will have `character: Character`

- **GridSummon.d.ts** → New `GridSummon` interface
  - Current has `object: Summon`
  - New version will have `summon: Summon`

### 2. Redundant View Types (Will be removed entirely)
- **From party.ts schema file:**
  - `PartyView` → Use new `Party` only
  - `GridWeaponItemView` → Use new `GridWeapon` only
  - `GridCharacterItemView` → Use new `GridCharacter` only
  - `GridSummonItemView` → Use new `GridSummon` only

## Types to KEEP

These types serve specific purposes and will remain:

### 1. UI State Types
- **CheckedState.d.ts** - UI selection state
- **ElementState.d.ts** - Element filtering state
- **ProficiencyState.d.ts** - Proficiency filtering state
- **RarityState.d.ts** - Rarity filtering state
- **FilterSet.d.ts** - Filter combinations

### 2. Domain-Specific Types
- **Awakening.d.ts** - Enhancement system
- **WeaponKey.d.ts** - Weapon upgrades
- **SimpleAxSkill.d.ts** - AX skill system
- **ItemSkill.d.ts** - Item skills
- **TeamElement.d.ts** - Team element logic

### 3. Infrastructure Types
- **User.d.ts** - User authentication
- **AccountCookie.d.ts** - Auth cookies
- **UserCookie.d.ts** - User preferences
- **GranblueCookie.d.ts** - Game data cookies
- **AppUpdate.d.ts** - App versioning

### 4. Helper Types
- **OnClickEvent.d.ts** - Event handlers
- **MentionItem.d.ts** - Rich text mentions
- **declarations.d.ts** - Module declarations
- **index.d.ts** - Type exports and utilities

## Types to MODIFY

These need minor updates to work with new architecture:

### 1. Base Entity Types
- **Weapon.d.ts** - Keep structure, but ensure camelCase
- **Character.d.ts** - Keep structure, but ensure camelCase
- **Summon.d.ts** - Keep structure, but ensure camelCase
- **Job.d.ts** - Keep structure, but ensure camelCase
- **JobSkill.d.ts** - Keep structure, but ensure camelCase
- **JobAccessory.d.ts** - Keep structure, but ensure camelCase
- **Raid.d.ts** - Keep structure, but ensure camelCase
- **RaidGroup.d.ts** - Keep structure, but ensure camelCase
- **Guidebook.d.ts** - Keep structure, but ensure camelCase

## Migration Plan

### Phase 1: Create New Type Definitions
1. Create `/src/lib/types/api/` directory for new clean types
2. Define base entities matching Rails blueprints
3. Use consistent camelCase throughout
4. Properly name nested entities (`weapon`, not `object`)

### Phase 2: Update API Client
1. Implement automatic transformation layer in `/src/lib/api/client.ts`
2. Handle `object` → proper entity name mapping
3. Apply snake_case ↔ camelCase transformation

### Phase 3: Gradual Component Migration
1. Update components to import from new type locations
2. Change property access from `item.object` to `item.weapon/character/summon`
3. Remove type casts and `as any` usage

### Phase 4: Cleanup
1. Delete old conflicting type files
2. Remove PartyView and other view types from schemas
3. Update all imports

## Type Import Strategy

```typescript
// OLD (current)
import type { Party } from '$lib/types/Party'
import type { GridWeapon } from '$lib/types/GridWeapon'
import type { PartyView } from '$lib/api/schemas/party'

// NEW (after migration)
import type { Party, GridWeapon, GridCharacter, GridSummon } from '$lib/types/api/party'
import type { Weapon, Character, Summon } from '$lib/types/api/entities'
// No more PartyView - just use Party
```

## Benefits of This Approach

1. **Preserves existing work**: Keeps all UI state types, domain logic types
2. **Single source of truth**: One `Party` type, not Party + PartyView
3. **Type safety**: Proper TypeScript types throughout
4. **Clean naming**: `weapon` instead of `object` everywhere
5. **Backwards compatible**: Can migrate gradually, component by component

## Example Type Transformation

### Before (Current)
```typescript
// Multiple conflicting types
interface Party { // from Party.d.ts
  full_auto: boolean
  weapons: Array<GridWeapon>
}

interface GridWeapon { // from GridWeapon.d.ts
  object: Weapon  // Confusing naming
}

interface PartyView { // from party.ts schema
  fullAuto?: boolean
  weapons: GridWeaponItemView[]
}
```

### After (New Architecture)
```typescript
// Single clean type
interface Party {
  fullAuto: boolean
  weapons: GridWeapon[]
}

interface GridWeapon {
  weapon: Weapon  // Semantic naming
  position: number
  mainhand?: boolean
  // ... other fields
}
// No PartyView needed!
```

## Implementation Order

1. **Start with Party types** - Most critical for hydration fix
2. **Then Grid types** - Fix the object → entity naming
3. **Keep all other types** - They're working fine
4. **Update components** - As needed for functionality

This approach minimizes disruption while fixing the core hydration and type safety issues.
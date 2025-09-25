# Clean Architecture Plan: Type-Safe Data Flow with Single Source of Truth

## Analysis Summary

After examining the Rails blueprints and current implementation, I've identified the key issues:

1. **Type Redundancy**: We have multiple types for the same entities (Party vs PartyView, GridWeapon vs GridWeaponItemView)
2. **Inconsistent Naming**: The API uses `object` to refer to nested entities (weapon, character, summon)
3. **Complex Validation**: The parseParty function does too much transformation and validation
4. **Hydration Issues**: Server and client compute different values due to timing and data availability

## Proposed Architecture

### 1. Single Source of Truth for Types

Create clean, single type definitions based on the Rails blueprints:

```typescript
// Core entities (from blueprints)
interface Weapon {
  id: string
  granblueId: string
  name: LocalizedName
  element: number
  proficiency: number
  rarity: number
  // ... all fields from WeaponBlueprint
}

interface Character {
  id: string
  granblueId: string
  name: LocalizedName
  element: number
  rarity: number
  // ... all fields from CharacterBlueprint
}

interface Summon {
  id: string
  granblueId: string
  name: LocalizedName
  element: number
  rarity: number
  // ... all fields from SummonBlueprint
}

// Grid items (relationships)
interface GridWeapon {
  id: string
  position: number
  mainhand?: boolean
  uncapLevel?: number
  transcendenceStep?: number
  element?: number
  weapon: Weapon  // Named properly, not "object"
  weaponKeys?: WeaponKey[]
  // ... fields from GridWeaponBlueprint
}

interface GridCharacter {
  id: string
  position: number
  uncapLevel?: number
  perpetuity?: boolean
  transcendenceStep?: number
  character: Character  // Named properly, not "object"
  awakening?: Awakening
  // ... fields from GridCharacterBlueprint
}

interface GridSummon {
  id: string
  position: number
  main?: boolean
  friend?: boolean
  quickSummon?: boolean
  uncapLevel?: number
  summon: Summon  // Named properly, not "object"
  // ... fields from GridSummonBlueprint
}

interface Party {
  id: string
  shortcode: string
  name?: string
  description?: string
  weapons: GridWeapon[]
  characters: GridCharacter[]
  summons: GridSummon[]
  job?: Job
  raid?: Raid
  // ... all fields from PartyBlueprint
}
```

### 2. Automatic Case Transformation Layer

Create a type-safe API client that handles transformations automatically:

```typescript
// api/client.ts
class ApiClient {
  private transformResponse<T>(data: any): T {
    // Transform snake_case to camelCase
    const camelCased = snakeToCamel(data)

    // Rename "object" to proper entity names
    if (camelCased.weapons) {
      camelCased.weapons = camelCased.weapons.map(w => ({
        ...w,
        weapon: w.object,
        object: undefined
      }))
    }
    if (camelCased.characters) {
      camelCased.characters = camelCased.characters.map(c => ({
        ...c,
        character: c.object,
        object: undefined
      }))
    }
    if (camelCased.summons) {
      camelCased.summons = camelCased.summons.map(s => ({
        ...s,
        summon: s.object,
        object: undefined
      }))
    }

    return camelCased as T
  }

  private transformRequest<T>(data: T): any {
    // Transform camelCase to snake_case
    // Rename entity names back to "object" for API
    const prepared = {
      ...data,
      weapons: data.weapons?.map(w => ({
        ...w,
        object: w.weapon,
        weapon: undefined
      })),
      // Similar for characters and summons
    }

    return camelToSnake(prepared)
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(path)
    const data = await response.json()
    return this.transformResponse<T>(data)
  }

  async post<T>(path: string, body: any): Promise<T> {
    const response = await fetch(path, {
      body: JSON.stringify(this.transformRequest(body))
    })
    const data = await response.json()
    return this.transformResponse<T>(data)
  }
}
```

### 3. Service Layer

Create clean service interfaces that return properly typed data:

```typescript
// services/party.service.ts
export class PartyService {
  constructor(private client: ApiClient) {}

  async getByShortcode(shortcode: string): Promise<Party> {
    // Client handles all transformations
    return this.client.get<Party>(`/parties/${shortcode}`)
  }

  async update(id: string, updates: Partial<Party>): Promise<Party> {
    return this.client.put<Party>(`/parties/${id}`, updates)
  }
}
```

### 4. Component Updates

Components use the clean, properly typed interfaces:

```typescript
// Party.svelte
interface Props {
  initial: Party  // Single Party type, no confusion
}

// WeaponUnit.svelte
interface Props {
  item: GridWeapon  // Properly typed with weapon property
}

// Access data cleanly:
const imageUrl = item.weapon.granblueId
const name = item.weapon.name
```

## Implementation Steps

1. **Create new type definitions** in `/src/lib/types/`:
   - `entities.ts` - Core entities (Weapon, Character, Summon, etc.)
   - `grid.ts` - Grid items (GridWeapon, GridCharacter, GridSummon)
   - `party.ts` - Party and related types

2. **Update API client** in `/src/lib/api/`:
   - Add transformation logic to handle `object` → entity name mapping
   - Keep snake_case/camelCase transformation
   - Make it type-safe with generics

3. **Simplify parseParty**:
   - Remove validation schemas
   - Just call the API client's transform method
   - Trust the API data structure

4. **Update components**:
   - Use the new single types everywhere
   - Access `item.weapon.granblueId` instead of `item.object.granblueId`
   - Remove all the `as any` casts

5. **Remove redundant types**:
   - Delete PartyView, GridWeaponItemView, etc.
   - Use only the new clean types

## Benefits

✅ **Single source of truth** - One type per entity, no confusion
✅ **Type safety** - Full TypeScript benefits with proper types
✅ **Clean property names** - `weapon`, `character`, `summon` instead of `object`
✅ **Automatic transformations** - Handle case conversion in one place
✅ **No hydration issues** - Consistent data structure everywhere
✅ **Maintainable** - Clear separation of concerns
✅ **Future-proof** - Easy to add new entities or fields
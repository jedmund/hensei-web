# Drag-Drop API Endpoints PRD

## Overview

This document outlines the API endpoints required to support drag-and-drop functionality for party grid management in the Hensei application. The frontend has implemented drag-drop interactions, but requires backend endpoints to persist position changes and item swaps.

## Problem Statement

### Current State
- The API currently only supports add/remove operations for grid items
- Position changes require removing and re-adding items
- Swapping items requires multiple API calls (remove both, then add both)
- This approach is error-prone and creates race conditions
- No atomic operations for complex moves

### User Impact
- Drag-drop appears to work visually but doesn't persist
- Risk of data loss if operations partially fail
- Poor performance with multiple network requests
- Inconsistent state between UI and database

## Proposed Solution

Implement dedicated API endpoints that match the drag-drop operations:
1. **Update Position** - Move an item to an empty slot
2. **Swap Items** - Exchange positions of two items
3. **Batch Update** - Handle complex multi-item operations atomically

## API Specifications

### 1. Update Position Endpoints

Move a grid item to a new empty position within the same or different container.

#### Weapons
```
PUT /api/v1/parties/:party_id/grid_weapons/:id/position
```

**Request Body:**
```json
{
  "position": 5,
  "container": "main" | "extra"
}
```

**Response (200 OK):**
```json
{
  "party": { /* updated party object */ },
  "grid_weapon": { /* updated grid weapon */ }
}
```

#### Characters
```
PUT /api/v1/parties/:party_id/grid_characters/:id/position
```

**Request Body:**
```json
{
  "position": 2,
  "container": "main" | "extra"
}
```

**Special Rules:**
- Characters must maintain sequential filling (no gaps)
- Server should auto-compact positions after move

**Response (200 OK):**
```json
{
  "party": { /* updated party object */ },
  "grid_character": { /* updated grid character */ },
  "reordered": true  // Indicates if sequential filling was applied
}
```

#### Summons
```
PUT /api/v1/parties/:party_id/grid_summons/:id/position
```

**Request Body:**
```json
{
  "position": 1,
  "container": "main" | "subaura"
}
```

**Response (200 OK):**
```json
{
  "party": { /* updated party object */ },
  "grid_summon": { /* updated grid summon */ }
}
```

### 2. Swap Endpoints

Exchange positions between two grid items of the same type.

#### Weapons
```
POST /api/v1/parties/:party_id/grid_weapons/swap
```

**Request Body:**
```json
{
  "source_id": "uuid-1",
  "target_id": "uuid-2"
}
```

**Response (200 OK):**
```json
{
  "party": { /* updated party object */ },
  "swapped": {
    "source": { /* updated source weapon */ },
    "target": { /* updated target weapon */ }
  }
}
```

#### Characters
```
POST /api/v1/parties/:party_id/grid_characters/swap
```

**Request Body:**
```json
{
  "source_id": "uuid-1",
  "target_id": "uuid-2"
}
```

**Response (200 OK):**
```json
{
  "party": { /* updated party object */ },
  "swapped": {
    "source": { /* updated source character */ },
    "target": { /* updated target character */ }
  }
}
```

#### Summons
```
POST /api/v1/parties/:party_id/grid_summons/swap
```

**Request Body:**
```json
{
  "source_id": "uuid-1",
  "target_id": "uuid-2"
}
```

**Response (200 OK):**
```json
{
  "party": { /* updated party object */ },
  "swapped": {
    "source": { /* updated source summon */ },
    "target": { /* updated target summon */ }
  }
}
```

### 3. Batch Grid Update Endpoint

Handle complex multi-item operations atomically.

```
POST /api/v1/parties/:party_id/grid_update
```

**Request Body:**
```json
{
  "operations": [
    {
      "type": "move",
      "entity": "character",
      "id": "uuid-1",
      "position": 2,
      "container": "main"
    },
    {
      "type": "swap",
      "entity": "weapon",
      "source_id": "uuid-2",
      "target_id": "uuid-3"
    },
    {
      "type": "remove",
      "entity": "summon",
      "id": "uuid-4"
    }
  ],
  "options": {
    "maintain_character_sequence": true,
    "validate_before_execute": true
  }
}
```

**Response (200 OK):**
```json
{
  "party": { /* fully updated party object */ },
  "operations_applied": 3,
  "changes": [
    { "entity": "character", "id": "uuid-1", "action": "moved", "from": 0, "to": 2 },
    { "entity": "weapon", "id": "uuid-2", "action": "swapped", "with": "uuid-3" },
    { "entity": "summon", "id": "uuid-4", "action": "removed" }
  ]
}
```

## Business Rules

### Position Constraints

#### Characters (0-4, 5-6 for extra)
- **Main slots (0-4):** Must be sequential, no gaps allowed
- **Extra slots (5-6):** Can have gaps
- **Auto-compact:** When moving/removing, shift remaining characters to maintain sequence

#### Weapons (-1 mainhand, 0-8 grid, 9+ extra)
- **Mainhand (-1):** Not draggable, cannot be target
- **Grid slots (0-8):** Can have gaps
- **Extra slots (9+):** Can have gaps

#### Summons (-1 main, 0-3 sub, 4-5 subaura, 6 friend)
- **Main (-1):** Not draggable, cannot be target
- **Sub slots (0-3):** Can have gaps
- **Subaura (4-5):** Can have gaps
- **Friend (6):** Not draggable, cannot be target

### Validation Rules

1. **Type Matching**
   - Can only swap/move items of the same type
   - Cannot mix characters, weapons, and summons

2. **Position Validation**
   - Target position must be valid for the entity type
   - Cannot move to restricted positions (mainhand, main summon, friend)

3. **Container Rules**
   - Items can move between containers (main ↔ extra)
   - Container must be valid for the entity type

4. **Conflict Resolution**
   - For weapons: Check Ultima/Opus conflicts
   - For summons: Check duplicate restrictions
   - Apply same rules as create operations

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": "Invalid position",
  "details": {
    "position": 10,
    "max_position": 8,
    "entity": "weapon"
  }
}
```

#### 403 Forbidden
```json
{
  "error": "Cannot modify restricted slot",
  "details": {
    "slot": "mainhand",
    "reason": "Mainhand weapon cannot be moved via drag-drop"
  }
}
```

#### 409 Conflict
```json
{
  "error": "Operation would create invalid state",
  "details": {
    "reason": "Cannot have two Ultima weapons in grid",
    "conflicting_items": ["uuid-1", "uuid-2"]
  }
}
```

#### 422 Unprocessable Entity
```json
{
  "error": "Validation failed",
  "details": {
    "source_id": ["not found"],
    "target_id": ["belongs to different party"]
  }
}
```

### Rollback Strategy

For batch operations:
1. Validate all operations before executing any
2. Use database transaction for atomicity
3. If any operation fails, rollback entire batch
4. Return detailed error showing which operation failed

## Implementation Notes

### Backend (Rails API)

1. **Controller Actions**
   - Add `update_position` action to grid controllers
   - Add `swap` action to grid controllers
   - Add `grid_update` action to parties controller

2. **Model Methods**
   - `GridWeapon#update_position(new_position, container = nil)`
   - `GridCharacter#update_position(new_position, container = nil)`
   - `GridSummon#update_position(new_position, container = nil)`
   - `Party#swap_items(source_item, target_item)`
   - `Party#apply_grid_operations(operations)`

3. **Validations**
   - Add position range validators
   - Add container validators
   - Ensure conflict rules are checked

4. **Authorization**
   - Require edit permission (user ownership or edit key)
   - Use existing `authorize_party_edit!` pattern

### Frontend Integration

1. **API Client Updates**
   ```typescript
   // Add to apiClient
   async updateWeaponPosition(partyId, weaponId, position, container)
   async updateCharacterPosition(partyId, characterId, position, container)
   async updateSummonPosition(partyId, summonId, position, container)
   async swapWeapons(partyId, sourceId, targetId)
   async swapCharacters(partyId, sourceId, targetId)
   async swapSummons(partyId, sourceId, targetId)
   async batchGridUpdate(partyId, operations)
   ```

2. **Drag Handler Updates**
   ```typescript
   // In Party.svelte
   async function handleMove(source, target) {
     const result = await apiClient.updateWeaponPosition(
       party.id,
       source.itemId,
       target.position,
       target.container
     )
     party = result.party
   }

   async function handleSwap(source, target) {
     const result = await apiClient.swapWeapons(
       party.id,
       source.itemId,
       target.itemId
     )
     party = result.party
   }
   ```

## Migration Strategy

### Phase 1: Backend Implementation
1. Implement new endpoints in Rails API
2. Add comprehensive tests
3. Deploy to staging

### Phase 2: Frontend Integration
1. Add new methods to API client
2. Update drag handlers to use new endpoints
3. Keep fallback to old method temporarily

### Phase 3: Validation
1. Test all drag-drop scenarios
2. Verify data integrity
3. Monitor for errors

### Phase 4: Cleanup
1. Remove old implementation
2. Remove fallback code
3. Update documentation

## Success Metrics

1. **Performance**
   - Single API call for position updates (vs 2-4 calls)
   - Response time < 200ms for position updates
   - Response time < 300ms for swaps

2. **Reliability**
   - Zero data inconsistencies
   - Atomic operations (no partial updates)
   - Proper rollback on failures

3. **User Experience**
   - Immediate visual feedback
   - Smooth animations
   - No lost changes

4. **Developer Experience**
   - Clean, intuitive API
   - Comprehensive error messages
   - Easy to debug issues

## Security Considerations

1. **Authorization**
   - Verify party ownership or edit key
   - Validate all IDs belong to specified party
   - Rate limiting on batch operations

2. **Input Validation**
   - Sanitize all position values
   - Validate container strings
   - Check array bounds

3. **Audit Trail**
   - Log all position changes
   - Track user/edit key for each operation
   - Monitor for suspicious patterns

## Future Enhancements

1. **Undo/Redo Support**
   - Track operation history
   - Implement reverse operations
   - Client-side undo stack

2. **Optimistic Updates**
   - Apply changes immediately in UI
   - Rollback on server rejection
   - Queue operations for offline support

3. **Bulk Operations**
   - "Auto-arrange" endpoint
   - "Clear grid" endpoint
   - "Copy from template" endpoint

4. **WebSocket Support**
   - Real-time updates for shared parties
   - Conflict resolution for simultaneous edits
   - Live collaboration features

## Conclusion

These API endpoints will provide a robust foundation for drag-drop functionality, ensuring data consistency, good performance, and excellent user experience. The atomic nature of these operations will eliminate current issues with partial updates and race conditions.
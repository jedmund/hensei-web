# Drag-and-Drop Implementation PRD

## Overview
Custom drag-and-drop solution for Granblue Fantasy party management grids (CharacterGrid, SummonGrid, WeaponGrid) using Svelte 5 runes. This is a client-side prototype focused on interaction patterns, built with API integration in mind for future persistence.

## Requirements

### CharacterGrid
- **Layout**: 5 horizontal slots
- **Behavior**: Sequential filling (no gaps allowed)
- **Drag Rules**:
  - All slots are draggable and droppable
  - Empty slots automatically sort to the end
  - Dragging to reorder maintains sequential filling

### SummonGrid
- **Layout**: Main + Friend (vertical) + 2x2 sub-summons
- **Positions**:
  - Main: position -1 (non-draggable)
  - Sub-summons: positions 0-3 (draggable)
  - Friend: position 6 (non-draggable)
- **Drag Rules**:
  - Sub-summons can have gaps
  - Can swap filled slots
  - Can move to empty slots

### WeaponGrid
- **Layout**: Mainhand (vertical) + 3x3 sub-weapons
- **Positions**:
  - Mainhand: position -1 (non-draggable)
  - Sub-weapons: positions 0-8 (draggable)
- **Drag Rules**:
  - Sub-weapons can have gaps
  - Can swap filled slots
  - Can move to empty slots

### Cross-Container Support
- Extra characters (separate container)
- Subaura summons (positions 4-5)
- Extra weapons (positions 9+)

## Implementation Phases

## Phase 1: Core Drag-and-Drop System ✅ COMPLETED

### Tasks:
- [x] Create core drag-and-drop composable (`$lib/composables/drag-drop.svelte.ts`)
  - [x] Implement reactive drag state management using runes
  - [x] Add drag source and drop target tracking
  - [x] Create coordinate and element detection helpers
  - [x] Implement unified pointer event handlers (mouse/touch)
  - [x] Add operation queue for future API sync
  - [x] Implement error recovery mechanisms

- [x] Create draggable item wrapper component (`$lib/components/dnd/DraggableItem.svelte`)
  - [x] Wrap unit components (CharacterUnit, WeaponUnit, SummonUnit)
  - [x] Handle drag start/end events
  - [x] Add visual feedback (opacity, cursor changes)
  - [x] Implement custom drag preview/ghost image
  - [x] Add touch gesture support with long-press detection

- [x] Create drop zone component (`$lib/components/dnd/DropZone.svelte`)
  - [x] Manage drop targets
  - [x] Implement hover state detection
  - [x] Add validation callbacks with console.log
  - [x] Implement visual feedback for valid/invalid drops
  - [x] Handle touch hover simulation

## Phase 2: Grid-Specific Implementation

### CharacterGrid Tasks:
- [ ] Implement draggable character slots
- [ ] Add sequential filling logic (no gaps allowed)
- [ ] Implement auto-sort to move empty slots to end
- [ ] Add position swapping between characters
- [ ] Test character reordering
- [ ] Add operation recording for future API sync

### SummonGrid Tasks:
- [ ] Make main/friend slots non-draggable
- [ ] Implement draggable sub-summons (2x2 grid)
- [ ] Allow gaps between filled slots
- [ ] Implement position swapping between filled slots
- [ ] Add move to empty slot functionality
- [ ] Test all summon grid interactions
- [ ] Add operation recording for future API sync

### WeaponGrid Tasks:
- [ ] Make mainhand slot non-draggable
- [ ] Implement draggable sub-weapons (3x3 grid)
- [ ] Allow gaps between filled slots
- [ ] Implement position swapping between filled slots
- [ ] Add move to empty slot functionality
- [ ] Test all weapon grid interactions
- [ ] Add operation recording for future API sync

## Phase 3: Cross-Container Dragging

### Tasks:
- [ ] Enable dragging between main and extra character slots
- [ ] Enable dragging between main and subaura summon slots
- [ ] Enable dragging between main and extra weapon slots
- [ ] Add validation rules with console.log output
- [ ] Test cross-container interactions
- [ ] Implement operation batching for complex moves

## Phase 4: Testing & Polish

### Tasks:
- [ ] Create comprehensive test route at `/test/drag-drop`
- [ ] Add mock data for all grid types
- [ ] Test all drag scenarios thoroughly
- [ ] Test touch device interactions
- [ ] Add smooth animations and transitions
- [ ] Optimize performance for smooth dragging
- [ ] Add visual indicators for drag states
- [ ] Test error recovery scenarios

## Phase 5: API Integration Preparation

### Tasks:
- [ ] Review operation queue implementation
- [ ] Add optimistic UI updates pattern
- [ ] Implement rollback mechanism for failed operations
- [ ] Add sync status indicators
- [ ] Document API contract requirements

## Technical Design

### Core Composable Structure with API-Ready State
```typescript
// $lib/composables/drag-drop.svelte.ts

// Operation types for future API sync
interface DragOperation {
  id: string
  type: 'move' | 'swap' | 'reorder'
  timestamp: number
  source: {
    container: string
    position: number
    itemId: string
  }
  target: {
    container: string
    position: number
    itemId?: string
  }
  status: 'pending' | 'synced' | 'failed'
  retryCount: number
}

interface TouchState {
  touchStartPos: { x: number, y: number } | null
  touchStartTime: number
  longPressTimer: number | null
  touchThreshold: number // 10px minimum movement to start drag
  longPressDuration: number // 500ms for long press
  currentTouch: Touch | null
}

interface DragState {
  isDragging: boolean
  draggedItem: {
    type: 'character' | 'weapon' | 'summon'
    data: GridCharacter | GridWeapon | GridSummon
    source: {
      container: string
      position: number
    }
  } | null
  hoveredOver: {
    container: string
    position: number
  } | null
  validDrop: boolean
  dragPreview: HTMLElement | null
  operationQueue: DragOperation[]
  lastError: Error | null
  touchState: TouchState
}

export function createDragDropContext() {
  const state = $state<DragState>({
    isDragging: false,
    draggedItem: null,
    hoveredOver: null,
    validDrop: false,
    dragPreview: null,
    operationQueue: [],
    lastError: null,
    touchState: {
      touchStartPos: null,
      touchStartTime: 0,
      longPressTimer: null,
      touchThreshold: 10,
      longPressDuration: 500,
      currentTouch: null
    }
  })

  // Unified pointer event handling
  function handlePointerDown(e: PointerEvent, item: GridItem, source: Position) {
    if (e.pointerType === 'touch') {
      initiateTouchDrag(e, item, source)
    } else {
      // Mouse handling remains immediate
      startDrag(item, source)
    }
  }

  function initiateTouchDrag(e: PointerEvent, item: GridItem, source: Position) {
    state.touchState.touchStartPos = { x: e.clientX, y: e.clientY }
    state.touchState.touchStartTime = Date.now()
    
    // Long press timer for touch devices
    state.touchState.longPressTimer = window.setTimeout(() => {
      startDrag(item, source)
      // Haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    }, state.touchState.longPressDuration)
  }

  function handlePointerMove(e: PointerEvent) {
    if (!state.touchState.touchStartPos) return

    const distance = Math.sqrt(
      Math.pow(e.clientX - state.touchState.touchStartPos.x, 2) +
      Math.pow(e.clientY - state.touchState.touchStartPos.y, 2)
    )

    // Cancel long press if user moves too much
    if (distance > state.touchState.touchThreshold && state.touchState.longPressTimer) {
      clearTimeout(state.touchState.longPressTimer)
      state.touchState.longPressTimer = null
    }
  }

  // Core drag operations with error handling
  function startDrag(item: GridItem, source: Position) {
    try {
      state.isDragging = true
      state.draggedItem = {
        type: detectItemType(item),
        data: item,
        source
      }
      createDragPreview(item)
    } catch (error) {
      handleDragError(error as Error)
    }
  }

  function createDragPreview(item: GridItem) {
    const preview = document.createElement('div')
    preview.className = 'drag-preview'
    preview.innerHTML = `
      <div class="drag-preview-content">
        <img src="${item.icon}" alt="${item.name}" />
        <span>${item.name}</span>
      </div>
    `
    document.body.appendChild(preview)
    state.dragPreview = preview
  }

  function endDrag() {
    try {
      if (state.validDrop && state.draggedItem && state.hoveredOver) {
        // Record operation for future API sync
        const operation: DragOperation = {
          id: crypto.randomUUID(),
          type: determineOperationType(state.draggedItem.source, state.hoveredOver),
          timestamp: Date.now(),
          source: {
            ...state.draggedItem.source,
            itemId: state.draggedItem.data.id
          },
          target: state.hoveredOver,
          status: 'pending',
          retryCount: 0
        }
        
        // Queue operation
        state.operationQueue.push(operation)
        
        // Perform local state update (optimistic)
        performLocalUpdate(operation)
        
        // Future: Trigger API sync here
        // scheduleSyncOperation(operation)
      }
    } catch (error) {
      handleDragError(error as Error)
    } finally {
      cleanupDragState()
    }
  }

  function handleDragError(error: Error) {
    console.error('🔥 Drag operation failed:', error)
    state.lastError = error
    
    // Rollback UI state if needed
    rollbackLastOperation()
    
    // Reset drag state
    cleanupDragState()
    
    // Could emit error event or show toast
    // eventBus.emit('drag-error', error)
  }

  function cleanupDragState() {
    state.isDragging = false
    state.draggedItem = null
    state.hoveredOver = null
    state.validDrop = false
    
    // Clean up drag preview
    if (state.dragPreview) {
      state.dragPreview.remove()
      state.dragPreview = null
    }
    
    // Clear touch state
    if (state.touchState.longPressTimer) {
      clearTimeout(state.touchState.longPressTimer)
    }
    state.touchState = {
      ...state.touchState,
      touchStartPos: null,
      longPressTimer: null,
      currentTouch: null
    }
  }

  function rollbackLastOperation() {
    const lastOp = state.operationQueue.at(-1)
    if (lastOp && lastOp.status === 'pending') {
      // Revert the optimistic update
      console.log('🔄 Rolling back operation:', lastOp.id)
      // Implementation depends on grid type
      state.operationQueue = state.operationQueue.filter(op => op.id !== lastOp.id)
    }
  }

  // API sync preparation
  async function syncOperations() {
    const pending = state.operationQueue.filter(op => op.status === 'pending')
    
    for (const operation of pending) {
      try {
        // Future API call would go here
        // await api.syncDragOperation(operation)
        
        operation.status = 'synced'
        console.log('✅ Operation synced:', operation.id)
      } catch (error) {
        operation.status = 'failed'
        operation.retryCount++
        
        if (operation.retryCount < 3) {
          // Retry later
          setTimeout(() => retryOperation(operation), 1000 * operation.retryCount)
        } else {
          // Max retries reached, handle failure
          handleSyncFailure(operation)
        }
      }
    }
  }

  function validateDrop(source: Position, target: Position): boolean {
    console.group('🎯 Drop Validation')
    console.log('Source:', source)
    console.log('Target:', target)

    try {
      // Check item type compatibility
      if (!isCompatibleType(source, target)) {
        console.log('❌ Type mismatch')
        return false
      }

      // Check position restrictions
      if (!isValidPosition(target)) {
        console.log('❌ Invalid target position')
        return false
      }

      console.log('✅ Drop allowed')
      return true
    } catch (error) {
      console.error('❌ Validation error:', error)
      return false
    } finally {
      console.groupEnd()
    }
  }

  return {
    get state() { return state },
    handlePointerDown,
    handlePointerMove,
    startDrag,
    updateHover,
    endDrag,
    validateDrop,
    syncOperations,
    getQueuedOperations: () => state.operationQueue.filter(op => op.status === 'pending'),
    clearQueue: () => { state.operationQueue = [] }
  }
}
```

### Enhanced Component Integration
```svelte
<!-- DraggableItem.svelte -->
<script lang="ts">
  import { getContext, onMount } from 'svelte'

  interface Props {
    item: GridItem
    container: string
    position: number
    canDrag?: boolean
    customPreview?: boolean
  }

  let { item, container, position, canDrag = true, customPreview = false }: Props = $props()
  const dragContext = getContext('drag-drop')
  let elementRef: HTMLElement

  // Handle both mouse and touch events
  function handleDragStart(e: DragEvent) {
    if (!canDrag) {
      e.preventDefault()
      return
    }

    // Custom drag preview
    if (customPreview) {
      const ghost = createCustomGhost()
      e.dataTransfer?.setDragImage(ghost, e.offsetX, e.offsetY)
      // Clean up ghost after frame
      requestAnimationFrame(() => ghost.remove())
    }

    // Set drag data
    e.dataTransfer!.effectAllowed = 'move'
    e.dataTransfer!.setData('application/json', JSON.stringify({
      item,
      container,
      position
    }))

    dragContext.startDrag(item, { container, position })
  }

  function createCustomGhost(): HTMLElement {
    const ghost = document.createElement('div')
    ghost.className = 'drag-ghost'
    ghost.style.position = 'absolute'
    ghost.style.top = '-1000px'
    ghost.style.left = '-1000px'
    ghost.style.transform = 'rotate(5deg)'
    ghost.style.opacity = '0.8'
    
    // Clone the dragged element's content
    ghost.innerHTML = elementRef.innerHTML
    document.body.appendChild(ghost)
    
    return ghost
  }

  // Touch support via pointer events
  function handlePointerDown(e: PointerEvent) {
    if (!canDrag) return
    dragContext.handlePointerDown(e, item, { container, position })
  }

  function handlePointerMove(e: PointerEvent) {
    dragContext.handlePointerMove(e)
  }

  function handlePointerUp(e: PointerEvent) {
    if (dragContext.state.touchState.longPressTimer) {
      clearTimeout(dragContext.state.touchState.longPressTimer)
    }
  }

  onMount(() => {
    // Add touch event listeners for better mobile support
    if ('ontouchstart' in window) {
      elementRef?.addEventListener('touchstart', handleTouchStart, { passive: false })
      elementRef?.addEventListener('touchmove', handleTouchMove, { passive: false })
      elementRef?.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      if ('ontouchstart' in window) {
        elementRef?.removeEventListener('touchstart', handleTouchStart)
        elementRef?.removeEventListener('touchmove', handleTouchMove)
        elementRef?.removeEventListener('touchend', handleTouchEnd)
      }
    }
  })

  // Prevent default touch behavior for better drag experience
  function handleTouchStart(e: TouchEvent) {
    if (!canDrag) return
    e.preventDefault() // Prevent scrolling while dragging
  }

  function handleTouchMove(e: TouchEvent) {
    if (dragContext.state.isDragging) {
      e.preventDefault()
      // Update drag preview position
      updateDragPreviewPosition(e.touches[0])
    }
  }

  function handleTouchEnd(e: TouchEvent) {
    if (dragContext.state.isDragging) {
      // Find drop target
      const touch = e.changedTouches[0]
      const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY)
      // Trigger drop on target
      dragContext.endDrag()
    }
  }

  function updateDragPreviewPosition(touch: Touch) {
    if (dragContext.state.dragPreview) {
      dragContext.state.dragPreview.style.left = `${touch.clientX}px`
      dragContext.state.dragPreview.style.top = `${touch.clientY}px`
    }
  }
</script>

<div
  bind:this={elementRef}
  draggable={canDrag}
  ondragstart={handleDragStart}
  onpointerdown={handlePointerDown}
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
  class:dragging={dragContext.state.isDragging && 
    dragContext.state.draggedItem?.source.position === position}
  class:can-drag={canDrag}
  data-container={container}
  data-position={position}
>
  <slot />
</div>

<style lang="scss">
  .dragging {
    opacity: 0.5;
    cursor: grabbing;
  }

  .can-drag {
    cursor: grab;
    touch-action: none; /* Prevent touch scrolling */
    user-select: none;
    
    &:active {
      cursor: grabbing;
    }
  }
</style>
```

### Grid State Management with Operation Queue
```typescript
// Grid component state (e.g., CharacterGrid.svelte)
import { createDragDropContext } from '$lib/composables/drag-drop.svelte.ts'

// Local state that will sync with API
let characters = $state<GridCharacter[]>([
  { id: '1', position: 0, character: mockCharacter1 },
  { id: '2', position: 1, character: mockCharacter2 },
])

// Track sync status
let syncStatus = $state<'idle' | 'syncing' | 'error'>('idle')
let unsyncedChanges = $derived(dragContext.getQueuedOperations().length > 0)

const dragContext = createDragDropContext()

// Handle drop with optimistic update
function handleCharacterDrop(operation: DragOperation) {
  // Optimistically update local state
  const tempCharacters = [...characters]
  
  if (operation.type === 'swap') {
    // Swap positions
    const sourceIndex = tempCharacters.findIndex(c => c.position === operation.source.position)
    const targetIndex = tempCharacters.findIndex(c => c.position === operation.target.position)
    
    if (sourceIndex !== -1 && targetIndex !== -1) {
      [tempCharacters[sourceIndex], tempCharacters[targetIndex]] = 
        [tempCharacters[targetIndex], tempCharacters[sourceIndex]]
    }
  } else if (operation.type === 'move') {
    // Move to empty slot
    const sourceChar = tempCharacters.find(c => c.position === operation.source.position)
    if (sourceChar) {
      sourceChar.position = operation.target.position
    }
  }
  
  // Apply optimistic update
  characters = tempCharacters
  
  // Queue for sync (will be processed when API is integrated)
  console.log('📝 Operation queued for sync:', operation)
}

// Future: Auto-sync with API
$effect(() => {
  if (unsyncedChanges && syncStatus === 'idle') {
    // Debounce sync attempts
    const timer = setTimeout(() => {
      syncWithAPI()
    }, 1000)
    
    return () => clearTimeout(timer)
  }
})

async function syncWithAPI() {
  syncStatus = 'syncing'
  
  try {
    // Future API implementation
    // await dragContext.syncOperations()
    console.log('🔄 Would sync operations here:', dragContext.getQueuedOperations())
    syncStatus = 'idle'
  } catch (error) {
    syncStatus = 'error'
    console.error('Sync failed:', error)
  }
}
```

## Error Recovery Patterns

### Automatic Retry Logic
```typescript
class DragOperationError extends Error {
  constructor(
    message: string,
    public operation: DragOperation,
    public recoverable: boolean = true
  ) {
    super(message)
    this.name = 'DragOperationError'
  }
}

async function retryOperation(operation: DragOperation) {
  console.log(`🔄 Retrying operation ${operation.id} (attempt ${operation.retryCount + 1})`)
  
  try {
    // Future API call
    // await api.syncDragOperation(operation)
    operation.status = 'synced'
  } catch (error) {
    if (error instanceof DragOperationError && !error.recoverable) {
      // Unrecoverable error, rollback
      rollbackOperation(operation)
    } else {
      // Schedule another retry
      operation.retryCount++
      if (operation.retryCount < 3) {
        setTimeout(() => retryOperation(operation), Math.pow(2, operation.retryCount) * 1000)
      }
    }
  }
}
```

### User Feedback for Sync Status
```svelte
<!-- SyncStatusIndicator.svelte -->
<script lang="ts">
  interface Props {
    status: 'idle' | 'syncing' | 'error'
    pendingCount: number
  }
  
  let { status, pendingCount }: Props = $props()
</script>

{#if pendingCount > 0}
  <div class="sync-indicator" class:error={status === 'error'}>
    {#if status === 'syncing'}
      <span class="spinner">⟳</span> Saving changes...
    {:else if status === 'error'}
      <span class="error-icon">⚠</span> Sync failed - changes pending
      <button onclick={retry}>Retry</button>
    {:else}
      <span class="pending-icon">●</span> {pendingCount} unsaved {pendingCount === 1 ? 'change' : 'changes'}
    {/if}
  </div>
{/if}
```

## Custom Drag Preview Specifications

### Visual Customization
```scss
.drag-preview {
  position: fixed;
  pointer-events: none;
  z-index: 10000;
  transform: rotate(3deg) scale(1.05);
  opacity: 0.9;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  transition: transform 0.2s ease-out;
  
  .drag-preview-content {
    background: var(--bg-primary);
    border: 2px solid var(--accent-color);
    border-radius: 8px;
    padding: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    
    img {
      width: 40px;
      height: 40px;
      border-radius: 4px;
    }
    
    span {
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
    }
  }
}

// Touch device specific styles
@media (hover: none) {
  .drag-preview {
    transform: translateY(-50px) scale(1.1); // Offset from finger
  }
}
```

## Touch/Mobile Interaction Patterns

### Long Press Visual Feedback
```scss
.draggable-item {
  position: relative;
  
  &.long-press-active::before {
    content: '';
    position: absolute;
    inset: -4px;
    border: 2px solid var(--accent-color);
    border-radius: 8px;
    animation: pulse 0.5s ease-in-out;
    pointer-events: none;
  }
}

@keyframes pulse {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.05);
  }
}
```

### Touch Gesture Configurations
```typescript
interface TouchConfig {
  longPressDuration: number      // 500ms default
  touchThreshold: number         // 10px movement threshold
  scrollLockThreshold: number    // 5px to lock scrolling
  hapticFeedback: boolean       // Enable vibration
  visualFeedback: boolean       // Show press indicator
}

// Allow customization per grid type
const characterGridTouchConfig: TouchConfig = {
  longPressDuration: 400,      // Faster for experienced users
  touchThreshold: 15,          // More forgiving
  scrollLockThreshold: 5,
  hapticFeedback: true,
  visualFeedback: true
}
```

## Validation Rules

### Console Logging Pattern (Enhanced)
```typescript
function validateDrop(source: Position, target: Position): boolean {
  console.group('🎯 Drop Validation')
  console.log('Source:', source)
  console.log('Target:', target)
  console.log('Queue Length:', state.operationQueue.length)

  try {
    // Check if operation would create invalid state
    const wouldCreateInvalidState = checkStateValidity(source, target)
    if (wouldCreateInvalidState) {
      console.log('❌ Would create invalid state:', wouldCreateInvalidState)
      return false
    }

    // Check item type compatibility
    if (source.type !== target.expectedType) {
      console.log('❌ Type mismatch:', source.type, 'vs', target.expectedType)
      return false
    }

    // Check position restrictions
    if (target.position === -1 && !target.allowMainhand) {
      console.log('❌ Cannot drop in mainhand slot')
      return false
    }

    // Check container transfer rules
    if (source.container !== target.container) {
      const transferAllowed = validateContainerTransfer(source.container, target.container)
      if (!transferAllowed) {
        console.log('❌ Container transfer not allowed')
        return false
      }
      console.log('✅ Valid container transfer')
    }

    console.log('✅ Drop allowed')
    return true
  } catch (error) {
    console.error('❌ Validation error:', error)
    state.lastError = error as Error
    return false
  } finally {
    console.groupEnd()
  }
}
```

## Testing Scenarios

### Touch Device Testing
1. Long press to initiate drag
2. Drag across viewport boundaries
3. Multi-touch rejection (only one drag at a time)
4. Scroll prevention during drag
5. Touch cancel handling (incoming call, notification)

### Error Recovery Testing
1. Simulate failed API calls
2. Test retry mechanism with exponential backoff
3. Verify rollback of optimistic updates
4. Test max retry limit behavior
5. Verify error state UI feedback

### Operation Queue Testing
1. Queue multiple operations rapidly
2. Verify operations maintain order
3. Test queue persistence (page refresh simulation)
4. Test sync status indicators
5. Verify batch operation handling

### Drag Preview Testing
1. Custom preview rendering
2. Preview position relative to cursor/touch
3. Preview cleanup on drag end
4. Preview visibility across z-indexes
5. Performance with complex preview content

## Performance Optimizations

### Touch Performance
```typescript
// Debounce touch move events
let touchMoveFrame: number | null = null

function handleTouchMove(e: TouchEvent) {
  if (touchMoveFrame) return
  
  touchMoveFrame = requestAnimationFrame(() => {
    updateDragPosition(e.touches[0])
    touchMoveFrame = null
  })
}
```

### Operation Queue Optimization
```typescript
// Batch operations for efficiency
function batchOperations(operations: DragOperation[]): BatchedOperation {
  return {
    id: crypto.randomUUID(),
    operations: operations,
    timestamp: Date.now(),
    type: 'batch'
  }
}

// Deduplicate redundant operations
function deduplicateQueue(queue: DragOperation[]): DragOperation[] {
  const seen = new Map<string, DragOperation>()
  
  for (const op of queue) {
    const key = `${op.source.itemId}-${op.target.position}`
    if (!seen.has(key) || op.timestamp > seen.get(key)!.timestamp) {
      seen.set(key, op)
    }
  }
  
  return Array.from(seen.values())
}
```

## Future API Contract Requirements

### Expected Endpoints
```typescript
interface DragDropAPI {
  // Single operation
  syncOperation(operation: DragOperation): Promise<{ success: boolean, error?: string }>
  
  // Batch operations
  syncBatch(operations: DragOperation[]): Promise<BatchSyncResult>
  
  // Get current state (for reconciliation)
  getGridState(gridType: string, partyId: string): Promise<GridState>
  
  // Validate operation before performing
  validateOperation(operation: DragOperation): Promise<ValidationResult>
}
```

### Optimistic Update Pattern
```typescript
async function performOperationWithOptimisticUpdate(operation: DragOperation) {
  // 1. Apply optimistic update immediately
  applyLocalUpdate(operation)
  
  // 2. Queue for sync
  state.operationQueue.push(operation)
  
  // 3. Attempt sync (non-blocking)
  syncOperation(operation).catch(error => {
    // 4. Rollback on failure
    if (error.code === 'INVALID_STATE') {
      rollbackOperation(operation)
      // Fetch fresh state from server
      refreshGridState()
    }
  })
}
```

## Success Metrics

- [ ] All drag operations feel smooth (60fps)
- [ ] Touch interactions feel native and responsive
- [ ] Visual feedback is clear and immediate
- [ ] Error recovery is transparent to users
- [ ] Operation queue handles offline scenarios gracefully
- [ ] Custom drag previews enhance user experience
- [ ] Console logs provide useful debugging info
- [ ] No breaking changes to existing components
- [ ] Code is clean and follows Svelte 5 patterns
- [ ] Test page demonstrates all features including error scenarios
- [ ] API integration points are clearly defined

## Implementation Notes

- Use Svelte 5 runes exclusively ($state, $derived, $effect)
- Implement pointer events for unified mouse/touch handling
- Keep operation queue in memory (localStorage for persistence if needed)
- Use RequestAnimationFrame for smooth animations
- Implement proper cleanup in component unmount
- Add comprehensive error boundaries
- Document API contract assumptions
- Follow existing SCSS module patterns
- Comment complex logic thoroughly
- Consider accessibility in future phases
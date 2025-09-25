# Transcendence Star Popover Fix - Implementation Plan

## Problem Statement

The TranscendenceStar component's popover interface has three critical issues:

1. **Z-index layering issue**: The popover (z-index: 100) appears below weapon images and other UI elements
2. **Overflow clipping**: The parent container `.page-wrap` has `overflow-x: auto` which clips the popover
3. **Viewport positioning**: The popover can appear partially off-screen when the star is near the bottom of the viewport

## Current Implementation Analysis

### File Structure
- Component: `/src/lib/components/uncap/TranscendenceStar.svelte`
- Fragment: `/src/lib/components/uncap/TranscendenceFragment.svelte`

### Current Approach
- Popover is rendered as a child div with `position: absolute`
- Uses local state `isPopoverOpen` to control visibility
- Z-index set to 100 (below tooltips at 1000)
- No viewport edge detection or smart positioning

## Solution Architecture

### 1. Portal-Based Rendering
Use bits-ui Portal component to render the popover outside the DOM hierarchy, avoiding overflow clipping.

**Benefits:**
- Escapes any parent overflow constraints
- Maintains React-like portal behavior
- Already proven pattern in Dialog.svelte

### 2. Z-index Hierarchy Management

Current z-index levels in codebase:
- Tooltips: 1000
- Navigation/Side panels: 50
- Fragments: 32
- Current popover: 100

**Solution:** Set popover z-index to 1001 (above tooltips)

### 3. Smart Positioning System

#### Position Calculation Algorithm

```typescript
interface PopoverPosition {
  top: number;
  left: number;
  placement: 'above' | 'below';
}

function calculatePopoverPosition(
  starElement: HTMLElement,
  popoverWidth: number = 80,
  popoverHeight: number = 100
): PopoverPosition {
  const rect = starElement.getBoundingClientRect();
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };

  // Calculate available space
  const spaceBelow = viewport.height - rect.bottom;
  const spaceAbove = rect.top;
  const spaceRight = viewport.width - rect.right;
  const spaceLeft = rect.left;

  // Determine vertical placement
  const placement = spaceBelow < popoverHeight && spaceAbove > spaceBelow
    ? 'above'
    : 'below';

  // Calculate position
  let top = placement === 'below'
    ? rect.bottom + 8  // 8px gap
    : rect.top - popoverHeight - 8;

  // Center horizontally on star
  let left = rect.left + (rect.width / 2) - (popoverWidth / 2);

  // Adjust horizontal position if too close to edges
  if (left < 8) {
    left = 8; // 8px from left edge
  } else if (left + popoverWidth > viewport.width - 8) {
    left = viewport.width - popoverWidth - 8; // 8px from right edge
  }

  return { top, left, placement };
}
```

### 4. Implementation Details

#### State Management
```typescript
// New state variables
let popoverPosition = $state<PopoverPosition | null>(null);
let popoverElement: HTMLDivElement;
```

#### Position Update Effect
```typescript
$effect(() => {
  if (isPopoverOpen && starElement) {
    const updatePosition = () => {
      popoverPosition = calculatePopoverPosition(starElement);
    };

    // Initial position
    updatePosition();

    // Update on scroll/resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }
});
```

#### Template Structure
```svelte
{#if interactive && isPopoverOpen && popoverPosition}
  <Portal>
    <div
      class="popover"
      class:above={popoverPosition.placement === 'above'}
      style="top: {popoverPosition.top}px; left: {popoverPosition.left}px"
      bind:this={popoverElement}
    >
      <div class="fragments">
        <!-- existing fragment content -->
      </div>
      <div class="level">
        <!-- existing level display -->
      </div>
    </div>
  </Portal>
{/if}
```

#### Style Updates
```scss
.popover {
  position: fixed;
  z-index: 1001;

  // Remove static positioning
  // top: -10px; (remove)
  // left: -10px; (remove)

  // Add placement variants
  &.above {
    // Arrow or visual indicator for above placement
  }

  // Smooth appearance
  animation: popover-appear 0.2s ease-out;
}

@keyframes popover-appear {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Implementation Steps

1. **Install/verify bits-ui Portal availability**
   - Check if Portal is exported from bits-ui
   - If not available, create custom portal implementation

2. **Add positioning logic**
   - Create calculatePopoverPosition function
   - Add position state management
   - Add scroll/resize listeners

3. **Update template**
   - Wrap popover in Portal component
   - Apply dynamic positioning styles
   - Add placement classes

4. **Update styles**
   - Change to position: fixed
   - Increase z-index to 1001
   - Add animation for smooth appearance
   - Handle above/below placement variants

5. **Testing**
   - Test near all viewport edges
   - Test with scrolling
   - Test with window resize
   - Verify z-index layering
   - Confirm no overflow clipping

## Alternative Approaches Considered

### Floating UI Library
- Pros: Robust positioning, automatic flipping, virtual element support
- Cons: Additional dependency, may be overkill for simple use case
- Decision: Start with custom implementation, can migrate if needed

### Tooltip Component Reuse
- Pros: Consistent behavior with existing tooltips
- Cons: Tooltips likely simpler, may not support interactive content
- Decision: Custom implementation for specific transcendence needs

## Success Criteria

- [ ] Popover appears above all other UI elements
- [ ] No clipping by parent containers
- [ ] Smart positioning avoids viewport edges
- [ ] Smooth transitions and animations
- [ ] Click outside properly closes popover
- [ ] Position updates on scroll/resize
- [ ] Works on all screen sizes

## References

- Current implementation: `/src/lib/components/uncap/TranscendenceStar.svelte`
- Portal example: `/src/lib/components/ui/Dialog.svelte`
- Original Next.js version: `/hensei-web/components/uncap/TranscendencePopover/`
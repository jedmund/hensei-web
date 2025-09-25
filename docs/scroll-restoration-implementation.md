# Scroll Restoration Implementation for Custom Containers

## Problem Description

In our SvelteKit application, scroll position isn't resetting when navigating between pages. This issue occurs because:

1. The application uses a custom scrolling container (`.main-content`) instead of the default window/body scrolling
2. SvelteKit's built-in scroll restoration only works with window-level scrolling
3. When navigating from a scrolled profile page to a team detail page, the detail page appears scrolled down instead of at the top

### User Experience Impact
- Users scroll down on a profile page
- Click on a team to view details
- The team detail page is already scrolled down (unexpected)
- This breaks the expected navigation behavior where new pages start at the top

## Research Findings

### SvelteKit's Default Behavior
- SvelteKit automatically handles scroll restoration for window-level scrolling
- It stores scroll positions in `sessionStorage` for browser back/forward navigation
- The `afterNavigate` and `beforeNavigate` hooks provide navigation lifecycle control
- The navigation `type` parameter distinguishes between different navigation methods

### Limitations with Custom Scroll Containers
- SvelteKit's scroll handling doesn't automatically work with custom containers (GitHub issues [#937](https://github.com/sveltejs/kit/issues/937), [#2733](https://github.com/sveltejs/kit/issues/2733))
- The framework only tracks `window.scrollY`, not element-specific scroll positions
- Using `disableScrollHandling()` is discouraged as it "breaks user expectations" (official docs)

### Community Solutions
1. Manual scroll management using navigation hooks
2. Combining `beforeNavigate` for saving positions with `afterNavigate` for restoration
3. Using the snapshot API for session persistence
4. Leveraging `requestAnimationFrame` to ensure DOM readiness

## Solution Architecture

### Core Components

1. **Scroll Position Storage**: A Map that stores scroll positions keyed by URL
2. **Navigation Hooks**: Using `beforeNavigate` and `afterNavigate` for lifecycle management
3. **Navigation Type Detection**: Using the `type` parameter to distinguish navigation methods
4. **DOM Reference**: Direct reference to the `.main-content` scrolling container

### Navigation Type Disambiguation

The solution uses SvelteKit's navigation `type` to determine the appropriate scroll behavior:

| Navigation Type | Value | Behavior | Example |
|----------------|-------|----------|---------|
| Initial Load | `'enter'` | Scroll to top | First visit to the app |
| Link Click | `'link'` | Scroll to top | Clicking `<a>` tags |
| Programmatic | `'goto'` | Scroll to top | Using `goto()` function |
| Browser Navigation | `'popstate'` | Restore position | Back/forward buttons |
| Leave App | `'leave'` | N/A | Navigating away |

## Implementation

### Complete Solution Code

Add the following to `/src/routes/+layout.svelte`:

```svelte
<script lang="ts">
  import { afterNavigate, beforeNavigate } from '$app/navigation'
  import { browser } from '$app/environment'
  // ... other imports

  // Reference to the scrolling container
  let mainContent: HTMLElement | undefined;

  // Store scroll positions for each visited route
  const scrollPositions = new Map<string, number>();

  // Save scroll position before navigating away
  beforeNavigate(({ from }) => {
    if (from && mainContent) {
      // Create a unique key including pathname and query params
      const key = from.url.pathname + from.url.search;
      scrollPositions.set(key, mainContent.scrollTop);
    }
  });

  // Handle scroll restoration or reset after navigation
  afterNavigate(({ from, to, type }) => {
    if (!mainContent) return;

    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      const key = to.url.pathname + to.url.search;

      // Only restore scroll for browser back/forward navigation
      if (type === 'popstate' && scrollPositions.has(key)) {
        // User clicked back/forward button - restore their position
        mainContent.scrollTop = scrollPositions.get(key) || 0;
      } else {
        // Any other navigation type (link, goto, enter, etc.) - go to top
        mainContent.scrollTop = 0;
      }
    });
  });

  // Optional: Export snapshot for session persistence
  export const snapshot = {
    capture: () => {
      if (!mainContent) return { scroll: 0, positions: [] };
      return {
        scroll: mainContent.scrollTop,
        positions: Array.from(scrollPositions.entries())
      };
    },
    restore: (data) => {
      if (!data || !mainContent) return;
      // Restore saved positions map
      if (data.positions) {
        scrollPositions.clear();
        data.positions.forEach(([key, value]) => {
          scrollPositions.set(key, value);
        });
      }
      // Restore current scroll position after DOM is ready
      if (browser) {
        requestAnimationFrame(() => {
          if (mainContent) mainContent.scrollTop = data.scroll;
        });
      }
    }
  };
</script>

<!-- Update the main content element to include the reference -->
<main class="main-content" bind:this={mainContent}>
  {@render children?.()}
</main>
```

### Integration Steps

1. **Import Navigation Hooks**
   ```typescript
   import { afterNavigate, beforeNavigate } from '$app/navigation'
   ```

2. **Add Container Reference**
   Change the `<main>` element to include `bind:this={mainContent}`

3. **Initialize Scroll Position Map**
   Create a Map to store positions: `const scrollPositions = new Map<string, number>()`

4. **Implement Navigation Handlers**
   Add the `beforeNavigate` and `afterNavigate` callbacks as shown above

5. **Optional: Add Snapshot Support**
   Export the snapshot object for session persistence across refreshes

## Navigation Scenarios

### 1. Back/Forward Button Navigation
- **Detection**: `type === 'popstate'`
- **Action**: Restore saved scroll position if it exists
- **Example**: User views profile → scrolls down → clicks team → clicks back button → returns to scrolled position

### 2. Link Click Navigation
- **Detection**: `type === 'link'`
- **Action**: Reset scroll to top
- **Example**: User clicks on any `<a>` tag or navigation link → new page starts at top

### 3. Page Refresh
- **Detection**: Map is empty after refresh (unless snapshot is used)
- **Action**: Start at top (default behavior)
- **Example**: User refreshes browser → page loads at top

### 4. Programmatic Navigation
- **Detection**: `type === 'goto'`
- **Action**: Reset scroll to top
- **Example**: Code calls `goto('/teams')` → page starts at top

### 5. Direct URL Access
- **Detection**: `type === 'enter'`
- **Action**: Start at top
- **Example**: User enters URL directly or opens bookmark → page starts at top

## Edge Cases

### Scenario: Refresh Then Back
- User refreshes page (Map is cleared)
- User navigates back
- Result: Scrolls to top (no stored position)

### Scenario: Same URL Different Navigation
- Via link click: Always scrolls to top
- Via back button: Restores position if available

### Scenario: Query Parameters
- Positions are stored with full path + query
- `/teams?page=2` and `/teams?page=3` have separate positions

### Scenario: Memory Management
- Positions accumulate during session
- Cleared on page refresh (unless using snapshot)
- Consider implementing a size limit for long sessions

## Best Practices

### 1. Avoid `disableScrollHandling`
The official documentation states this is "generally discouraged, since it breaks user expectations." Our solution works alongside SvelteKit's default behavior.

### 2. Use `requestAnimationFrame`
Ensures the DOM has fully updated before manipulating scroll position:
```javascript
requestAnimationFrame(() => {
  mainContent.scrollTop = position;
});
```

### 3. Include Query Parameters in Keys
Important for paginated views where each page should maintain its own scroll position:
```javascript
const key = url.pathname + url.search;
```

### 4. Progressive Enhancement
The solution gracefully degrades if JavaScript is disabled, falling back to default browser behavior.

### 5. Type Safety
Use TypeScript types for better maintainability:
```typescript
let mainContent: HTMLElement | undefined;
const scrollPositions = new Map<string, number>();
```

## Testing Checklist

- [ ] Forward navigation resets scroll to top
- [ ] Back button restores previous scroll position
- [ ] Forward button restores appropriate position
- [ ] Page refresh starts at top
- [ ] Direct URL access starts at top
- [ ] Programmatic navigation (`goto`) resets to top
- [ ] Query parameter changes are handled correctly
- [ ] Snapshot persistence works across refreshes (if enabled)
- [ ] No memory leaks during long sessions
- [ ] Works on mobile devices with touch scrolling

## References

- [SvelteKit Navigation Documentation](https://svelte.dev/docs/kit/$app-navigation)
- [GitHub Issue #937: Customize navigation scroll container](https://github.com/sveltejs/kit/issues/937)
- [GitHub Issue #2733: Page scroll position not reset](https://github.com/sveltejs/kit/issues/2733)
- [GitHub Issue #9914: Get access to scroll positions](https://github.com/sveltejs/kit/issues/9914)
- [SvelteKit Snapshots Documentation](https://kit.svelte.dev/docs/snapshots)

## Future Considerations

1. **Performance Optimization**: Implement a maximum size for the scroll positions Map to prevent memory issues in long sessions
2. **Animation Support**: Consider smooth scrolling animations for certain navigation types
3. **Accessibility**: Ensure screen readers properly announce page changes
4. **Analytics**: Track scroll depth and navigation patterns for UX improvements
5. **Configuration**: Consider making scroll behavior configurable per route
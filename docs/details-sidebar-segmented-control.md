# DetailsSidebar Segmented Control Implementation

## Overview

Add a segmented control to the DetailsSidebar component that allows users to switch between viewing the canonical (base) item data and the user's customized version with their modifications.

## User Requirements

The sidebar should display two distinct views:

1. **Canonical Data View** - Shows the base item statistics and properties as they exist in the game database
2. **User Version View** - Shows the user's specific customizations and modifications to the item

## Data Structure Analysis

### Current Grid Item Structure

Each grid item (GridCharacter, GridWeapon, GridSummon) contains:
- The base object data (`character`, `weapon`, or `summon`)
- User-specific modifications stored at the grid item level
- Instance-specific properties like position, uncap level, etc.

### User Version Data by Type

#### Weapons (GridWeapon)
- `uncapLevel` - Current uncap level (0-6)
- `transcendenceStep` - Transcendence stage (0-5)
- `awakening` - Object containing:
  - `type` - Awakening type with name and slug
  - `level` - Awakening level
- `weaponKeys` - Array of weapon keys:
  - Opus pendulums (series 2)
  - Draconic telumas (series 3, 34)
  - Ultima gauph keys (series 17)
  - Revans emblems (series 22)
- `ax` - Array of AX skills containing:
  - `modifier` - Skill ID
  - `strength` - Skill strength value
- `element` - Instance element for null-element weapons

#### Characters (GridCharacter)
- `uncapLevel` - Current uncap level (0-5 or 0-6)
- `transcendenceStep` - Transcendence stage (0-5)
- `awakening` - Awakening type and level
- `rings` - Array of over mastery rings:
  - `modifier` - Ring stat type
  - `strength` - Ring stat value
- `earring` - Aetherial mastery object:
  - `modifier` - Earring stat type
  - `strength` - Earring stat value
- `aetherial_mastery` - Alternative property name for earring
- `perpetuity` - Boolean for permanent mastery status

#### Summons (GridSummon)
- `uncapLevel` - Current uncap level (0-5)
- `transcendenceStep` - Transcendence stage (0-5)
- `quick_summon` - Boolean for quick summon status
- `friend` - Boolean for friend summon

## Component Architecture

### Reusable Components to Create

#### 1. `DetailsSidebarSegmentedControl.svelte`
A specialized segmented control for the details sidebar that can be reused across different detail views.

```svelte
<script lang="ts">
  interface Props {
    hasModifications: boolean
    selectedView: 'canonical' | 'user'
    onViewChange: (view: 'canonical' | 'user') => void
  }
</script>
```

#### 2. `ModificationSection.svelte`
Generic wrapper for modification sections with consistent styling.

```svelte
<script lang="ts">
  interface Props {
    title: string
    visible?: boolean
    children: Snippet
  }
</script>

{#if visible}
  <div class="modification-section">
    <h3>{title}</h3>
    <div class="modification-content">
      {@render children()}
    </div>
  </div>
{/if}
```

#### 3. `AwakeningDisplay.svelte`
Reusable awakening display component for both weapons and characters.

```svelte
<script lang="ts">
  import { getAwakeningImage } from '$lib/utils/modifiers'

  interface Props {
    awakening?: { type: Awakening; level: number }
    size?: 'small' | 'medium' | 'large'
    showLevel?: boolean
  }
</script>
```

#### 4. `WeaponKeysList.svelte`
Component for displaying weapon keys with proper icons and formatting.

```svelte
<script lang="ts">
  import { getWeaponKeyImages } from '$lib/utils/modifiers'

  interface Props {
    weaponKeys?: WeaponKey[]
    weaponData: { element?: number; proficiency?: number; series?: number; name?: LocalizedString }
    layout?: 'list' | 'grid'
  }
</script>
```

#### 5. `StatModifierItem.svelte`
Generic component for displaying stat modifications (rings, earrings, etc.).

```svelte
<script lang="ts">
  interface Props {
    label: string
    value: string | number
    suffix?: string
    icon?: string
    variant?: 'default' | 'enhanced' | 'max'
  }
</script>

<div class="stat-modifier" class:variant>
  {#if icon}<img src={icon} alt="" />{/if}
  <span class="label">{label}</span>
  <span class="value">{value}{suffix}</span>
</div>
```

#### 6. `UncapStatusDisplay.svelte`
Dedicated component for showing current uncap/transcendence status.

```svelte
<script lang="ts">
  interface Props {
    type: 'character' | 'weapon' | 'summon'
    uncapLevel?: number
    transcendenceStep?: number
    maxUncap: number
    showIndicator?: boolean
  }
</script>
```

### Data Processing Utilities

#### `modificationDetector.ts`
Utility to detect what modifications exist on a grid item.

```typescript
export interface ModificationStatus {
  hasModifications: boolean
  hasAwakening: boolean
  hasWeaponKeys: boolean
  hasAxSkills: boolean
  hasRings: boolean
  hasEarring: boolean
  hasPerpetuity: boolean
  hasTranscendence: boolean
}

export function detectModifications(
  type: 'character' | 'weapon' | 'summon',
  item: GridCharacter | GridWeapon | GridSummon
): ModificationStatus {
  // Implementation
}
```

#### `modificationFormatters.ts`
Centralized formatters for modification display.

```typescript
export function formatRingStat(modifier: number, strength: number): string
export function formatEarringStat(modifier: number, strength: number): string
export function formatAxSkill(ax: SimpleAxSkill): string
export function getWeaponKeyTitle(series?: number): string
```

### Component Composition Pattern

The main DetailsSidebar will compose these smaller components:

```svelte
<!-- DetailsSidebar.svelte -->
<DetailsSidebarSegmentedControl {hasModifications} bind:selectedView />

{#if selectedView === 'canonical'}
  <!-- Existing canonical view -->
{:else}
  <!-- User version composed of reusable components -->
  <UncapStatusDisplay {type} {uncapLevel} {transcendenceStep} />

  <ModificationSection title="Awakening" visible={item.awakening}>
    <AwakeningDisplay awakening={item.awakening} size="medium" showLevel />
  </ModificationSection>

  {#if type === 'weapon'}
    <ModificationSection title={getWeaponKeyTitle(item.weapon?.series)} visible={item.weaponKeys?.length}>
      <WeaponKeysList {weaponKeys} weaponData={item.weapon} />
    </ModificationSection>
  {/if}

  <!-- etc... -->
{/if}
```

## Styling Guidelines

### IMPORTANT: Use Existing Theme System

**DO NOT create new style variables or custom styles.** All necessary styling is already defined in the theme files:

- `_colors.scss` - All color variables and element-specific colors
- `_typography.scss` - Font sizes, weights, and text styling
- `_spacing.scss` - Spacing units and gaps
- `_layout.scss` - Border radius, corners, and layout constants
- `_effects.scss` - Shadows, transitions, and visual effects
- `_mixins.scss` - Reusable style mixins
- `_rep.scss` - Representation/aspect ratio utilities

### Component Styling Example

```scss
// Import only what's needed from themes
@use '$src/themes/colors' as colors;
@use '$src/themes/typography' as typography;
@use '$src/themes/spacing' as spacing;
@use '$src/themes/layout' as layout;
@use '$src/themes/effects' as effects;

.modification-section {
  // Use existing spacing variables
  margin-bottom: spacing.$unit-3x;
  padding: spacing.$unit-2x;

  h3 {
    // Use existing typography
    font-size: typography.$font-regular;
    font-weight: typography.$medium;
    color: var(--text-secondary, colors.$grey-40);
    margin-bottom: spacing.$unit-1-5x;
  }
}

.stat-modifier {
  // Use existing layout patterns
  display: flex;
  justify-content: space-between;
  padding: spacing.$unit;
  background: colors.$grey-90;
  border-radius: layout.$item-corner-small;

  .label {
    font-size: typography.$font-small;
    color: var(--text-secondary, colors.$grey-50);
  }

  .value {
    font-size: typography.$font-regular;
    font-weight: typography.$medium;
    color: var(--text-primary, colors.$grey-10);
  }

  // Use existing effect patterns for enhanced state
  &.enhanced {
    background: colors.$grey-85;
    box-shadow: effects.$hover-shadow;
  }
}

.awakening-display {
  // Use consistent spacing
  display: flex;
  gap: spacing.$unit-2x;
  align-items: center;

  img {
    // Use standard sizing
    width: spacing.$unit-6x;
    height: spacing.$unit-6x;
    border-radius: layout.$item-corner-small;
  }
}
```

### Theme Variables Reference

#### Colors
- Text: `var(--text-primary)`, `var(--text-secondary)`, `var(--text-tertiary)`
- Backgrounds: `var(--card-bg)`, `colors.$grey-90`, `colors.$grey-85`
- Element colors: `var(--wind-item-detail-bg)`, etc.
- State colors: `var(--color-success)`, `var(--color-error)`

#### Typography
- Sizes: `$font-tiny`, `$font-small`, `$font-regular`, `$font-medium`, `$font-large`
- Weights: `$normal: 400`, `$medium: 500`, `$bold: 600`

#### Spacing
- Base unit: `$unit: 8px`
- Multipliers: `$unit-half`, `$unit-2x`, `$unit-3x`, `$unit-4x`, etc.
- Fractions: `$unit-fourth`, `$unit-third`

#### Layout
- Corners: `$item-corner`, `$item-corner-small`, `$modal-corner`
- Breakpoints: Use mixins from `_mixins.scss`

#### Effects
- Shadows: `$hover-shadow`, `$focus-shadow`
- Transitions: `$duration-zoom`, `$duration-color-fade`
- Transforms: `$scale-wide`, `$scale-tall`

## Benefits of Componentization

### Maintainability
- Each component has a single responsibility
- Changes to display logic are isolated
- Easier to test individual components
- Consistent styling through shared theme system

### Reusability
- `AwakeningDisplay` can be used in hovercards, modals, and sidebars
- `StatModifierItem` works for any stat modification
- `ModificationSection` provides consistent section layout

### Type Safety
- Each component has clearly defined props
- TypeScript interfaces ensure correct data flow
- Compile-time checking prevents runtime errors

### Performance
- Components can be memoized if needed
- Smaller components = smaller re-render boundaries
- Derived states prevent unnecessary recalculation

## Testing Strategy

### Unit Tests for Components
Each reusable component should have tests for:
- Rendering with different prop combinations
- Conditional visibility
- Event handling
- Edge cases (missing data, invalid values)

### Integration Tests
Test the complete DetailsSidebar with:
- View switching
- Data flow between components
- Correct component composition

### Visual Regression Tests
Use Storybook to document and test visual states:
- Different modification combinations
- Various item types
- Empty states
- Loading states

## Implementation Checklist

### Phase 1: Infrastructure
- [ ] Set up modificationDetector utility
- [ ] Set up modificationFormatters utility
- [ ] Create ModificationSection wrapper component

### Phase 2: Display Components
- [ ] Create AwakeningDisplay component
- [ ] Create WeaponKeysList component
- [ ] Create StatModifierItem component
- [ ] Create UncapStatusDisplay component
- [ ] Create DetailsSidebarSegmentedControl

### Phase 3: Integration
- [ ] Update DetailsSidebar to use new components
- [ ] Wire up view switching logic
- [ ] Implement canonical view with existing code
- [ ] Implement user version view with new components

### Phase 4: Polish
- [ ] Add loading states
- [ ] Add empty states
- [ ] Optimize performance
- [ ] Add accessibility attributes
- [ ] Documentation and examples

## Notes

- Components should accept `class` prop for custom styling
- All components should handle missing/null data gracefully
- Consider using slots/snippets for maximum flexibility
- Keep components pure - no direct API calls
- Use consistent prop naming across components
- **Always use existing theme variables - never create custom styles**
- Import only the theme modules you need to minimize bundle size
- Use CSS custom properties (var()) for dynamic theming support
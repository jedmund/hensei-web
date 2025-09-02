# Product Requirements Document: Fix Party Component Interface Mismatch

## Problem Statement
During the App Router migration, the client components (`NewPartyClient` and `PartyPageClient`) were created with an incorrect interface for the `Party` component. This causes an "Element type is invalid" error preventing pages from loading.

## Root Cause Analysis

### What Went Wrong
1. **Interface Mismatch**: The Party component expects props like `selectedTab`, `raidGroups`, and `handleTabChanged`, but client components are passing `party`, `isNew`, and `onSave`
2. **Incomplete Migration**: During the Pages-to-App Router migration, new client wrapper components were created without matching the existing Party component's interface
3. **Missing Context**: The migration didn't account for the Party component being a complete, self-contained system that handles its own state management

### Current Party Component Architecture
The Party component is a comprehensive system that:
- Manages its own save/create/update logic via internal functions (`createParty()` and `updateParty()`)
- Uses global `appState` from Valtio for state management
- Handles tab switching between Character/Weapon/Summon grids
- Manages edit permissions and authentication
- Contains PartyHeader, PartySegmentedControl, Grid components, and PartyFooter

### Expected Interface
```typescript
interface Props {
  new?: boolean
  team?: Party
  selectedTab: GridType
  raidGroups: RaidGroup[]
  handleTabChanged: (value: string) => void
  pushHistory?: (path: string) => void
}
```

### Current (Incorrect) Usage
```typescript
// In NewPartyClient.tsx
<Party 
  party={appState.parties[0] || { name: t('new_party'), element: 1 }}
  isNew={true}
  onSave={handleSave}
/>

// In PartyPageClient.tsx
<Party 
  party={party}
  onRemix={handleRemix}
  onDelete={handleDelete}
/>
```

## Solution Options

### Option 1: Fix Client Components (Recommended)
Update the client wrapper components to match the Party component's expected interface.

**Pros:**
- Maintains existing Party component architecture
- Minimal changes required
- Preserves all existing functionality
- Lower risk of breaking existing features

**Cons:**
- Client components need to manage additional state

### Option 2: Create Adapter Components
Create intermediate adapter components that translate between the two interfaces.

**Pros:**
- Keeps existing client component logic
- Provides flexibility for future changes

**Cons:**
- Adds complexity
- Extra layer of abstraction
- Performance overhead

### Option 3: Refactor Party Component
Change the Party component to accept the simpler interface the client components expect.

**Pros:**
- Simpler client components
- More explicit prop passing

**Cons:**
- Major refactoring required
- Risk of breaking existing functionality
- Would need to extract and relocate save/update logic
- Affects multiple components

## Implementation Plan (Option 1 - Recommended)

### Phase 1: Fix Critical Props Interface

#### Task List
- [x] Remove unstable_cache from data.ts (completed)
- [x] Fix viewport metadata in layout.tsx (completed)
- [x] Fix Radix Toast import (completed)
- [ ] Fix NewPartyClient props interface
- [ ] Fix PartyPageClient props interface
- [ ] Add selectedTab state management to both components
- [ ] Implement handleTabChanged functions
- [ ] Add pushHistory navigation wrapper
- [ ] Ensure raidGroups are passed correctly
- [ ] Remove next/head usage from Head components

#### Files to Modify

##### Critical Files (Must Change)
```typescript
/app/new/NewPartyClient.tsx
  - Add: useState for selectedTab (default: GridType.Weapon)
  - Add: handleTabChanged function
  - Change: party → team prop
  - Change: isNew → new prop
  - Remove: onSave prop (Party handles internally)
  - Add: raidGroups prop from parent
  - Add: pushHistory function using router.push

/app/p/[party]/PartyPageClient.tsx  
  - Add: useState for selectedTab (default: GridType.Weapon)
  - Add: handleTabChanged function
  - Change: party → team prop
  - Remove: onRemix and onDelete props (Party handles internally)
  - Add: raidGroups prop from parent
  - Add: pushHistory function using router.push

/app/new/page.tsx
  - Verify: raidGroups are fetched correctly
  - Ensure: raidGroups are passed to NewPartyClient

/app/p/[party]/page.tsx
  - Add: Fetch raidGroups data
  - Pass: raidGroups to PartyPageClient
```

##### Head Component Cleanup
```typescript
/components/head/NewHead/index.tsx
  - Remove entirely (metadata handled in page.tsx)

/components/head/ProfileHead/index.tsx
  - Remove entirely (metadata handled in page.tsx)

/components/head/SavedHead/index.tsx
  - Remove entirely (metadata handled in page.tsx)

/components/head/TeamsHead/index.tsx
  - Remove entirely (metadata handled in page.tsx)

/components/party/PartyHead/index.tsx
  - Refactor to not use next/head
  - Or remove if not needed in App Router
```

### Phase 2: Restore Toast Viewport
```typescript
/app/layout.tsx
  - Uncomment and fix ToastViewport component
  - Ensure proper import from @radix-ui/react-toast
```

## Testing Requirements

### Functional Tests
1. **Page Loading**
   - [ ] /new page loads without errors
   - [ ] /p/[party] pages load without errors
   - [ ] No "Element type is invalid" errors in console

2. **Party Creation**
   - [ ] Can create a new party
   - [ ] Party name can be edited
   - [ ] Party description can be added
   - [ ] Save functionality works

3. **Party Editing**
   - [ ] Can edit existing party
   - [ ] Changes persist after save
   - [ ] Edit permissions work correctly

4. **Tab Navigation**
   - [ ] Can switch between Characters tab
   - [ ] Can switch to Weapons tab
   - [ ] Can switch to Summons tab
   - [ ] Tab state persists during editing

5. **State Management**
   - [ ] appState updates correctly
   - [ ] Valtio state management works
   - [ ] No state inconsistencies

### Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari

## Success Criteria
- No runtime errors on party pages
- All party creation/editing functionality works
- Tab navigation functions correctly
- Pages load successfully in development and production
- Metadata is properly rendered for SEO
- No console warnings about invalid props

## Risk Mitigation
1. **Testing Strategy**
   - Test each change incrementally
   - Verify functionality after each component update
   - Use development server for immediate feedback

2. **Rollback Plan**
   - Create focused commits for each component
   - Keep changes minimal and isolated
   - Document any discovered issues

3. **Communication**
   - Document any unexpected behavior
   - Note any additional required changes
   - Update PRD if scope changes

## Timeline
- **Phase 1**: Immediate (blocking issue)
  - Estimated: 1-2 hours
  - Priority: Critical

- **Phase 2**: Follow-up
  - Estimated: 30 minutes
  - Priority: Medium

## Dependencies
- GridType enum from utils/enums.tsx
- RaidGroup type definitions
- Valtio state management
- Next.js App Router navigation

## Open Questions
1. Should PartyHead component be refactored or removed?
2. Are there other pages using the Party component that need updates?
3. Should we add TypeScript interfaces for better type safety?

## Notes
- The Party component is well-designed as a self-contained system
- The issue is purely an interface mismatch, not a design flaw
- This pattern (self-contained components) might be worth documenting for future migrations
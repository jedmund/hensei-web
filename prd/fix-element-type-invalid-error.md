# Product Requirements Document: Fix "Element type is invalid" Error

## Problem Statement
After implementing the Party component interface fixes, pages still fail to load with the error:
```
Error: Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined
```

This error occurs when React tries to render a component that is `undefined`, typically due to:
- Incorrect imports
- Missing exports
- Incompatible APIs between Pages Router and App Router
- SVG import issues

## Investigation Findings

### Components Verified as Working
✅ **Party Component** (`/components/party/Party/index.tsx`)
- Has proper 'use client' directive
- All imports exist and are correct
- Proper default export
- All child components properly imported

✅ **Grid Components**
- WeaponGrid, SummonGrid, CharacterGrid all have proper exports
- All their child components exist and work

✅ **Common Components**
- Button, Overlay, SegmentedControl have proper exports
- Alert component exists and works

✅ **SVG Icons**
- All SVG files exist with proper content
- Icons: Edit.svg, Remix.svg, Save.svg, Private.svg, Unlisted.svg, Check.svg, Ellipsis.svg

### Root Cause Analysis

#### Primary Issue: next/head in Client Components
The most critical issue is components using `next/head` which is incompatible with App Router:

**How this causes the error:**
1. `next/head` is a Pages Router API
2. In App Router context, `next/head` exports become `undefined`
3. When components try to render `<Head>`, they render `undefined`
4. React throws "Element type is invalid: got undefined"

#### Secondary Issues
1. **Import path inconsistencies** - Some components use 'types' instead of '~types'
2. **Potential SVG import issues** - Some SVG imports might need `.default` accessor
3. **Missing error boundaries** - No way to catch and debug component errors

## Files That Need Changes

### Critical Files (Using next/head)
- [ ] `/components/party/PartyHead/index.tsx` - Uses `import Head from 'next/head'`
- [ ] `/components/head/NewHead/index.tsx` - Uses `import Head from 'next/head'`
- [ ] `/components/head/ProfileHead/index.tsx` - Uses `import Head from 'next/head'`
- [ ] `/components/head/SavedHead/index.tsx` - Uses `import Head from 'next/head'`
- [ ] `/components/head/TeamsHead/index.tsx` - Uses `import Head from 'next/head'`
- [ ] `/components/about/AboutHead/index.tsx` - Uses `import Head from 'next/head'`

### Files Already Using next/head (Need Verification)
These files in pages directory are okay since they're Pages Router:
- `/pages/_app.tsx` - Pages Router, can use next/head
- `/pages/*.tsx` - All pages files can use next/head

### Components That Import Head Components
- [ ] Check if any App Router pages import the head components above
- [ ] Verify PartyHead is not being used anywhere

## Implementation Plan

### Phase 1: Remove/Replace next/head Usage

#### Option A: Remove Head Components (Recommended for unused components)
For components that are not actively used in App Router:
1. Delete the component file entirely
2. Remove any imports of these components
3. Metadata should be handled in page.tsx files instead

#### Option B: Convert to Client-Safe Components
For components that need to be preserved:
1. Remove `import Head from 'next/head'`
2. Remove `<Head>` wrapper
3. Return only the content that should be rendered in the component
4. Move metadata to the parent page.tsx file

### Phase 2: Fix Import Issues
1. Ensure all imports use correct paths ('~types' not 'types')
2. Verify SVG imports work correctly
3. Check for circular dependencies

### Phase 3: Add Error Boundaries
1. Create an ErrorBoundary component
2. Wrap Party component to catch errors
3. Add logging for better debugging

## Task List

### Immediate Actions
1. **Investigate PartyHead usage**
   - Check if PartyHead is imported anywhere
   - If not used, delete it
   - If used, convert to App Router compatible component

2. **Remove unused head components**
   - Delete NewHead (not used, metadata in page.tsx)
   - Delete ProfileHead (not used, metadata in page.tsx)  
   - Delete SavedHead (not used, metadata in page.tsx)
   - Delete TeamsHead (not used, metadata in page.tsx)
   - Delete AboutHead (check usage first)

3. **Fix PartyHead if needed**
   - Remove next/head import
   - Convert to regular component
   - Move metadata logic to parent

4. **Verify all imports**
   - Check all components for correct import paths
   - Fix any SVG import issues
   - Resolve any circular dependencies

5. **Test thoroughly**
   - Test /new page
   - Test /p/[party] pages
   - Test all other App Router pages

## Success Criteria
- No "Element type is invalid" errors
- All pages load successfully
- Party component renders correctly
- Tab navigation works
- All interactive features function

## Risk Mitigation
1. **Backup current state** - Commit current changes before modifications
2. **Test incrementally** - Fix and test one component at a time
3. **Use error boundaries** - Add error handling to isolate issues
4. **Maintain rollback plan** - Keep track of changes for easy reversion

## Expected Outcome
After implementing these fixes:
1. The "Element type is invalid" error will be resolved
2. All App Router pages will load correctly
3. The Party component will function as expected
4. Better error handling will be in place for future debugging

## Timeline
- Phase 1: 30 minutes (remove/fix head components)
- Phase 2: 15 minutes (fix imports)
- Phase 3: 15 minutes (add error boundaries)
- Testing: 15 minutes
- Total: ~1.25 hours

## Notes
- The head components were likely created during initial development for Pages Router
- In App Router, metadata should be handled via the metadata export in page.tsx files
- Many of these head components appear to be unused since metadata is already defined in the App Router pages
- Removing unused components will simplify the codebase and prevent future issues
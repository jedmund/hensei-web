# Svelte-Main Branch Cleanup Plan

## Overview
This document outlines the remaining work needed to clean up the `svelte-main` branch and get the build green.

## Completed Fixes

### 1. Environment/Generated Module Issues
- Ran Paraglide codegen to generate translation files in `src/lib/paraglide/`
- Added type declarations for `$env/static/public` module in `src/lib/types/declarations.d.ts`

### 2. Broken Imports from Removed Legacy API Layer
- Updated `SearchSidebar.svelte` to use new adapter layer
- Updated `Party.svelte` to use new adapter layer
- Updated `teams/new/+page.svelte` to use new adapter layer

### 3. Type Shims for External Libraries
- Added comprehensive type declarations for `wx-svelte-grid` in `src/lib/types/declarations.d.ts`

### 4. RequestOptions Cache Type Incompatibility
- Fixed `RequestOptions` interface in `src/lib/api/adapters/types.ts` to exclude 'cache' from RequestInit extension
- Added both `cacheTime?: number` and `cache?: RequestCache` properties
- Updated `base.adapter.ts` to use `cacheTime` instead of `cache` for duration

### 5. Users Resource Module
- Updated `src/lib/api/resources/users.ts` to use `userAdapter` instead of removed `../core` module
- Changed function signature from `update(fetch, userId, params)` to `update(userId, params)`

### 6. UserSettingsModal.svelte Fixes
- Fixed Switch import path (case sensitivity: `switch.svelte` -> `Switch.svelte`)
- Fixed `users.update` call signature
- Removed invalid footer snippet definition
- Removed unused `Snippet` import

### 7. Character Type in Entity Adapter
- Added missing properties to Character type in `entity.adapter.ts`:
  - `gender?: number`
  - `proficiency?: number[]`
  - `race?: number[]`
  - `hp?: { minHp, maxHp, maxHpFlb }`
  - `atk?: { minAtk, maxAtk, maxAtkFlb }`
  - `uncap?: { flb, ulb, transcendence }`

### 8. Adapters Index File
- Created `src/lib/api/adapters/index.ts` to export all adapters and types

### 9. Character Type in Entities
- Added missing properties to Character type in `src/lib/types/api/entities.ts`:
  - `gender`, `race`, `proficiency`, `hp`, `atk`

## Remaining Type Errors (~378 errors)

### High Priority (Most Impactful)

#### 1. 'firstItem' and 'item' Possibly Undefined (27 errors)
- **Location**: `src/routes/teams/new/+page.svelte`
- **Issue**: TypeScript strict null checks flagging array access without null guards
- **Fix**: Add null checks before accessing `items[0]` and in forEach loops

#### 2. PartyCtx Missing openPicker Property (8 errors)
- **Location**: Various components using party context
- **Issue**: `PartyCtx` type doesn't include `openPicker` method
- **Fix**: Update `PartyCtx` type definition to include `openPicker` method

#### 3. Missing Paraglide Translation Keys (18 errors)
- **Keys**: `context_view_details`, `context_replace`, `context_remove`
- **Location**: `src/lib/paraglide/messages`
- **Fix**: Add missing translation keys to `project.inlang/messages/en.json` and `ja.json`

#### 4. Summon/Weapon Missing hp/atk Properties (18 errors)
- **Location**: Entity adapter types
- **Issue**: Summon and Weapon types in `entity.adapter.ts` need hp/atk properties
- **Fix**: Update Summon type to include `hp` and `atk` nested objects

### Medium Priority

#### 5. exactOptionalPropertyTypes Violations (~15 errors)
- **Issue**: Props with `undefined` values being passed to components that don't accept undefined
- **Fix**: Update component Props interfaces to accept `undefined` for optional properties

#### 6. Select.svelte ItemIndicator Errors (4 errors)
- **Issue**: `Select.ItemIndicator` doesn't exist in bits-ui
- **Fix**: Check bits-ui documentation for correct component name or remove usage

#### 7. Button.svelte Icon Type Issues (2 errors)
- **Issue**: `icon` prop is `string | undefined` but Icon component expects `string`
- **Fix**: Add conditional rendering or default value for icon prop

#### 8. DropdownItem.svelte asChild Issue (2 errors)
- **Issue**: `asChild` prop doesn't exist on DropdownMenu.Item in bits-ui
- **Fix**: Use `child` snippet pattern instead of `asChild` prop

### Lower Priority

#### 9. maxLength vs maxlength (4 errors)
- **Issue**: HTML attribute should be lowercase `maxlength`
- **Fix**: Change `maxLength` to `maxlength` in input elements

#### 10. Button Variant "outlined" (3 errors)
- **Issue**: "outlined" is not a valid Button variant
- **Fix**: Use correct variant name (check Button component for valid variants)

#### 11. SearchResult Type Mismatch (5 errors)
- **Issue**: `SearchResult<any>[]` vs `SearchResult[]` type mismatch
- **Fix**: Update function signatures to use consistent SearchResult type

## Files Modified in This Session

1. `src/lib/api/adapters/types.ts` - RequestOptions cache fix
2. `src/lib/api/adapters/base.adapter.ts` - cacheTime usage
3. `src/lib/api/adapters/entity.adapter.ts` - Character type properties
4. `src/lib/api/adapters/index.ts` - New file for exports
5. `src/lib/api/resources/users.ts` - Updated to use userAdapter
6. `src/lib/types/declarations.d.ts` - wx-svelte-grid and $env type shims
7. `src/lib/types/api/entities.ts` - Character type properties
8. `src/lib/components/UserSettingsModal.svelte` - Multiple fixes
9. `src/lib/components/panels/SearchSidebar.svelte` - Accepted upstream version
10. `src/lib/components/party/Party.svelte` - granblueId fix
11. `src/routes/teams/new/+page.svelte` - Accepted upstream version

## Commands to Verify Progress

```bash
# Count remaining errors
pnpm check 2>&1 | grep -c "Error:"

# Analyze error patterns
pnpm check 2>&1 | grep "Error:" | sort | uniq -c | sort -rn | head -20

# Run lint
pnpm lint

# Run build
pnpm build
```

## Next Steps

1. Fix the 'firstItem'/'item' possibly undefined errors in teams/new/+page.svelte
2. Add missing Paraglide translation keys
3. Update PartyCtx type to include openPicker
4. Update Summon type in entity.adapter.ts to include hp/atk
5. Fix exactOptionalPropertyTypes violations
6. Fix bits-ui component usage (Select.ItemIndicator, DropdownItem asChild)
7. Run `pnpm check` to verify all errors are resolved
8. Run `pnpm lint` and `pnpm build`
9. Create PR with all fixes

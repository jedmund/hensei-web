# Prompt for Next Devin Session

## Task
Continue cleaning up type errors in the `svelte-main` branch of `jedmund/hensei-web`. The goal is to get the build green by fixing all remaining type errors.

## Context
This is a Svelte 5 rewrite of a Granblue Fantasy team composition app. The previous sessions reduced type errors from ~412 to ~161. A detailed plan of completed and remaining work is in `CLEANUP_PLAN.md`.

## Starting Point
1. Checkout the `svelte-main` branch in `/home/ubuntu/repos/hensei-web`
2. Run `pnpm check 2>&1 | grep -c "Error:"` to see current error count (~161)
3. Review this file for detailed context on what's been fixed and what remains

## Completed Fixes (This Session - 219 -> 161 errors)
- Fixed teams/new/+page.svelte position type assertions (non-null assertions for array access after length check)
- Fixed Party.svelte editKey type (string | null -> string | undefined)
- Fixed sidebar.svelte.ts Component type to accept any props (Component<any, any, any>)
- Fixed database/characters/[id]/+page.svelte UncapData type (provide default values for flb/ulb)
- Fixed DetailScaffold.svelte optional props (use nullish coalescing for optional callbacks)
- Fixed SearchSidebar.svelte params construction (conditionally add properties instead of passing undefined)
- Fixed SearchSidebar.svelte granblue_id -> granblueId property name
- Fixed Party.svelte mainWeapon derived state (removed arrow function wrapper)

## Remaining Type Errors to Fix (~161 errors)

### Files with Most Errors
1. Party.svelte - 22 errors
2. database/characters/[id]/+page.svelte - 19 errors
3. Checkbox.svelte - 19 errors
4. SearchSidebar.svelte - 12 errors
5. teams/new/+page.svelte - 10 errors
6. test/images/+page.svelte - 9 errors
7. Switch.svelte - 9 errors
8. StatsSection.svelte - 9 errors
9. Button.svelte - 8 errors
10. WeaponUnit.svelte - 7 errors

### High Priority Error Patterns

1. **SearchResult type mismatch** (5 errors)
   - Issue: `(items: SearchResult<any>[]) => Promise<void>` not assignable to `(items: SearchResult[]) => void`
   - Files: Party.svelte, teams/new/+page.svelte, SearchSidebar.svelte
   - Fix: Update function signatures or SearchResult type definition

2. **Object is possibly 'undefined'** (5 errors)
   - Various files need null guards or optional chaining

3. **number | null vs number | undefined** (4 errors)
   - File: ItemHeader.svelte
   - Fix: Normalize null/undefined handling (use ?? operator)

4. **Expected 1 arguments, but got 2** (4 errors)
   - Function call signature mismatches

5. **Conversion of number to "0" | "1" | "2" | "3"** (3 errors)
   - File: Party.svelte (job skill slot handling)
   - Fix: Use `as unknown as "0" | "1" | "2" | "3"` or update type definitions

### Medium Priority Error Patterns

6. **exactOptionalPropertyTypes violations** (multiple errors)
   - Issue: Passing `undefined` explicitly to optional props
   - Fix: Use nullish coalescing or omit the property entirely

7. **Select.Item disabled prop** (2 errors)
   - bits-ui type compatibility issue

8. **RadioGroup.Item type mismatch** (2 errors)
   - bits-ui type compatibility issue

9. **Property 'normalizer' does not exist on DatabaseProvider** (2 errors)

10. **Module has no exported member 'PartyView'** (2 errors)
    - File: party schema
    - Fix: Add or update the export

### Lower Priority

11. **Argument of type '"01"' not assignable to ImageVariant** (2 errors)
12. **'uncapLevel' is possibly 'null'** (2 errors)
13. **'to' is possibly 'null'** (2 errors)
14. **Expression produces union type too complex** (3 errors)
15. **Parameter implicitly has 'any' type** (6 errors)

## Commands Reference
```bash
# Check error count
pnpm check 2>&1 | grep -c "Error:"

# Analyze error patterns
pnpm check 2>&1 | grep "Error:" | sort | uniq -c | sort -rn | head -20

# Find specific errors
pnpm check 2>&1 | grep -B2 "specific error text"

# Run lint
pnpm lint

# Run build
pnpm build

# Regenerate Paraglide translations
pnpm paraglide-js compile --project ./project.inlang
```

## Important Notes
- This project uses `exactOptionalPropertyTypes: true` in tsconfig, which is stricter than normal TypeScript
- The codebase uses Svelte 5 runes (`$state`, `$derived`, `$effect`)
- bits-ui v2.9.6 is used for UI components - check their docs for correct API
- Focus on errors only, not warnings (per user instruction)
- The branch `devin/1764361948-fix-type-errors` contains the latest fixes - merge into svelte-main or continue from there

## Success Criteria
- `pnpm check` returns 0 errors
- `pnpm lint` passes
- `pnpm build` succeeds

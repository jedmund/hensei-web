# Prompt for Next Devin Session

## Task
Continue cleaning up type errors in the `svelte-main` branch of `jedmund/hensei-web`. The goal is to get the build green by fixing all remaining type errors.

## Context
This is a Svelte 5 rewrite of a Granblue Fantasy team composition app. The previous sessions reduced type errors from ~412 to ~217. A detailed plan of completed and remaining work is in `CLEANUP_PLAN.md`.

## Starting Point
1. Checkout the `svelte-main` branch in `/home/ubuntu/repos/hensei-web`
2. Merge or cherry-pick from `devin/1764361948-fix-type-errors` branch which has the latest fixes
3. Run `pnpm check 2>&1 | grep -c "Error:"` to see current error count (~217)
4. Review `CLEANUP_PLAN.md` for detailed context on what's been fixed and what remains

## Completed Fixes (This Session)
- Fixed Button variant errors (outlined -> ghost, contained -> primary)
- Fixed search.queries.ts import path and property names (snake_case -> camelCase)
- Fixed PartyContext export from party.service.ts
- Fixed User type missing avatar property
- Fixed exactOptionalPropertyTypes violations in Unit components (SummonUnit, WeaponUnit, CharacterUnit)
- Fixed MenuItems Props interface
- Fixed RequestOptions, SearchParams, SearchFilters types in types.ts
- Fixed UpdateUncapParams type in grid.adapter.ts
- Fixed Select.ItemIndicator and maxLength errors
- Fixed Summon/Weapon hp/atk properties in entity.adapter.ts

## Remaining Type Errors to Fix (~217 errors)

### High Priority - exactOptionalPropertyTypes Violations
The project uses `exactOptionalPropertyTypes: true` which requires explicit `T | undefined` for optional properties.

1. **SearchState error property** (3 errors)
   - File: `src/lib/api/adapters/resources/search.resource.svelte.ts`
   - Issue: `error: undefined` not assignable to `AdapterError`
   - Fix: Update SearchState interface to allow `error?: AdapterError | undefined`

2. **JobState error property** (2 errors)
   - Similar fix needed for JobState interface

3. **Party type missing element property** (2 errors)
   - Files: `src/lib/components/party/PartySegmentedControl.svelte`, `src/lib/components/party/Party.svelte`
   - Fix: Add `element?: number` to Party interface in `src/lib/types/api/party.ts`

### Medium Priority - Type Mismatches

4. **SearchResult async function type** (5 errors)
   - Issue: `(items: SearchResult<any>[]) => Promise<void>` not assignable to `(items: SearchResult[]) => void`
   - Fix: Update function signatures to be async-compatible

5. **number | undefined vs number** (6 errors)
   - Various files need null guards or type assertions

6. **number | null vs number | undefined** (4 errors)
   - Need to normalize null/undefined handling

7. **boolean vs string | number | undefined** (4 errors)
   - Type mismatch in component props

8. **Expected 1 arguments, but got 2** (4 errors)
   - Function call signature mismatches

### Lower Priority - bits-ui Component Issues

9. **Select.Item disabled prop** (2 errors)
   - Issue: `disabled: boolean | undefined` not matching bits-ui types
   - Fix: Use conditional spreading or type assertion

10. **RadioGroup.Item type mismatch** (2 errors)
    - Similar bits-ui type compatibility issue

11. **Checkbox.Indicator doesn't exist** (2 errors)
    - Check bits-ui v2.9.6 docs for correct API

### Other Issues

12. **Property 'normalizer' does not exist on DatabaseProvider** (2 errors)
13. **Property 'granblue_id' should be 'granblueId'** (2 errors)
14. **Expression produces union type too complex** (5 errors)
15. **Object is possibly 'undefined'** (5 errors)

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

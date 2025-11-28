# Prompt for Next Devin Session

## Task
Continue cleaning up type errors in the `svelte-main` branch of `jedmund/hensei-web`. The goal is to get the build green by fixing all remaining type errors.

## Context
This is a Svelte 5 rewrite of a Granblue Fantasy team composition app. The previous session reduced type errors from ~412 to ~378. A detailed plan of completed and remaining work is in `CLEANUP_PLAN.md`.

## Starting Point
1. Checkout the `svelte-main` branch in `/home/ubuntu/repos/hensei-web`
2. Run `pnpm check 2>&1 | grep -c "Error:"` to see current error count (~378)
3. Review `CLEANUP_PLAN.md` for detailed context on what's been fixed and what remains

## Remaining Type Errors to Fix (Priority Order)

### 1. 'firstItem' and 'item' Possibly Undefined (27 errors)
- **File**: `src/routes/teams/new/+page.svelte`
- **Fix**: Add null checks before accessing `items[0]` and in forEach loops
- **Example**: Change `const firstItem = items[0]` to include a guard like `if (!items[0]) return`

### 2. PartyCtx Missing openPicker Property (8 errors)
- **Fix**: Find the `PartyCtx` type definition and add `openPicker` method signature
- **Search**: `grep -rn "PartyCtx" src/lib/types/`

### 3. Missing Paraglide Translation Keys (18 errors)
- **Keys needed**: `context_view_details`, `context_replace`, `context_remove`
- **Files to update**: `project.inlang/messages/en.json` and `project.inlang/messages/ja.json`
- **Then run**: `pnpm paraglide-js compile --project ./project.inlang`

### 4. Summon/Weapon Missing hp/atk Properties (18 errors)
- **File**: `src/lib/api/adapters/entity.adapter.ts`
- **Fix**: Update `Summon` interface to include nested `hp` and `atk` objects (similar to Character fix already done)

### 5. exactOptionalPropertyTypes Violations (~15 errors)
- **Issue**: Props with `undefined` values passed to components that don't accept undefined
- **Fix**: Update component Props interfaces to accept `| undefined` for optional properties

### 6. Select.svelte ItemIndicator Errors (4 errors)
- **File**: `src/lib/components/ui/Select.svelte`
- **Issue**: `Select.ItemIndicator` doesn't exist in bits-ui v2.9.6
- **Fix**: Check bits-ui docs for correct component or remove usage

### 7. DropdownItem.svelte asChild Issue (2 errors)
- **File**: `src/lib/components/ui/dropdown/DropdownItem.svelte`
- **Issue**: `asChild` prop doesn't exist in bits-ui
- **Fix**: Use `child` snippet pattern instead

### 8. Button.svelte Icon Type Issues (2 errors)
- **File**: `src/lib/components/ui/Button.svelte`
- **Fix**: Add conditional rendering `{#if icon}` before Icon component

### 9. Button Variant "outlined" (3 errors)
- **Fix**: Change "outlined" to valid variant (check Button component for valid options)

### 10. maxLength vs maxlength (4 errors)
- **Fix**: Change `maxLength` to `maxlength` (lowercase) in input elements

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
- Push directly to `svelte-main` branch when done

## Success Criteria
- `pnpm check` returns 0 errors
- `pnpm lint` passes
- `pnpm build` succeeds

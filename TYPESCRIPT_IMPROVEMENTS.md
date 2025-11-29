# TypeScript Quality Improvement Plan

**Status:** 0 TypeScript errors achieved (151 → 0)
**Next Phase:** Code quality and maintainability improvements

## Overview

While we've eliminated all TypeScript errors, several opportunities exist to improve type safety, reduce workarounds, and enhance maintainability.

---

## Phase 1: Critical Type Safety (High Priority)

### 1.1 Remove Type Assertions in Component Props

**Problem:** Using `as any` to spread props loses type safety

**Files:**
- `src/lib/components/uncap/UncapIndicator.svelte` (lines 167, 169)
- `src/lib/components/ui/segmented-control/SegmentedControl.svelte` (line 88)

**Tasks:**
- [ ] Create proper union type for StarRender props
- [ ] Define TranscendenceStarProps and UncapStarProps interfaces
- [ ] Replace `{...(star.props as any)}` with properly typed spread
- [ ] Create typed wrapper for RadioGroupPrimitive or fix optionalProps spreading

**Acceptance Criteria:**
- No `as any` casts in component prop spreading
- Full IntelliSense support for star component props
- Type errors caught at compile time

**Effort:** Medium (4-6 hours)

### 1.2 Unify Visibility Types

**Problem:** Number/string mismatch between frontend and API requiring runtime conversion

**Files:**
- `src/lib/types/api/party.ts` (visibility: number)
- `src/lib/api/adapters/party.adapter.ts` (visibility: string literal)
- `src/lib/services/party.service.ts` (runtime mapping)

**Tasks:**
- [ ] Create PartyVisibility enum/const
- [ ] Update Party type to use string literals
- [ ] Remove number-to-string mapping in party.service.ts
- [ ] Update all visibility references across codebase
- [ ] Update API serialization if needed

**Acceptance Criteria:**
- Single source of truth for visibility values
- No runtime type conversion needed
- Type safety when setting visibility

**Effort:** Medium (3-4 hours)

**Impact:** Prevents invalid visibility values at compile time

---

## Phase 2: Third-Party Library Improvements (Medium Priority)

### 2.1 Create bits-ui Wrapper Components

**Problem:** Using `optionalProps()` workaround for type incompatibilities

**Files:**
- `src/lib/components/ui/Select.svelte`
- `src/lib/components/ui/segmented-control/SegmentedControl.svelte`
- `src/lib/components/ui/RadioGroup.svelte` (if exists)

**Tasks:**
- [ ] Create `src/lib/components/ui/bits-ui-wrappers/` directory
- [ ] Create SelectRoot wrapper with explicit prop typing
- [ ] Create RadioGroupRoot wrapper with explicit prop typing
- [ ] Update consuming components to use wrappers
- [ ] Document why wrappers exist (bits-ui type issues)

**Acceptance Criteria:**
- No `optionalProps()` calls for bits-ui components
- Clear prop types for each wrapper
- Wrappers forward only supported props

**Effort:** Medium (4-5 hours)

### 2.2 Add wx-svelte-grid Type Definitions

**Problem:** Missing Cell export causing workaround with loose types

**Files:**
- `src/lib/components/database/cells/LastUpdatedCell.svelte`
- Other cell components using wx-svelte-grid

**Tasks:**
- [ ] Create `src/lib/types/wx-svelte-grid.d.ts`
- [ ] Define Cell, Grid, and other used types
- [ ] Replace `[key: string]: any` with proper Cell interface
- [ ] Update all cell components to use typed Cell props

**Acceptance Criteria:**
- Proper Cell type available for import
- No `[key: string]: any` in cell components
- IntelliSense support for grid props

**Effort:** Small (2-3 hours)

---

## Phase 3: Type Consolidation (Medium Priority)

### 3.1 Consolidate Awakening Types

**Problem:** Two different Awakening interfaces exist

**Files:**
- `src/lib/types/Awakening.d.ts`
- `src/lib/types/api/entities.ts`

**Tasks:**
- [ ] Compare both definitions and identify differences
- [ ] Choose canonical location (prefer entities.ts)
- [ ] Remove duplicate definition
- [ ] Update all imports to use single source
- [ ] Ensure LocalizedName is properly defined

**Acceptance Criteria:**
- Single Awakening type definition
- All imports use same source
- No breaking changes to existing code

**Effort:** Small (1-2 hours)

### 3.2 Type the `any` Usages

**Problem:** Loose typing in services and adapters

**Files to audit:**
```bash
grep -r ": any" src/lib --include="*.ts" --include="*.svelte"
```

**Common patterns to fix:**
- `row: any` → `row: DatabaseRow` (or specific entity type)
- `item: any` → `item: GridItem`
- `mapped: any` → `mapped: CreatePartyParams`
- `result: any` → proper return type
- Context types using `any`

**Tasks:**
- [ ] Audit all `any` usages and categorize
- [ ] Create proper types for common patterns (DatabaseRow, GridItem, etc.)
- [ ] Replace `any` with specific types
- [ ] Add generics where appropriate

**Acceptance Criteria:**
- Minimal `any` usage (only where truly necessary)
- Clear justification comment for remaining `any` usages
- Improved IntelliSense throughout codebase

**Effort:** Large (6-8 hours)

---

## Phase 4: Test Infrastructure (Low Priority)

### 4.1 Create Test Mock Factories

**Problem:** Test mocks are brittle and require manual updates when types change

**Files:**
- `src/lib/api/adapters/__tests__/entity.adapter.test.ts`
- `src/lib/api/adapters/__tests__/grid.adapter.test.ts`
- Other test files

**Tasks:**
- [ ] Create `src/lib/testing/factories.ts`
- [ ] Implement `createMockWeapon(overrides?)`
- [ ] Implement `createMockCharacter(overrides?)`
- [ ] Implement `createMockSummon(overrides?)`
- [ ] Implement `createMockParty(overrides?)`
- [ ] Update all tests to use factories
- [ ] Add JSDoc examples for each factory

**Acceptance Criteria:**
- All test mocks use factory functions
- Overrides supported for customization
- Type-safe mock creation
- Tests resilient to type changes

**Effort:** Medium (4-5 hours)

### 4.2 Improve Test Coverage for Type Transformations

**Focus areas:**
- Visibility mapping (number → string)
- Awakening type handling
- Party payload transformations
- Grid item CRUD operations

**Tasks:**
- [ ] Add tests for mapToApiPayload visibility conversion
- [ ] Add tests for awakening null/undefined handling
- [ ] Test edge cases in type transformations
- [ ] Document expected type contracts in tests

**Effort:** Medium (3-4 hours)

---

## Phase 5: Code Quality (Low Priority)

### 5.1 Address TypeScript Warnings

**Current status:** 190 warnings

**Categories to review:**
- Unused CSS selectors
- Non-reactive updates
- Accessibility warnings
- Import warnings

**Tasks:**
- [ ] Run `pnpm check 2>&1 | grep "Warn:" | sort | uniq -c`
- [ ] Categorize warnings by type and severity
- [ ] Fix or suppress unused CSS warnings
- [ ] Review non-reactive update warnings (may indicate bugs)
- [ ] Address accessibility issues

**Acceptance Criteria:**
- Warnings reduced by 50% or more
- All critical warnings addressed
- Suppressions documented with reason

**Effort:** Medium (4-6 hours)

### 5.2 Add JSDoc Documentation

**Problem:** Complex type transformations lack explanation

**Target areas:**
- `mapToApiPayload()` in party.service.ts
- Visibility mapping logic
- Type assertion workarounds
- Third-party wrapper purposes

**Tasks:**
- [ ] Document visibility mapping with TODO for unification
- [ ] Explain why type assertions are needed
- [ ] Add examples to complex type transformations
- [ ] Document third-party library workarounds

**Acceptance Criteria:**
- All workarounds have explanation comments
- Complex transformations documented
- TODOs added for future improvements

**Effort:** Small (2-3 hours)

### 5.3 Strict Null Checks Review

**Problem:** Some null handling is implicit or unclear

**Tasks:**
- [ ] Review null coalescing operators (`??`)
- [ ] Document what empty string defaults mean
- [ ] Consider making related properties required together (e.g., avatar.picture + avatar.element)
- [ ] Add validation for undefined vs null semantics

**Effort:** Small (2-3 hours)

---

## Implementation Strategy

### Recommended Order:

**Week 1: Critical Type Safety**
1. Remove type assertions in UncapIndicator (1.1)
2. Unify visibility types (1.2)

**Week 2: Third-Party Libraries**
3. Create bits-ui wrappers (2.1)
4. Add wx-svelte-grid types (2.2)

**Week 3: Type Consolidation**
5. Consolidate Awakening types (3.1)
6. Type the `any` usages (3.2) - ongoing

**Week 4: Polish**
7. Create test factories (4.1)
8. Address warnings (5.1)
9. Add JSDoc (5.2)

### Success Metrics:

- **Type Safety:** 0 `as any` casts (except documented cases)
- **Consistency:** Single source of truth for shared types
- **Maintainability:** Test factories, JSDoc, reduced warnings
- **Developer Experience:** Better IntelliSense, clearer errors

### Non-Goals:

- Perfect type coverage (pragmatic > perfect)
- Rewriting working code just for types
- Over-engineering simple components

---

## Notes

### Philosophy:
- Incremental improvement over big rewrites
- Document "why" for workarounds
- Type safety where it adds value
- Pragmatic trade-offs are okay

### When to Use `any`:
- Truly dynamic data (rare)
- Third-party library gaps (with comment)
- Overly complex generic inference
- Always add `// eslint-disable-next-line @typescript-eslint/no-explicit-any` and justification

### When to Create Wrappers:
- Type incompatibilities we can't fix upstream
- Need to restrict API surface
- Want better defaults
- Shared configuration across usages

---

## Progress Tracking

- [ ] Phase 1: Critical Type Safety (0/2)
- [ ] Phase 2: Third-Party Libraries (0/2)
- [ ] Phase 3: Type Consolidation (0/2)
- [ ] Phase 4: Test Infrastructure (0/2)
- [ ] Phase 5: Code Quality (0/3)

**Last Updated:** 2025-11-28
**Current Status:** Planning phase

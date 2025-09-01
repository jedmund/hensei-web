# Fix App Router Caching Issues PRD

## Overview
Fix critical runtime errors in the App Router implementation related to viewport metadata configuration and dynamic data access within cached functions. These fixes are designed to work with Next.js 14 while preparing for migration to Next.js 15.

## Current Issues

### Issue 1: Viewport Metadata Warning
**Error:** "Unsupported metadata viewport is configured in metadata export. Please move it to viewport export instead."

**Root Cause:** 
- Viewport configuration is incorrectly placed in the `metadata` export in `app/layout.tsx`
- Next.js 13+ App Router requires viewport to be a separate export

**Impact:** Warning on every page load, potential SEO and mobile rendering issues

### Issue 2: Dynamic Data in Cached Functions
**Error:** "Route /new used 'cookies' inside a function cached with 'unstable_cache(...)'. Accessing Dynamic data sources inside a cache scope is not supported."

**Root Cause:**
- Data fetching functions in `app/lib/data.ts` use `unstable_cache` wrapper
- Inside cached functions, `fetchFromApi()` calls `getAuthToken()` which accesses `cookies()`
- Next.js doesn't allow dynamic data sources (cookies, headers) inside cached scopes

**Impact:** Pages fail to load, API calls fail, poor user experience

## Files to be Modified

### Core Files Requiring Changes

#### 1. `/app/layout.tsx`
**Changes needed:**
- Remove `viewport` property from `metadata` export (line 16)
- Add new `viewport` export with proper format
- Fix import conflict with Radix UI's Viewport component

#### 2. `/app/lib/data.ts`
**Changes needed:**
- Remove `unstable_cache` wrapper from all 10 functions:
  - `getTeams()` (lines 30-52)
  - `getTeam()` (lines 58-69)
  - `getUserInfo()` (lines 73-84)
  - `getRaidGroups()` (lines 88-99)
  - `getVersion()` (lines 103-114)
  - `getFavorites()` (lines 118-129)
  - `getJobs()` (lines 133-151)
  - `getJob()` (lines 155-166)
  - `getJobSkills()` (lines 170-182)
  - `getJobAccessories()` (lines 186-197)
- Remove `unstable_cache` import from line 1

### Pages That Use These Functions (Testing Required)

#### 3. `/app/new/page.tsx`
- Uses: `getRaidGroups()` (line 14)
- Test: Page loads, raid groups populate

#### 4. `/app/teams/page.tsx`
- Uses: `getTeams()`
- Test: Teams list loads with filters

#### 5. `/app/saved/page.tsx`
- Uses: `getFavorites()`
- Test: Saved teams display correctly

#### 6. `/app/p/[party]/page.tsx`
- Uses: `getTeam()`
- Test: Individual party pages load

#### 7. `/app/[username]/page.tsx`
- Uses: `getUserInfo()`, `getTeams()`
- Test: User profiles load with their teams

### Supporting Files (No changes, but related)

#### 8. `/app/lib/api-utils.ts`
- Contains `getAuthToken()` that causes the issue
- No changes needed, just awareness

## Next.js 15 Migration Context

### Key Next.js 15 Changes
1. **Caching Behavior**
   - Fetch requests no longer cached by default
   - `unstable_cache` being deprecated in favor of `use cache` directive
   - More explicit cache control

2. **Async Request APIs**
   - `cookies()`, `headers()`, and `params` become async
   - Better separation between static and dynamic data

3. **Request Deduplication**
   - Automatic deduplication of identical requests
   - No need for manual caching in many cases

### Migration Strategy
Our fixes should align with Next.js 15's philosophy:
- Remove implicit caching
- Rely on framework's built-in optimizations
- Prepare for async request APIs

## Proposed Solution

### Solution for Viewport Issue
Move viewport configuration to a separate export in `app/layout.tsx`:

```typescript
// Remove from metadata
export const metadata: Metadata = {
  title: 'granblue.team',
  description: 'Create, save, and share Granblue Fantasy party compositions',
  // viewport: 'viewport-fit=cover, width=device-width, initial-scale=1.0', // REMOVE
}

// Add as separate export
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}
```

### Solution for Caching Issue
Remove `unstable_cache` wrapper from all data fetching functions. This aligns with Next.js 15's default behavior and eliminates the dynamic data issue.

**Before:**
```typescript
export async function getRaidGroups() {
  const key = ['getRaidGroups'];
  const run = unstable_cache(async () => {
    try {
      const data = await fetchFromApi('/raids/groups');
      return data;
    } catch (error) {
      console.error('Failed to fetch raid groups', error);
      throw error;
    }
  }, key, { revalidate: 300 });
  return run();
}
```

**After:**
```typescript
export async function getRaidGroups() {
  try {
    const data = await fetchFromApi('/raids/groups');
    return data;
  } catch (error) {
    console.error('Failed to fetch raid groups', error);
    throw error;
  }
}
```

### Rationale
1. **Simplicity** - Removes complexity of cache management
2. **Next.js 15 Ready** - Aligns with new caching defaults
3. **No Dynamic Data Issues** - Cookies can be accessed freely
4. **Performance** - Next.js automatically deduplicates requests within same render
5. **Maintainability** - Less code to maintain and debug

## Implementation Tasks

### Phase 1: Immediate Fixes (Next.js 14)

#### File: `/app/layout.tsx`
- [ ] Remove viewport from metadata export (line 16)
- [ ] Add viewport as separate export
- [ ] Rename Radix Toast Viewport import to avoid naming conflict

#### File: `/app/lib/data.ts`
- [ ] Remove `import { unstable_cache } from 'next/cache'` (line 1)
- [ ] Remove `unstable_cache` wrapper from `getTeams()` (lines 30-52)
- [ ] Remove `unstable_cache` wrapper from `getTeam()` (lines 58-69)
- [ ] Remove `unstable_cache` wrapper from `getUserInfo()` (lines 73-84)
- [ ] Remove `unstable_cache` wrapper from `getRaidGroups()` (lines 88-99)
- [ ] Remove `unstable_cache` wrapper from `getVersion()` (lines 103-114)
- [ ] Remove `unstable_cache` wrapper from `getFavorites()` (lines 118-129)
- [ ] Remove `unstable_cache` wrapper from `getJobs()` (lines 133-151)
- [ ] Remove `unstable_cache` wrapper from `getJob()` (lines 155-166)
- [ ] Remove `unstable_cache` wrapper from `getJobSkills()` (lines 170-182)
- [ ] Remove `unstable_cache` wrapper from `getJobAccessories()` (lines 186-197)

#### Testing
- [ ] Test `/new` page loads without errors (uses getRaidGroups)
- [ ] Test `/teams` page functionality (uses getTeams)
- [ ] Test `/saved` page functionality (uses getFavorites)
- [ ] Test `/p/[party]` pages load (uses getTeam)
- [ ] Test `/[username]` profile pages (uses getUserInfo, getTeams)
- [ ] Verify API calls work with authentication
- [ ] Check console for any remaining warnings

### Phase 2: Next.js 15 Migration Prep
- [ ] Document any performance impacts from removing caching
- [ ] Identify truly static data that might benefit from explicit caching
- [ ] Plan implementation of `use cache` directive for Next.js 15
- [ ] Prepare for async `cookies()` and `headers()` migration

### Phase 3: Next.js 15 Migration
- [ ] Update to Next.js 15
- [ ] Convert `cookies()` calls to async where needed
- [ ] Implement `use cache` directive for static data if needed
- [ ] Remove any remaining `unstable_cache` imports
- [ ] Test full application functionality

## Success Criteria

### Immediate (Phase 1)
- [ ] No viewport metadata warnings in console
- [ ] No "cookies inside cached function" errors
- [ ] All pages load successfully
- [ ] API calls work with and without authentication
- [ ] No regression in functionality

### Long-term (Phase 3)
- [ ] Successfully running on Next.js 15
- [ ] Optimal caching strategy implemented
- [ ] Clean codebase without deprecated APIs
- [ ] Performance metrics maintained or improved

## Risks and Mitigations

### Risk: Performance Impact
**Mitigation:** 
- Next.js automatically deduplicates requests in same render cycle
- Monitor performance metrics before/after change
- Can implement selective caching if needed

### Risk: Increased API Load
**Mitigation:**
- Most data fetching happens server-side with deduplication
- API should handle load or implement server-side caching
- Can add Redis/memory cache if needed

## Timeline
- Phase 1: Immediate (1-2 hours)
- Phase 2: Before Next.js 15 migration (documentation only)
- Phase 3: During Next.js 15 migration sprint

## Notes
- This approach prioritizes simplicity and forward compatibility
- Aligns with Next.js team's recommended patterns
- Reduces technical debt before major version upgrade
- Makes codebase more maintainable and predictable
- Total of 2 core files need modification, 5 pages need testing
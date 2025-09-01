# App Router Migration PRD

## Overview
Complete migration from Next.js Pages Router to App Router by updating all components to use `next/navigation` instead of `next/router`.

## Migration Requirements

### Router API Changes
- `useRouter()` from `next/router` → `useRouter()` from `next/navigation`
- `router.query` → `useSearchParams()` hook
- `router.pathname` → `usePathname()` hook  
- `router.asPath` → combination of `usePathname()` + `useSearchParams()`
- `router.push()` → stays the same
- `router.replace()` → stays the same
- `router.back()` → stays the same
- `router.reload()` → `router.refresh()`
- `router.prefetch()` → stays the same
- `router.beforePopState()` → not available in App Router (needs alternative)
- `router.events` → not available in App Router (needs alternative)

### Import Updates Required
All imports need to change from:
```tsx
import { useRouter } from 'next/router'
```
To:
```tsx
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
```

## Files to Migrate

### App Directory Files (Already using next/navigation - 6 files)
These files already use `next/navigation` but should be verified:
- [ ] `/app/teams/TeamsPageClient.tsx`
- [ ] `/app/saved/SavedPageClient.tsx`
- [ ] `/app/p/[party]/PartyPageClient.tsx`
- [ ] `/app/new/NewPartyClient.tsx`
- [ ] `/app/components/Header.tsx`
- [ ] `/app/[username]/ProfilePageClient.tsx`

### Pages Directory Files (1 file)
- [ ] `/pages/about.tsx` - Needs migration to app router or update imports

### Component Files - Auth (3 files)
- [x] `/components/auth/LoginModal/index.tsx`
- [x] `/components/auth/SignupModal/index.tsx`
- [x] `/components/auth/AccountModal/index.tsx`

### Component Files - Character (5 files)
- [x] `/components/character/CharacterUnit/index.tsx`
- [x] `/components/character/CharacterModal/index.tsx`
- [x] `/components/character/CharacterHovercard/index.tsx`
- [x] `/components/character/CharacterConflictModal/index.tsx`
- [x] `/components/character/CharacterResult/index.tsx`

### Component Files - Weapon (7 files)
- [x] `/components/weapon/WeaponUnit/index.tsx`
- [x] `/components/weapon/WeaponModal/index.tsx`
- [x] `/components/weapon/WeaponKeySelect/index.tsx`
- [x] `/components/weapon/WeaponHovercard/index.tsx`
- [x] `/components/weapon/WeaponConflictModal/index.tsx`
- [x] `/components/weapon/WeaponResult/index.tsx`
- [x] `/components/weapon/WeaponLabelIcon/index.tsx`

### Component Files - Summon (3 files)
- [x] `/components/summon/SummonUnit/index.tsx`
- [x] `/components/summon/SummonHovercard/index.tsx`
- [x] `/components/summon/SummonResult/index.tsx`

### Component Files - Party (5 files)
- [x] `/components/party/PartyHeader/index.tsx`
- [x] `/components/party/PartyHead/index.tsx`
- [x] `/components/party/PartyFooter/index.tsx`
- [x] `/components/party/PartyDropdown/index.tsx`
- [x] `/components/party/Party/index.tsx`

### Component Files - Job (7 files)
- [x] `/components/job/JobSkillItem/index.tsx`
- [x] `/components/job/JobSection/index.tsx`
- [x] `/components/job/JobDropdown/index.tsx`
- [x] `/components/job/JobAccessoryPopover/index.tsx`
- [x] `/components/job/JobAccessoryItem/index.tsx`
- [x] `/components/job/JobSkillResult/index.tsx`
- [x] `/components/job/JobImage/index.tsx`

### Component Files - Mastery (3 files)
- [x] `/components/mastery/ExtendedMasterySelect/index.tsx`
- [x] `/components/mastery/AxSelect/index.tsx`
- [x] `/components/mastery/AwakeningSelectWithInput/index.tsx`

### Component Files - Reps (4 files)
- [x] `/components/reps/GridRep/index.tsx`
- [x] `/components/reps/CharacterRep/index.tsx`
- [x] `/components/reps/WeaponRep/index.tsx`
- [x] `/components/reps/SummonRep/index.tsx`

### Component Files - Common (2 files)
- [x] `/components/common/SelectWithInput/index.tsx`
- [x] `/components/common/Editor/index.tsx`

### Component Files - Extra (2 files)
- [x] `/components/extra/GuidebookUnit/index.tsx`
- [x] `/components/extra/GuidebookResult/index.tsx`

### Component Files - Other (11 files)
- [x] `/components/toasts/UpdateToast/index.tsx`
- [x] `/components/search/SearchModal/index.tsx`
- [x] `/components/raids/RaidCombobox/index.tsx`
- [x] `/components/filters/FilterModal/index.tsx`
- [x] `/components/MentionList/index.tsx`
- [x] `/components/Layout/index.tsx`
- [x] `/components/LanguageSwitch/index.tsx`
- [x] `/components/Header/index.tsx`
- [x] `/components/ElementToggle/index.tsx`
- [x] `/components/about/ChangelogUnit/index.tsx`
- [x] `/components/HovercardHeader/index.tsx`

### Utility Files (1 file)
- [x] `/utils/changeLanguage.tsx`

## Total Files to Migrate: 59

## Migration Steps for Each File

1. **Analyze current usage**
   - Check how `router` is being used
   - Identify which properties/methods are accessed
   - Note any router.events listeners

2. **Update imports**
   - Change from `next/router` to `next/navigation`
   - Add additional hooks if needed (`usePathname`, `useSearchParams`)

3. **Update router usage**
   - Replace `router.query` with `useSearchParams()`
   - Replace `router.pathname` with `usePathname()`
   - Update any other router property access

4. **Handle edge cases**
   - Router events (need alternative approach)
   - beforePopState (need alternative approach)
   - Dynamic route params (use `useParams()`)

5. **Test the component**
   - Ensure navigation still works
   - Check query parameter handling
   - Verify dynamic routes

## Special Considerations

### Router Events
Files using `router.events` will need special handling as this is not available in App Router. Common patterns:
- Route change start/complete events → Use loading.tsx or Suspense
- Route change error → Use error boundaries

### Query Parameters
When migrating `router.query`:
```tsx
// Old (Pages Router)
const { id, filter } = router.query

// New (App Router)
const searchParams = useSearchParams()
const id = searchParams.get('id')
const filter = searchParams.get('filter')
```

### Dynamic Route Parameters
For dynamic segments like `[id]`:
```tsx
// Old (Pages Router)
const { id } = router.query

// New (App Router)
import { useParams } from 'next/navigation'
const params = useParams()
const id = params.id
```

### Programmatic Navigation
```tsx
// Both routers (mostly the same)
router.push('/path')
router.replace('/path')
router.back()

// Refresh (different)
// Old: router.reload()
// New: router.refresh()
```

## Post-Migration Cleanup

After all files are migrated:
1. [ ] Remove `/pages` directory (except `/pages/api` if still needed)
2. [ ] Remove Pages Router specific configuration
3. [ ] Update `_app.tsx` dependencies if any remain
4. [ ] Test all routes thoroughly
5. [ ] Update any documentation

## Success Criteria

- [x] All components use `next/navigation` imports
- [x] No references to `next/router` remain in components (only in pages/about.tsx which still needs migration)
- [x] All navigation functionality works as before
- [x] No console errors about "NextRouter was not mounted"
- [x] App runs successfully with `npm run dev`
- [ ] Build completes with `npm run build` (to be tested)
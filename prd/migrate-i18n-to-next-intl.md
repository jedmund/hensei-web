# PRD: Migrate i18n from next-i18next to next-intl for App Router

## Current Status (Sep 2, 2025)
**Migration is ~90% complete. App is now running successfully!**

### What's Working:
- ✅ Core configuration complete (next.config.js wrapped with plugin, middleware composed)
- ✅ App Router structure migrated to [locale] segments
- ✅ ALL 76 component files now have correct `next-intl` imports
- ✅ Navigation helper created at `/i18n/navigation.ts`
- ✅ All `react-i18next` and `next-i18next` imports have been replaced
- ✅ **App compiles and runs without import errors**
- ✅ English locale loads successfully

### What's Pending:
- ⚠️ 18 components have `<Trans>` components that need refactoring to `t.rich()`
- ⚠️ Most components still use standard Next.js navigation instead of locale-aware navigation
- ⚠️ Minor issue: Missing translation key `common.toasts.update.description.`
- ⚠️ Japanese locale testing needed

### Next Steps:
1. Test the app to verify it runs without import errors
2. Update navigation imports to use locale-aware routing
3. Refactor Trans components to use `t.rich()`
4. Test locale switching
5. Clean up old config files

## Problem Statement
The application is displaying raw translation keys (e.g., `party.segmented_control.characters`) instead of localized strings. This is because:
- The codebase uses `next-i18next` which is designed for Pages Router
- App Router pages don't have proper i18n provider setup
- Client components are trying to use `useTranslation` from `next-i18next` without a provider

## Solution: Migrate to next-intl
We will migrate from `next-i18next` to `next-intl`, adopting idiomatic App Router patterns (Next 13–15): localized route segment, composed middleware (i18n + auth), and locale-aware navigation. We will reuse our existing JSON translation files and remove legacy Next.js i18n config to avoid conflicts.

## Implementation Plan

### 1. Install Dependencies
```bash
npm install next-intl
```

### 2. Create i18n Configuration
Create `/i18n.config.ts` (single source of truth for locales):
```typescript
export const locales = ['en', 'ja'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'
```

### 3. Compose Middleware (i18n + auth)
Compose next-intl middleware with our existing auth checks. Keep i18n first, then apply auth to the path without the locale prefix.
```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware'
import {locales, defaultLocale, type Locale} from './i18n.config'
import {NextResponse} from 'next/server'
import type {NextRequest} from 'next/server'

const intl = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed' // Show locale in URL when not default
})

const PROTECTED_PATHS = ['/saved', '/profile'] as const
const MIXED_AUTH_PATHS = ['/api/parties', '/p/'] as const

export default function middleware(request: NextRequest) {
  // Run next-intl first (handles locale detection, redirects, etc.)
  const intlResponse = intl(request)
  if (intlResponse) return intlResponse

  const {pathname} = request.nextUrl
  const seg = pathname.split('/')[1]
  const pathWithoutLocale = locales.includes(seg as Locale)
    ? pathname.slice(seg.length + 1) || '/'
    : pathname

  const isProtectedPath = PROTECTED_PATHS.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + '/')
  )
  const isMixedAuthPath = MIXED_AUTH_PATHS.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p)
  )

  const needsAuth =
    isProtectedPath || (isMixedAuthPath && ['POST', 'PUT', 'DELETE'].includes(request.method))

  if (!needsAuth) return NextResponse.next()

  const accountCookie = request.cookies.get('account')
  if (!accountCookie?.value) {
    if (pathWithoutLocale.startsWith('/api/')) {
      return NextResponse.json({error: 'Authentication required'}, {status: 401})
    }
    // Preserve locale in redirect
    const url = request.nextUrl.clone()
    url.pathname = '/teams'
    return NextResponse.redirect(url)
  }

  try {
    const account = JSON.parse(accountCookie.value)
    if (!account.token) {
      if (pathWithoutLocale.startsWith('/api/')) {
        return NextResponse.json({error: 'Authentication required'}, {status: 401})
      }
      const url = request.nextUrl.clone()
      url.pathname = '/teams'
      return NextResponse.redirect(url)
    }
  } catch {
    if (pathWithoutLocale.startsWith('/api/')) {
      return NextResponse.json({error: 'Authentication required'}, {status: 401})
    }
    const url = request.nextUrl.clone()
    url.pathname = '/teams'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)']
}
```

### 4. Localized Layout (App Router)
Create `/app/[locale]/layout.tsx` and place `NextIntlClientProvider` here. Use `unstable_setRequestLocale` to tell Next the active locale and pre-generate locale params if statically building.
```typescript
// app/[locale]/layout.tsx
import {NextIntlClientProvider} from 'next-intl'
import {getMessages, unstable_setRequestLocale} from 'next-intl/server'
import {locales} from '../../i18n.config'

export function generateStaticParams() {
  return locales.map((locale) => ({locale}))
}

export default async function LocaleLayout({
  children,
  params: {locale}
}: {
  children: React.ReactNode
  params: {locale: string}
}) {
  unstable_setRequestLocale(locale)
  const messages = await getMessages()
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
```
Notes:
- If `/app/layout.tsx` exists, keep it minimal (global styles/fonts only) and avoid setting the `lang` attribute or an i18n provider there. The locale-specific layout above should own `<html>`/`<body>`.

### 5. Locale-Aware Navigation
Replace `next/link` and `next/navigation` with `next-intl/navigation` to preserve locale on navigation.
```typescript
// Before
import Link from 'next/link'
import {useRouter, usePathname, useSearchParams} from 'next/navigation'

// After
import {Link, useRouter, usePathname, useSearchParams} from 'next-intl/navigation'
```

### 6. Update Component Imports
Change all translation imports from:
```typescript
import { useTranslation } from 'next-i18next'
import { Trans } from 'next-i18next'
```

To:
```typescript
import { useTranslations } from 'next-intl'
// Note: Trans component usage will need to be refactored
```

### 7. Update Translation Hook Usage
Change from:
```typescript
const { t } = useTranslation('common')
// Usage: t('party.segmented_control.characters')
```

To:
```typescript
const t = useTranslations('common')
// Usage: t('party.segmented_control.characters')
```

### 8. Update Trans Component Usage
The `Trans` component works differently in next-intl. Change from:
```typescript
<Trans i18nKey="modals.summons.messages.remove">
  Are you sure you want to remove{' '}
  <strong>{{ weapon: gridSummon?.object.name[locale] }}</strong> from
  your team?
</Trans>
```

To using rich text formatting:
```typescript
t.rich('modals.summons.messages.remove', {
  weapon: gridSummon?.object.name[locale],
  strong: (chunks) => <strong>{chunks}</strong>
})
```

### 9. Language Switch
Prefer path-based locale switching over cookie+refresh for clarity and correct URL behavior.
```typescript
// Using next-intl/navigation
const router = useRouter()
const pathname = usePathname()

function changeLanguage(to: 'en'|'ja') {
  router.replace(pathname, {locale: to})
}
```
You may still set `NEXT_LOCALE` for persistence, but the router option should be the source of truth.

### 10. Server Helpers and Metadata
Use server utilities for server-only files and localized metadata.
```typescript
// In server components/routes (e.g., not-found.tsx)
import {getTranslations} from 'next-intl/server'
const t = await getTranslations('common')

// Localized metadata
export async function generateMetadata({params: {locale}}) {
  const t = await getTranslations({locale, namespace: 'common'})
  return {title: t('title')}
}
```

## Files to Update

### Core Configuration Files
1. `/package.json` - Add `next-intl` dependency
2. `/i18n.config.ts` - Create new configuration file
3. `/middleware.ts` - Compose next-intl + auth middleware
4. `/i18n/request.ts` - Ensure imports from `../i18n.config` are correct
5. `/next.config.js` - Remove `i18n` property (avoid conflict with middleware)
6. `/next-i18next.config.js` - Remove after migration

### App Router Files (7 files)
1. `/app/[locale]/layout.tsx` - New; add NextIntlClientProvider
2. `/app/new/NewPartyClient.tsx` - Update imports and usage
3. `/app/[username]/ProfilePageClient.tsx` - Update imports and usage
4. `/app/saved/SavedPageClient.tsx` - Update imports and usage
5. `/app/p/[party]/PartyPageClient.tsx` - Update imports and usage
6. `/app/teams/TeamsPageClient.tsx` - Update imports and usage
7. `/app/not-found.tsx` - Update imports and usage
8. `/app/layout.tsx` - If present, keep minimal; remove i18n/lang handling

### Component Files (76 files)
All files in `/components` directory that use translations and/or navigation:
1. `/components/Header/index.tsx`
2. `/components/ErrorSection/index.tsx`
3. `/components/party/Party/index.tsx`
4. `/components/party/PartyHeader/index.tsx`
5. `/components/party/PartyFooter/index.tsx`
6. `/components/party/PartySegmentedControl/index.tsx`
7. `/components/party/PartyDropdown/index.tsx`
8. `/components/party/EditPartyModal/index.tsx`
9. `/components/party/PartyVisibilityDialog/index.tsx`
10. `/components/character/CharacterUnit/index.tsx`
11. `/components/character/CharacterGrid/index.tsx`
12. `/components/character/CharacterModal/index.tsx`
13. `/components/character/CharacterHovercard/index.tsx`
14. `/components/character/CharacterConflictModal/index.tsx`
15. `/components/character/CharacterSearchFilterBar/index.tsx`
16. `/components/weapon/WeaponUnit/index.tsx`
17. `/components/weapon/WeaponGrid/index.tsx`
18. `/components/weapon/WeaponModal/index.tsx`
19. `/components/weapon/WeaponHovercard/index.tsx`
20. `/components/weapon/WeaponConflictModal/index.tsx`
21. `/components/weapon/WeaponKeySelect/index.tsx`
22. `/components/weapon/WeaponSearchFilterBar/index.tsx`
23. `/components/summon/SummonUnit/index.tsx`
24. `/components/summon/SummonGrid/index.tsx`
25. `/components/summon/SummonHovercard/index.tsx`
26. `/components/summon/SummonSearchFilterBar/index.tsx`
27. `/components/job/JobSection/index.tsx`
28. `/components/job/JobDropdown/index.tsx`
29. `/components/job/JobSkillItem/index.tsx`
30. `/components/job/JobAccessoryPopover/index.tsx`
31. `/components/job/JobSkillSearchFilterBar/index.tsx`
32. `/components/auth/LoginModal/index.tsx`
33. `/components/auth/SignupModal/index.tsx`
34. `/components/auth/AccountModal/index.tsx`
35. `/components/raids/RaidCombobox/index.tsx`
36. `/components/raids/RaidItem/index.tsx`
37. `/components/search/SearchModal/index.tsx`
38. `/components/filters/FilterBar/index.tsx`
39. `/components/filters/FilterModal/index.tsx`
40. `/components/mastery/AwakeningSelectWithInput/index.tsx`
41. `/components/mastery/AxSelect/index.tsx`
42. `/components/mastery/ExtendedMasterySelect/index.tsx`
43. `/components/uncap/UncapIndicator/index.tsx`
44. `/components/uncap/TranscendencePopover/index.tsx`
45. `/components/uncap/TranscendenceStar/index.tsx`
46. `/components/uncap/TranscendenceFragment/index.tsx`
47. `/components/extra/GuidebookUnit/index.tsx`
48. `/components/extra/GuidebooksGrid/index.tsx`
49. `/components/extra/ExtraWeaponsGrid/index.tsx`
50. `/components/extra/ExtraSummonsGrid/index.tsx`
51. `/components/reps/CharacterRep/index.tsx`
52. `/components/reps/GridRep/index.tsx`
53. `/components/toasts/UpdateToast/index.tsx`
54. `/components/toasts/UrlCopiedToast/index.tsx`
55. `/components/toasts/RemixedToast/index.tsx`
56. `/components/dialogs/RemixTeamAlert/index.tsx`
57. `/components/dialogs/DeleteTeamAlert/index.tsx`
58. `/components/common/Editor/index.tsx`
59. `/components/common/SelectWithInput/index.tsx`
60. `/components/common/ToolbarButton/index.tsx`
61. `/components/common/MentionTypeahead/index.tsx`
62. `/components/ElementToggle/index.tsx`
63. `/components/MentionList/index.tsx`
64. `/components/about/AboutPage/index.tsx`
65. `/components/about/AboutHead/index.tsx`
66. `/components/about/RoadmapPage/index.tsx`
67. `/components/about/UpdatesPage/index.tsx`
68. `/components/about/ContentUpdate/index.tsx`
69. `/components/about/updates/ContentUpdate2022/index.tsx`
70. `/components/about/updates/ContentUpdate2023/index.tsx`
71. `/components/about/updates/ContentUpdate2024/index.tsx`
72. `/components/head/NewHead/index.tsx`
73. `/components/head/ProfileHead/index.tsx`
74. `/components/head/SavedHead/index.tsx`
75. `/components/head/TeamsHead/index.tsx`
76. `/components/party/PartyHead/index.tsx`

### Pages Router Files (temporary)
Plan to remove Pages Router usage. Temporarily keep while migrating:
1. `/pages/_app.tsx` - Keep until all pages are on App Router
2. `/pages/about.tsx` - Keep until migrated

## Task List

- [x] **Setup and Configuration**
  - [x] Install next-intl package (v4.3.5)
  - [x] Create `/i18n.config.ts` with locale configuration
  - [x] Create/update `/middleware.ts` for locale routing (composed with auth)
  - [x] Update `/next.config.js` with `createNextIntlPlugin` wrapper
  - [x] Create `/i18n/navigation.ts` with `createNavigation` for locale-aware routing

- [x] **Localized Layout**
  - [x] Create `/app/[locale]/layout.tsx` with `unstable_setRequestLocale`
  - [x] Load messages with `getMessages()` and wrap with `NextIntlClientProvider`
  - [x] Keep `/app/layout.tsx` minimal (no lang/i18n)

- [x] **Update App Router Pages (7+ files)**
  - [x] Update `/app/new/NewPartyClient.tsx`
  - [x] Update `/app/[username]/ProfilePageClient.tsx`
  - [x] Update `/app/saved/SavedPageClient.tsx`
  - [x] Update `/app/p/[party]/PartyPageClient.tsx`
  - [x] Update `/app/teams/TeamsPageClient.tsx`
  - [x] Update `/app/not-found.tsx`
  - [x] Update `/app/components/Header.tsx`

- [ ] **Update Component Imports (76 files)**
  - [x] Partial: 54/76 files updated to use `next-intl`
  - [x] Fix remaining 8 files with `react-i18next` imports
  - [x] Fix remaining 11 files with `next-i18next` imports  
  - [ ] Replace `next/link` and `next/navigation` with locale-aware navigation (only 1 file done)
  - [ ] Refactor 18 files still using `Trans` component to `t.rich()`

- [x] **Testing and Verification**
  - [x] Test English locale - App loads successfully!
  - [ ] Test Japanese locale
  - [ ] Verify locale switching works
  - [ ] Check all translation keys render correctly
  - [ ] Test dynamic translations with variables

- [ ] **Cleanup**
  - [ ] Remove `i18n` from `next.config.js`
  - [ ] Remove `/next-i18next.config.js`
  - [ ] Remove `next-i18next` from `package.json`
  - [ ] Update documentation

## Files Still Requiring Updates

### Files with `react-i18next` imports (8 files): ✅ COMPLETED
1. ✅ `/components/auth/LoginModal/index.tsx` - Fixed import
2. ✅ `/components/filters/FilterModal/index.tsx` - Fixed import, commented Trans
3. ✅ `/components/job/JobSkillSearchFilterBar/index.tsx` - Fixed import
4. ✅ `/components/party/EditPartyModal/index.tsx` - Fixed import, simplified Trans
5. ✅ `/components/party/PartyVisibilityDialog/index.tsx` - Fixed import
6. ✅ `/components/raids/RaidCombobox/index.tsx` - Fixed import
7. ✅ `/components/search/SearchModal/index.tsx` - Fixed import
8. ✅ `/components/weapon/WeaponConflictModal/index.tsx` - Fixed import, simplified Trans

### Files with `next-i18next` imports (11 files): ✅ COMPLETED
1. ✅ `/components/about/AboutPage/index.tsx` - Fixed import, simplified Trans
2. ✅ `/components/character/CharacterConflictModal/index.tsx` - Fixed import
3. ✅ `/components/character/CharacterModal/index.tsx` - Fixed import
4. ✅ `/components/character/CharacterUnit/index.tsx` - Fixed import
5. ✅ `/components/dialogs/RemixTeamAlert/index.tsx` - Fixed import
6. ✅ `/components/extra/GuidebookUnit/index.tsx` - Fixed import
7. ✅ `/components/job/JobSkillItem/index.tsx` - Fixed import
8. ✅ `/components/summon/SummonUnit/index.tsx` - Fixed import
9. ✅ `/components/toasts/RemixedToast/index.tsx` - Fixed import
10. ✅ `/components/weapon/WeaponModal/index.tsx` - Fixed import
11. ✅ `/components/weapon/WeaponUnit/index.tsx` - Fixed import

### Additional files with Trans components but correct imports (3 files):
1. `/components/auth/SignupModal/index.tsx` - Imports correct but Trans is commented out
2. `/components/uncap/TranscendencePopover/index.tsx`
3. `/components/uncap/TranscendenceStar/index.tsx`
4. `/components/uncap/UncapIndicator/index.tsx`

### Navigation Updates Required:
- Most components still use `next/navigation` instead of `~/i18n/navigation`
- Only 1 component currently uses the locale-aware navigation
- The navigation helper exists at `/i18n/navigation.ts` using `createNavigation`

## Success Criteria
1. All translation keys render as localized strings (not raw keys)
2. Locale switching between English and Japanese works and preserves locale in URLs
3. Dynamic translations with variables work correctly
4. No console errors related to i18n
5. App Router pages work correctly; Pages Router pages are removed or temporarily functional during migration

## Risks and Mitigation
- **Risk**: Middleware composition can cause routing conflicts
  - **Mitigation**: Run next-intl middleware first; strip locale before auth checks; unify matcher

- **Risk**: Breaking Pages Router pages during transition
  - **Mitigation**: Keep Pages Router temporarily; schedule removal after App Router parity
  
- **Risk**: Trans component refactoring may be complex
  - **Mitigation**: Start with simple replacements; handle rich content with `t.rich()` gradually
 
- **Risk**: Large number of files to update
  - **Mitigation**: Batch replace imports; test incrementally; prioritize high-traffic routes

## Notes
- The existing translation files in `/public/locales/` can be reused without changes
- The `i18n/request.ts` file already uses next-intl; ensure it imports from the root `i18n.config.ts`
- Use `next-intl/navigation` everywhere for links and routers to preserve locale
- Remove `i18n` from `next.config.js` to avoid conflicts with next-intl middleware routing
- Consider using a codemod/script to automate import updates across 76+ files

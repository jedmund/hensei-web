# PRD: Fix App Version Fetching with Server Prefetch + Hydrator

## Problem
- The app shows a missing translation key for `common.toasts.update.description.` because `appState.version.update_type` is empty.
- Root cause: The app never fetches or populates `appState.version` with backend data.

## Current State (validated)
- Backend API and internal route exist and work: `/app/api/version/route.ts` calls `fetchFromApi('/version')`.
- Client util exists but is unused: `utils/fetchLatestVersion.tsx`.
- Global state shape: `utils/appState.tsx` initializes `version` as `{ version: '0.0', update_type: '', updated_at: '' }`.
- `UpdateToastClient` reads `appState.version` but never triggers a fetch and only checks on mount.

## Goals
- Populate `appState.version` reliably on app load without extra client latency.
- Show the update toast exactly when appropriate (within time window and not already seen).
- Avoid redundant network requests and race conditions.

## Solution Overview
- Server-prefetch the version in the localized layout (`app/[locale]/layout.tsx`).
- Hydrate global state on the client via a tiny `VersionHydrator` client component.
- Make `UpdateToastClient` reactive to version changes using Valtio snapshots.
- Ensure `update_type` maps to valid i18n keys; add a small fallback mapping.

## Implementation Plan

1) Server Prefetch in `app/[locale]/layout.tsx`
- Fetch version data on the server and pass to the client for hydration.
- Use either of:
  - Direct helper: `const version = await fetchFromApi('/version')` (from `app/lib/api-utils.ts`), or
  - Next fetch: `const res = await fetch('/api/version', { cache: 'no-store' }); const version = await res.json();`
- Do this inside the default exported async layout function.
- Handle errors gracefully (wrap in try/catch and set `version = null`).

2) Add `VersionHydrator` (client)
- File: `app/components/VersionHydrator.tsx`
- Behavior: On mount and when `version` prop changes, set `appState.version`.

Example:
- 'use client'
- import { useEffect } from 'react'
- import { appState } from '~/utils/appState'
- export default function VersionHydrator({ version }: { version: AppUpdate | null }) {
  useEffect(() => {
    if (version && version.updated_at) {
      appState.version = version
    }
  }, [version])
  return null
}

3) Wire Hydrator in Layout
- In `app/[locale]/layout.tsx`, render `<VersionHydrator version={version} />` alongside `<Header />` and `<UpdateToastClient />`.
- Order suggestion (not strict): Hydrator before UpdateToastClient.

4) Make `UpdateToastClient` reactive
- Import `useSnapshot` from `valtio` and observe `appState.version`.
- Change the `useEffect` dependency to run when `version?.updated_at` becomes available.
- This ensures the toast can open even if hydration happens after mount.

Sketch:
- import { useSnapshot } from 'valtio'
- const { version } = useSnapshot(appState)
- useEffect(() => {
  if (version && version.updated_at) {
    const cookie = getToastCookie(version.updated_at)
    const now = new Date()
    const updatedAt = new Date(version.updated_at)
    const validUntil = add(updatedAt, { days: 7 })
    if (now < validUntil && !cookie.seen) setUpdateToastOpen(true)
  }
}, [version?.updated_at])

5) Validate i18n key mapping for `update_type`
- Current keys: `common.toasts.update.description.content` and `...feature`.
- Ensure API returns only these (or map unknown types to a default):
- const typeKey = ['content', 'feature'].includes(version.update_type) ? version.update_type : 'content'
- appState.version.update_type = typeKey

6) Optional: Pages Router compatibility (temporary)
- If the Pages Router `pages/_app.tsx` still needs server-unavailable behavior, add a small client hydrator there too or remove coupling to `appState.version`.

## Files to Update
- `app/[locale]/layout.tsx` (server prefetch + render Hydrator)
- `app/components/VersionHydrator.tsx` (new)
- `app/components/UpdateToastClient.tsx` (valtio snapshot + effect dependency)
- Optional: Add a small mapping for `update_type` before setting state

## Testing
- With API up: `appState.version` is populated on first render; toast opens if within 7 days and unseen.
- With API down: No crash; state remains initial; toast doesn’t open.
- Verify both locales; i18n keys resolve correctly for `update_type`.
- Confirm no duplicate requests across navigations.

## Risks & Mitigations
- Race between hydrator and toast effect: mitigated by making toast reactive to `version?.updated_at`.
- Caching behavior: using `no-store` avoids stale data; can switch to `revalidate` if desired.
- API type mismatch: handle unknown `update_type` with a default mapping.

## Rollout Steps
- Implement server prefetch and hydrator.
- Update `UpdateToastClient` reactivity.
- Ship behind no feature flags (safe, read-only state).
- Observe logs and confirm behavior in both locales.


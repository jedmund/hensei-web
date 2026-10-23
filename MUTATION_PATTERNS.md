# Mutation patterns

Two mutation shapes live side-by-side in the codebase. They look different on
purpose — picking the right one for a new feature avoids accidental drift.

## Direct writes (default)

Each mutation hits the live resource and the cache is invalidated immediately.
Use this when:

- The write has a single, well-defined target (one party, one grid row).
- The user expects their change to land — and to be visible — the moment they
  release the mouse.
- There is no concept of "review before saving."

**Examples:** `useUpdateGridWeapon`, `useCreateSubstitution`, `useReorderSubstitutions`,
`useCreateRole`, `useUpdateRole`, `useReorderRoles`.

**Cache strategy:** the mutation's `onSuccess` calls
`queryClient.invalidateQueries({ queryKey: … })` against the keys it touched.
Optimistic updates are layered on selectively where the round-trip is visible
to the user (e.g. position changes during drag-reorder are eagerly applied;
the invalidate forces reconciliation on failure).

**Errors:** surface via `useAsyncAction` (toast or banner) or directly via the
mutation's `onError` callback. The user retries the same operation.

## Staged drafts

Mutations return `{ draft: … }` without modifying the live resource. A separate
"commit" step (`commitDrafts`) promotes every staged change at once; `discardDrafts`
throws them away. Use this when:

- An edit pass is heavyweight (multiple linked records, scoring previews).
- The editor wants to see a diff and review before publishing.
- A bulk-apply lets editors batch related changes into a single audit entry.

**Examples:** the entire `/database/difficulties` editor — `createTier`,
`updateTier`, `deleteTier`, `updateComponent`, plus the `preview`, `commitDrafts`,
`discardDrafts`, and `getDiff` endpoints. The `pending` / `pendingOperation`
flags on `DifficultyTier` and `DifficultyComponent` are how the read path
distinguishes a draft from a live row.

**Cache strategy:** writes invalidate the tier/rule/component lists _with the
`withDrafts: true` flag_ so the editor view picks up the staged change while
the public read path (no `withDrafts`) stays stable. `commitDrafts` is the
only mutation that invalidates the public keys.

**Errors:** the editor surfaces them in a `CommitDialog` summary so the user
can react before the change leaves their workspace.

## Choosing

If the answer to "should the user see a confirmation/diff before this
persists?" is **no**, write a direct mutation. If it's **yes** for the whole
editing session (not just one button), build draft-staging endpoints and route
all writes through them.

Avoid mixing modes in the same surface — half-staged + half-direct is the
worst of both: users can't tell which of their changes are live.

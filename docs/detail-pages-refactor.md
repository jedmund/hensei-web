# Database Detail Pages Refactor Plan (SvelteKit-centric)

This plan refactors the database detail pages to be modular, reusable, and easy to port across characters, weapons, and summons. It leans into SvelteKit features (server `load`, form `actions`, and `use:enhance`) and Svelte composition (slots, small components, and lightweight state helpers).

## Goals
- Consistent scaffold for detail pages (header, edit toolbar, sections, feedback).
- Encapsulated edit-mode state + mapping to/from API payloads.
- Clean separation between server concerns (loading, saving, validation) and client UI.
- Reusable section components that can be shared or adapted per resource.
- Smooth path to port the architecture to weapons and summons.

## Architecture Overview
- Client
  - `DetailScaffold.svelte`: Common header, edit/save/cancel controls, messages, and section slots.
  - `createEditForm.ts`: Small factory returning state + helpers for edit lifecycle.
    - Initializes `editData` from the resource model via a schema mapping.
    - Exposes `editMode`, `toggleEdit`, `reset`, `set`, `get`, and `submit` glue for forms.
  - `image.ts`: `getResourceImage(type, granblue_id)` centralizing image paths and fallbacks.
  - Section components per resource (e.g., `CharacterMetadataSection.svelte`, shared `StatsSection` when possible).
- Server
  - Shared loader helpers (e.g., `lib/server/detail/load.ts`) to fetch a resource detail and normalize to a client-facing model.
  - Form actions in `+page.server.ts` for save (`actions.save`) with validation (optionally Zod) and proper error handling.
  - Progressive enhancement via `use:enhance` so the UI stays responsive without losing SSR form semantics.
- Schema-driven mapping
  - Per resource (`characters/schema.ts`, `weapons/schema.ts`, `summons/schema.ts`) define:
    - `toEditData(model)`: API model -> UI edit state.
    - `toPayload(editData)`: UI edit state -> API payload.
    - Optional field metadata (labels, formatter hooks) for low-ceremony sections.

## File Structure (proposed)
- `src/lib/features/database/detail/`
  - `DetailScaffold.svelte` (header + actions + slots)
  - `createEditForm.ts` (state helper)
  - `image.ts` (resource image helper)
  - `api.ts` (client-side action helpers if needed)
- `src/lib/features/database/characters/`
  - `schema.ts`
  - `sections/`
    - `CharacterMetadataSection.svelte`
    - `CharacterUncapSection.svelte`
    - `CharacterTaxonomySection.svelte`
    - `CharacterStatsSection.svelte`
      - `HPStatsSubsection.svelte`
      - `ATKStatsSubsection.svelte`
- Similar folders for `weapons` and `summons` as we port.

## Form Actions and Loaders
- Loader strategy
  - Current route `+page.ts`/`+page.server.ts` fetches the detailed entity and returns a normalized `model`.
  - A shared helper `getResourceDetail(resource, id)` can live under `lib/server/detail/load.ts` to reduce duplication across resources.
- Save strategy
  - Define `export const actions = { save: async (event) => { ... } }` in `+page.server.ts`.
  - Validate incoming form data (Zod/schema), map to API payload via the schema’s `toPayload`, then persist via your backend API.
  - Return `fail(status, { fieldErrors, message })` on validation errors.
  - On success, return the updated item; `load` can pick it up or the client can reconcile locally.
- Client strategy
  - Wrap the editable fields in a `<form method="POST">` with `use:enhance`.
  - For a gradual migration from controlled inputs, keep local `editData` but mirror it into form fields (hidden or direct binds) to submit via actions.
  - Use action results to show success/error messages in `DetailScaffold`.

## Phased Tasks

### Phase 1 — Extract Scaffold + Edit Form Helper
- [ ] Create `src/lib/features/database/detail/DetailScaffold.svelte` with slots:
  - [ ] Header slot or props for resource `type`, `item`, `image`.
  - [ ] Top-right action area for Edit/Cancel/Save.
  - [ ] Message area for success/error.
  - [ ] Default slot for sections.
- [ ] Create `src/lib/features/database/detail/createEditForm.ts`:
  - [ ] Accepts initial `model` and mapping `toEditData`/`toPayload`.
  - [ ] Returns `editMode`, `editData` (store or bindable object), `toggleEdit`, `reset`, `submit`.
  - [ ] Resets `editData` when `model` changes.
- [ ] Replace inline header/controls in `characters/[id]/+page.svelte` with `DetailScaffold` while preserving behavior.

### Phase 2 — Extract Character Sections
- [ ] `CharacterMetadataSection.svelte` (Rarity, Granblue ID): view/edit with existing utilities.
- [ ] `CharacterUncapSection.svelte` (Indicator + FLB/ULB/Transcendence/Special toggles).
- [ ] `CharacterTaxonomySection.svelte` (Element, Race1/2, Gender, Proficiency1/2).
- [ ] `CharacterStatsSection.svelte` with subcomponents for HP and ATK stats.
- [ ] Wire sections to `editMode` and `editData` via props/bindings; keep look-and-feel identical.

### Phase 3 — Add Schema + Validation + Actions
- [ ] `src/lib/features/database/characters/schema.ts`:
  - [ ] `toEditData(model)` maps current character model to edit state.
  - [ ] `toPayload(editData)` maps edit state to backend payload.
  - [ ] Optional Zod schemas for validation.
- [ ] Add `+page.server.ts` `actions.save` for characters:
  - [ ] Parse form data; validate; call backend; return updated item or errors.
  - [ ] Handle cookies/credentials as needed.
- [ ] Wrap editable UI in `<form method="POST" use:enhance>` and handle optimistic UI/disable Save while pending.
- [ ] Show validation errors and success states in `DetailScaffold`.

### Phase 4 — Shared Loaders + Port to Weapons/Summons
- [ ] Add `lib/server/detail/load.ts` helpers for shared resource fetching.
- [ ] Update characters loader to use shared helper.
- [ ] Create `src/lib/features/database/weapons/schema.ts` and sections; adopt the scaffold.
- [ ] Create `src/lib/features/database/summons/schema.ts` and sections; adopt the scaffold.
- [ ] Implement `+page.server.ts` actions for weapons and summons with validation.

### Phase 5 — Polish and DX
- [ ] `image.ts` helper and replace ad-hoc image path logic.
- [ ] Extract `getDisplayName` to a single utility.
- [ ] Add unit tests for schema mapping functions (to/from payload).
- [ ] Add basic e2e smoke for actions (save success and validation failure).
- [ ] Document conventions (where to put schemas, sections, and loaders).

## Acceptance Criteria
- Character detail page renders identically, with no regressions.
- Edit mode and saving function via form actions, with graceful errors.
- Sections are split into components and trivially testable.
- Weapons and summons can be implemented by adding schema + sections and wiring the same scaffold and actions.

## Risks and Mitigations
- Form action migration conflict with controlled inputs:
  - Mitigate by mirroring `editData` into form fields and using `use:enhance` to reconcile results.
- Server validation shape mismatch:
  - Use Zod schemas that align with backend; log/trace action failures early.
- Over-abstracting sections:
  - Favor small, explicit components; introduce config-driven rendering only where repetition is high and behavior simple.

---

If we agree on this plan, start with Phase 1 (scaffold + helper) and wire it into the character page without changing behavior, then proceed section-by-section.


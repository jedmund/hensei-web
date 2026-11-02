<script lang="ts">
	/**
	 * Side panel that shows a database record next to its list (GBF-140).
	 *
	 * Mount it inside the component that provides the list's ResultSet
	 * (`setResultSet`). The open record is `?open=<id>`; j/k (and ↓/↑ with
	 * focus in the panel) step through the ResultSet, Esc closes, e edits.
	 * Open records with `openRecordInPanel()` so Back closes the panel.
	 *
	 * Editing happens in the panel (`?edit=1`, GBF-173) for editors on
	 * resources with a generated form: ⌘S saves, Esc goes back to the detail,
	 * and j/k keep editing the next record. Unsaved changes ask before any of
	 * that. Style shifts and resources with `panelEdit: false` open the full
	 * edit page instead.
	 */
	import { onDestroy, tick, untrack } from 'svelte'
	import { MediaQuery } from 'svelte/reactivity'
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { m } from '$lib/paraglide/messages'
	import { EDITOR_ROLE } from '$lib/auth/roles'
	import { resourceDef } from '$lib/features/database/schema/registry'
	import Button from '$lib/components/ui/Button.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import type { DetailTab } from '$lib/features/database/detail/DetailScaffold.svelte'
	import { getResultSet } from '../resultSet.svelte'
	import { rootOf, sectionForUrl } from '../sections'
	import { recentPages } from '../recent.svelte'
	import RecordDetail from './RecordDetail.svelte'
	import RecordEditForm from './RecordEditForm.svelte'
	import { openRecord } from './openRecord.svelte'
	import { panelKeyAction } from './panelKeys'
	import { panelPosition, stepRecord, type StepDirection } from './panelNavigation'
	import { PANEL_MIN_QUERY } from './openInPanel'
	import {
		parseRecordId,
		readEdit,
		readOpen,
		recordPath,
		relativeHref,
		withClosedPanel,
		withEdit,
		withOpen,
		type PanelResource
	} from './panelUrl'

	interface Props {
		resource: PanelResource
	}

	const { resource }: Props = $props()

	const resultSet = getResultSet()
	const wide = new MediaQuery(PANEL_MIN_QUERY)

	const openId = $derived(readOpen(page.url))
	const isOpen = $derived(openId !== null && wide.current)
	const role = $derived((page.data as { role?: number }).role ?? 0)

	// Keep the last record rendered while the panel slides closed
	let shownId = $state<string | null>(null)
	$effect(() => {
		if (openId) shownId = openId
	})

	const item = $derived(shownId ? resultSet?.items.find((i) => i.id === shownId) : undefined)
	const href = $derived(shownId ? (item?.href ?? recordPath(resource, shownId)) : null)
	const position = $derived(openId && resultSet ? panelPosition(resultSet, openId) : null)

	// Editing in the panel: editors, a generated form, and not a style shift
	const def = $derived(resourceDef(resource))
	const parsed = $derived(shownId ? parseRecordId(resource, shownId) : null)
	const canEdit = $derived(role >= EDITOR_ROLE)
	const editsInPanel = $derived(
		canEdit &&
			!!def?.record &&
			!!def.save?.update &&
			def.panelEdit !== false &&
			!!parsed &&
			!parsed.styleSwap
	)
	const editing = $derived(isOpen && editsInPanel && readEdit(page.url))
	let editForm = $state<RecordEditForm | undefined>(undefined)
	let saving = $state(false)

	// Tab stays put while stepping, so reviewing images of 40 weapons stays on Images
	let tab = $state<DetailTab>('info')
	let stepping = $state(false)
	let panelEl = $state<HTMLElement | undefined>(undefined)

	// Phones get the full page instead (also for shared ?open= links)
	$effect(() => {
		if (openId && !wide.current) {
			goto(localizeHref(recordPath(resource, openId)), { replaceState: true })
		}
	})

	// Move focus into the panel whenever a record opens from outside it (a row
	// click, even with the panel already open), so ↓/↑ step and Esc closes
	$effect(() => {
		if (!isOpen || !openId) return
		void tick().then(() => {
			if (panelEl && !panelEl.contains(document.activeElement)) {
				panelEl.focus({ preventScroll: true })
			}
		})
	})

	// Treat the open record like a visited page: breadcrumb and "Recently opened"
	$effect(() => {
		const title = item?.title
		if (!isOpen || !href || !title) {
			if (!isOpen) openRecord.set(null)
			return
		}
		openRecord.set({ path: href, title })
		const section = rootOf(sectionForUrl(new URL(href, page.url.origin)))
		// record() reads the list it writes: untracked, or this effect would loop
		if (section) {
			const entry = { path: localizeHref(href), title, sectionId: section.id }
			untrack(() => recentPages.record(entry))
		}
	})

	onDestroy(() => openRecord.set(null))

	async function step(direction: StepDirection) {
		if (!resultSet || !openId || stepping) return
		stepping = true
		try {
			const next = await stepRecord(resultSet, openId, direction)
			if (next) {
				await goto(relativeHref(withOpen(page.url, next.id)), {
					replaceState: true,
					noScroll: true,
					keepFocus: true,
					state: page.state
				})
			}
		} finally {
			stepping = false
		}
	}

	function close() {
		// Back returns to the entry the panel was opened from, but only while the
		// list hasn't paged or filtered since (the grid doesn't reload on Back)
		if (page.state.recordPanel === relativeHref(withClosedPanel(page.url))) {
			history.back()
		} else {
			goto(relativeHref(withClosedPanel(page.url)), {
				replaceState: true,
				noScroll: true,
				keepFocus: true
			})
		}
	}

	function edit() {
		if (!href || !canEdit) return
		if (!editsInPanel) {
			goto(localizeHref(`${href}/edit`))
			return
		}
		// A history entry of its own, so Back leaves the form (asking first if dirty)
		goto(relativeHref(withEdit(page.url, true)), {
			noScroll: true,
			keepFocus: true,
			state: page.state
		})
	}

	function stopEditing() {
		goto(relativeHref(withEdit(page.url, false)), {
			replaceState: true,
			noScroll: true,
			keepFocus: true,
			state: page.state
		})
	}

	function save() {
		void editForm?.save()
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!isOpen) return
		// Leave keys to an open dialog (e.g. a confirmation inside the detail body)
		if (document.querySelector('[role="dialog"][data-state="open"]')) return
		const action = panelKeyAction(event, {
			focusInPanel: !!panelEl && panelEl.contains(document.activeElement),
			editing
		})
		if (!action) return
		event.preventDefault()
		if (action === 'next' || action === 'prev') step(action)
		else if (action === 'close') close()
		else if (action === 'save') save()
		else if (action === 'cancel') stopEditing()
		else edit()
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<aside
	class="record-panel"
	class:open={isOpen}
	aria-label={m.db_panel_label()}
	aria-hidden={!isOpen}
	inert={!isOpen}
>
	<div class="panel-card" bind:this={panelEl} tabindex="-1">
		<header class="panel-header">
			<div class="stepper">
				<Tooltip content={m.db_panel_previous()}>
					<Button
						variant="ghost"
						size="small"
						iconOnly
						icon="chevron-up"
						aria-label={m.db_panel_previous()}
						disabled={!position?.hasPrev || stepping}
						onclick={() => step('prev')}
					/>
				</Tooltip>
				<Tooltip content={m.db_panel_next()}>
					<Button
						variant="ghost"
						size="small"
						iconOnly
						icon="chevron-down"
						aria-label={m.db_panel_next()}
						disabled={!position?.hasNext || stepping}
						onclick={() => step('next')}
					/>
				</Tooltip>
			</div>

			<div class="actions">
				{#if href}
					{#if editing}
						<Tooltip content={m.db_panel_cancel_edit()}>
							<Button variant="ghost" size="small" onclick={stopEditing}>
								{m.action_cancel()}
							</Button>
						</Tooltip>
						<Tooltip content={m.db_panel_save()}>
							<Button variant="primary" size="small" onclick={save} disabled={saving}>
								{saving ? m.action_saving() : m.action_save()}
							</Button>
						</Tooltip>
					{:else if canEdit}
						<Tooltip content={m.db_panel_edit()}>
							{#if editsInPanel}
								<Button variant="ghost" size="small" onclick={edit}>{m.action_edit()}</Button>
							{:else}
								<Button variant="ghost" size="small" href={localizeHref(`${href}/edit`)}>
									{m.action_edit()}
								</Button>
							{/if}
						</Tooltip>
					{/if}
					<Tooltip content={m.db_panel_open_full()}>
						<Button
							variant="ghost"
							size="small"
							iconOnly
							icon="expand"
							href={localizeHref(href)}
							aria-label={m.db_panel_open_full()}
						/>
					</Tooltip>
				{/if}
				<Tooltip content={m.db_panel_close()}>
					<Button
						variant="ghost"
						size="small"
						iconOnly
						icon="close"
						aria-label={m.db_panel_close()}
						onclick={close}
					/>
				</Tooltip>
			</div>
		</header>

		<div class="panel-body">
			{#if shownId && editing && def && parsed}
				<RecordEditForm
					bind:this={editForm}
					onSavingChange={(value) => (saving = value)}
					{def}
					id={parsed.routeId}
					onSaved={stopEditing}
				/>
			{:else if shownId}
				<RecordDetail {resource} id={shownId} {role} {tab} onTabChange={(t) => (tab = t)} />
			{/if}
		</div>
	</div>
</aside>

<style lang="scss">
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;

	// Large screens: a column beside the list (the list narrows as it opens)
	.record-panel {
		--record-panel-width: 440px;

		position: sticky;
		top: 0; // the scroll container's top padding already clears the fixed nav
		flex: 0 0 auto;
		align-self: flex-start;
		width: 0;
		height: calc(100vh - #{layout.$nav-height} - var(--bahamut-offset, 0px) - #{spacing.$unit-2x});
		opacity: 0;
		overflow: hidden;
		transition:
			width effects.$duration-slide ease-in-out,
			margin effects.$duration-slide ease-in-out,
			opacity effects.$duration-slide ease-in-out;

		&.open {
			width: var(--record-panel-width);
			margin-left: spacing.$unit-2x;
			opacity: 1;
		}

		// Below the sidebar breakpoint: cover the content
		@media (max-width: #{layout.$database-sidebar-breakpoint - 1px}) {
			position: fixed;
			inset: spacing.$unit-2x;
			width: auto;
			height: auto;
			z-index: effects.$z-popover;
			transform: translateX(calc(100% + #{spacing.$unit-2x}));
			transition:
				transform effects.$duration-slide ease-in-out,
				opacity effects.$duration-slide ease-in-out;

			&.open {
				width: auto;
				margin-left: 0;
				transform: translateX(0);
			}
		}

		// Phones open the full page instead
		@media (max-width: 768px) {
			display: none;
		}
	}

	.panel-card {
		display: flex;
		flex-direction: column;
		width: var(--record-panel-width);
		height: 100%;
		box-sizing: border-box;
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
		overflow: hidden;
		outline: none;

		@media (max-width: #{layout.$database-sidebar-breakpoint - 1px}) {
			width: 100%;
			box-shadow: var(--shadow-md);
		}
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit;
		padding: spacing.$unit-2x;
	}

	.stepper,
	.actions {
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
	}

	.panel-body {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	@media (prefers-reduced-motion: reduce) {
		.record-panel {
			transition: none;
		}
	}
</style>

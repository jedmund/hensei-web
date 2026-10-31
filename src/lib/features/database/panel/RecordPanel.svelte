<script lang="ts">
	/**
	 * Side panel that shows a database record next to its list (GBF-140).
	 *
	 * Mount it inside the component that provides the list's ResultSet
	 * (`setResultSet`). The open record is `?open=<id>`; j/k (and ↓/↑ with
	 * focus in the panel) step through the ResultSet, Esc closes, e edits.
	 * Open records with `openRecordInPanel()` so Back closes the panel.
	 */
	import { onDestroy, tick } from 'svelte'
	import { MediaQuery } from 'svelte/reactivity'
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { m } from '$lib/paraglide/messages'
	import Button from '$lib/components/ui/Button.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import type { DetailTab } from '$lib/features/database/detail/DetailScaffold.svelte'
	import { getResultSet } from '../resultSet.svelte'
	import { rootOf, sectionForUrl } from '../sections'
	import { recentPages } from '../recent.svelte'
	import RecordDetail from './RecordDetail.svelte'
	import { openRecord } from './openRecord.svelte'
	import { panelKeyAction } from './panelKeys'
	import { panelPosition, stepRecord, type StepDirection } from './panelNavigation'
	import { PANEL_MIN_QUERY } from './openInPanel'
	import { readOpen, recordPath, relativeHref, withOpen, type PanelResource } from './panelUrl'

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

	// Move focus into the panel when it opens, so ↓/↑ step and Esc closes
	let wasOpen = false
	$effect(() => {
		const open = isOpen
		if (open && !wasOpen) {
			tick().then(() => panelEl?.focus({ preventScroll: true }))
		}
		wasOpen = open
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
		if (section) recentPages.record({ path: localizeHref(href), title, sectionId: section.id })
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
		if (page.state.recordPanel) {
			history.back()
		} else {
			goto(relativeHref(withOpen(page.url, null)), {
				replaceState: true,
				noScroll: true,
				keepFocus: true
			})
		}
	}

	function edit() {
		if (href && role >= 7) goto(localizeHref(`${href}/edit`))
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!isOpen) return
		// Leave keys to an open dialog (e.g. a confirmation inside the detail body)
		if (document.querySelector('[role="dialog"][data-state="open"]')) return
		const action = panelKeyAction(event, {
			focusInPanel: !!panelEl && panelEl.contains(document.activeElement)
		})
		if (!action) return
		event.preventDefault()
		if (action === 'next' || action === 'prev') step(action)
		else if (action === 'close') close()
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
				{#if position}
					<span class="position" aria-live="polite">
						{#if position.index !== null}
							{m.db_panel_position({ index: position.index, count: position.count })}
						{:else}
							—
						{/if}
						{#if position.totalPages > 1}
							· {m.db_panel_page({ page: position.page, total: position.totalPages })}
						{/if}
					</span>
				{/if}
			</div>

			<div class="actions">
				{#if href}
					{#if role >= 7}
						<Tooltip content={m.db_panel_edit()}>
							<Button variant="ghost" size="small" href={localizeHref(`${href}/edit`)}>
								{m.action_edit()}
							</Button>
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
			{#if shownId}
				<RecordDetail {resource} id={shownId} {role} {tab} onTabChange={(t) => (tab = t)} />
			{/if}
		</div>
	</div>
</aside>

<style lang="scss">
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	// Large screens: a column beside the list (the list narrows as it opens)
	.record-panel {
		--record-panel-width: 440px;

		position: sticky;
		top: spacing.$unit-2x;
		flex: 0 0 auto;
		align-self: flex-start;
		width: 0;
		height: calc(100vh - #{spacing.$unit-4x});
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
		padding: spacing.$unit spacing.$unit-2x;
		border-bottom: 1px solid var(--border-subtle);
	}

	.stepper,
	.actions {
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
	}

	.position {
		margin-left: spacing.$unit;
		font-size: typography.$font-small;
		color: var(--text-secondary);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
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

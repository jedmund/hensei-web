<!--
  An ordered resource's list (`list.ordered`): every row in its stored order,
  reordered by drag or keyboard, with the record side panel. Provides the
  ResultSet the panel steps through with j/k, in display order.
-->
<script lang="ts">
	import { tick, untrack } from 'svelte'
	import { MediaQuery } from 'svelte/reactivity'
	import { page } from '$app/state'
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'
	import GripVertical from '@lucide/svelte/icons/grip-vertical'
	import * as m from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { adminKeys, adminQueries } from '$lib/api/queries/admin.queries'
	import { catalogueRowId, toResultItems } from '$lib/components/data-table/resultSync'
	import { encodeSort } from '$lib/components/data-table/urlState'
	import Button from '$lib/components/ui/Button.svelte'
	import EmptyState from '$lib/components/ui/EmptyState.svelte'
	import RecordPanel from '$lib/features/database/panel/RecordPanel.svelte'
	import {
		openInPanel,
		opensInPanel,
		PANEL_MIN_QUERY
	} from '$lib/features/database/panel/openInPanel'
	import { readOpen, recordPath, withOpen } from '$lib/features/database/panel/panelUrl'
	import { ResultSet, setResultSet } from '$lib/features/database/resultSet.svelte'
	import type { AdminListParams } from '$lib/types/api/admin'
	import { useDragReorder, type KeyboardReorderResult } from '$lib/utils/dragReorder.svelte'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { storeListUrl } from '$lib/utils/listNavigation'
	import { titleFor } from './columns'
	import type { ResourceName } from './names'
	import { RESOURCES } from './registry'

	// Admin list rows: catalogue rows carry a granblueId, the default row id;
	// other resources name theirs (`list.rowId`)
	type Row = { granblueId: string }

	interface Props {
		resource: ResourceName
	}

	const props: Props = $props()

	// Built once; a different resource is a different screen
	const name = untrack(() => props.resource)
	const def = RESOURCES[name]
	const list = def.list
	const ordered = list.ordered!

	const resultSet = setResultSet(new ResultSet())
	const queryClient = useQueryClient()

	const rowTitle = titleFor(def)
	const rowId: (row: Row) => string = list.rowId ?? catalogueRowId
	const rowHref = (row: Row) => recordPath(name, rowId(row))
	const Thumbnail = ordered.thumbnail

	// Every row on one page (the API's maximum), in stored order
	const params: AdminListParams = {
		page: 1,
		per: 200,
		sort: encodeSort(list.defaultSort),
		fields: [...new Set([...list.baseFields, ordered.field])].sort()
	}
	const listQuery = createQuery(() => adminQueries.list<Row>(name, params))

	// A dragged or keyed order shown before the server confirms it
	let pending = $state<Row[] | null>(null)
	const rows = $derived(pending ?? listQuery.data?.results ?? [])

	$effect(() => {
		const items = toResultItems(rows, { rowId, rowHref, rowTitle })
		untrack(() => {
			resultSet.items = items
			resultSet.page = 1
			resultSet.totalPages = 1
			resultSet.loadPage = null
		})
	})

	// --- Saving the order ---

	let saves = 0
	let queue: Promise<unknown> = Promise.resolve()

	/** Saves `next`, one save at a time; the list shows it until the last save settles */
	function commit(next: Row[]) {
		pending = next
		const save = ++saves
		queue = queue
			.then(() => ordered.reorder(next))
			.catch((error: unknown) => {
				toast.error(extractErrorMessage(error, m.db_ordered_reorder_failed()))
			})
			.then(async () => {
				if (save !== saves) return
				await Promise.all([
					queryClient.invalidateQueries({ queryKey: adminKeys.lists(name) }),
					...(ordered.invalidates?.() ?? []).map((queryKey) =>
						queryClient.invalidateQueries({ queryKey })
					)
				])
				if (save === saves && drag.grabbedIndex === null) pending = null
			})
	}

	const drag = useDragReorder<Row>({
		items: () => rows,
		onReorder: (next) => commit(next),
		onPreview: (next) => (pending = next)
	})

	// --- Keyboard ---

	let listEl = $state<HTMLOListElement>()
	let announcement = $state('')

	async function focusRow(index: number, selector: '.grip' | '.row-link') {
		await tick()
		const el = listEl?.children[index]?.querySelector<HTMLElement>(selector)
		el?.focus()
		el?.scrollIntoView({ block: 'nearest' })
	}

	function announce(result: KeyboardReorderResult) {
		const row = rows[result.index]
		if (!row) return
		const values = { name: rowTitle(row), position: result.index + 1, total: rows.length }
		announcement = {
			grab: m.db_ordered_grabbed,
			move: m.db_ordered_moved,
			drop: m.db_ordered_dropped,
			cancel: m.db_ordered_cancelled
		}[result.kind](values)
	}

	function handleGripKeydown(event: KeyboardEvent, index: number) {
		const result = drag.onKeydown(event, index)
		if (!result) return
		if (result.kind === 'cancel') pending = null
		announce(result)
		if (event.key !== 'Tab') void focusRow(result.index, '.grip')
	}

	// ↑/↓ move between rows, like the table; Alt+↑/↓ moves the row itself
	function handleRowKeydown(event: KeyboardEvent, index: number) {
		if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
		if (event.altKey) {
			const result = drag.onKeydown(event, index)
			if (!result) return
			announce(result)
			void focusRow(result.index, '.row-link')
			return
		}
		const to = event.key === 'ArrowDown' ? index + 1 : index - 1
		if (to < 0 || to >= rows.length) return
		event.preventDefault()
		void focusRow(to, '.row-link')
	}

	// --- Record panel ---

	const panelFits = new MediaQuery(PANEL_MIN_QUERY)
	const openId = $derived(readOpen(page.url))

	// Rows are links: ⌘/ctrl/shift/middle-click and phones follow them
	function handleRowActivate(row: Row, event: MouseEvent) {
		// Back from the full page returns to this list, without the panel
		storeListUrl(withOpen(page.url, null).href, name)
		if (!opensInPanel(event, panelFits.current)) return
		event.preventDefault()
		void openInPanel(page.url, rowId(row), page.state)
	}

	function subtitles(row: Row): string[] {
		return (ordered.subtitle?.(row) ?? []).filter((line): line is string => !!line)
	}
</script>

<div class="list-layout">
	<div class="ordered-list">
		<div class="controls">
			<h2 class="label">{list.label()}</h2>
			<p class="hint" id="{name}-order-hint">{m.db_ordered_hint()}</p>
		</div>

		{#if listQuery.error && rows.length === 0}
			<div class="error" role="alert">
				<span>{m.data_table_error()}</span>
				<Button variant="ghost" size="small" onclick={() => listQuery.refetch()}>
					{m.retry()}
				</Button>
			</div>
		{:else if listQuery.isPending}
			<p class="loading" role="status">{m.data_table_loading()}</p>
		{:else if rows.length === 0}
			<EmptyState message={list.empty()} />
		{:else}
			<ol class="rows" aria-label={list.label()} bind:this={listEl}>
				{#each rows as row, index (rowId(row))}
					{@const title = rowTitle(row)}
					<li
						class="row"
						class:inactive={ordered.inactive?.(row)}
						class:drop-target={drag.isDropTarget(index)}
						class:dragging={drag.dragIndex === index}
						class:grabbed={drag.grabbedIndex === index}
						aria-current={openId !== null && rowId(row) === openId ? 'true' : undefined}
						draggable="true"
						ondragstart={(e) => drag.onDragStart(e, index)}
						ondragover={(e) => drag.onDragOver(e, index)}
						ondragleave={drag.onDragLeave}
						ondrop={(e) => drag.onDrop(e, index)}
					>
						<button
							type="button"
							class="grip"
							aria-label={m.db_ordered_move({ name: title })}
							aria-describedby="{name}-order-hint"
							aria-pressed={drag.grabbedIndex === index}
							onkeydown={(e) => handleGripKeydown(e, index)}
						>
							<GripVertical size={16} aria-hidden="true" />
						</button>
						<a
							class="row-link"
							href={localizeHref(rowHref(row))}
							onclick={(event) => handleRowActivate(row, event)}
							onkeydown={(event) => handleRowKeydown(event, index)}
						>
							{#if Thumbnail}
								<span class="thumbnail"><Thumbnail {row} /></span>
							{/if}
							<span class="names">
								<span class="title">{title}</span>
								{#each subtitles(row) as line, i (i)}
									<span class="subtitle">{line}</span>
								{/each}
							</span>
						</a>
						{#if ordered.inactive?.(row)}
							<span class="badge">{m.db_ordered_inactive()}</span>
						{/if}
					</li>
				{/each}
			</ol>
		{/if}
		<p class="visually-hidden" aria-live="assertive">{announcement}</p>
	</div>

	<RecordPanel resource={name} />
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/database' as database;

	.list-layout {
		display: flex;
		align-items: flex-start;
		width: 100%;
	}

	.ordered-list {
		flex: 1;
		min-width: 0;
		background: var(--card-bg);
		border: 0.5px solid var(--border-subtle);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
		overflow: hidden;
	}

	.controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit-2x;
		padding: spacing.$unit spacing.$unit-2x;
		border-bottom: 1px solid var(--border-medium);
	}

	.label {
		margin: 0;
		font-size: typography.$font-regular;
		font-weight: typography.$bold;
		color: var(--text-primary);
	}

	.hint {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}

	.error {
		@include database.error-banner;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit;
	}

	.loading {
		margin: 0;
		padding: spacing.$unit-4x;
		text-align: center;
		color: var(--text-secondary);
	}

	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.row {
		// Containing block for the stretched row link
		position: relative;
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		min-height: calc(spacing.$unit * 7);
		padding: 0 spacing.$unit-2x 0 spacing.$unit;
		border-bottom: 1px solid var(--border-subtle);
		background: var(--card-bg);
		cursor: grab;

		&:last-child {
			border-bottom: none;
		}

		&:hover,
		&[aria-current] {
			background: var(--table-row-hover);
		}

		// The row open in the panel: the user's element, like the table
		&[aria-current] {
			box-shadow: inset 3px 0 0 var(--database-accent, var(--text-primary));
		}

		&:has(.row-link:focus-visible) {
			outline: 2px solid var(--accent-blue);
			outline-offset: -2px;
		}

		&.drop-target {
			box-shadow: inset 0 2px 0 var(--accent-blue);
		}

		&.dragging {
			opacity: 0.5;
		}

		&.grabbed {
			background: var(--table-row-hover);
			outline: 2px dashed var(--accent-blue);
			outline-offset: -2px;
		}

		&.inactive .row-link {
			opacity: 0.5;
		}
	}

	.grip {
		position: relative;
		z-index: 2;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: spacing.$unit-half;
		border: none;
		border-radius: layout.$item-corner-small;
		background: none;
		color: var(--text-tertiary);
		cursor: grab;

		&:hover,
		&[aria-pressed='true'] {
			color: var(--text-primary);
		}

		&:focus-visible {
			outline: 2px solid var(--accent-blue);
			outline-offset: 1px;
		}
	}

	.row-link {
		display: flex;
		align-items: center;
		gap: spacing.$unit-2x;
		flex: 1;
		min-width: 0;
		padding: spacing.$unit 0;
		color: inherit;
		text-decoration: none;
		outline: none;
	}

	.thumbnail {
		display: inline-flex;
		flex-shrink: 0;
	}

	.names {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-fourth;
		min-width: 0;
	}

	.title {
		font-weight: typography.$medium;
		color: var(--text-primary);
	}

	.subtitle {
		font-size: typography.$font-small;
		color: var(--text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.badge {
		flex-shrink: 0;
		padding: spacing.$unit-fourth spacing.$unit;
		border-radius: layout.$item-corner-small;
		background: var(--bar-bg);
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
</style>

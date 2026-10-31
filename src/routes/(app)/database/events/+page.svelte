<script lang="ts">
	import { goto } from '$app/navigation'
	import { untrack } from 'svelte'
	import { createQuery } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'

	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import ElementBadge from '$lib/components/ui/ElementBadge.svelte'

	import { eventQueries } from '$lib/api/queries/event.queries'
	import { useRunEventSync } from '$lib/api/mutations/event.mutations'
	import { eventKindLabel, eventStatusLabel } from '$lib/utils/eventLabels'
	import { formatJstDateTime } from '$lib/utils/jstDateTime'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { localizedName } from '$lib/utils/locale'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { isEditor } from '$lib/auth/roles'

	import type { EventStatus, GameEvent } from '$lib/types/api/event'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	// Curators can read events but not review or create them
	const canEdit = $derived(isEditor(data.role))

	let status = $state<EventStatus | 'all'>(untrack(() => data.status))

	const eventsQuery = createQuery(() => ({
		...eventQueries.list({ status }),
		initialData: status === data.status ? data.events : undefined
	}))

	const events = $derived(
		[...(eventsQuery.data ?? [])].sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt))
	)

	const syncMut = useRunEventSync()

	function runSync() {
		syncMut.mutate(undefined, {
			onSuccess: () => toast.success(m.db_events_sync_queued()),
			onError: (err) => toast.error(extractErrorMessage(err, m.db_events_sync_failed()))
		})
	}

	function open(event: GameEvent) {
		goto(localizeHref(`/database/events/${event.id}`))
	}
</script>

<PageMeta title={m.page_title_db_events()} description={m.page_desc_home()} />

<div class="page">
	<DatabasePageHeader title={m.nav_events()}>
		{#snippet leftAction()}
			<SegmentedControl
				value={status}
				onValueChange={(v) => (status = v as EventStatus | 'all')}
				size="xsmall"
				variant="background"
			>
				<Segment value="draft">{eventStatusLabel('draft')}</Segment>
				<Segment value="approved">{eventStatusLabel('approved')}</Segment>
				<Segment value="hidden">{eventStatusLabel('hidden')}</Segment>
				<Segment value="all">{m.db_events_status_all()}</Segment>
			</SegmentedControl>
		{/snippet}
		{#snippet rightAction()}
			{#if canEdit}
				<Button variant="secondary" size="small" onclick={runSync} disabled={syncMut.isPending}>
					{m.db_events_run_sync()}
				</Button>
				<Button variant="primary" size="small" href={localizeHref('/database/events/new')}>
					{m.db_events_new()}
				</Button>
			{/if}
		{/snippet}
	</DatabasePageHeader>

	<div class="table-wrapper" class:loading={eventsQuery.isFetching}>
		<table class="events-table">
			<thead>
				<tr>
					<th>{m.db_events_col_name()}</th>
					<th>{m.db_events_col_kind()}</th>
					<th>{m.db_events_col_element()}</th>
					<th>{m.db_events_col_dates()}</th>
					<th>{m.db_events_col_raids()}</th>
					<th>{m.db_events_col_status()}</th>
				</tr>
			</thead>
			<tbody>
				{#if events.length === 0 && !eventsQuery.isLoading}
					<tr>
						<td colspan="6" class="empty-state">{m.db_events_empty()}</td>
					</tr>
				{:else}
					{#each events as event (event.id)}
						<tr class="clickable" onclick={() => open(event)}>
							<td>
								<a class="name" href={localizeHref(`/database/events/${event.id}`)}>
									{localizedName(event.name)}
								</a>
							</td>
							<td>{eventKindLabel(event.kind)}</td>
							<td>
								{#if event.element}
									<ElementBadge element={event.element} />
								{/if}
							</td>
							<td class="dates">
								{formatJstDateTime(event.startsAt)} – {formatJstDateTime(event.endsAt)} JST
							</td>
							<td>{event.raids?.length ?? 0}</td>
							<td>{eventStatusLabel(event.status)}</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;

	.page {
		background: var(--card-bg);
		border-radius: layout.$page-corner;
		box-shadow: var(--shadow-sm);
		overflow: hidden;
	}

	.table-wrapper {
		overflow-x: auto;

		&.loading {
			opacity: 0.6;
		}
	}

	.events-table {
		width: 100%;
		border-collapse: collapse;

		th,
		td {
			padding: spacing.$unit spacing.$unit-2x;
			text-align: left;
			border-bottom: 1px solid var(--table-border);
		}

		th {
			background: var(--table-header-bg);
			font-weight: typography.$bold;
			color: var(--text-secondary);
			font-size: typography.$font-small;
		}

		tr.clickable {
			cursor: pointer;

			&:hover {
				background: var(--table-row-hover);
			}
		}
	}

	.name {
		color: var(--text-primary);
		font-weight: typography.$medium;
		text-decoration: none;
	}

	.dates {
		font-size: typography.$font-small;
		color: var(--text-secondary);
		white-space: nowrap;
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		padding: spacing.$unit-4x !important;
	}
</style>

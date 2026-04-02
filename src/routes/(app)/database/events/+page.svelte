<script lang="ts">
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import { goto } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'
	import { eventAdapter } from '$lib/api/adapters/event.adapter'
	import Button from '$lib/components/ui/Button.svelte'
	import { formatDateJST } from '$lib/utils/date'
	import { getElementLabel } from '$lib/utils/element'
	import { getEventTypeLabel, getEventStatusLabel } from '$lib/utils/event'
	import ElementBadge from '$lib/components/ui/ElementBadge.svelte'
	import type { GameEvent } from '$lib/types/api/event'
	import type { PageData } from './$types'

	interface Props {
		data: PageData
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let { data }: Props = $props()

	let searchTerm = $state('')

	const eventsQuery = createQuery(() => ({
		queryKey: ['events', 'admin'],
		queryFn: () => eventAdapter.getEvents(),
		staleTime: 1000 * 60 * 5
	}))

	const filteredEvents = $derived.by(() => {
		const events = eventsQuery.data ?? []
		if (!searchTerm.trim()) return events

		const term = searchTerm.toLowerCase()
		return events.filter(
			(e) =>
				e.name.toLowerCase().includes(term) ||
				getEventTypeLabel(e.eventType).toLowerCase().includes(term) ||
				getElementLabel(e.element ?? undefined)
					.toLowerCase()
					.includes(term)
		)
	})

	function handleRowClick(event: GameEvent) {
		goto(`/database/events/${event.id}`)
	}
</script>

<PageMeta title={m.events_title()} description={m.page_desc_home()} />

<div class="page">
	<div class="grid">
		<div class="controls">
			<input type="text" placeholder={m.events_title()} bind:value={searchTerm} />
			<div class="controls-right">
				<Button variant="primary" size="small" onclick={() => goto('/database/events/new')}>
					{m.events_new()}
				</Button>
			</div>
		</div>

		<div class="grid-wrapper" class:loading={eventsQuery.isLoading}>
			{#if eventsQuery.isLoading}
				<div class="loading-overlay">
					<div class="loading-spinner">Loading...</div>
				</div>
			{/if}

			<table class="events-table">
				<thead>
					<tr>
						<th class="col-name">{m.events_name()}</th>
						<th class="col-type">{m.events_type()}</th>
						<th class="col-element">{m.events_element()}</th>
						<th class="col-dates">{m.events_start_time()}</th>
						<th class="col-dates">{m.events_end_time()}</th>
						<th class="col-status">{m.events_status()}</th>
					</tr>
				</thead>
				<tbody>
					{#if filteredEvents.length === 0 && !eventsQuery.isLoading}
						<tr>
							<td colspan="6" class="empty-state">
								{searchTerm ? m.events_no_events() : m.events_no_events()}
							</td>
						</tr>
					{:else}
						{#each filteredEvents as event (event.id)}
							<tr onclick={() => handleRowClick(event)} class="clickable">
								<td class="col-name">
									<span class="event-name">{event.name}</span>
								</td>
								<td class="col-type">
									<span class="event-type">{getEventTypeLabel(event.eventType)}</span>
								</td>
								<td class="col-element">
									{#if event.element != null}
										<ElementBadge element={event.element} />
									{/if}
								</td>
								<td class="col-dates">
									<span class="dates">{formatDateJST(event.startTime)}</span>
								</td>
								<td class="col-dates">
									<span class="dates">{formatDateJST(event.endTime)}</span>
								</td>
								<td class="col-status">
									<span class="status-badge {event.status}">
										{getEventStatusLabel(event.status)}
									</span>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<div class="grid-footer">
			<div class="pagination-info">
				{filteredEvents.length} event{filteredEvents.length === 1 ? '' : 's'}
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.page {
		padding: 0;
		margin: 0 auto;
	}

	.grid {
		width: 100%;
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
		overflow: hidden;
	}

	.controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit;
		border-bottom: 1px solid var(--table-border);
		gap: spacing.$unit;

		input {
			padding: spacing.$unit spacing.$unit-2x;
			background: var(--input-bound-bg);
			border: none;
			border-radius: layout.$item-corner;
			font-size: typography.$font-medium;
			color: var(--text-primary);
			width: 100%;
			max-width: 300px;

			&:hover {
				background: var(--input-bound-bg-hover);
			}

			&:focus {
				outline: none;
			}
		}

		.controls-right {
			display: flex;
			align-items: center;
			gap: spacing.$unit;
		}
	}

	.grid-wrapper {
		position: relative;
		overflow-x: auto;
		min-height: 200px;

		&.loading {
			opacity: 0.6;
		}
	}

	.loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(var(--background-rgb), 0.9);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: effects.$z-sticky;

		.loading-spinner {
			font-size: typography.$font-medium;
			color: var(--text-secondary);
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

		.col-name {
			min-width: 200px;
		}

		.col-type {
			width: 150px;
		}

		.col-element {
			width: 100px;
		}

		.col-dates {
			width: 150px;
		}

		.col-status {
			width: 100px;
		}
	}

	.event-name {
		font-weight: typography.$bold;
		color: var(--text-primary);
	}

	.event-type {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.dates {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.status-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-small;
		font-weight: typography.$medium;

		&.current {
			background: var(--color-green-light, #dcfce7);
			color: var(--color-green-dark, #166534);
		}

		&.upcoming {
			background: var(--color-blue-light, #dbeafe);
			color: var(--color-blue-dark, #1e40af);
		}

		&.past {
			background: var(--button-contained-bg-hover, rgba(0, 0, 0, 0.04));
			color: var(--text-tertiary);
		}
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		padding: spacing.$unit-4x !important;
	}

	.grid-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit;
		border-top: 1px solid var(--table-border);
		background: var(--table-header-bg);

		.pagination-info {
			font-size: typography.$font-small;
			color: var(--text-secondary);
		}
	}
</style>

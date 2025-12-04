<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import { createQuery } from '@tanstack/svelte-query'
	import { gwAdapter } from '$lib/api/adapters/gw.adapter'
	import Button from '$lib/components/ui/Button.svelte'
	import type { GwEvent } from '$lib/types/api/gw'
	import type { PageData } from './$types'

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

	// State
	let searchTerm = $state('')

	// Query for GW events
	const eventsQuery = createQuery(() => ({
		queryKey: ['gw', 'events', 'admin'],
		queryFn: () => gwAdapter.getEvents(),
		staleTime: 1000 * 60 * 5
	}))

	// Element labels (matches GranblueEnums::ELEMENTS)
	const elementLabels: Record<number, string> = {
		0: 'Null',
		1: 'Wind',
		2: 'Fire',
		3: 'Water',
		4: 'Earth',
		5: 'Dark',
		6: 'Light'
	}

	// Element colors for badges
	const elementColors: Record<number, string> = {
		0: 'null',
		1: 'wind',
		2: 'fire',
		3: 'water',
		4: 'earth',
		5: 'dark',
		6: 'light'
	}

	// Filter events by search
	const filteredEvents = $derived.by(() => {
		const events = eventsQuery.data ?? []
		if (!searchTerm.trim()) return events

		const term = searchTerm.toLowerCase()
		return events.filter(
			(e) =>
				String(e.eventNumber).includes(term) ||
				elementLabels[e.element]?.toLowerCase().includes(term)
		)
	})

	// Format date for display
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})
	}

	// Navigate to event detail/edit
	function handleRowClick(event: GwEvent) {
		goto(`/database/gw-events/${event.id}`)
	}
</script>

<div class="page">
	<div class="grid">
		<div class="controls">
			<input type="text" placeholder="Search events..." bind:value={searchTerm} />
			<div class="controls-right">
				<Button variant="primary" size="small" onclick={() => goto('/database/gw-events/new')}>
					New Event
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
						<th class="col-number">#</th>
						<th class="col-element">Element</th>
						<th class="col-dates">Dates</th>
					</tr>
				</thead>
				<tbody>
					{#if filteredEvents.length === 0 && !eventsQuery.isLoading}
						<tr>
							<td colspan="3" class="empty-state">
								{searchTerm ? 'No events match your search' : 'No GW events yet'}
							</td>
						</tr>
					{:else}
						{#each filteredEvents as event}
							<tr onclick={() => handleRowClick(event)} class="clickable">
								<td class="col-number">
									<span class="event-number">{event.eventNumber}</span>
								</td>
								<td class="col-element">
									<span class="element-badge element-{elementColors[event.element]}">
										{elementLabels[event.element] ?? 'Unknown'}
									</span>
								</td>
								<td class="col-dates">
									<span class="dates">
										{formatDate(event.startDate)} - {formatDate(event.endDate)}
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
		padding: spacing.$unit-2x 0;
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
		border-bottom: 1px solid #e5e5e5;
		gap: spacing.$unit;

		input {
			padding: spacing.$unit spacing.$unit-2x;
			background: var(--input-bound-bg);
			border: none;
			border-radius: layout.$item-corner;
			font-size: typography.$font-medium;
			width: 100%;
			max-width: 300px;

			&:hover {
				background: var(--input-bound-bg-hover);
			}

			&:focus {
				outline: none;
				border-color: #007bff;
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
		background: rgba(255, 255, 255, 0.9);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;

		.loading-spinner {
			font-size: typography.$font-medium;
			color: #666;
		}
	}

	.events-table {
		width: 100%;
		border-collapse: collapse;

		th,
		td {
			padding: spacing.$unit spacing.$unit-2x;
			text-align: left;
			border-bottom: 1px solid #e5e5e5;
		}

		th {
			background: #f8f9fa;
			font-weight: typography.$bold;
			color: #495057;
			font-size: typography.$font-small;
		}

		tr.clickable {
			cursor: pointer;

			&:hover {
				background: #f8f9fa;
			}
		}

		.col-number {
			width: 80px;
		}

		.col-element {
			width: 120px;
		}

		.col-dates {
			min-width: 200px;
		}
	}

	.event-number {
		font-weight: typography.$bold;
		color: #666;
	}

	.element-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 4px;
		font-size: typography.$font-small;
		font-weight: 500;

		&.element-fire {
			background: #fee2e2;
			color: #dc2626;
		}

		&.element-water {
			background: #dbeafe;
			color: #2563eb;
		}

		&.element-earth {
			background: #fef3c7;
			color: #d97706;
		}

		&.element-wind {
			background: #d1fae5;
			color: #059669;
		}

		&.element-light {
			background: #fef9c3;
			color: #ca8a04;
		}

		&.element-dark {
			background: #ede9fe;
			color: #7c3aed;
		}
	}

	.dates {
		font-size: typography.$font-small;
		color: #666;
	}

	.empty-state {
		text-align: center;
		color: #666;
		padding: spacing.$unit-4x !important;
	}

	.grid-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit;
		border-top: 1px solid #e5e5e5;
		background: #f8f9fa;

		.pagination-info {
			font-size: typography.$font-small;
			color: #6c757d;
		}
	}
</style>

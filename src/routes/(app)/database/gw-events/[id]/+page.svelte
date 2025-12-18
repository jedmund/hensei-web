<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { createQuery } from '@tanstack/svelte-query'
	import { gwAdapter } from '$lib/api/adapters/gw.adapter'
	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import SidebarHeader from '$lib/components/ui/SidebarHeader.svelte'
	import { formatDateJST, formatDateLongJST } from '$lib/utils/date'
	import type { PageData } from './$types'

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

	// Get event ID from URL
	const eventId = $derived($page.params.id)

	// Query for event data
	const eventQuery = createQuery(() => ({
		queryKey: ['gw', 'events', eventId],
		queryFn: () => gwAdapter.getEvent(eventId ?? ''),
		enabled: !!eventId
	}))

	const event = $derived(eventQuery.data)
	const userRole = $derived(data.role || 0)
	const canEdit = $derived(userRole >= 7)

	// Element labels and colors (matches GranblueEnums::ELEMENTS)
	const elementLabels: Record<number, string> = {
		0: 'Null',
		1: 'Wind',
		2: 'Fire',
		3: 'Water',
		4: 'Earth',
		5: 'Dark',
		6: 'Light'
	}

	const elementColors: Record<number, string> = {
		0: 'null',
		1: 'wind',
		2: 'fire',
		3: 'water',
		4: 'earth',
		5: 'dark',
		6: 'light'
	}

	// Navigate to edit
	function handleEdit() {
		goto(`/database/gw-events/${eventId}/edit`)
	}

	// Navigate back
	function handleBack() {
		goto('/database/gw-events')
	}
</script>

<div class="page">
	{#if eventQuery.isLoading}
		<div class="loading-state">
			<p>Loading event...</p>
		</div>
	{:else if eventQuery.isError}
		<div class="error-state">
			<p>Failed to load event</p>
			<Button variant="secondary" onclick={handleBack}>Back to Events</Button>
		</div>
	{:else if event}
		<SidebarHeader title={`GW #${event.eventNumber}`}>
			{#snippet leftAccessory()}
				<Button variant="secondary" size="small" onclick={handleBack}>Back</Button>
			{/snippet}
			{#snippet rightAccessory()}
				{#if canEdit}
					<Button variant="primary" size="small" onclick={handleEdit}>Edit</Button>
				{/if}
			{/snippet}
		</SidebarHeader>

		<section class="details">
			<DetailsContainer title="Event Details">
				<DetailItem label="Event Number" value={`#${event.eventNumber}`} />
				<DetailItem label="Element">
					<span class="element-badge element-{elementColors[event.element]}">
						{elementLabels[event.element] ?? 'Unknown'}
					</span>
				</DetailItem>
				<DetailItem label="Start Date" value={formatDateLongJST(event.startDate)} />
				<DetailItem label="End Date" value={formatDateLongJST(event.endDate)} />
			</DetailsContainer>

			{#if event.createdAt}
				<DetailsContainer title="Metadata">
					<DetailItem label="Created" value={formatDateJST(event.createdAt)} />
					{#if event.updatedAt}
						<DetailItem label="Updated" value={formatDateJST(event.updatedAt)} />
					{/if}
				</DetailsContainer>
			{/if}
		</section>
	{:else}
		<div class="not-found">
			<h2>Event Not Found</h2>
			<p>The event you're looking for could not be found.</p>
			<Button variant="secondary" onclick={handleBack}>Back to Events</Button>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.page {
		background: white;
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
	}

	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		min-height: 200px;
		gap: spacing.$unit-2x;
		color: var(--text-secondary);
	}

	.not-found {
		text-align: center;
		padding: spacing.$unit-4x;

		h2 {
			margin-bottom: spacing.$unit;
		}

		p {
			color: var(--text-secondary);
			margin-bottom: spacing.$unit-2x;
		}
	}

	.details {
		display: flex;
		flex-direction: column;
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
</style>

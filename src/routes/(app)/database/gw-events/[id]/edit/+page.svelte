
<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { gwAdapter } from '$lib/api/adapters/gw.adapter'
	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import SidebarHeader from '$lib/components/ui/SidebarHeader.svelte'
	import type { PageData } from './$types'

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

	const queryClient = useQueryClient()

	// Get event ID from URL
	const eventId = $derived($page.params.id)

	// Query for event data
	const eventQuery = createQuery(() => ({
		queryKey: ['gw', 'events', eventId],
		queryFn: () => gwAdapter.getEvent(eventId ?? ''),
		enabled: !!eventId
	}))

	const event = $derived(eventQuery.data)

	// Save state
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	// Edit data state
	let editData = $state({
		eventNumber: 0,
		element: 0,
		startDate: '',
		endDate: ''
	})

	// Sync edit data when event changes
	$effect(() => {
		if (event) {
			editData = {
				eventNumber: event.eventNumber,
				element: event.element,
				startDate: event.startDate,
				endDate: event.endDate
			}
		}
	})

	// Element options (matches GranblueEnums::ELEMENTS, excluding Null)
	const elementOptions = [
		{ value: 1, label: 'Wind' },
		{ value: 2, label: 'Fire' },
		{ value: 3, label: 'Water' },
		{ value: 4, label: 'Earth' },
		{ value: 5, label: 'Dark' },
		{ value: 6, label: 'Light' }
	]

	// Validation
	const canSave = $derived(
		editData.eventNumber > 0 && editData.startDate !== '' && editData.endDate !== ''
	)

	// Save changes
	async function handleSave() {
		if (!canSave || !event) return

		isSaving = true
		saveError = null

		try {
			await gwAdapter.updateEvent(event.id, {
				eventNumber: editData.eventNumber,
				element: editData.element,
				startDate: editData.startDate,
				endDate: editData.endDate
			})

			// Invalidate queries
			await queryClient.invalidateQueries({ queryKey: ['gw', 'events'] })

			// Navigate back to detail page
			goto(`/database/gw-events/${eventId}`)
		} catch (error: any) {
			saveError = error.message || 'Failed to save event'
		} finally {
			isSaving = false
		}
	}

	// Cancel and go back
	function handleCancel() {
		goto(`/database/gw-events/${eventId}`)
	}
</script>

<div class="page">
	{#if eventQuery.isLoading}
		<div class="loading-state">
			<p>Loading event...</p>
		</div>
	{:else if event}
		<SidebarHeader title="Edit Event">
			{#snippet leftAccessory()}
				<Button variant="secondary" size="small" onclick={handleCancel}>Cancel</Button>
			{/snippet}
			{#snippet rightAccessory()}
				<Button variant="primary" size="small" onclick={handleSave} disabled={!canSave || isSaving}>
					{isSaving ? 'Saving...' : 'Save'}
				</Button>
			{/snippet}
		</SidebarHeader>

		{#if saveError}
			<div class="error-banner">{saveError}</div>
		{/if}

		<section class="details">
			<DetailsContainer title="Event Details">
				<DetailItem
					label="Event Number"
					bind:value={editData.eventNumber}
					editable={true}
					type="number"
				/>
				<DetailItem
					label="Element"
					bind:value={editData.element}
					editable={true}
					type="select"
					options={elementOptions}
				/>
				<DetailItem
					label="Start Date"
					bind:value={editData.startDate}
					editable={true}
					type="text"
					placeholder="YYYY-MM-DD"
				/>
				<DetailItem
					label="End Date"
					bind:value={editData.endDate}
					editable={true}
					type="text"
					placeholder="YYYY-MM-DD"
				/>
			</DetailsContainer>
		</section>
	{:else}
		<div class="not-found">
			<h2>Event Not Found</h2>
			<p>The event you're looking for could not be found.</p>
			<Button variant="secondary" onclick={() => goto('/database/gw-events')}>
				Back to Events
			</Button>
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
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
	}

	.loading-state {
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

	.error-banner {
		color: var(--danger);
		font-size: typography.$font-small;
		padding: spacing.$unit-2x;
		background: var(--danger-bg);
	}

	.details {
		display: flex;
		flex-direction: column;
	}
</style>

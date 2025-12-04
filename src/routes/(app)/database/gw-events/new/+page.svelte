<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import { useQueryClient } from '@tanstack/svelte-query'
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

	// Save state
	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	// Edit data state
	let editData = $state({
		eventNumber: 0,
		element: 2, // Fire
		startDate: '',
		endDate: ''
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

	// Create event
	async function handleSave() {
		if (!canSave) return

		isSaving = true
		saveError = null

		try {
			const newEvent = await gwAdapter.createEvent({
				eventNumber: editData.eventNumber,
				element: editData.element,
				startDate: editData.startDate,
				endDate: editData.endDate
			})

			// Invalidate queries
			await queryClient.invalidateQueries({ queryKey: ['gw', 'events'] })

			// Navigate to the new event's detail page
			goto(`/database/gw-events/${newEvent.id}`)
		} catch (error: any) {
			saveError = error.message || 'Failed to create event'
		} finally {
			isSaving = false
		}
	}

	// Cancel and go back
	function handleCancel() {
		goto('/database/gw-events')
	}
</script>

<div class="page">
	<SidebarHeader title="New Event">
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
				label="Event number"
				bind:value={editData.eventNumber}
				editable={true}
				type="number"
			/>
			<DetailItem
				label="Element advantage"
				bind:value={editData.element}
				editable={true}
				type="select"
				options={elementOptions}
			/>
			<DetailItem
				label="Start date"
				bind:value={editData.startDate}
				editable={true}
				type="text"
				placeholder="YYYY-MM-DD"
			/>
			<DetailItem
				label="End date"
				bind:value={editData.endDate}
				editable={true}
				type="text"
				placeholder="YYYY-MM-DD"
			/>
		</DetailsContainer>
	</section>
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.page {
		background: white;
		border-radius: layout.$card-corner;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.error-banner {
		color: colors.$error;
		font-size: typography.$font-small;
		padding: spacing.$unit-2x;
		background: colors.$error--bg--light;
	}

	.details {
		display: flex;
		flex-direction: column;
	}
</style>

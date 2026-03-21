
<script lang="ts">
	import { goto } from '$app/navigation'
	import { useQueryClient } from '@tanstack/svelte-query'
	import { gwAdapter } from '$lib/api/adapters/gw.adapter'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import DatabaseFormHeader from '$lib/components/database/DatabaseFormHeader.svelte'
	import ElementPicker from '$lib/components/ui/element-picker/ElementPicker.svelte'
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
	<DatabaseFormHeader title="New Event" onCancel={handleCancel} onSave={handleSave} {isSaving} disabled={!canSave} />

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
				editable={true}
			>
				<ElementPicker
					bind:value={editData.element}
					mode="dropdown"
					contained
				/>
			</DetailItem>
			<DetailItem label="Start date" bind:value={editData.startDate} editable={true} type="date" />
			<DetailItem label="End date" bind:value={editData.endDate} editable={true} type="date" />
		</DetailsContainer>
	</section>
</div>

<style lang="scss">
	@use '$src/themes/database' as database;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;

	.page {
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
	}

	.error-banner {
		@include database.error-banner;
	}

	.details {
		@include database.details;
	}
</style>

<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { eventAdapter } from '$lib/api/adapters/event.adapter'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import DatabaseFormHeader from '$lib/components/database/DatabaseFormHeader.svelte'
	import ElementPicker from '$lib/components/ui/element-picker/ElementPicker.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import { getEventTypeOptions } from '$lib/utils/event'
	import type { PageData } from './$types'

	interface Props {
		data: PageData
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let { data }: Props = $props()

	const queryClient = useQueryClient()
	const eventId = $derived($page.params.id)

	const eventQuery = createQuery(() => ({
		queryKey: ['events', eventId],
		queryFn: () => eventAdapter.getEvent(eventId ?? ''),
		enabled: !!eventId
	}))

	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	let editData = $state({
		name: '',
		eventType: '',
		element: 0,
		startTime: '',
		endTime: ''
	})

	let initialized = $state(false)

	$effect(() => {
		if (eventQuery.data && !initialized) {
			const event = eventQuery.data
			editData = {
				name: event.name,
				eventType: event.eventType,
				element: event.element ?? 0,
				startTime: event.startTime,
				endTime: event.endTime
			}
			initialized = true
		}
	})

	const canSave = $derived(
		editData.name !== '' &&
			editData.eventType !== '' &&
			editData.startTime !== '' &&
			editData.endTime !== ''
	)

	async function handleSave() {
		if (!canSave) return

		isSaving = true
		saveError = null

		try {
			await eventAdapter.updateEvent(eventId ?? '', {
				name: editData.name,
				event_type: editData.eventType,
				start_time: editData.startTime,
				end_time: editData.endTime,
				element: editData.element === 0 ? null : editData.element
			})

			await queryClient.invalidateQueries({ queryKey: ['events'] })
			goto(localizeHref(`/database/events/${eventId}`))
		} catch (error: unknown) {
			saveError = error instanceof Error ? error.message : 'Failed to update event'
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		goto(localizeHref(`/database/events/${eventId}`))
	}
</script>

<div class="page">
	<DatabaseFormHeader
		title={m.events_edit()}
		onCancel={handleCancel}
		onSave={handleSave}
		{isSaving}
		disabled={!canSave}
	/>

	{#if saveError}
		<div class="error-banner">{saveError}</div>
	{/if}

	<section class="details">
		<DetailsContainer title={m.events_title()}>
			<DetailItem label={m.events_name()} bind:value={editData.name} editable={true} />
			<DetailItem label={m.events_type()} editable={true}>
				<Select
					bind:value={editData.eventType}
					options={getEventTypeOptions()}
					placeholder={m.events_type()}
					contained
					portal
				/>
			</DetailItem>
			<DetailItem label={m.events_element()} editable={true}>
				<ElementPicker bind:value={editData.element} mode="dropdown" contained />
			</DetailItem>
			<DetailItem
				label={m.events_start_time()}
				bind:value={editData.startTime}
				editable={true}
				type="text"
				placeholder="YYYY-MM-DD HH:MM"
			/>
			<DetailItem
				label={m.events_end_time()}
				bind:value={editData.endTime}
				editable={true}
				type="text"
				placeholder="YYYY-MM-DD HH:MM"
			/>
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

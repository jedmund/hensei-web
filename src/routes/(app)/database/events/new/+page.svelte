<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { goto } from '$app/navigation'
	import { useQueryClient } from '@tanstack/svelte-query'
	import { eventAdapter } from '$lib/api/adapters/event.adapter'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import DatabaseFormHeader from '$lib/components/database/DatabaseFormHeader.svelte'
	import ElementPicker from '$lib/components/ui/element-picker/ElementPicker.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import DatePicker from '$lib/components/ui/DatePicker.svelte'
	import TimePicker from '$lib/components/ui/TimePicker.svelte'
	import { getEventTypeOptions } from '$lib/utils/event'
	import type { PageData } from './$types'

	interface Props {
		data: PageData
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let { data }: Props = $props()

	const queryClient = useQueryClient()

	let isSaving = $state(false)
	let saveError = $state<string | null>(null)

	let editData = $state({
		name: '',
		eventType: '',
		element: null as number | null,
		startDate: null as string | null,
		startTime: null as string | null,
		endDate: null as string | null,
		endTime: null as string | null
	})

	function combineDatetime(date: string | null, time: string | null): string {
		if (!date) return ''
		if (!time) return `${date}T00:00:00`
		return `${date}T${time}:00`
	}

	const canSave = $derived(
		editData.name !== '' &&
			editData.eventType !== '' &&
			editData.startDate != null &&
			editData.endDate != null
	)

	async function handleSave() {
		if (!canSave) return

		isSaving = true
		saveError = null

		try {
			const newEvent = await eventAdapter.createEvent({
				name: editData.name,
				event_type: editData.eventType,
				start_time: combineDatetime(editData.startDate, editData.startTime),
				end_time: combineDatetime(editData.endDate, editData.endTime),
				element: editData.element
			})

			await queryClient.invalidateQueries({ queryKey: ['events'] })
			goto(`/database/events/${newEvent.id}`)
		} catch (error: unknown) {
			saveError = error instanceof Error ? error.message : 'Failed to create event'
		} finally {
			isSaving = false
		}
	}

	function handleCancel() {
		goto('/database/events')
	}
</script>

<div class="page">
	<DatabaseFormHeader
		title={m.events_new()}
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
				<ElementPicker
					value={editData.element ?? undefined}
					onValueChange={(v) => {
						editData.element = typeof v === 'number' ? v : null
					}}
					mode="dropdown"
					contained
				/>
			</DetailItem>
			<DetailItem label={m.events_start_time()} editable={true}>
				<div class="datetime-pair">
					<DatePicker bind:value={editData.startDate} contained />
					<TimePicker bind:value={editData.startTime} contained />
				</div>
			</DetailItem>
			<DetailItem label={m.events_end_time()} editable={true}>
				<div class="datetime-pair">
					<DatePicker bind:value={editData.endDate} contained />
					<TimePicker bind:value={editData.endTime} contained />
				</div>
			</DetailItem>
		</DetailsContainer>
	</section>
</div>

<style lang="scss">
	@use '$src/themes/database' as database;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;

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

	.datetime-pair {
		display: flex;
		gap: spacing.$unit;
		align-items: center;
	}
</style>

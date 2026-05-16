<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { createQuery } from '@tanstack/svelte-query'
	import { eventAdapter } from '$lib/api/adapters/event.adapter'
	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import SidebarHeader from '$lib/components/ui/SidebarHeader.svelte'
	import NotFoundPlaceholder from '$lib/components/database/NotFoundPlaceholder.svelte'
	import { formatDateJST, formatDateLongJST } from '$lib/utils/date'
	import { getEventTypeLabel, getEventStatusLabel } from '$lib/utils/event'
	import ElementBadge from '$lib/components/ui/ElementBadge.svelte'
	import type { PageData } from './$types'

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

	const eventId = $derived($page.params.id)

	const eventQuery = createQuery(() => ({
		queryKey: ['events', eventId],
		queryFn: () => eventAdapter.getEvent(eventId ?? ''),
		enabled: !!eventId
	}))

	const event = $derived(eventQuery.data)
	const userRole = $derived(data.role || 0)
	const canEdit = $derived(userRole >= 7)

	function handleEdit() {
		goto(`/database/events/${eventId}/edit`)
	}

	function handleBack() {
		goto('/database/events')
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
			<Button variant="secondary" onclick={handleBack}>Back</Button>
		</div>
	{:else if event}
		<SidebarHeader title={event.name}>
			{#snippet leftAccessory()}
				<Button variant="secondary" size="small" onclick={handleBack}>Back</Button>
			{/snippet}
			{#snippet rightAccessory()}
				{#if canEdit}
					<Button variant="primary" size="small" onclick={handleEdit}>{m.action_edit()}</Button>
				{/if}
			{/snippet}
		</SidebarHeader>

		<section class="details">
			<DetailsContainer title={m.events_title()}>
				<DetailItem label={m.events_name()} value={event.name} />
				<DetailItem label={m.events_type()} value={getEventTypeLabel(event.eventType)} />
				<DetailItem label={m.events_element()}>
					{#if event.element != null}
						<ElementBadge element={event.element} />
					{:else}
						<span class="none">—</span>
					{/if}
				</DetailItem>
				<DetailItem label={m.events_start_time()} value={formatDateLongJST(event.startTime)} />
				<DetailItem label={m.events_end_time()} value={formatDateLongJST(event.endTime)} />
				<DetailItem label={m.events_status()} value={getEventStatusLabel(event.status)} />
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
		<NotFoundPlaceholder title="Event Not Found" backHref="/database/events" backLabel="Back" />
	{/if}
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

	.loading-state,
	.error-state {
		@include database.loading-state;
	}

	.details {
		@include database.details;
	}

	.none {
		color: var(--text-tertiary);
	}
</style>

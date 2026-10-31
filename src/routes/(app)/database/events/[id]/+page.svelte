<script lang="ts">
	import { goto } from '$app/navigation'
	import { untrack } from 'svelte'
	import { createQuery } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'

	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import DatabaseFormHeader from '$lib/components/database/DatabaseFormHeader.svelte'
	import EventFormFields from '$lib/components/database/EventFormFields.svelte'
	import ImageFileField from '$lib/components/database/ImageFileField.svelte'
	import StaffPicksSection from '$lib/components/database/StaffPicksSection.svelte'

	import { eventQueries } from '$lib/api/queries/event.queries'
	import { useUpdateEvent, useUploadEventImage } from '$lib/api/mutations/event.mutations'
	import { eventToForm, formToEventPayload } from '$lib/utils/eventLabels'
	import { useAsyncAction } from '$lib/utils/asyncAction.svelte'
	import { withInitialData } from '$lib/query/ssr'
	import { localizedName } from '$lib/utils/locale'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { canEditStaffPicks, isEditor } from '$lib/auth/roles'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'

	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const eventQuery = createQuery(() => ({
		...eventQueries.byId(data.event.id),
		...withInitialData(data.event)
	}))
	const event = $derived(eventQuery.data ?? data.event)

	// Curators read the event and manage its staff picks while it hasn't ended
	const canEdit = $derived(isEditor(data.role))
	const canEditPicks = $derived(canEditStaffPicks(data.role, event.endsAt))

	const updateMut = useUpdateEvent()
	const uploadMut = useUploadEventImage()

	// The event's details, or its staff picks
	let view = $state<'details' | 'picks'>('details')
	const picksQuery = createQuery(() => eventQueries.staffPicks(data.event.id))
	const pickCount = $derived(picksQuery.data?.length ?? 0)

	let values = $state(untrack(() => eventToForm(data.event)))
	let loadedId = $state(untrack(() => data.event.id))
	$effect(() => {
		// Reset the form when navigating to another event
		if (event.id !== loadedId) {
			loadedId = event.id
			values = eventToForm(event)
		}
	})

	let imageFile = $state<File | null>(null)
	let saveError = $state<string | null>(null)

	const payload = $derived(formToEventPayload(values))

	const saveAction = useAsyncAction(
		async () => {
			if (!payload) return
			saveError = null
			const saved = await updateMut.mutateAsync({ id: event.id, payload })
			if (imageFile) {
				await uploadMut.mutateAsync({ id: event.id, file: imageFile })
				imageFile = null
			}
			values = eventToForm(saved)
			toast.success(m.db_events_saved())
		},
		m.db_events_save_failed(),
		{ onError: (_, message) => (saveError = message) }
	)
</script>

<PageMeta
	title={m.page_title_db_edit({ name: localizedName(event.name) })}
	description={m.page_desc_home()}
/>

<div class="page">
	{#if canEdit}
		<DatabaseFormHeader
			title={m.db_events_review_title()}
			onCancel={() => goto(localizeHref('/database/events'))}
			onSave={saveAction.run}
			isSaving={saveAction.busy}
			disabled={!payload}
		/>
	{:else}
		<DatabasePageHeader title={localizedName(event.name)}>
			{#snippet leftAction()}
				<Button
					variant="secondary"
					size="small"
					onclick={() => goto(localizeHref('/database/events'))}
				>
					{m.db_events_back()}
				</Button>
			{/snippet}
		</DatabasePageHeader>
	{/if}

	{#if saveError}
		<div class="error-banner">{saveError}</div>
	{/if}

	<div class="view-switch">
		<SegmentedControl
			value={view}
			onValueChange={(v) => (view = v === 'picks' ? 'picks' : 'details')}
			variant="background"
			size="small"
		>
			<Segment value="details">{m.db_events_section_details()}</Segment>
			<Segment value="picks">{m.db_picks_title()} ({pickCount})</Segment>
		</SegmentedControl>
	</div>

	{#if view === 'details'}
		<section class="details">
			<EventFormFields bind:values eventNumber={event.eventNumber} readonly={!canEdit} />

			{#if canEdit}
				<DetailsContainer title={m.db_events_section_image()}>
					<div class="image-section">
						<ImageFileField
							variant="banner"
							currentUrl={event.imageUrl}
							accept={['image/png', 'image/webp', 'image/jpeg']}
							maxBytes={5 * 1024 * 1024}
							hint={m.db_events_image_hint()}
							onSelect={(file) => (imageFile = file)}
						/>
					</div>
				</DetailsContainer>
			{/if}
		</section>
	{:else}
		<StaffPicksSection eventId={event.id} readonly={!canEditPicks} />
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/database' as database;

	.page {
		background: var(--card-bg);
		border-radius: layout.$card-corner;
		box-shadow: var(--shadow-sm);
	}

	.details {
		@include database.details;
	}

	.error-banner {
		@include database.error-banner;
	}

	.view-switch {
		padding: 0 spacing.$unit-2x spacing.$unit;
	}

	.image-section {
		padding: spacing.$unit-2x;
	}
</style>

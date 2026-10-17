<script lang="ts">
	import { goto } from '$app/navigation'
	import { untrack } from 'svelte'
	import { createQuery } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'

	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	import Button from '$lib/components/ui/Button.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DatabaseFormHeader from '$lib/components/database/DatabaseFormHeader.svelte'
	import EventFormFields from '$lib/components/database/EventFormFields.svelte'
	import ImageFileField from '$lib/components/database/ImageFileField.svelte'
	import StaffPicksSection from '$lib/components/database/StaffPicksSection.svelte'

	import { eventQueries } from '$lib/api/queries/event.queries'
	import {
		useApproveEvent,
		useHideEvent,
		useUpdateEvent,
		useUploadEventImage
	} from '$lib/api/mutations/event.mutations'
	import { eventStatusLabel, eventToForm, formToEventPayload } from '$lib/utils/eventLabels'
	import { useAsyncAction } from '$lib/utils/asyncAction.svelte'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { withInitialData } from '$lib/query/ssr'
	import { localizedName } from '$lib/utils/locale'
	import { localizeHref } from '$lib/paraglide/runtime'

	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	const eventQuery = createQuery(() => ({
		...eventQueries.byId(data.event.id),
		...withInitialData(data.event)
	}))
	const event = $derived(eventQuery.data ?? data.event)

	const updateMut = useUpdateEvent()
	const approveMut = useApproveEvent()
	const hideMut = useHideEvent()
	const uploadMut = useUploadEventImage()

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

	function setStatus(action: 'approve' | 'hide') {
		const mut = action === 'approve' ? approveMut : hideMut
		mut.mutate(event.id, {
			onSuccess: () =>
				toast.success(action === 'approve' ? m.db_events_approved() : m.db_events_hidden()),
			onError: (err) => toast.error(extractErrorMessage(err, m.db_events_save_failed()))
		})
	}
</script>

<PageMeta
	title={m.page_title_db_edit({ name: localizedName(event.name) })}
	description={m.page_desc_home()}
/>

<div class="page">
	<DatabaseFormHeader
		title={m.db_events_review_title()}
		onCancel={() => goto(localizeHref('/database/events'))}
		onSave={saveAction.run}
		isSaving={saveAction.busy}
		disabled={!payload}
	/>

	{#if saveError}
		<div class="error-banner">{saveError}</div>
	{/if}

	<div class="status-row">
		<span class="status">
			{m.db_events_col_status()}: <strong>{eventStatusLabel(event.status)}</strong>
		</span>
		<div class="status-actions">
			{#if event.status !== 'approved'}
				<Button
					variant="primary"
					size="small"
					onclick={() => setStatus('approve')}
					disabled={approveMut.isPending}
				>
					{m.db_events_approve()}
				</Button>
			{/if}
			{#if event.status !== 'hidden'}
				<Button
					variant="secondary"
					size="small"
					onclick={() => setStatus('hide')}
					disabled={hideMut.isPending}
				>
					{m.db_events_hide()}
				</Button>
			{/if}
		</div>
	</div>

	<p class="jst-note">{m.db_events_times_jst()}</p>

	<section class="details">
		<EventFormFields bind:values eventNumber={event.eventNumber} />

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

		<StaffPicksSection eventId={event.id} />
	</section>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;
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

	.status-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit-2x;
		padding: 0 spacing.$unit-2x spacing.$unit;
	}

	.status {
		color: var(--text-secondary);
	}

	.status-actions {
		display: flex;
		gap: spacing.$unit;
	}

	.jst-note {
		margin: 0;
		padding: 0 spacing.$unit-2x;
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.image-section {
		padding: spacing.$unit-2x;
	}
</style>

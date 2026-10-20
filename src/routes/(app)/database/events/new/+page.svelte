<script lang="ts">
	import { goto } from '$app/navigation'

	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	import DatabaseFormHeader from '$lib/components/database/DatabaseFormHeader.svelte'
	import EventFormFields from '$lib/components/database/EventFormFields.svelte'
	import { useCreateEvent } from '$lib/api/mutations/event.mutations'
	import { emptyEventForm, formToEventPayload } from '$lib/utils/eventLabels'
	import { useAsyncAction } from '$lib/utils/asyncAction.svelte'
	import { localizeHref } from '$lib/paraglide/runtime'

	const createMut = useCreateEvent()

	let values = $state(emptyEventForm())
	let saveError = $state<string | null>(null)

	const payload = $derived(formToEventPayload(values))

	const saveAction = useAsyncAction(
		async () => {
			if (!payload) return
			saveError = null
			const event = await createMut.mutateAsync(payload)
			goto(localizeHref(`/database/events/${event.id}`))
		},
		m.db_events_save_failed(),
		{ onError: (_, message) => (saveError = message) }
	)
</script>

<PageMeta
	title={m.page_title_db_new({ type: m.db_events_type() })}
	description={m.page_desc_home()}
/>

<div class="page">
	<DatabaseFormHeader
		title={m.db_events_new()}
		onCancel={() => goto(localizeHref('/database/events'))}
		onSave={saveAction.run}
		isSaving={saveAction.busy}
		disabled={!payload}
	/>

	{#if saveError}
		<div class="error-banner">{saveError}</div>
	{/if}

	<p class="jst-note">{m.db_events_times_jst()}</p>

	<section class="details">
		<EventFormFields bind:values />
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

	.jst-note {
		margin: 0;
		padding: 0 spacing.$unit-2x;
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}
</style>

<script lang="ts">
	// The events list: the generated list, with the schedule sync for editors.
	// Curators read it too (the events section's `minRole`).
	import { page } from '$app/state'
	import { toast } from 'svelte-sonner'
	import * as m from '$lib/paraglide/messages'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { useRunEventSync } from '$lib/api/mutations/event.mutations'
	import { isEditor } from '$lib/auth/roles'
	import ResourceTable from '$lib/features/database/schema/ResourceTable.svelte'
	import { extractErrorMessage } from '$lib/utils/errors'

	const canEdit = $derived(isEditor(page.data.role as number | undefined))
	const sync = useRunEventSync()

	function runSync() {
		sync.mutate(undefined, {
			onSuccess: () => toast.success(m.db_events_sync_queued()),
			onError: (err) => toast.error(extractErrorMessage(err, m.db_events_sync_failed()))
		})
	}
</script>

<PageMeta title={m.page_title_db_events()} description={m.page_desc_home()} />

{#snippet actions()}
	{#if canEdit}
		<Button variant="secondary" size="small" onclick={runSync} disabled={sync.isPending}>
			{m.db_events_run_sync()}
		</Button>
	{/if}
{/snippet}

<div class="database-page">
	<ResourceTable resource="events" toolbarEnd={actions} />
</div>

<style lang="scss">
	.database-page {
		margin: 0 auto;
	}
</style>

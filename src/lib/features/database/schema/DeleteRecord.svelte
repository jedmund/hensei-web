<script lang="ts">
	/**
	 * The edit form's Delete button, for resources with `save.destroy`. Asks
	 * first; `save.canDestroy` can disable it with a reason. On success the
	 * record leaves the cache, the lists go stale and `onDeleted` runs.
	 */
	import { useQueryClient } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'
	import * as m from '$lib/paraglide/messages'
	import { adminKeys } from '$lib/api/queries/admin.queries'
	import Button from '$lib/components/ui/Button.svelte'
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte'
	import type { AdminResource } from '$lib/types/api/admin'
	import { extractErrorMessage } from '$lib/utils/errors'
	import type { AnyResourceDef } from './registry'

	interface Props {
		def: AnyResourceDef
		record: unknown
		/** The record's title, for the confirm and the toast */
		title: string
		onDeleted: () => void
	}

	let { def, record, title, onDeleted }: Props = $props()

	const queryClient = useQueryClient()
	let confirming = $state(false)
	let deleting = $state(false)

	const allowed = $derived(def.save?.canDestroy?.(record) ?? true)
	const reason = $derived(
		typeof allowed === 'function' ? allowed() : typeof allowed === 'string' ? allowed : null
	)
	const disabled = $derived(allowed !== true)

	async function destroy() {
		const recordDef = def.record
		if (!def.save?.destroy || !recordDef || deleting) return
		deleting = true
		try {
			await def.save.destroy(record)
			// Refetching the deleted record would only 404
			queryClient.removeQueries({ queryKey: recordDef.query(recordDef.routeId(record)).queryKey })
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: adminKeys.lists(def.name as AdminResource) }),
				...(def.save.invalidates?.() ?? []).map((queryKey) =>
					queryClient.invalidateQueries({ queryKey })
				)
			])
			confirming = false
			toast.success(m.db_deleted({ name: title }))
			onDeleted()
		} catch (error) {
			confirming = false
			toast.error(extractErrorMessage(error, m.db_delete_failed()))
		} finally {
			deleting = false
		}
	}
</script>

<div class="delete-row">
	<p class="reason">{reason ?? ''}</p>
	<Button variant="destructive" size="small" {disabled} onclick={() => (confirming = true)}>
		{m.db_delete_action()}
	</Button>
</div>

<ConfirmDialog
	bind:open={confirming}
	title={m.db_delete_confirm_title({ name: title })}
	message={m.db_delete_confirm_message()}
	loading={deleting}
	onconfirm={destroy}
/>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.delete-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit-2x;
		padding: spacing.$unit-2x;
	}

	.reason {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}
</style>

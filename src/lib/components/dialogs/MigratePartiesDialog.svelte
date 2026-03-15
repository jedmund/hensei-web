<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import { getAllEditKeys, removeEditKeys } from '$lib/utils/editKeys'
	import { useMigrateParties } from '$lib/api/mutations/party.mutations'

	interface Props {
		open: boolean
		onComplete: () => void
	}

	let { open = $bindable(), onComplete }: Props = $props()

	const migrateMutation = useMigrateParties()
	let migrating = $state(false)
	let result = $state<{
		migratedCount: number
		results: Array<{ shortcode: string; status: string }>
	} | null>(null)

	const editKeys = $derived(getAllEditKeys())

	async function handleMigrate() {
		migrating = true
		try {
			const response = await $migrateMutation.mutateAsync(editKeys)
			result = response

			const completedShortcodes = response.results
				.filter((r) => r.status === 'migrated' || r.status === 'already_claimed')
				.map((r) => r.shortcode)
			removeEditKeys(completedShortcodes)
		} finally {
			migrating = false
		}
	}

	function handleDone() {
		open = false
		if (result && result.migratedCount === editKeys.length) {
			onComplete()
		}
	}
</script>

<Dialog bind:open>
	{#snippet children()}
		<ModalHeader title={m.migrate_dialog_title()} />
		<ModalBody>
			{#if result}
				<p class="message">
					{#if result.migratedCount === editKeys.length}
						{m.migrate_dialog_success({ count: result.migratedCount.toString() })}
					{:else}
						{m.migrate_dialog_partial({
							migrated: result.migratedCount.toString(),
							total: editKeys.length.toString()
						})}
					{/if}
				</p>
			{:else}
				<p class="message">{m.migrate_dialog_body()}</p>
				<p class="count">{m.migrate_dialog_count({ count: editKeys.length.toString() })}</p>
			{/if}
		</ModalBody>
		{#if result}
			<ModalFooter
				onCancel={handleDone}
				primaryAction={{
					label: m.migrate_dialog_done(),
					onclick: handleDone
				}}
			/>
		{:else}
			<ModalFooter
				onCancel={() => (open = false)}
				cancelDisabled={migrating}
				primaryAction={{
					label: migrating ? m.migrate_dialog_migrating() : m.migrate_dialog_confirm(),
					onclick: handleMigrate,
					disabled: migrating || editKeys.length === 0
				}}
			/>
		{/if}
	{/snippet}
</Dialog>

<style lang="scss">
	@use '$src/themes/typography' as *;
	@use '$src/themes/spacing' as *;

	.message {
		margin: 0;
		font-size: $font-regular;
		line-height: 1.5;
		color: var(--text-primary);
		text-align: left;
	}

	.count {
		margin: $unit 0 0;
		font-size: $font-small;
		color: var(--text-secondary);
	}
</style>

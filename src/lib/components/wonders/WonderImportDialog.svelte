<script lang="ts">
	/**
	 * WonderImportDialog - imports the game's Wonders page by hand: paste the
	 * `/item/memorial_list/1` response and send it as is. The extension does
	 * the same in one step. Wonders the catalogue doesn't know are reported
	 * back, not created.
	 */
	import { toast } from 'svelte-sonner'
	import { m } from '$lib/paraglide/messages'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import { useImportCollectionWonders } from '$lib/api/mutations/wonder.mutations'
	import { parseWondersPage } from '$lib/features/wonders/wonders'
	import { extractErrorMessage } from '$lib/utils/errors'

	interface Props {
		open: boolean
		element?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined
	}

	let { open = $bindable(false), element }: Props = $props()

	const importMutation = useImportCollectionWonders()

	let text = $state('')
	let error = $state<string | null>(null)

	const busy = $derived(importMutation.isPending)

	async function submit() {
		const parsed = parseWondersPage(text)
		if (!parsed) {
			error = m.wonders_import_invalid()
			return
		}
		error = null
		try {
			const result = await importMutation.mutateAsync(parsed)
			toast.success(m.wonders_import_success({ created: result.created, updated: result.updated }))
			if (result.skipped.length > 0) {
				toast.warning(
					m.wonders_import_skipped({ names: result.skipped.map((s) => s.name).join(', ') })
				)
			}
			text = ''
			open = false
		} catch (err: unknown) {
			toast.error(extractErrorMessage(err, m.wonders_import_failed()))
		}
	}
</script>

<Dialog bind:open size="medium">
	<ModalHeader title={m.wonders_import_title()} descriptionText={m.wonders_import_description()} />
	<ModalBody>
		<div class="content">
			<textarea
				class="data"
				bind:value={text}
				readonly={busy}
				placeholder={m.wonders_import_placeholder()}
				rows="12"
				spellcheck="false"
				aria-label={m.wonders_import_title()}
				aria-invalid={error ? 'true' : undefined}
				oninput={() => (error = null)}></textarea>
			{#if error}
				<p class="error" role="alert">{error}</p>
			{/if}
		</div>
	</ModalBody>
	<ModalFooter
		onCancel={() => (open = false)}
		cancelDisabled={busy}
		primaryAction={{
			label: m.wonders_import_submit(),
			onclick: submit,
			disabled: busy || text.trim().length === 0
		}}
		userElement={element}
	/>
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	.content {
		display: flex;
		flex-direction: column;
		gap: $unit;
	}

	.data {
		box-sizing: border-box;
		width: 100%;
		padding: $unit calc($unit * 1.5);
		border: none;
		border-radius: $input-corner;
		font-family: monospace;
		font-size: $font-small;
		line-height: 1.5;
		background: var(--input-bound-bg);
		color: var(--text-primary);
		resize: vertical;
	}

	.error {
		margin: 0;
		font-size: $font-small;
		color: var(--danger);
	}
</style>

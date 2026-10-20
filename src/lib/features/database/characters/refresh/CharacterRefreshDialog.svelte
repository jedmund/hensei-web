<!-- Refresh one character from the wiki: preview what changes, then apply exactly that -->
<script lang="ts">
	import { untrack } from 'svelte'
	import * as m from '$lib/paraglide/messages'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import SettingsRow from '$lib/components/ui/SettingsRow.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import Notice from '$lib/components/ui/Notice.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import RefreshPreview from './RefreshPreview.svelte'
	import { CharacterRefreshSession } from './refreshSession.svelte'
	import { failureMessage } from './refresh'
	import {
		characterRefreshAdapter,
		type CharacterReparseResponse
	} from '$lib/api/adapters/characterRefresh.adapter'

	interface Props {
		open: boolean
		/** Character row id (a style row refreshes on its own) */
		characterId: string
		/** Called after the refresh was written */
		onApplied?: (response: CharacterReparseResponse) => void
	}

	let { open = $bindable(false), characterId, onApplied }: Props = $props()

	let session = $state<CharacterRefreshSession | null>(null)

	// A fresh session each time the dialog opens; closing drops any request in flight.
	$effect(() => {
		if (open) {
			session = new CharacterRefreshSession(characterId, characterRefreshAdapter)
		} else {
			untrack(() => session?.reset())
		}
	})

	const phase = $derived(session?.phase ?? 'idle')
	const showOptions = $derived(phase === 'idle' || (phase === 'failed' && !session?.result))

	async function handleApply() {
		const response = await session?.apply()
		if (!response) return
		open = false
		onApplied?.(response)
	}

	function handleOpenChange(next: boolean) {
		// Keep the dialog up while a write is in flight
		if (!next && phase === 'applying') open = true
	}

	const primaryAction = $derived.by(() => {
		if (!session) return undefined
		if (session.result && session.outcome !== 'none') {
			return {
				label: phase === 'applying' ? m.character_refresh_applying() : m.character_refresh_apply(),
				onclick: handleApply,
				disabled: !session.canApply
			}
		}
		if (session.result) return undefined
		return {
			label:
				phase === 'previewing'
					? m.character_refresh_previewing()
					: session.failure === 'preview_expired'
						? m.character_refresh_preview_again()
						: m.character_refresh_preview(),
			onclick: () => session?.preview(),
			disabled: session.busy
		}
	})
</script>

<Dialog bind:open onOpenChange={handleOpenChange}>
	<ModalHeader
		title={m.character_refresh_title()}
		description={m.character_refresh_description()}
	/>

	<ModalBody>
		{#if session}
			<div class="refresh-body">
				{#if showOptions}
					<SettingsRow
						title={m.character_refresh_include_jp()}
						subtitle={m.character_refresh_include_jp_subtitle()}
						compact
					>
						{#snippet control()}
							<Switch bind:checked={session!.includeJp} disabled={session!.busy} />
						{/snippet}
					</SettingsRow>
				{/if}

				{#if session.failure}
					<Notice variant={session.failure === 'preview_expired' ? 'yellow' : 'red'}>
						{failureMessage(session.failure, session.failureDetail)}
					</Notice>
				{/if}

				{#if phase === 'previewing'}
					<p class="status">{m.character_refresh_previewing()}</p>
				{/if}

				{#if session.result}
					<RefreshPreview result={session.result} />
					{#if session.outcome === 'none'}
						<div class="again">
							<Button variant="ghost" size="small" onclick={() => session?.preview()}>
								{m.character_refresh_preview_again()}
							</Button>
						</div>
					{/if}
				{/if}
			</div>
		{/if}
	</ModalBody>

	<ModalFooter
		onCancel={() => (open = false)}
		cancelDisabled={phase === 'applying'}
		{primaryAction}
	/>
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.refresh-body {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
		padding: spacing.$unit 0;
	}

	.status {
		margin: 0;
		color: var(--text-secondary);
	}

	.again {
		display: flex;
		justify-content: flex-end;
	}
</style>

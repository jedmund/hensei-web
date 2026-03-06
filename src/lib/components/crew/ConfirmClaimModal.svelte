<svelte:options runes={true} />

<script lang="ts">
	import { useConfirmPhantomClaim } from '$lib/api/mutations/crew.mutations'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import type { PhantomPlayer } from '$lib/types/api/crew'

	interface Props {
		open: boolean
		crewId: string
		phantom: PhantomPlayer | null
	}

	let { open = $bindable(false), crewId, phantom }: Props = $props()

	const confirmMutation = useConfirmPhantomClaim()

	// State
	let confirmSuccess = $state(false)
	let confirmError = $state<string | null>(null)

	async function handleConfirm() {
		if (!phantom) return

		confirmError = null
		try {
			await confirmMutation.mutateAsync({
				crewId,
				phantomId: phantom.id
			})
			confirmSuccess = true
			setTimeout(() => {
				resetState()
				open = false
			}, 1500)
		} catch (err) {
			confirmError = err instanceof Error ? err.message : 'Failed to confirm claim'
		}
	}

	function resetState() {
		confirmSuccess = false
		confirmError = null
	}

	function handleCancel() {
		resetState()
		open = false
	}

	// Reset state when modal opens
	$effect(() => {
		if (open) {
			resetState()
		}
	})
</script>

<Dialog bind:open>
	<ModalHeader title="Confirm Phantom Claim" />

	<ModalBody>
		{#if confirmSuccess}
			<div class="success-message">
				<Icon name="check-circle" size={32} />
				<p>Claim confirmed! You have inherited the phantom's scores and join date.</p>
			</div>
		{:else}
			<div class="confirm-content">
				<p class="confirm-message">
					Are you sure you want to claim <strong>{phantom?.name ?? 'this phantom'}</strong>?
				</p>
				<p class="confirm-details">
					You will inherit this phantom's GW scores and join date. This action cannot be undone.
				</p>

				{#if confirmError}
					<div class="confirm-error">
						<p>{confirmError}</p>
					</div>
				{/if}
			</div>
		{/if}
	</ModalBody>

	{#if !confirmSuccess}
		<ModalFooter
			onCancel={handleCancel}
			primaryAction={{
				label: confirmMutation.isPending ? 'Confirming...' : 'Confirm Claim',
				onclick: handleConfirm,
				disabled: confirmMutation.isPending
			}}
		/>
	{/if}
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.confirm-content {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.confirm-message {
		margin: 0;
		font-size: typography.$font-regular;
		color: var(--text-primary);
		line-height: 1.5;
	}

	.confirm-details {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.confirm-error {
		padding: spacing.$unit;
		background: var(--danger-bg);
		border-radius: layout.$item-corner-small;

		p {
			margin: 0;
			font-size: typography.$font-small;
			color: var(--danger);
		}
	}

	.success-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit-4x;
		text-align: center;
		color: var(--wind-nav-selected-text);

		p {
			margin: 0;
		}
	}
</style>

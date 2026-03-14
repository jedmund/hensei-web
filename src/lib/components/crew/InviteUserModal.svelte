
<script lang="ts">
	import { useSendInvitation } from '$lib/api/mutations/crew.mutations'
	import * as m from '$lib/paraglide/messages'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'

	interface Props {
		open: boolean
		userId: string
		username: string
		crewId: string
	}

	let { open = $bindable(false), userId, username, crewId }: Props = $props()

	const sendMutation = useSendInvitation()

	// State
	let error = $state<string | null>(null)
	let success = $state(false)

	async function handleSend() {
		error = null
		try {
			await sendMutation.mutateAsync({ crewId, userId })
			success = true
			// Close after a brief delay to show success
			setTimeout(() => {
				open = false
				success = false
			}, 1500)
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to send invitation'
		}
	}

	function handleCancel() {
		open = false
		error = null
		success = false
	}

	// Reset state when modal opens
	$effect(() => {
		if (open) {
			error = null
			success = false
		}
	})
</script>

<Dialog bind:open>
	<ModalHeader
		title={m.crew_invite_title()}
		description={m.crew_invite_desc()}
	/>

	<ModalBody>
		{#if success}
			<div class="success-message">
				<p>{m.crew_invite_success({ username })}</p>
			</div>
		{:else}
			<div class="confirmation">
				<p>
					{m.crew_invite_confirm({ username })}
				</p>
				<p class="note">
					{m.crew_invite_hint()}
				</p>
			</div>

			{#if error}
				<div class="error-message">
					<p>{error}</p>
				</div>
			{/if}
		{/if}
	</ModalBody>

	{#if !success}
		<ModalFooter
			onCancel={handleCancel}
			cancelDisabled={sendMutation.isPending}
			primaryAction={{
				label: sendMutation.isPending ? m.crew_invite_sending() : m.crew_invite_title(),
				onclick: handleSend,
				disabled: sendMutation.isPending
			}}
		/>
	{/if}
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.confirmation {
		p {
			margin: 0 0 spacing.$unit;

			&:last-child {
				margin-bottom: 0;
			}
		}

		.note {
			font-size: typography.$font-small;
			color: var(--text-secondary);
		}
	}

	.success-message {
		text-align: center;
		padding: spacing.$unit-2x;
		color: var(--wind-nav-selected-text);

		p {
			margin: 0;
		}
	}

	.error-message {
		margin-top: spacing.$unit;
		padding: spacing.$unit;
		background: var(--danger-bg);
		border-radius: layout.$item-corner-small;
		color: var(--danger);

		p {
			margin: 0;
			font-size: typography.$font-small;
		}
	}
</style>

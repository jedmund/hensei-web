<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import CrewNotificationCards from './CrewNotificationCards.svelte'
	import type { CrewInvitation, PhantomPlayer } from '$lib/types/api/crew'

	interface Props {
		open: boolean
		invitations: CrewInvitation[]
		phantomClaims: PhantomPlayer[]
		isLoading?: boolean
	}

	let { open = $bindable(false), invitations, phantomClaims, isLoading = false }: Props = $props()

	const hasInvitations = $derived(invitations.length > 0)
	const hasPhantomClaims = $derived(phantomClaims.length > 0)
	const hasNotifications = $derived(hasInvitations || hasPhantomClaims)
</script>

<Dialog bind:open>
	<ModalHeader title={m.crew_notifications_title()} />

	<ModalBody>
		{#if isLoading}
			<div class="loading-state">
				<Icon name="loader-2" size={24} />
				<p>{m.notifications_loading()}</p>
			</div>
		{:else if !hasNotifications}
			<div class="empty-state">
				<Icon name="bell" size={32} />
				<p>{m.notifications_empty()}</p>
				<p class="hint">{m.notifications_empty_hint()}</p>
			</div>
		{:else}
			<CrewNotificationCards
				{invitations}
				{phantomClaims}
				showSectionHeaders
				onAcceptInvitation={() => (open = false)}
			/>
		{/if}
	</ModalBody>
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: spacing.$unit;
		padding: spacing.$unit-4x;
		color: var(--text-secondary);

		:global(svg) {
			animation: spin 1s linear infinite;
		}

		p {
			margin: 0;
		}
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: spacing.$unit;
		padding: spacing.$unit-4x;
		text-align: center;
		color: var(--text-secondary);

		:global(svg) {
			opacity: 0.5;
		}

		p {
			margin: 0;
		}

		.hint {
			font-size: typography.$font-small;
			opacity: 0.8;
		}
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>

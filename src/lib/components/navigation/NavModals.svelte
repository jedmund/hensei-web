<script lang="ts">
	import UserSettingsModal from '../UserSettingsModal.svelte'
	import InvitationsModal from '../crew/InvitationsModal.svelte'
	import type { NavigationState } from './navigationState.svelte'

	interface Props {
		nav: NavigationState
	}

	const { nav }: Props = $props()
</script>

<!-- Settings Modal -->
{#if nav.isAuth && nav.account && nav.currentUser}
	<UserSettingsModal
		bind:open={nav.settingsModalOpen}
		onOpenChange={nav.handleSettingsOpenChange}
		username={nav.username}
		userId={nav.account.userId}
		user={nav.currentUser}
		role={nav.role ?? 0}
		initialSection={nav.settingsSection}
		socialResult={nav.socialResult}
	/>
{/if}

<!-- Notifications Modal (invitations + phantom claims) -->
{#if nav.isAuth}
	<InvitationsModal
		bind:open={nav.invitationsModalOpen}
		invitations={nav.pendingInvitations.data ?? []}
		phantomClaims={nav.pendingPhantomClaims.data ?? []}
		isLoading={nav.pendingInvitations.isLoading || nav.pendingPhantomClaims.isLoading}
	/>
{/if}

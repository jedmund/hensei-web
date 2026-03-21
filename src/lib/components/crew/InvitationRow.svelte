<script lang="ts">
	import type { CrewInvitation } from '$lib/types/api/crew'
	import { formatDate } from '$lib/utils/date'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		invitation: CrewInvitation
	}

	let { invitation }: Props = $props()

	const expired = $derived(new Date(invitation.expiresAt) < new Date())
</script>

<li class="invitation-row" class:expired>
	<div class="invitation-info">
		<span class="invited-user">{invitation.user?.username ?? m.crew_unknown()}</span>
		{#if invitation.invitedBy}
			<span class="invited-by">
				{m.crew_invited_by({ username: invitation.invitedBy.username })}
			</span>
		{/if}
	</div>
	<div class="invitation-status">
		{#if expired}
			<span class="status-badge expired">{m.crew_expired()}</span>
		{:else}
			<span class="expires-text">{m.crew_expires({ date: formatDate(invitation.expiresAt) })}</span>
		{/if}
	</div>
</li>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.invitation-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit spacing.$unit spacing.$unit spacing.$unit-2x;
		border-radius: layout.$item-corner;
		transition: background-color 0.15s;

		&:hover {
			background: rgba(0, 0, 0, 0.03);
		}

		&.expired {
			opacity: 0.5;
		}
	}

	.invitation-info {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-fourth;
	}

	.invited-user {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-primary);
	}

	.invited-by {
		font-size: typography.$font-tiny;
		color: var(--text-tertiary);
	}

	.invitation-status {
		display: flex;
		align-items: center;
	}

	.expires-text {
		font-size: typography.$font-tiny;
		color: var(--text-tertiary);
	}

	.status-badge.expired {
		font-size: typography.$font-tiny;
		color: var(--danger);
		background: var(--danger-bg);
		padding: 2px 8px;
		border-radius: layout.$item-corner-small;
		font-weight: typography.$medium;
	}
</style>

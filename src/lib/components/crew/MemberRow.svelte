<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import Button from '$lib/components/ui/Button.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import { formatDate } from '$lib/utils/date'
	import type { CrewMembership } from '$lib/types/api/crew'

	interface Props {
		member: CrewMembership
		onEdit?: () => void
		onPromote?: () => void
		onDemote?: () => void
		onRemove?: () => void
	}

	const { member, onEdit, onPromote, onDemote, onRemove }: Props = $props()

	function getRoleLabel(role: string): string {
		switch (role) {
			case 'captain':
				return 'Captain'
			case 'vice_captain':
				return 'Vice Captain'
			default:
				return 'Member'
		}
	}

	function getRoleClass(role: string): string {
		switch (role) {
			case 'captain':
				return 'captain'
			case 'vice_captain':
				return 'officer'
			default:
				return ''
		}
	}

	const canShowOfficerActions = $derived(
		crewStore.isOfficer &&
			crewStore.canActOnMember(member.role) &&
			!member.retired &&
			member.id !== crewStore.membership?.id
	)

	const canPromote = $derived(member.role === 'member' && crewStore.canPromoteTo('vice_captain'))
	const canDemote = $derived(
		member.role === 'vice_captain' && crewStore.canDemote('vice_captain')
	)
</script>

<li class="member-row" class:retired={member.retired}>
	<a href="/crew/members/{member.user?.username}" class="member-link">
		<div class="member-info">
			<div class="member-details">
				{#if member.user?.username}
					<span class="username">{member.user.username}</span>
				{:else}
					<span class="username">Unknown</span>
				{/if}
				{#if member.joinedAt}
					<span class="joined-date">Joined {formatDate(member.joinedAt)}</span>
				{/if}
			</div>
		</div>
	</a>

	<div class="member-actions">
		<span class="role-badge {getRoleClass(member.role)}">
			{getRoleLabel(member.role)}
		</span>

		<DropdownMenu>
		{#snippet trigger({ props })}
			<Button variant="ghost" size="small" iconOnly icon="ellipsis" {...props} />
		{/snippet}
		{#snippet menu()}
			{#if member.user?.username}
				<DropdownMenuBase.Item
					class="dropdown-menu-item"
					onclick={() => goto(`/crew/members/${member.user?.username}`)}
				>
					View crew profile
				</DropdownMenuBase.Item>
				<DropdownMenuBase.Item
					class="dropdown-menu-item"
					onclick={() => goto(`/${member.user?.username}`)}
				>
					View profile
				</DropdownMenuBase.Item>
			{/if}
			{#if crewStore.isOfficer && onEdit}
				<DropdownMenuBase.Item class="dropdown-menu-item" onclick={onEdit}>
					Edit
				</DropdownMenuBase.Item>
			{/if}
			{#if canShowOfficerActions}
				{#if canPromote && onPromote}
					<DropdownMenuBase.Item class="dropdown-menu-item" onclick={onPromote}>
						Promote
					</DropdownMenuBase.Item>
				{/if}
				{#if canDemote && onDemote}
					<DropdownMenuBase.Item class="dropdown-menu-item" onclick={onDemote}>
						Demote
					</DropdownMenuBase.Item>
				{/if}
				{#if onRemove}
					<DropdownMenuBase.Item class="dropdown-menu-item danger" onclick={onRemove}>
						Remove
					</DropdownMenuBase.Item>
				{/if}
			{/if}
		{/snippet}
		</DropdownMenu>
	</div>
</li>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.member-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-radius: layout.$item-corner;
		transition: background-color 0.15s;

		&:hover {
			background: rgba(0, 0, 0, 0.03);
		}

		&.retired {
			opacity: 0.6;
		}
	}

	.member-link {
		flex: 1;
		display: flex;
		align-items: center;
		padding: spacing.$unit spacing.$unit spacing.$unit spacing.$unit-2x;
		text-decoration: none;
		color: inherit;
	}

	.member-info {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.member-details {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-fourth;
	}

	.member-actions {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding-right: spacing.$unit;
	}

	.username {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-primary);
	}

	.role-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		background: rgba(0, 0, 0, 0.04);

		&.captain {
			background: var(--color-gold-light, #fef3c7);
			color: var(--color-gold-dark, #92400e);
		}

		&.officer {
			background: var(--color-blue-light, #dbeafe);
			color: var(--color-blue-dark, #1e40af);
		}
	}

	.joined-date {
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}
</style>

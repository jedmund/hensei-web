<script lang="ts">
	import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'
	import { DropdownMenu } from 'bits-ui'
	import Icon from '$lib/components/Icon.svelte'
	import DropdownItem from '$lib/components/ui/dropdown/DropdownItem.svelte'
	import InviteUserModal from '$lib/components/crew/InviteUserModal.svelte'
	import type { CrewRole } from '$lib/types/api/crew'

	interface Props {
		username: string
		userId?: string
		avatarPicture?: string
		title?: string
		activeTab: 'teams' | 'favorites' | 'collection'
		isOwner?: boolean
		/** Current user's crew role (null if not in a crew) */
		viewerCrewRole?: CrewRole | null
		/** Current user's crew ID */
		viewerCrewId?: string | null
		/** Whether the target user is in a crew */
		targetUserHasCrew?: boolean
	}

	let {
		username,
		userId,
		avatarPicture = '',
		title,
		activeTab,
		isOwner = false,
		viewerCrewRole = null,
		viewerCrewId = null,
		targetUserHasCrew = false
	}: Props = $props()

	const avatarSrc = $derived(getAvatarSrc(avatarPicture))
	const avatarSrcSet = $derived(getAvatarSrcSet(avatarPicture))
	const displayTitle = $derived(title || username)

	// Can invite if: viewer is captain/vice_captain AND target user is not in a crew AND not viewing own profile
	const canInvite = $derived(
		!isOwner &&
			viewerCrewRole !== null &&
			(viewerCrewRole === 'captain' || viewerCrewRole === 'vice_captain') &&
			!targetUserHasCrew &&
			userId
	)

	// Show menu if there are any actions available
	const showMenu = $derived(canInvite)

	// Invite modal state
	let inviteModalOpen = $state(false)
</script>

<header class="header">
	{#if avatarPicture}
		<img
			class="avatar"
			alt={`Avatar of ${username}`}
			src={avatarSrc}
			srcset={avatarSrcSet}
			width="64"
			height="64"
		/>
	{:else}
		<div class="avatar" aria-hidden="true"></div>
	{/if}
	<div class="header-content">
		<h1>{displayTitle}</h1>
		<nav class="tabs" aria-label="Profile sections">
			<a
				class:active={activeTab === 'teams' || activeTab === 'favorites'}
				href="/{username}"
				data-sveltekit-preload-data="hover"
			>
				Teams
			</a>
			{#if isOwner}
				<a
					class:active={activeTab === 'favorites'}
					href="/{username}?tab=favorites"
					data-sveltekit-preload-data="hover"
				>
					Favorites
				</a>
			{/if}
			<a
				class:active={activeTab === 'collection'}
				href="/{username}/collection/characters"
				data-sveltekit-preload-data="hover"
			>
				Collection
			</a>
		</nav>
	</div>

	{#if showMenu}
		<div class="header-actions">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger class="menu-trigger">
					<Icon name="ellipsis" size={16} />
				</DropdownMenu.Trigger>

				<DropdownMenu.Portal>
					<DropdownMenu.Content class="dropdown-content" sideOffset={5} align="end">
						{#if canInvite}
							<DropdownItem>
								<button onclick={() => (inviteModalOpen = true)}>
									<Icon name="user-plus" size={14} />
									<span>Invite to Crew</span>
								</button>
							</DropdownItem>
						{/if}
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		</div>
	{/if}
</header>

{#if canInvite && userId && viewerCrewId}
	<InviteUserModal
		bind:open={inviteModalOpen}
		{userId}
		{username}
		crewId={viewerCrewId}
	/>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/layout' as *;

	.header {
		background: var(--card-bg);
		border-radius: $card-corner;
		padding: $unit-2x;
		display: flex;
		align-items: center;
		gap: $unit-2x;
		margin-bottom: $unit-2x;
	}

	.avatar {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: $grey-80;
		border: 1px solid $grey-75;
		object-fit: cover;
		flex-shrink: 0;
	}

	.header-content {
		flex: 1;
	}

	h1 {
		margin: 0 0 $unit-half;
		font-size: 24px;
	}

	.tabs {
		display: flex;
		gap: $unit-2x;
	}

	.tabs a {
		text-decoration: none;
		color: var(--text-secondary);
		padding-bottom: 2px;
		border-bottom: 2px solid transparent;

		&:hover {
			color: var(--text-primary);
		}

		&.active {
			border-color: var(--accent-color, #3366ff);
			color: var(--accent-color, #3366ff);
		}
	}

	.header-actions {
		margin-left: auto;
		flex-shrink: 0;
	}

	:global(.menu-trigger) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: transparent;
		border: none;
		cursor: pointer;
		color: var(--text-secondary);
		transition: background-color 0.15s ease, color 0.15s ease;

		&:hover {
			background: var(--button-contained-bg-hover, $grey-90);
			color: var(--text-primary);
		}

		&:focus-visible {
			outline: 2px solid var(--focus-ring);
			outline-offset: 2px;
		}
	}

	:global(.dropdown-content) {
		background-color: var(--menu-bg);
		border-radius: 8px;
		padding: $unit-half;
		min-width: 160px;
		box-shadow:
			0 10px 38px -10px rgba(22, 23, 24, 0.35),
			0 10px 20px -15px rgba(22, 23, 24, 0.2);
		z-index: 50;

		button {
			display: flex;
			align-items: center;
			gap: $unit-half;
			width: 100%;
		}
	}
</style>

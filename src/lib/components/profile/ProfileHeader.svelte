<script lang="ts">
	import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'
	import { DropdownMenu } from 'bits-ui'
	import Icon from '$lib/components/Icon.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
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
		/** User's selected element for theming */
		element?: string
		/** User's Granblue Fantasy ID for profile link */
		granblueId?: string
		/** Whether the user wants to show their Granblue ID on profile */
		showGranblueId?: boolean
		/** Whether to show crew gamertag */
		showCrewGamertag?: boolean
		/** The crew's gamertag to display */
		crewGamertag?: string
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
		element = 'null',
		granblueId,
		showGranblueId = false,
		showCrewGamertag = false,
		crewGamertag,
		viewerCrewRole = null,
		viewerCrewId = null,
		targetUserHasCrew = false
	}: Props = $props()

	// GBF profile URL - only show if user has enabled the setting
	const gbfProfileUrl = $derived(
		granblueId && showGranblueId
			? `https://game.granbluefantasy.jp/#profile/${granblueId}`
			: null
	)

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
	<div class="header-top">
		<div class="profile-info">
			{#if avatarPicture}
				<img
					class="avatar"
					alt={`Avatar of ${username}`}
					src={avatarSrc}
					srcset={avatarSrcSet}
					width="56"
					height="56"
				/>
			{:else}
				<div class="avatar" aria-hidden="true"></div>
			{/if}
			<div class="name-section">
				<div class="name-row">
					<h1>{displayTitle}</h1>
					{#if showCrewGamertag && crewGamertag}
						<span class="gamertag-pill" data-element={element}>{crewGamertag}</span>
					{/if}
				</div>
			</div>
		</div>

		<div class="header-actions">
			{#if gbfProfileUrl}
				<Tooltip content="In-game profile">
					<a
						href={gbfProfileUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="gbf-profile-link"
					>
						<Icon name="sword" size={24} />
					</a>
				</Tooltip>
			{/if}

			{#if showMenu}
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
			{/if}
		</div>
	</div>

	<nav class="tabs" aria-label="Profile sections" data-element={element}>
		<a class:active={activeTab === 'teams'} href="/{username}" data-sveltekit-preload-data="hover">
			Teams
		</a>
		{#if isOwner}
			<a
				class:active={activeTab === 'favorites'}
				href="/{username}/favorites"
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
</header>

{#if canInvite && userId && viewerCrewId}
	<InviteUserModal bind:open={inviteModalOpen} {userId} {username} crewId={viewerCrewId} />
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/effects' as effects;

	.header {
		background: var(--card-bg);
		border-radius: $card-corner;
		margin-bottom: $unit-2x;
		overflow: hidden;
	}

	.header-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: $unit-2x $unit-3x;
	}

	.profile-info {
		display: flex;
		align-items: center;
		gap: $unit-2x;
	}

	.avatar {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: $grey-80;
		border: 1px solid $grey-75;
		object-fit: cover;
		flex-shrink: 0;
	}

	.name-section {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
	}

	.name-row {
		display: flex;
		align-items: center;
		gap: $unit;
	}

	h1 {
		margin: 0;
		font-size: 20px;
		font-weight: $medium;
	}

	.gamertag-pill {
		display: inline-flex;
		align-items: center;
		padding: 2px $unit;
		border-radius: $full-corner;
		font-size: $font-small;
		font-weight: $medium;

		// Element-based pill colors
		&[data-element='wind'] {
			background: $wind-bg-20;
			color: $wind-text-20;
		}
		&[data-element='fire'] {
			background: $fire-bg-20;
			color: $fire-text-20;
		}
		&[data-element='water'] {
			background: $water-bg-20;
			color: $water-text-20;
		}
		&[data-element='earth'] {
			background: $earth-bg-20;
			color: $earth-text-20;
		}
		&[data-element='light'] {
			background: $light-bg-20;
			color: $light-text-20;
		}
		&[data-element='dark'] {
			background: $dark-bg-20;
			color: $dark-text-20;
		}
		&[data-element='null'],
		&:not([data-element]) {
			background: $grey-90;
			color: $grey-30;
		}
	}

	.gbf-profile-link {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: $card-corner;
		color: var(--text-secondary);
		text-decoration: none;
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			color 0.15s ease;

		:global(svg) {
			stroke-width: 2px;
		}

		&:hover {
			background: var(--button-contained-bg-hover, $grey-90);
			color: var(--text-primary);
		}

		&:focus-visible {
			outline: 2px solid var(--focus-ring);
			outline-offset: 2px;
		}
	}

	.tabs {
		display: flex;
	}

	.tabs a {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: $unit-2x $unit;
		border-top: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
		text-decoration: none;
		color: var(--text-secondary);
		font-size: $font-small;
		font-weight: $medium;
		transition:
			color 0.15s ease,
			background-color 0.15s ease;

		&:hover {
			color: var(--text-primary);
			background: rgba(0, 0, 0, 0.02);
		}
	}

	// Element-based active tab colors
	.tabs[data-element='wind'] a.active {
		color: var(--wind-nav-selected-text);
		background: var(--wind-nav-selected-bg);
	}

	.tabs[data-element='fire'] a.active {
		color: var(--fire-nav-selected-text);
		background: var(--fire-nav-selected-bg);
	}

	.tabs[data-element='water'] a.active {
		color: var(--water-nav-selected-text);
		background: var(--water-nav-selected-bg);
	}

	.tabs[data-element='earth'] a.active {
		color: var(--earth-nav-selected-text);
		background: var(--earth-nav-selected-bg);
	}

	.tabs[data-element='light'] a.active {
		color: var(--light-nav-selected-text);
		background: var(--light-nav-selected-bg);
	}

	.tabs[data-element='dark'] a.active {
		color: var(--dark-nav-selected-text);
		background: var(--dark-nav-selected-bg);
	}

	.tabs[data-element='null'] a.active,
	.tabs:not([data-element]) a.active {
		color: var(--null-nav-selected-text);
		background: var(--null-nav-selected-bg);
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: $unit-half;
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
		transition:
			background-color 0.15s ease,
			color 0.15s ease;

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
		border-radius: $input-corner;
		padding: $unit-half;
		min-width: 160px;
		box-shadow: var(--shadow-xl);
		z-index: effects.$z-popover;

		button {
			display: flex;
			align-items: center;
			gap: $unit-half;
			width: 100%;
		}
	}
</style>

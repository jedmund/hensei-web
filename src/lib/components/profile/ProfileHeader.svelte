<script lang="ts">
	import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'
	import { createQuery } from '@tanstack/svelte-query'
	import { goto } from '$app/navigation'
	import { DropdownMenu } from 'bits-ui'
	import Icon from '$lib/components/Icon.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import DropdownItem from '$lib/components/ui/dropdown/DropdownItem.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import InviteUserModal from '$lib/components/crew/InviteUserModal.svelte'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import type { CrewRole } from '$lib/types/api/crew'
	import { localizeHref } from '$lib/paraglide/runtime'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		username: string
		displayName?: string | null
		userId?: string
		avatarPicture?: string
		title?: string
		activeTab: 'teams' | 'favorites' | 'playlists' | 'collection'
		isOwner?: boolean
		/** User's selected element for theming */
		element?: string
		/** Short bio/description shown above the tabs */
		description?: string
		/** User's Granblue Fantasy ID for profile link */
		granblueId?: string
		/** User's gbf.wiki username */
		wikiProfile?: string
		/** User's YouTube channel handle */
		youtube?: string
		/** Whether to show crew gamertag */
		showCrewGamertag?: boolean
		/** The crew's gamertag to display */
		crewGamertag?: string
		/** The crew's full name for tooltip display */
		crewName?: string
		/** Current user's crew role (null if not in a crew) */
		viewerCrewRole?: CrewRole | null
		/** Current user's crew ID */
		viewerCrewId?: string | null
		/** Collection privacy setting: 1=everyone, 2=crew_only, 3=private */
		collectionPrivacy?: number
		/** Whether the viewer is logged in */
		isAuthenticated?: boolean
		/** Whether the header is expanded (bindable) */
		expanded?: boolean
	}

	let {
		username,
		displayName,
		userId,
		avatarPicture = '',
		title,
		activeTab,
		isOwner = false,
		element = 'null',
		description,
		granblueId,
		wikiProfile,
		youtube,
		showCrewGamertag = false,
		crewGamertag,
		crewName,
		viewerCrewRole = null,
		viewerCrewId = null,
		collectionPrivacy,
		isAuthenticated = false,
		expanded = $bindable(false)
	}: Props = $props()

	// GBF profile URL - shown if user has filled in their Granblue ID
	const gbfProfileUrl = $derived(
		granblueId ? `https://game.granbluefantasy.jp/#profile/${granblueId}` : null
	)

	// Wiki profile URL - shown if user has filled in their wiki username
	const wikiProfileUrl = $derived(
		wikiProfile ? `https://gbf.wiki/User:${encodeURIComponent(wikiProfile)}` : null
	)

	// YouTube channel URL - shown if user has filled in their YouTube handle
	const youtubeUrl = $derived(
		youtube ? `https://www.youtube.com/@${youtube.replace(/^@/, '')}` : null
	)

	const hasLinks = $derived(!!(gbfProfileUrl || wikiProfileUrl || youtubeUrl))
	const hasBody = $derived(!!description || hasLinks)

	const avatarSrc = $derived(getAvatarSrc(avatarPicture))
	const avatarSrcSet = $derived(getAvatarSrcSet(avatarPicture))
	const displayTitle = $derived(title || displayName || username)
	const showUsernameTooltip = $derived(displayTitle !== username)

	// Viewer is a crew officer
	const isCrewOfficer = $derived(viewerCrewRole === 'captain' || viewerCrewRole === 'vice_captain')

	// Query crew members to check if target user is already in viewer's crew
	const crewMembersQuery = createQuery(() => ({
		...crewQueries.members('active'),
		enabled: !isOwner && isCrewOfficer && !!userId
	}))

	const isInViewerCrew = $derived.by(() => {
		if (!userId || !crewMembersQuery.data) return false
		return crewMembersQuery.data.members.some((m) => m.user?.id === userId)
	})

	// Can invite if: viewer is crew officer AND target user is not in viewer's crew
	const canInvite = $derived(!isOwner && isCrewOfficer && !isInViewerCrew && userId)

	// Show "Already in your crew" when target IS in viewer's crew
	const showAlreadyInCrew = $derived(!isOwner && isCrewOfficer && isInViewerCrew && userId)

	// Can create team from collection if: not owner, logged in, collection is public, and user exists
	const canCreateTeam = $derived(!isOwner && isAuthenticated && collectionPrivacy === 1 && userId)

	// Show dropdown if there are any crew-related actions available
	const showMenu = $derived(canInvite || showAlreadyInCrew)

	// Typed element for SegmentedControl
	const typedElement = $derived(
		(element as 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined) ?? undefined
	)

	function handleTabChange(value: string) {
		if (value === 'teams') {
			goto(localizeHref(`/${username}`))
		} else if (value === 'favorites') {
			goto(localizeHref(`/${username}/favorites`))
		} else if (value === 'playlists') {
			goto(localizeHref(`/${username}/playlists`))
		} else if (value === 'collection') {
			goto(localizeHref(`/${username}/collection/characters`))
		}
	}

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
					{#if showUsernameTooltip}
						<Tooltip content={`@${username}`}>
							<h1>{displayTitle}</h1>
						</Tooltip>
					{:else}
						<h1>{displayTitle}</h1>
					{/if}
					{#if showCrewGamertag && crewGamertag}
						<Tooltip content={crewName ?? crewGamertag}>
							<span class="gamertag-pill" data-element={element}>{crewGamertag}</span>
						</Tooltip>
					{/if}
				</div>
			</div>
		</div>

		<div class="header-actions">
			{#if canCreateTeam}
				<Button
					variant="primary"
					size="small"
					element={typedElement}
					href={localizeHref(`/teams/new?collectionSource=${username}`)}
				>
					{m.profile_create_with_collection()}
				</Button>
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
										<span>{m.crew_invite_title()}</span>
									</button>
								</DropdownItem>
							{:else if showAlreadyInCrew}
								<DropdownItem>
									<button disabled class="disabled-item">
										<Icon name="user-check" size={14} />
										<span>{m.crew_already_member()}</span>
									</button>
								</DropdownItem>
							{/if}
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu.Root>
			{/if}
		</div>
	</div>

	{#if hasBody}
		<div class="profile-body">
			{#if description}
				<p class="description">{description}</p>
			{/if}
			{#if hasLinks}
				<!-- eslint-disable svelte/no-navigation-without-resolve -- external URLs -->
				<div class="link-pills">
					{#if gbfProfileUrl}
						<a href={gbfProfileUrl} target="_blank" rel="noopener noreferrer" class="link-pill">
							<Icon name="sword" size={14} />
							<span>{m.profile_ingame()}</span>
						</a>
					{/if}
					{#if wikiProfileUrl}
						<a href={wikiProfileUrl} target="_blank" rel="noopener noreferrer" class="link-pill">
							<Icon name="link" size={14} />
							<span>{m.profile_wiki()}</span>
						</a>
					{/if}
					{#if youtubeUrl}
						<a href={youtubeUrl} target="_blank" rel="noopener noreferrer" class="link-pill">
							<Icon name="youtube" size={14} />
							<span>{m.profile_youtube()}</span>
						</a>
					{/if}
				</div>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			{/if}
		</div>
	{/if}

	<div class="expand-spacer" class:open={expanded}></div>

	<nav class="tabs" class:dimmed={expanded} aria-label="Profile sections">
		<SegmentedControl
			value={activeTab}
			onValueChange={handleTabChange}
			variant="background"
			size="small"
			element={typedElement}
			grow
			slidingIndicator
		>
			<Segment value="teams">{m.profile_tab_teams()}</Segment>
			<Segment value="playlists">{m.profile_tab_playlists()}</Segment>
			<Segment value="collection">{m.profile_tab_collection()}</Segment>
			{#if isOwner}
				<Segment value="favorites">{m.profile_tab_favorites()}</Segment>
			{/if}
		</SegmentedControl>
	</nav>

	<div class="expand-section">
		<button
			type="button"
			class="expand-toggle"
			aria-expanded={expanded}
			aria-label={expanded ? m.profile_collapse() : m.profile_expand()}
			onclick={() => (expanded = !expanded)}
		>
			<Icon name={expanded ? 'chevron-up-small' : 'chevron-down-small'} size={16} />
		</button>
	</div>
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
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: $page-corner;
		box-shadow: effects.$page-elevation;
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
		background: var(--button-contained-bg-hover, $grey-80);
		border: 1px solid var(--border-subtle);
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
		font-size: $font-large;
		font-weight: $medium;
		color: var(--text-primary);
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
			background: var(--wind-bg);
			color: var(--wind-text);
		}
		&[data-element='fire'] {
			background: var(--fire-bg);
			color: var(--fire-text);
		}
		&[data-element='water'] {
			background: var(--water-bg);
			color: var(--water-text);
		}
		&[data-element='earth'] {
			background: var(--earth-bg);
			color: var(--earth-text);
		}
		&[data-element='light'] {
			background: var(--light-bg);
			color: var(--light-text);
		}
		&[data-element='dark'] {
			background: var(--dark-bg);
			color: var(--dark-text);
		}
		&[data-element='null'],
		&:not([data-element]) {
			background: var(--null-bg);
			color: var(--null-text);
		}
	}

	.profile-body {
		display: flex;
		flex-direction: column;
		gap: $unit;
		padding: 0 $unit-3x $unit-2x;
	}

	.description {
		margin: 0;
		font-size: $font-regular;
		color: var(--text-secondary);
		overflow-wrap: anywhere;
	}

	.link-pills {
		display: flex;
		flex-wrap: wrap;
		gap: $unit-half;
	}

	.link-pill {
		display: inline-flex;
		align-items: center;
		gap: $unit-half;
		padding: $unit-half $unit;
		border-radius: $full-corner;
		background: var(--button-contained-bg, $grey-90);
		color: var(--text-secondary);
		font-size: $font-small;
		font-weight: $medium;
		text-decoration: none;
		transition:
			background-color 0.15s ease,
			color 0.15s ease;

		&:hover {
			background: var(--button-contained-bg-hover, $grey-80);
			color: var(--text-primary);
		}

		&:focus-visible {
			outline: 2px solid var(--focus-ring);
			outline-offset: 2px;
		}
	}

	.tabs {
		padding: 0 $unit-2x $unit;
		transition: opacity effects.$duration-slide ease-in-out;

		&.dimmed {
			opacity: 0.4;
		}
	}

	.expand-section {
		display: flex;
		flex-direction: column;
		padding: 0 $unit-2x $unit-2x;
	}

	.expand-spacer {
		width: 100%;
		height: 0;
		transition: height effects.$duration-slide ease-in-out;

		&.open {
			height: 50dvh;
		}
	}

	.expand-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 24px;
		padding: 0;
		border-radius: $input-corner;
		background: transparent;
		border: none;
		cursor: pointer;
		color: var(--text-tertiary);
		transition:
			background-color effects.$duration-quick ease,
			color effects.$duration-quick ease;

		&:hover {
			background: var(--button-contained-bg-hover, $grey-90);
			color: var(--text-primary);
			cursor: pointer;
		}

		&:focus-visible {
			outline: 2px solid var(--focus-ring);
			outline-offset: 2px;
		}
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

		:global(.dropdown-item button),
		:global(.dropdown-item a) {
			gap: $unit-half;
		}

		:global(.dropdown-item button.disabled-item) {
			opacity: 0.5;
			cursor: default;
		}
	}
</style>

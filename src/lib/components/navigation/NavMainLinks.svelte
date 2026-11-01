<script lang="ts">
	import { page } from '$app/state'
	import { cubicOut } from 'svelte/easing'
	import { fly } from 'svelte/transition'
	import { m } from '$lib/paraglide/messages'
	import Icon from '../Icon.svelte'
	import SlidingSelection from '../ui/SlidingSelection.svelte'
	import CrewNotificationDot from './CrewNotificationDot.svelte'
	import NavAccountMenu from './NavAccountMenu.svelte'
	import NavUserSearch from './NavUserSearch.svelte'
	import type { NavigationState } from './navigationState.svelte'

	interface Props {
		nav: NavigationState
	}

	const { nav }: Props = $props()

	const STATE_IN = { x: -12, duration: 200, easing: cubicOut, delay: 60 }
	const STATE_OUT = { x: -12, duration: 140, easing: cubicOut }
	const SEARCH_IN = { x: 12, duration: 200, easing: cubicOut, delay: 60 }
	const SEARCH_OUT = { x: 12, duration: 140, easing: cubicOut }

	// User search state: the pill keeps its width while the search field shows
	let searchOpen = $state(false)
	let pillEl = $state<HTMLUListElement | undefined>()
	let pillLockedWidth = $state<number | null>(null)

	function openSearch() {
		if (pillEl) pillLockedWidth = pillEl.offsetWidth
		searchOpen = true
	}

	function closeSearch() {
		searchOpen = false
		pillLockedWidth = null
	}

	// Host ref for the sliding selection indicator (tracks the .selected nav link)
	let pillDefaultEl = $state<HTMLLIElement | undefined>()
</script>

<!-- The desktop pill: main links, user search and the "more" menu -->
<ul role="list" bind:this={pillEl} style={pillLockedWidth ? `min-width:${pillLockedWidth}px` : ''}>
	{#if searchOpen}
		<li class="nav-search pill-state" in:fly={SEARCH_IN} out:fly={SEARCH_OUT}>
			<NavUserSearch userElement={nav.isAuth ? nav.userElement : undefined} onClose={closeSearch} />
		</li>
	{:else}
		<li
			class="pill-state pill-default"
			bind:this={pillDefaultEl}
			in:fly={STATE_IN}
			out:fly={STATE_OUT}
		>
			<SlidingSelection host={pillDefaultEl} trigger={page.url.pathname} />
			{#each nav.mainLinks as link (link.id)}
				{#if link.id === 'profile'}
					<a
						href={link.href}
						class:selected={nav.isProfileSelected}
						aria-label={m.nav_account_aria()}
						class="profile-link"
					>
						{#if nav.avatarSrc}
							<img
								src={nav.avatarSrc}
								srcset={nav.avatarSrcSet}
								alt={nav.username}
								class="user-avatar"
								width="24"
								height="24"
							/>
						{/if}
						<span>{nav.username}</span>
					</a>
				{:else if link.id === 'crew'}
					<a
						href={link.href}
						class:selected={nav.isNavSelected(link.href)}
						class:crew-link={nav.isAuth}
					>
						{link.label()}
						{#if nav.notificationCount > 0}
							<CrewNotificationDot element={nav.userElement} />
						{/if}
					</a>
				{:else}
					<a href={link.href} class:selected={nav.isNavSelected(link.href)}>{link.label()}</a>
				{/if}
			{/each}
			<button
				type="button"
				class="nav-search-trigger"
				aria-label={m.nav_search_users_aria()}
				onclick={openSearch}
			>
				<Icon name="search" size={16} />
			</button>
			<NavAccountMenu {nav} />
		</li>
	{/if}
</ul>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/navigation' as navigation;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	$elements: wind, fire, water, earth, dark, light;

	ul {
		@include navigation.nav-pill-bar;

		// Stage the two pill states in a single grid cell so they can crossfade
		// without pushing layout during the transition.
		display: grid;
		grid-template-columns: 1fr;
		gap: 0;

		li {
			@include navigation.nav-pill-item;
		}

		a {
			@include navigation.nav-pill-link;
		}
	}

	.pill-state {
		grid-row: 1;
		grid-column: 1;
		display: flex;
		align-items: stretch;
		gap: spacing.$unit-quarter;
		min-width: 0;

		&.nav-search {
			gap: 0;
		}
	}

	// Crew link with notification dot
	.crew-link {
		display: flex !important;
		align-items: center;
		gap: spacing.$unit-half;
	}

	// Profile link with avatar
	.profile-link {
		display: flex !important;
		align-items: center;
		gap: spacing.$unit-half;

		.user-avatar {
			width: 24px;
			height: 24px;
			border-radius: 50%;
			object-fit: cover;
		}
	}

	// Search trigger button — mirrors .nav-more-trigger
	.nav-search-trigger {
		display: flex;
		align-items: center;
		justify-content: center;
		align-self: stretch;
		padding: spacing.$unit calc(spacing.$unit * 1.5 + 1px);
		border-radius: layout.$full-corner;
		background-color: transparent;
		color: var(--menu-text);
		border: none;
		cursor: pointer;
		transition: background-color 0.2s ease;
		outline: none;

		&:hover {
			background-color: var(--menu-bg-item-hover);
		}

		&:focus-visible {
			box-shadow: 0 0 0 2px var(--accent-blue-focus);
		}
	}

	// Search list-item: fills the pill so NavUserSearch can stretch
	.nav-search {
		flex: 1;
		display: flex;
		align-items: stretch;
		min-width: 0;
	}

	// Element-specific SELECTED states for navigation links.
	// In `.pill-default` the background is rendered by <SlidingSelection> via the
	// `--sliding-selection-bg` CSS variable.
	@each $el in $elements {
		:global(nav.element-#{$el}) ul a.selected {
			background-color: var(--#{$el}-nav-selected-bg);
			color: var(--#{$el}-nav-selected-text);
			font-weight: typography.$bold;
		}

		:global(nav.element-#{$el}) .pill-default {
			--sliding-selection-bg: var(--#{$el}-nav-selected-bg);

			a.selected {
				background-color: transparent;
			}
		}
	}

	// `.pill-default` hosts the sliding indicator. It must establish a
	// positioning context, and its selectable children must sit above the indicator.
	.pill-default {
		position: relative;

		> a,
		> button {
			position: relative;
			z-index: 1;
		}

		> a.selected {
			background-color: transparent;
		}
	}
</style>

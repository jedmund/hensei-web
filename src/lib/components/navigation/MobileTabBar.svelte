<script lang="ts">
	import { afterNavigate } from '$app/navigation'
	import { m } from '$lib/paraglide/messages'
	import Icon from '../Icon.svelte'
	import CrewNotificationDot from './CrewNotificationDot.svelte'
	import NewTeamButton from './NewTeamButton.svelte'
	import { tabBarLinks, type TabBarLinkId } from './navLinks'
	import type { NavigationState } from './navigationState.svelte'

	interface Props {
		nav: NavigationState
		/** The "More" sheet; the bar stays visible while it's open */
		sheetOpen: boolean
	}

	let { nav, sheetOpen = $bindable(false) }: Props = $props()

	const links = $derived(tabBarLinks(nav.hrefs, nav.isAuth))

	// Profile shows the avatar, or the username's initial without one
	const ICONS: Record<Exclude<TabBarLinkId, 'profile'>, string> = {
		home: 'home',
		gallery: 'grid',
		newTeam: 'plus'
	}

	function isSelected(id: TabBarLinkId, href: string): boolean {
		if (id === 'profile') return nav.isProfileSelected
		return nav.isNavSelected(href)
	}

	// Hide on scroll: away while scrolling down, back when scrolling up, near
	// the top or at the bottom. Small movements (and iOS rubber-banding past
	// either end) are ignored.
	const THRESHOLD = 8
	const NEAR_TOP = 48
	let scrolledAway = $state(false)
	let lastY = 0

	function onScroll() {
		const max = document.documentElement.scrollHeight - window.innerHeight
		const y = Math.min(Math.max(window.scrollY, 0), Math.max(max, 0))
		const delta = y - lastY
		if (y <= NEAR_TOP || y >= max - 2) {
			scrolledAway = false
			lastY = y
			return
		}
		if (Math.abs(delta) < THRESHOLD) return
		scrolledAway = delta > 0
		lastY = y
	}

	afterNavigate(() => {
		scrolledAway = false
		lastY = window.scrollY
	})

	const hidden = $derived(scrolledAway && !sheetOpen)
</script>

<svelte:window onscroll={onScroll} />

<nav class="tab-bar {nav.elementClass}" class:hidden aria-label={m.nav_menu_button()}>
	{#each links as link (link.id)}
		{#if link.id === 'newTeam'}
			<div class="tab new-team">
				<NewTeamButton userElement={nav.userElement} />
			</div>
		{:else}
			{@const selected = isSelected(link.id, link.href)}
			<a href={link.href} class="tab" class:selected aria-current={selected ? 'page' : undefined}>
				{#if link.id === 'profile'}
					{#if nav.avatarSrc}
						<img
							class="tab-avatar"
							src={nav.avatarSrc}
							srcset={nav.avatarSrcSet}
							alt=""
							width="24"
							height="24"
						/>
					{:else}
						<span class="tab-avatar tab-initial" aria-hidden="true">
							{nav.username.charAt(0).toUpperCase()}
						</span>
					{/if}
				{:else}
					<Icon name={ICONS[link.id]} size={22} />
				{/if}
				<span class="tab-label">{link.label()}</span>
			</a>
		{/if}
	{/each}
	<button
		type="button"
		class="tab"
		class:selected={sheetOpen}
		aria-haspopup="dialog"
		aria-expanded={sheetOpen}
		onclick={() => (sheetOpen = true)}
	>
		<span class="more-icon">
			<Icon name="ellipsis" size={22} />
			{#if nav.notificationCount > 0}
				<span class="more-dot"><CrewNotificationDot element={nav.userElement} /></span>
			{/if}
		</span>
		<span class="tab-label">{m.nav_more()}</span>
	</button>
</nav>

<style lang="scss">
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	$elements: wind, fire, water, earth, dark, light;

	.tab-bar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: effects.$z-sticky;
		display: flex;
		align-items: stretch;
		justify-content: space-around;
		height: calc(var(--tab-bar-height) + env(safe-area-inset-bottom, 0px));
		padding: 0 spacing.$unit env(safe-area-inset-bottom, 0px);
		background: color-mix(in srgb, var(--menu-bg) 88%, transparent);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-top: 1px solid var(--separator-bg);
		transition: transform effects.$duration-slide ease-in-out;

		&.hidden {
			transform: translateY(100%);
		}

		@media (prefers-reduced-motion: reduce) {
			transition: none;
		}
	}

	.tab {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		min-width: 0;
		padding: 0;
		background: none;
		border: none;
		color: var(--text-secondary);
		font-family: var(--font-family);
		text-decoration: none;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;

		&.selected {
			color: var(--text-primary);
		}
	}

	.tab-label {
		font-size: typography.$font-tiny;
		font-weight: typography.$medium;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tab-avatar {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		object-fit: cover;
	}

	.tab-initial {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--button-bg);
		color: var(--text-primary);
		font-size: typography.$font-tiny;
		font-weight: typography.$bold;
	}

	.tab.selected .tab-avatar {
		box-shadow: 0 0 0 2px var(--text-primary);
	}

	.more-icon {
		position: relative;
		display: flex;
	}

	.more-dot {
		position: absolute;
		top: -2px;
		right: -4px;
	}

	// New team: the same round + button the top bar used to have
	.tab.new-team {
		cursor: default;
	}
</style>

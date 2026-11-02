<script lang="ts">
	import { m } from '$lib/paraglide/messages'
	import Icon from '../Icon.svelte'
	import CrewNotificationDot from './CrewNotificationDot.svelte'
	import NewTeamButton from './NewTeamButton.svelte'
	import { tabBarLinks, type TabBarLinkId } from './navLinks'
	import type { NavigationState } from './navigationState.svelte'

	interface Props {
		nav: NavigationState
		/** The menu sheet, opened by the last tab */
		sheetOpen: boolean
	}

	let { nav, sheetOpen = $bindable(false) }: Props = $props()

	const links = $derived(tabBarLinks(nav.hrefs, nav.isAuth))

	// Profile shows the avatar, or the username's initial without one
	const ICONS: Record<Exclude<TabBarLinkId, 'profile'>, string> = {
		home: 'home',
		gallery: 'search',
		newTeam: 'plus'
	}

	function isSelected(id: TabBarLinkId, href: string): boolean {
		if (id === 'profile') return nav.isProfileSelected
		return nav.isNavSelected(href)
	}
</script>

<nav class="tab-bar {nav.elementClass}" aria-label="Global">
	<!-- Sheen and rim highlights; a child layer, so Safari's toolbar tinting
	     ignores it -->
	<span class="glass" aria-hidden="true"></span>
	{#each links as link (link.id)}
		{#if link.id === 'newTeam'}
			<div class="tab new-team">
				<NewTeamButton userElement={nav.userElement} />
			</div>
		{:else}
			{@const selected = isSelected(link.id, link.href)}
			<a
				href={link.href}
				class="tab"
				class:selected
				aria-current={selected ? 'page' : undefined}
				aria-label={link.label()}
				title={link.label()}
			>
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
			</a>
		{/if}
	{/each}
	<button
		type="button"
		class="tab"
		class:selected={sheetOpen}
		aria-haspopup="dialog"
		aria-expanded={sheetOpen}
		aria-label={m.nav_menu_button()}
		title={m.nav_menu_button()}
		onclick={() => (sheetOpen = true)}
	>
		<span class="more-icon">
			<Icon name="menu" size={22} />
			{#if nav.notificationCount > 0}
				<span class="more-dot"><CrewNotificationDot element={nav.userElement} /></span>
			{/if}
		</span>
	</button>
</nav>

<style lang="scss">
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	$elements: wind, fire, water, earth, dark, light;

	// A floating glass capsule above the bottom edge (and Safari's own
	// toolbar), icons only; the selected tab gets a pill behind it. It always
	// stays put: moving it to the bottom edge (or past it) makes iOS Safari
	// stop drawing the page under its collapsed toolbar.
	.tab-bar {
		position: fixed;
		// Centered with margins, not a transform. It must not sit inside a
		// top-fixed container either (see (app)/+layout): iOS Safari moves it
		// with its toolbar, and either made that movement choppy
		left: 0;
		right: 0;
		margin-inline: auto;
		bottom: calc(var(--tab-bar-gap) + env(safe-area-inset-bottom, 0px));
		z-index: effects.$z-sticky;
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
		// Nearly the full width, so each tab gets a wide target
		width: calc(100% - #{spacing.$unit-4x});
		max-width: 480px;
		height: var(--tab-bar-pill);
		padding: spacing.$unit-half;
		border-radius: layout.$full-corner;
		background: color-mix(in srgb, var(--menu-bg) 72%, transparent);
		backdrop-filter: blur(20px) saturate(180%);
		-webkit-backdrop-filter: blur(20px) saturate(180%);
		border: 1px solid color-mix(in srgb, var(--text-primary) 10%, transparent);
		box-shadow:
			0 8px 24px rgba(0, 0, 0, 0.12),
			0 1px 3px rgba(0, 0, 0, 0.08);
	}

	// Light catching the glass, from straight above: a sheen fading down from
	// the top and a bright rim along the top edge
	.glass {
		position: absolute;
		inset: 0;
		border-radius: inherit;
		pointer-events: none;
		background: linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.45),
			rgba(255, 255, 255, 0.12) 45%,
			rgba(255, 255, 255, 0) 70%
		);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.85),
			inset 0 0 0 1px rgba(255, 255, 255, 0.25);
	}

	:global(html[data-theme='dark']) .glass {
		background: linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.14),
			rgba(255, 255, 255, 0.04) 45%,
			rgba(255, 255, 255, 0) 70%
		);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.22),
			inset 0 0 0 1px rgba(255, 255, 255, 0.06);
	}

	.tab {
		// Above the glass layer
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1 1 0;
		min-width: 0;
		height: 100%;
		padding: 0;
		border: none;
		border-radius: layout.$full-corner;
		background: none;
		color: var(--text-secondary);
		text-decoration: none;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition:
			background-color effects.$duration-quick ease,
			color effects.$duration-quick ease;

		// The selected tab is a lens tinted with the user's element (neutral
		// when signed out), and the icon takes the element's text color
		&.selected {
			background: color-mix(in srgb, var(--text-primary) 6%, transparent);
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.42);
			border: 0.5px solid rgba(0, 0, 0, 0.08);
			color: var(--text-primary);
		}
	}

	:global(html[data-theme='dark']) .tab.selected {
		background: rgba(255, 255, 255, 0.12);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
	}

	@each $el in $elements {
		.tab-bar.element-#{$el} .tab.selected {
			background: color-mix(in srgb, var(--#{$el}-button-bg) 10%, transparent);
			color: var(--#{$el}-ghost-text);
		}

		:global(html[data-theme='dark']) .tab-bar.element-#{$el} .tab.selected {
			background: color-mix(in srgb, var(--#{$el}-button-bg) 20%, transparent);
		}
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
		box-shadow: 0 0 0 2px currentColor;
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

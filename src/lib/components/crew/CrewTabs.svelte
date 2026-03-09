
<script lang="ts">
	import { page } from '$app/stores'

	type Element = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		userElement?: Element | string | undefined
	}

	const { userElement }: Props = $props()

	interface Tab {
		href: string
		label: string
		match: (pathname: string) => boolean
	}

	const tabs: Tab[] = [
		{
			href: '/crew',
			label: 'Events',
			match: (pathname) => pathname === '/crew'
		},
		{
			href: '/crew/members',
			label: 'Members',
			match: (pathname) => pathname.startsWith('/crew/members')
		},
		{
			href: '/crew/teams',
			label: 'Teams',
			match: (pathname) => pathname.startsWith('/crew/teams')
		},
		{
			href: '/crew/roster',
			label: 'Roster',
			match: (pathname) => pathname === '/crew/roster'
		}
	]

	const currentTab = $derived(tabs.find((tab) => tab.match($page.url.pathname))?.href ?? '/crew')
	const elementClass = $derived(userElement ? `element-${userElement}` : '')
</script>

<nav class="crew-tabs {elementClass}" aria-label="Crew navigation">
	{#each tabs as tab (tab.href)}
		<a href={tab.href} class="tab" class:active={currentTab === tab.href}>
			{tab.label}
		</a>
	{/each}
</nav>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;

	.crew-tabs {
		display: flex;
		gap: spacing.$unit-quarter;
		padding: 0 spacing.$unit-2x spacing.$unit;
		background: var(--menu-bg);
		border-bottom: 1px solid var(--border-subtle);
	}

	.tab {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: spacing.$unit-2x spacing.$unit-2x;
		border-radius: layout.$card-corner;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--menu-text);
		text-decoration: none;
		transition:
			color 0.15s,
			background-color 0.15s;

		&:hover {
			background: var(--menu-bg-item-hover);
		}

		&.active {
			font-weight: typography.$bold;
			background: var(--menu-bg-item-selected, var(--menu-bg-item-hover));
		}
	}

	// Element-specific active states
	nav.element-wind .tab.active {
		background-color: var(--wind-nav-selected-bg);
		color: var(--wind-nav-selected-text);
	}

	nav.element-fire .tab.active {
		background-color: var(--fire-nav-selected-bg);
		color: var(--fire-nav-selected-text);
	}

	nav.element-water .tab.active {
		background-color: var(--water-nav-selected-bg);
		color: var(--water-nav-selected-text);
	}

	nav.element-earth .tab.active {
		background-color: var(--earth-nav-selected-bg);
		color: var(--earth-nav-selected-text);
	}

	nav.element-dark .tab.active {
		background-color: var(--dark-nav-selected-bg);
		color: var(--dark-nav-selected-text);
	}

	nav.element-light .tab.active {
		background-color: var(--light-nav-selected-bg);
		color: var(--light-nav-selected-text);
	}
</style>

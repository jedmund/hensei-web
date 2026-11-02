<script lang="ts">
	import DatabaseNavigation from './DatabaseNavigation.svelte'
	import BahamutBar from './navigation/BahamutBar.svelte'
	import MobileNavSheet from './navigation/MobileNavSheet.svelte'
	import MobileTabBar from './navigation/MobileTabBar.svelte'
	import NavModals from './navigation/NavModals.svelte'
	import { NavigationState, type NavigationProps } from './navigation/navigationState.svelte'

	const props: NavigationProps = $props()

	const nav = new NavigationState(() => props)

	let sheetOpen = $state(false)
</script>

{#if nav.isBahamut && nav.currentUser}
	<!-- With the tab bar, the nav container has no box (see (app)/+layout), so
	     the Bahamut bar pins itself to the top -->
	<div class="bahamut-top" class:pinned={!nav.isDatabaseRoute}>
		<BahamutBar currentUser={nav.currentUser} />
	</div>
{/if}

<!-- Phones: the Database keeps its own top bar; everywhere else navigation is
     the tab bar at the bottom, with everything else in its menu sheet -->
{#if nav.isDatabaseRoute}
	<nav aria-label="Global" class="database-layout {nav.elementClass}">
		<DatabaseNavigation userElement={nav.userElement} role={nav.role} />
	</nav>
{:else}
	<MobileTabBar {nav} bind:sheetOpen />
{/if}

<MobileNavSheet {nav} bind:open={sheetOpen} />

<NavModals {nav} />

<style lang="scss">
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;

	.bahamut-top.pinned {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: effects.$z-sticky;
	}

	nav {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		max-width: var(--main-max-width);
		margin: 0 auto;
		width: 100%;
		padding: spacing.$unit layout.$database-gutter-phone;
	}
</style>

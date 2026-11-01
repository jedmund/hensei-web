<script lang="ts">
	import { m } from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { HOME_LAUNCHED } from '$lib/utils/browseRoutes'
	import DatabaseNavigation from './DatabaseNavigation.svelte'
	import Icon from './Icon.svelte'
	import BahamutBar from './navigation/BahamutBar.svelte'
	import MobileNavSheet from './navigation/MobileNavSheet.svelte'
	import NavModals from './navigation/NavModals.svelte'
	import NewTeamButton from './navigation/NewTeamButton.svelte'
	import { NavigationState, type NavigationProps } from './navigation/navigationState.svelte'

	const props: NavigationProps = $props()

	const nav = new NavigationState(() => props)

	// Signed-in users' collection lives under their profile
	const collectionHref = $derived(
		nav.isAuth ? localizeHref(`/${nav.username}/collection`) : nav.hrefs.collection
	)

	// Current page label
	const currentPageLabel = $derived.by(() => {
		const { hrefs, isNavSelected } = nav
		if (isNavSelected(hrefs.home)) return m.nav_home()
		if (isNavSelected(hrefs.gallery)) return m.nav_gallery()
		if (isNavSelected(hrefs.crew)) return m.nav_crew()
		if (isNavSelected(collectionHref)) return m.nav_collection()
		if (nav.isProfileSelected) return nav.username
		if (isNavSelected(hrefs.about)) return m.nav_about()
		if (isNavSelected(hrefs.gacha)) return m.nav_gacha()
		if (isNavSelected(hrefs.extension)) return m.nav_extension()
		if (isNavSelected(hrefs.database)) return m.nav_database()
		if (isNavSelected(hrefs.login)) return m.nav_login()
		if (isNavSelected(hrefs.register)) return m.nav_register()
		return HOME_LAUNCHED ? m.nav_home() : m.nav_gallery()
	})

	let sheetOpen = $state(false)
</script>

{#if nav.isBahamut && nav.currentUser}
	<BahamutBar currentUser={nav.currentUser} />
{/if}

<nav aria-label="Global" class={nav.elementClass} class:database-layout={nav.isDatabaseRoute}>
	{#if nav.isDatabaseRoute}
		<DatabaseNavigation userElement={nav.userElement} role={nav.role} />
	{:else}
		<button class="mobile-nav-trigger" onclick={() => (sheetOpen = true)}>
			<span class="trigger-label">{currentPageLabel}</span>
			<Icon name="chevron-down" size={14} />
		</button>

		<NewTeamButton userElement={nav.userElement} />
	{/if}
</nav>

<MobileNavSheet {nav} bind:open={sheetOpen} />

<NavModals {nav} />

<style lang="scss">
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	nav {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit 0;
		max-width: var(--main-max-width);
		margin: 0 auto;
		width: 100%;

		@media (max-width: 768px) {
			padding: spacing.$unit;
		}

		// Line up with the database page's gutter
		&.database-layout {
			padding-inline: layout.$database-gutter-phone;
		}
	}

	.mobile-nav-trigger {
		background-color: var(--menu-bg);
		border: effects.$page-border;
		box-shadow: effects.$page-elevation;
		border-radius: layout.$full-corner;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit;
		height: calc(spacing.$unit * 5.5);
		padding: 0 (spacing.$unit * 1.5);
		cursor: pointer;
		font-family: var(--font-family);
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--menu-text);
		flex: 1;
		margin-right: spacing.$unit;
	}

	.trigger-label {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>

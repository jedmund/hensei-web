<script lang="ts">
	import { m } from '$lib/paraglide/messages'
	import DatabaseNavigation from './DatabaseNavigation.svelte'
	import BahamutBar from './navigation/BahamutBar.svelte'
	import NavMainLinks from './navigation/NavMainLinks.svelte'
	import NavModals from './navigation/NavModals.svelte'
	import NewTeamButton from './navigation/NewTeamButton.svelte'
	import { NavigationState, type NavigationProps } from './navigation/navigationState.svelte'

	// Props from layout data
	const props: NavigationProps = $props()

	const nav = new NavigationState(() => props)
</script>

{#if nav.isBahamut && nav.currentUser}
	<BahamutBar currentUser={nav.currentUser} />
{/if}

<nav aria-label="Global" class={nav.elementClass} class:database-layout={nav.isDatabaseRoute}>
	{#if nav.isDatabaseRoute}
		<DatabaseNavigation userElement={nav.userElement} role={nav.role} />
	{:else}
		<div class="nav-links">
			<NavMainLinks {nav} />

			{#if !nav.isAuth}
				<ul role="list">
					<li>
						<a href={nav.hrefs.register} class:selected={nav.isNavSelected(nav.hrefs.register)}
							>{m.nav_register()}</a
						>
					</li>
					<li>
						<a href={nav.hrefs.login} class:selected={nav.isNavSelected(nav.hrefs.login)}
							>{m.nav_login()}</a
						>
					</li>
				</ul>
			{/if}
		</div>
	{/if}
	{#if !nav.isDatabaseRoute}
		<NewTeamButton userElement={nav.userElement} />
	{/if}
</nav>

<NavModals {nav} />

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/navigation' as navigation;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	$elements: wind, fire, water, earth, dark, light;

	nav {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit-2x 0;
		max-width: var(--main-max-width);
		margin: 0 auto;
		width: 100%;

		// Match the database page width; beside the sidebar, start where the
		// content column starts so the bar never overlaps the sidebar
		&.database-layout {
			max-width: layout.$database-max-width;

			@media (min-width: layout.$database-sidebar-breakpoint) {
				padding-left: calc(layout.$database-sidebar-width + layout.$database-sidebar-gap);
			}
		}

		// Responsive padding
		@media (max-width: 768px) {
			padding: spacing.$unit;
		}

		// The signed-out Register / Log in pill
		ul {
			@include navigation.nav-pill-bar;

			li {
				@include navigation.nav-pill-item;
			}

			a {
				@include navigation.nav-pill-link;
			}
		}

		// Group nav pills together so space-between doesn't split them
		.nav-links {
			display: flex;
			gap: spacing.$unit;
			align-items: center;
		}
	}

	// Element-specific SELECTED states for the Register / Log in pill and the
	// database navigation
	@each $el in $elements {
		nav.element-#{$el} {
			ul a.selected {
				background-color: var(--#{$el}-nav-selected-bg);
				color: var(--#{$el}-nav-selected-text);
				font-weight: typography.$bold;
			}
		}

		:global(nav.element-#{$el} .database-nav a.selected) {
			background-color: var(--#{$el}-nav-selected-bg);
			color: var(--#{$el}-nav-selected-text);
			font-weight: typography.$bold;
		}
	}
</style>

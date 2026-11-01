<script lang="ts">
	import { beforeNavigate } from '$app/navigation'
	import { m } from '$lib/paraglide/messages'
	import LanguageToggle from '../LanguageToggle.svelte'
	import ThemeToggle from '../ThemeToggle.svelte'
	import BottomSheet from '../ui/BottomSheet.svelte'
	import NotificationBadge from '../ui/NotificationBadge.svelte'
	import CrewNotificationDot from './CrewNotificationDot.svelte'
	import { logout, type NavigationState } from './navigationState.svelte'

	interface Props {
		nav: NavigationState
		open: boolean
	}

	let { nav, open = $bindable(false) }: Props = $props()

	// Close sheet on navigation
	beforeNavigate(() => {
		open = false
	})
</script>

<!-- The mobile menu: every link and account action, in a bottom sheet -->
<BottomSheet bind:open>
	<div class="mobile-nav-sheet {nav.elementClass}">
		<ul class="sheet-nav-group" role="list">
			{#each nav.mainLinks as link (link.id)}
				<li>
					{#if link.id === 'profile'}
						<a href={link.href} class:selected={nav.isProfileSelected} class="profile-link">
							<span>{nav.username}</span>
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
						</a>
					{:else}
						<a href={link.href} class:selected={nav.isNavSelected(link.href)}>
							{link.label()}
							{#if link.id === 'crew' && nav.notificationCount > 0}
								<CrewNotificationDot element={nav.userElement} />
							{/if}
						</a>
					{/if}
				</li>
			{/each}
		</ul>
		<hr class="sheet-separator" />
		<ul class="sheet-nav-group" role="list">
			{#each nav.moreLinks as link (link.id)}
				<li><a href={link.href}>{link.label()}</a></li>
			{/each}
		</ul>
		<hr class="sheet-separator" />
		{#if nav.isAuth}
			<ul class="sheet-nav-group" role="list">
				<li>
					<button
						class="sheet-button-with-badge"
						onclick={() => {
							open = false
							nav.invitationsModalOpen = true
						}}
					>
						<span>{m.nav_notifications()}</span>
						{#if nav.notificationCount > 0}
							<NotificationBadge
								count={nav.notificationCount}
								showCount
								element={nav.userElement}
							/>
						{/if}
					</button>
				</li>
				<li>
					<button
						onclick={() => {
							open = false
							nav.settingsModalOpen = true
						}}
					>
						{m.nav_settings()}
					</button>
				</li>
			</ul>
			<hr class="sheet-separator" />
		{/if}
		<div class="sheet-nav-toggles">
			<LanguageToggle />
			<ThemeToggle />
		</div>
		<hr class="sheet-separator" />
		<ul class="sheet-nav-group" role="list">
			{#if nav.isAuth}
				<li><button onclick={logout}>{m.nav_logout()}</button></li>
			{:else}
				<li><a href={nav.hrefs.login}>{m.nav_login()}</a></li>
				<li><a href={nav.hrefs.register}>{m.nav_register()}</a></li>
			{/if}
		</ul>
	</div>
</BottomSheet>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	$elements: wind, fire, water, earth, dark, light;

	.mobile-nav-sheet {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.sheet-nav-group {
		list-style: none;
		padding: 0;
		margin: 0;

		li {
			a,
			button {
				display: flex;
				align-items: center;
				width: 100%;
				padding: calc(spacing.$unit * 1.5) spacing.$unit;
				border-radius: layout.$card-corner;
				color: var(--text-primary);
				text-decoration: none;
				font-size: typography.$font-regular;
				font-weight: typography.$medium;
				background: none;
				border: none;
				cursor: pointer;
				font-family: var(--font-family);
				gap: spacing.$unit-half;

				&:hover {
					background: var(--menu-bg-item-hover);
				}
			}
		}
	}

	.sheet-button-with-badge {
		justify-content: space-between;
	}

	.sheet-separator {
		border: none;
		height: 2px;
		background-color: var(--separator-bg);
		border-radius: 1px;
		margin: spacing.$unit 0;
	}

	.sheet-nav-toggles {
		padding: spacing.$unit-half 0;

		:global(.language-row),
		:global(.theme-row) {
			padding: calc(spacing.$unit * 1.5) spacing.$unit;
		}

		:global(.language-label),
		:global(.theme-label) {
			font-size: typography.$font-regular;
			color: var(--text-primary);
		}
	}

	// Profile link with avatar on right
	.profile-link {
		justify-content: space-between;

		.user-avatar {
			width: 24px;
			height: 24px;
			border-radius: 50%;
			object-fit: cover;
		}
	}

	// Element-specific selected states in sheet
	@each $el in $elements {
		.mobile-nav-sheet.element-#{$el} {
			.sheet-nav-group li a.selected {
				background-color: var(--#{$el}-nav-selected-bg);
				color: var(--#{$el}-nav-selected-text);
			}
		}
	}

	// Fallback selected state when no element is set
	.sheet-nav-group li a.selected {
		background-color: var(--null-nav-selected-bg);
		color: var(--null-nav-selected-text);
	}
</style>

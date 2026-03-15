<script lang="ts">
	import { Switch as SwitchPrimitive } from 'bits-ui'
	import * as m from '$lib/paraglide/messages'
	import { themeStore } from '$lib/stores/theme.svelte'
	import { authStore } from '$lib/stores/auth.store.svelte'
	import { users } from '$lib/api/resources/users'
	import SunIcon from '$src/assets/icons/sun.svg?raw'
	import MoonIcon from '$src/assets/icons/moon.svg?raw'

	const isDark = $derived(themeStore.resolved === 'dark')

	function handleToggle(checked: boolean) {
		const newTheme = checked ? 'dark' : 'light'
		themeStore.setTheme(newTheme)
		document.cookie = `theme=${newTheme};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`

		if (authStore.isAuthenticated && authStore.user) {
			users.update(authStore.user.id, { theme: newTheme })
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="theme-row" onpointerdown={(e) => e.stopPropagation()} onclick={(e) => e.stopPropagation()}>
	<span class="theme-label">{m.nav_theme()}</span>
	<SwitchPrimitive.Root
		checked={isDark}
		onCheckedChange={handleToggle}
		class="theme-switch"
	>
		<SwitchPrimitive.Thumb class="theme-thumb" />
		<span class="track-label left">{@html MoonIcon}</span>
		<span class="track-label right">{@html SunIcon}</span>
	</SwitchPrimitive.Root>
</div>

<style lang="scss">
	@use '$src/themes/typography' as typography;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/colors' as colors;
	@use '$src/themes/effects' as effects;

	.theme-row {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit calc(spacing.$unit * 1.5);
		width: 100%;
	}

	.theme-label {
		flex: 1;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--menu-text);
		user-select: none;
	}

	:global(.theme-switch) {
		$height: 24px;

		background: #d4a017;
		border-radius: calc($height / 2);
		border: none;
		position: relative;
		width: 44px;
		height: $height;
		cursor: pointer;
		flex-shrink: 0;
		@include effects.smooth-transition(effects.$duration-instant, background-color);
	}

	:global(.theme-switch[data-state='checked']) {
		background: #4a2d7a;
	}

	:global(.theme-thumb) {
		$diameter: 18px;

		background: colors.$grey-100;
		border-radius: calc($diameter / 2);
		display: block;
		height: $diameter;
		width: $diameter;
		position: absolute;
		top: 3px;
		left: 3px;
		z-index: 3;
		cursor: pointer;
		@include effects.smooth-transition(effects.$duration-instant, left);
	}

	:global(.theme-thumb[data-state='checked']) {
		left: 23px;
	}

	.track-label {
		color: colors.$grey-100;
		position: absolute;
		z-index: 2;
		user-select: none;
		pointer-events: none;
		display: flex;
		align-items: center;
		justify-content: center;

		:global(svg) {
			width: 12px;
			height: 12px;
		}

		&.left {
			top: 6px;
			left: 5px;
		}

		&.right {
			top: 6px;
			right: 4px;
		}
	}
</style>

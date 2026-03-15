<script lang="ts">
	import { getLocale } from '$lib/paraglide/runtime.js'
	import { invalidateAll } from '$app/navigation'
	import { Switch as SwitchPrimitive } from 'bits-ui'
	import * as m from '$lib/paraglide/messages'
	import { authStore } from '$lib/stores/auth.store.svelte'
	import { users } from '$lib/api/resources/users'
	import type { AppLocale } from '$lib/utils/locale'

	const locale = $derived(getLocale() as AppLocale)
	const isJapanese = $derived(locale === 'ja')

	async function handleToggle(checked: boolean) {
		const newLocale: AppLocale = checked ? 'ja' : 'en'
		if (newLocale === locale) return

		document.cookie = `PARAGLIDE_LOCALE=${newLocale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`

		if (authStore.isAuthenticated && authStore.user) {
			users.update(authStore.user.id, { language: newLocale })
		}

		await invalidateAll()
		window.location.reload()
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="language-row" onpointerdown={(e) => e.stopPropagation()} onclick={(e) => e.stopPropagation()}>
	<span class="language-label">{m.nav_language()}</span>
	<SwitchPrimitive.Root
		checked={isJapanese}
		onCheckedChange={handleToggle}
		class="language-switch"
	>
		<SwitchPrimitive.Thumb class="language-thumb" />
		<span class="track-label left">JP</span>
		<span class="track-label right">EN</span>
	</SwitchPrimitive.Root>
</div>

<style lang="scss">
	@use '$src/themes/typography' as typography;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/colors' as colors;
	@use '$src/themes/effects' as effects;

	.language-row {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit calc(spacing.$unit * 1.5);
		width: 100%;
	}

	.language-label {
		flex: 1;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--menu-text);
		user-select: none;
	}

	:global(.language-switch) {
		$height: 24px;

		background: colors.$grey-60;
		border-radius: calc($height / 2);
		border: none;
		position: relative;
		width: 44px;
		height: $height;
		cursor: pointer;
		flex-shrink: 0;
	}

	:global(.language-thumb) {
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

	:global(.language-thumb[data-state='checked']) {
		left: 23px;
	}

	.track-label {
		color: colors.$grey-100;
		font-size: 10px;
		font-weight: typography.$bold;
		position: absolute;
		z-index: 2;
		user-select: none;
		pointer-events: none;

		&.left {
			top: 6px;
			left: 6px;
		}

		&.right {
			top: 6px;
			right: 5px;
		}
	}
</style>

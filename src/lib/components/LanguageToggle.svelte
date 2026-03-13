<script lang="ts">
	import { getLocale } from '$lib/paraglide/runtime.js'
	import { invalidateAll } from '$app/navigation'
	import type { AppLocale } from '$lib/utils/locale'

	const locale = $derived(getLocale() as AppLocale)
	const otherLocale = $derived(locale === 'en' ? 'ja' : 'en')
	const label = $derived(locale === 'en' ? '日本語' : 'English')

	async function toggle() {
		// Set the Paraglide cookie
		document.cookie = `PARAGLIDE_LOCALE=${otherLocale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`

		await invalidateAll()
		window.location.reload()
	}
</script>

<button class="language-toggle" onclick={toggle} aria-label={label}>
	<span class="current">{locale.toUpperCase()}</span>
	<span class="divider">/</span>
	<span class="other">{otherLocale.toUpperCase()}</span>
</button>

<style lang="scss">
	@use '$src/themes/typography' as typography;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;

	.language-toggle {
		display: flex;
		align-items: center;
		gap: 2px;
		padding: spacing.$unit calc(spacing.$unit * 1.5);
		border-radius: layout.$full-corner;
		background: transparent;
		border: none;
		cursor: pointer;
		font-family: var(--font-family);
		font-size: typography.$font-small;
		color: var(--menu-text);
		transition: background-color 0.2s ease;

		&:hover {
			background-color: var(--menu-bg-item-hover);
		}

		.current {
			font-weight: typography.$bold;
		}

		.divider {
			color: var(--text-tertiary);
			margin: 0 1px;
		}

		.other {
			font-weight: typography.$regular;
			color: var(--text-secondary);
		}
	}
</style>

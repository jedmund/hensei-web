<script lang="ts">
	import { getLocale } from '$lib/paraglide/runtime.js'
	import { invalidateAll } from '$app/navigation'
	import Switch from './ui/switch/Switch.svelte'
	import type { AppLocale } from '$lib/utils/locale'

	const locale = $derived(getLocale() as AppLocale)
	const isJapanese = $derived(locale === 'ja')

	async function handleToggle(checked: boolean) {
		const newLocale: AppLocale = checked ? 'ja' : 'en'
		if (newLocale === locale) return

		document.cookie = `PARAGLIDE_LOCALE=${newLocale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
		await invalidateAll()
		window.location.reload()
	}
</script>

<div class="language-toggle" role="group" aria-label="Language">
	<span class="label" class:active={!isJapanese}>EN</span>
	<Switch checked={isJapanese} size="small" onCheckedChange={handleToggle} />
	<span class="label" class:active={isJapanese}>JP</span>
</div>

<style lang="scss">
	@use '$src/themes/typography' as typography;
	@use '$src/themes/spacing' as spacing;

	.language-toggle {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit calc(spacing.$unit * 1.5);
		width: 100%;
	}

	.label {
		font-size: typography.$font-small;
		font-weight: typography.$normal;
		color: var(--text-tertiary);
		user-select: none;

		&.active {
			font-weight: typography.$bold;
			color: var(--text-primary);
		}
	}
</style>

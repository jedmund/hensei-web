<script lang="ts">
	import { getLocale } from '$lib/paraglide/runtime.js'
	import { invalidateAll } from '$app/navigation'
	import type { AppLocale } from '$lib/utils/locale'

	const locale = $derived(getLocale() as AppLocale)
	const otherLocale = $derived(locale === 'en' ? 'ja' : 'en')
	const label = $derived(locale === 'en' ? '日本語' : 'English')

	async function toggle() {
		document.cookie = `PARAGLIDE_LOCALE=${otherLocale};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
		await invalidateAll()
		window.location.reload()
	}
</script>

<button onclick={toggle}>{label}</button>

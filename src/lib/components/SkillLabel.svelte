<script lang="ts">
	import { getLocale } from '$lib/paraglide/runtime.js'

	interface Props {
		/** In-game label texture slug (e.g. "omega-might"); null renders the text label */
		slug: string | null
		/** Accessible label text (also the visual fallback when no image exists) */
		label: string
	}

	let { slug, label }: Props = $props()

	// Build-time manifest of available label textures, per locale. Japanese variants
	// drop into src/assets/skill-labels/ja/ with the same filenames and take over
	// automatically for the ja locale; missing files fall back to en, then to text.
	const textures = import.meta.glob('/src/assets/skill-labels/*/*.png', {
		eager: true,
		query: '?url',
		import: 'default'
	}) as Record<string, string>

	const src = $derived.by(() => {
		if (!slug) return null
		const locale = getLocale()
		return (
			textures[`/src/assets/skill-labels/${locale}/${slug}.png`] ??
			textures[`/src/assets/skill-labels/en/${slug}.png`] ??
			null
		)
	})
</script>

{#if src}
	<img class="skill-label" {src} alt={label} loading="lazy" />
{:else}
	<span class="skill-label-text">{label}</span>
{/if}

<style lang="scss">
	@use '$src/themes/typography' as *;

	.skill-label {
		display: block;
		height: $font-xlarge; // badge stands in for the row's text, so track the type scale
		width: auto;
	}

	.skill-label-text {
		font-size: $font-regular;
		color: var(--text-secondary);
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>

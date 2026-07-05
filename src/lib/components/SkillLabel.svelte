<script lang="ts">
	import { getLocale } from '$lib/paraglide/runtime.js'
	import { getSkillLabelImage } from '$lib/utils/images'

	interface Props {
		/** In-game label texture slug (e.g. "omega-might"); null renders the text label */
		slug: string | null
		/** Accessible label text (also the visual fallback when no image exists) */
		label: string
	}

	let { slug, label }: Props = $props()

	// Badges live on S3 with the rest of our images (icons/skill-labels/{en,ja}/).
	// Load order: locale variant → en variant → plain text, stepping down on 404.
	type Stage = 'locale' | 'en' | 'text'
	let stage = $state<Stage>('locale')

	// Reset the fallback chain whenever the slug (or locale) changes.
	$effect(() => {
		void slug
		stage = getLocale() === 'en' ? 'en' : 'locale'
	})

	const src = $derived.by(() => {
		if (!slug || stage === 'text') return null
		return getSkillLabelImage(slug, stage === 'locale' ? getLocale() : 'en')
	})

	function handleError() {
		stage = stage === 'locale' ? 'en' : 'text'
	}
</script>

{#if src}
	<img class="skill-label" {src} alt={label} loading="lazy" onerror={handleError} />
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

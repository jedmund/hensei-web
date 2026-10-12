<script lang="ts">
	import type { GuideEffect } from '$lib/types/api/solomonis'
	import { guideEffectIconCategory, guideEffectIconSrc } from './guidebook'
	import { iconCategoryLabel } from './labels'

	interface Props {
		effect: GuideEffect
		size?: 'small' | 'medium'
	}

	let { effect, size = 'medium' }: Props = $props()

	const src = $derived(guideEffectIconSrc(effect))
	const category = $derived(guideEffectIconCategory(effect))
	const label = $derived(iconCategoryLabel(category))
</script>

{#if src}
	<img class="guide-effect-icon {size}" {src} alt={label} loading="lazy" />
{:else}
	<!-- Placeholder until the game's icon URL pattern is known (see guideEffectIconSrc). -->
	<span class="guide-effect-icon placeholder {size} {category}" role="img" aria-label={label}
	></span>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;

	.guide-effect-icon {
		display: block;
		flex-shrink: 0;
		border-radius: $item-corner-small;

		&.medium {
			width: $unit-5x;
			height: $unit-5x;
		}

		&.small {
			width: $unit-4x;
			height: $unit-4x;
		}
	}

	.placeholder {
		border: 1px solid var(--border-subtle);

		&.offence {
			background: var(--fire-nav-selected-bg);
		}

		&.defence {
			background: var(--water-nav-selected-bg);
		}

		&.special {
			background: var(--light-nav-selected-bg);
		}

		&.cursed {
			background: var(--dark-nav-selected-bg);
		}
	}
</style>

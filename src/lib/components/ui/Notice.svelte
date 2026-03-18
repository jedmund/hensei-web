<script lang="ts">
	import type { Snippet } from 'svelte'

	type Variant = 'blue' | 'yellow' | 'red' | 'wind' | 'fire' | 'water' | 'earth' | 'light' | 'dark'

	interface Props {
		variant?: Variant
		icon?: Snippet
		children: Snippet
	}

	let { variant = 'blue', icon, children }: Props = $props()

	const elementVariants = ['wind', 'fire', 'water', 'earth', 'light', 'dark']
	const isElement = $derived(elementVariants.includes(variant))
</script>

<div
	class="notice {variant}"
	class:element={isElement}
	role="status"
>
	{#if icon}
		<span class="notice-icon">
			{@render icon()}
		</span>
	{/if}
	<span class="notice-text">
		{@render children()}
	</span>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	.notice {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit-2x;
		border-radius: $card-corner;
		font-size: $font-small;
	}

	.notice-icon {
		display: flex;
		flex-shrink: 0;
	}

	// Fixed color variants
	.blue {
		background: var(--blue-subtle);
		color: var(--accent-blue);
	}

	.yellow {
		background: rgba(209, 137, 58, 0.15);
		color: var(--accent-yellow);
	}

	.red {
		background: rgba(220, 53, 53, 0.15);
		color: var(--red);
	}

	// Element variants
	.wind {
		background: var(--wind-bg);
		color: var(--wind-text);
	}

	.fire {
		background: var(--fire-bg);
		color: var(--fire-text);
	}

	.water {
		background: var(--water-bg);
		color: var(--water-text);
	}

	.earth {
		background: var(--earth-bg);
		color: var(--earth-text);
	}

	.light {
		background: var(--light-bg);
		color: var(--light-text);
	}

	.dark {
		background: var(--dark-bg);
		color: var(--dark-text);
	}
</style>

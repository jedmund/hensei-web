<script lang="ts">
	import type { Snippet } from 'svelte'

	type Variant =
		| 'gray'
		| 'blue'
		| 'yellow'
		| 'red'
		| 'wind'
		| 'fire'
		| 'water'
		| 'earth'
		| 'light'
		| 'dark'

	interface Props {
		variant?: Variant
		icon?: Snippet
		children: Snippet
	}

	let { variant = 'gray', icon, children }: Props = $props()

	const elementVariants = ['wind', 'fire', 'water', 'earth', 'light', 'dark']
	const isElement = $derived(elementVariants.includes(variant))
</script>

<div class="notice {variant}" class:element={isElement} role="status">
	{#if icon}
		<span class="notice-icon">
			{@render icon()}
		</span>
	{/if}
	<div class="notice-text">
		{@render children()}
	</div>
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

	.notice-text {
		display: flex;
		flex-direction: column;
		gap: $unit;
		font-size: $font-regular;
		line-height: 1.5;
		margin: 0;

		:global(p) {
			margin: 0;
		}
	}

	.notice-icon {
		display: flex;
		flex-shrink: 0;
	}

	// Fixed color variants
	.gray {
		background: var(--notice-grey-bg);
		color: var(--notice-grey-text);
	}

	.blue {
		background: var(--notice-blue-bg);
		color: var(--notice-blue-text);
	}

	.yellow {
		background: var(--notice-yellow-bg);
		color: var(--notice-yellow-text);
	}

	.red {
		background: var(--notice-red-bg);
		color: var(--notice-red-text);
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

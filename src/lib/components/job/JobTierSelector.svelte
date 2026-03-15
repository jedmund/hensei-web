<script lang="ts">
	type ElementType = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Tier {
		value: string
		label: string
		shortLabel: string
	}

	interface Props {
		tiers: Tier[]
		selectedTiers: Set<string>
		onToggleTier: (value: string) => void
		element?: ElementType
	}

	let { tiers, selectedTiers, onToggleTier, element }: Props = $props()

	// Split tiers into two rows
	const firstRowTiers = $derived(tiers.filter(t => ['1', '2', '3', '4', '5'].includes(t.value)))
	const secondRowTiers = $derived(tiers.filter(t => ['ex', 'ex2', 'o1'].includes(t.value)))

	function handleTierClick(value: string) {
		onToggleTier(value)
	}
</script>

<div class="tier-selector {element ?? ''}">
	<div class="tier-row">
		{#each firstRowTiers as tier (tier.value)}
			<button
				class="tier-button"
				class:selected={selectedTiers.has(tier.value)}
				onclick={() => handleTierClick(tier.value)}
				type="button"
			>
				{tier.shortLabel}
			</button>
		{/each}
	</div>
	<div class="tier-row">
		{#each secondRowTiers as tier (tier.value)}
			<button
				class="tier-button"
				class:selected={selectedTiers.has(tier.value)}
				onclick={() => handleTierClick(tier.value)}
				type="button"
			>
				{tier.shortLabel}
			</button>
		{/each}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/effects' as *;

	.tier-selector {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
	}

	.tier-row {
		display: flex;
		gap: $unit-half;

		.tier-button {
			flex: 1;
		}
	}

	.tier-button {
		padding: $unit $unit-2x;
		background: var(--tier-button-bg);
		border: 1px solid transparent;
		border-radius: $card-corner;
		font-size: $font-small;
		font-weight: $medium;
		color: var(--tier-button-text);
		cursor: pointer;
		@include smooth-transition($duration-quick, background-color, color, border-color);
		user-select: none;
		font-family: var(--font-family);
		text-align: center;

		&:hover:not(.selected) {
			background: var(--tier-button-bg-hover);
			color: var(--tier-button-text-hover);
		}

		&.selected {
			background: var(--button-primary-bg);
			color: var(--button-primary-text);
			border-color: var(--button-primary-border);

			&:hover {
				background: var(--button-primary-bg-hover);
			}
		}

		&:active {
			transform: translateY(1px);
		}
	}

	// Element-specific selected colors
	.tier-selector {
		&.wind .tier-button.selected {
			background: var(--wind-nav-selected-bg);
			color: var(--wind-nav-selected-text);
			border-color: transparent;
		}
		&.fire .tier-button.selected {
			background: var(--fire-nav-selected-bg);
			color: var(--fire-nav-selected-text);
			border-color: transparent;
		}
		&.water .tier-button.selected {
			background: var(--water-nav-selected-bg);
			color: var(--water-nav-selected-text);
			border-color: transparent;
		}
		&.earth .tier-button.selected {
			background: var(--earth-nav-selected-bg);
			color: var(--earth-nav-selected-text);
			border-color: transparent;
		}
		&.dark .tier-button.selected {
			background: var(--dark-nav-selected-bg);
			color: var(--dark-nav-selected-text);
			border-color: transparent;
		}
		&.light .tier-button.selected {
			background: var(--light-nav-selected-bg);
			color: var(--light-nav-selected-text);
			border-color: transparent;
		}
	}
</style>

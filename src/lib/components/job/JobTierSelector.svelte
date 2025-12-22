<script lang="ts">
	import type { ComponentProps } from 'svelte'

	interface Tier {
		value: string
		label: string
		shortLabel: string
	}

	interface Props {
		tiers: Tier[]
		selectedTiers: Set<string>
		onToggleTier: (value: string) => void
	}

	let { tiers, selectedTiers, onToggleTier }: Props = $props()

	// Split tiers into two rows
	const firstRowTiers = $derived(tiers.filter(t => ['1', '2', '3', '4', '5'].includes(t.value)))
	const secondRowTiers = $derived(tiers.filter(t => ['ex', 'ex2', 'o1'].includes(t.value)))

	function handleTierClick(value: string) {
		onToggleTier(value)
	}
</script>

<div class="tier-selector">
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
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/effects' as effects;

	.tier-selector {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.tier-row {
		display: flex;
		gap: spacing.$unit-half;

		&:first-child {
			// First row with 5 items
			.tier-button {
				flex: 1;
			}
		}

		&:last-child {
			// Second row with 3 items
			.tier-button {
				flex: 1;
			}
		}
	}

	.tier-button {
		padding: spacing.$unit spacing.$unit-2x;
		background: var(--button-secondary-bg);
		border: 1px solid transparent;
		border-radius: layout.$card-corner;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--button-secondary-text);
		cursor: pointer;
		transition: all effects.$duration-quick ease;
		user-select: none;
		font-family: var(--font-family);
		text-align: center;

		&:hover:not(.selected) {
			background: var(--button-secondary-bg-hover);
			color: var(--button-secondary-text-hover);
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
</style>

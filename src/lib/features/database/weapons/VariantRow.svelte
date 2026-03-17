<script lang="ts">
	import type { WeaponSeriesVariant } from '$lib/types/api/weaponSeriesVariant'
	import { getAugmentTypeLabel } from '$lib/utils/augmentType'

	interface Props {
		variant: WeaponSeriesVariant
		onclick?: () => void
	}

	let { variant, onclick }: Props = $props()

	function formatOverrides(v: WeaponSeriesVariant): string {
		const parts: string[] = []
		if (v.hasWeaponKeys !== null) parts.push(`Keys: ${v.hasWeaponKeys ? 'Yes' : 'No'}`)
		if (v.hasAwakening !== null) parts.push(`Awakening: ${v.hasAwakening ? 'Yes' : 'No'}`)
		if (v.numWeaponKeys !== null) parts.push(`Key Slots: ${v.numWeaponKeys}`)
		if (v.augmentType !== null) parts.push(`Augment: ${getAugmentTypeLabel(v.augmentType)}`)
		if (v.elementChangeable !== null) parts.push(`Element Change: ${v.elementChangeable ? 'Yes' : 'No'}`)
		if (v.extra !== null) parts.push(`Extra: ${v.extra ? 'Yes' : 'No'}`)
		return parts.join(', ') || 'No overrides'
	}

	const overrides = $derived(formatOverrides(variant))
	const interactive = $derived(!!onclick)
</script>

{#if interactive}
	<button class="variant-row interactive" {onclick}>
		<span class="name">{variant.name || 'Unnamed'}</span>
		<span class="overrides">{overrides}</span>
	</button>
{:else}
	<div class="variant-row">
		<span class="name">{variant.name || 'Unnamed'}</span>
		<span class="overrides">{overrides}</span>
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.variant-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: spacing.$unit-2x;
		padding: calc(spacing.$unit * 1.5) spacing.$unit;
		border: none;
		background: none;
		width: 100%;
		text-align: left;
		font-family: inherit;

		.name {
			font-size: typography.$font-regular;
			color: var(--text-primary);
			font-weight: typography.$medium;
			flex-shrink: 0;
		}

		.overrides {
			font-size: typography.$font-regular;
			color: var(--text-secondary);
			text-align: right;
		}

		&.interactive {
			cursor: pointer;
			border-radius: layout.$item-corner;
			margin-left: -8px;
			width: calc(100% + 8px);

			&:hover {
				background: var(--page-hover);
			}
		}
	}
</style>

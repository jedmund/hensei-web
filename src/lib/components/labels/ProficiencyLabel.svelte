<svelte:options runes={true} />

<script lang="ts">
	import { getProficiencyLabel, getProficiencyIcon } from '$lib/utils/proficiency'

	interface Props {
		proficiency?: number
		size?: 'small' | 'medium' | 'large' | 'xlarge' | 'natural'
	}

	let { proficiency, size = 'natural' }: Props = $props()

	const label = $derived(getProficiencyLabel(proficiency ?? 0))
	const imagePath = $derived(getProficiencyIcon(proficiency ?? 0))
</script>

{#if imagePath}
	<img
		src={imagePath}
		alt={label}
		aria-label={`${label} proficiency`}
		class="proficiency-label {size}"
	/>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.proficiency-label {
		display: inline-block;
		vertical-align: middle;
		object-fit: contain;

		&.natural {
			// Display at natural size (34px height)
			height: 34px;
			width: auto;
		}

		&.small {
			// Half of natural size
			height: 17px;
			width: auto;
		}

		&.medium {
			// ~75% of natural size
			height: 25px;
			width: auto;
		}

		&.large {
			// Natural size
			height: 34px;
			width: auto;
		}

		&.xlarge {
			// 1.5x natural size
			height: 51px;
			width: auto;
		}
	}
</style>
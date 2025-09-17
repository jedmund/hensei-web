<svelte:options runes={true} />

<script lang="ts">
	import { getElementLabel, getElementIcon } from '$lib/utils/element'

	interface Props {
		element?: number
		size?: 'small' | 'medium' | 'large' | 'xlarge' | 'natural'
	}

	let { element, size = 'natural' }: Props = $props()

	const label = $derived(getElementLabel(element))
	const imagePath = $derived(getElementIcon(element))
</script>

{#if imagePath}
	<img src={imagePath} alt={label} aria-label={`${label} element`} class="element-label {size}" />
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.element-label {
		display: inline-block;
		vertical-align: middle;
		object-fit: contain;

		&.natural {
			// Display at natural size (34px height)
			height: 34px;
			width: auto;
		}

		&.small {
			height: 20px;
			width: auto;
		}

		&.medium {
			height: 25px;
			width: auto;
		}

		&.large {
			// Natural size
			height: 34px;
			width: auto;
		}

		&.xlarge {
			height: 51px;
			width: auto;
		}
	}
</style>

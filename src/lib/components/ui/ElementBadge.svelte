<svelte:options runes={true} />

<script lang="ts">
	import { ELEMENT_LABELS, ELEMENT_CSS_CLASSES } from '$lib/utils/gw'

	interface Props {
		element: number
		size?: 'small' | 'medium'
	}

	let { element, size = 'small' }: Props = $props()

	const label = $derived(ELEMENT_LABELS[element] ?? 'Unknown')
	const cssClass = $derived(ELEMENT_CSS_CLASSES[element] ?? 'null')
</script>

<span class="element-badge element-{cssClass}" class:medium={size === 'medium'}>
	{label}
</span>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;

	.element-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-small;
		font-weight: typography.$medium;

		&.medium {
			padding: 4px 12px;
			font-size: typography.$font-regular;
		}

		&.element-null {
			background: rgba(0, 0, 0, 0.04);
			color: var(--text-secondary);
		}

		&.element-fire {
			background: #fee2e2;
			color: #dc2626;
		}

		&.element-water {
			background: #dbeafe;
			color: #2563eb;
		}

		&.element-earth {
			background: #fef3c7;
			color: #d97706;
		}

		&.element-wind {
			background: #d1fae5;
			color: #059669;
		}

		&.element-light {
			background: #fef9c3;
			color: #ca8a04;
		}

		&.element-dark {
			background: #ede9fe;
			color: #7c3aed;
		}
	}
</style>

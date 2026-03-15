
<script lang="ts">
	import { getElementLabel, getElementKey } from '$lib/utils/element'

	interface Props {
		element: number
		size?: 'small' | 'medium'
	}

	let { element, size = 'small' }: Props = $props()

	const label = $derived(getElementLabel(element))
	const cssClass = $derived(getElementKey(element))
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
			background: var(--fire-bg);
			color: var(--fire-text);
		}

		&.element-water {
			background: var(--water-bg);
			color: var(--water-text);
		}

		&.element-earth {
			background: var(--earth-bg);
			color: var(--earth-text);
		}

		&.element-wind {
			background: var(--wind-bg);
			color: var(--wind-text);
		}

		&.element-light {
			background: var(--light-bg);
			color: var(--light-text);
		}

		&.element-dark {
			background: var(--dark-bg);
			color: var(--dark-text);
		}
	}
</style>

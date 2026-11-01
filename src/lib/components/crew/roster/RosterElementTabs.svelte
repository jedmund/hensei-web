<script lang="ts">
	import {
		ELEMENT_DISPLAY_ORDER,
		getElementClass,
		getElementImage,
		getElementLabel
	} from '$lib/utils/element'

	interface Props {
		value: number
		onChange: (element: number) => void
	}

	const { value, onChange }: Props = $props()
</script>

<div class="element-tabs">
	{#each ELEMENT_DISPLAY_ORDER as element (element)}
		<button
			class="element-tab {getElementClass(element)}"
			class:active={value === element}
			onclick={() => onChange(element)}
		>
			<img src={getElementImage(element)} alt={getElementLabel(element)} class="element-icon" />
			{getElementLabel(element)}
		</button>
	{/each}
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.element-tabs {
		display: flex;
		gap: spacing.$unit-half;
		align-items: center;
	}

	.element-tab {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: spacing.$unit-half;
		padding: spacing.$unit spacing.$unit;
		border: none;
		border-radius: layout.$item-corner;
		background: var(--pill-bg);
		color: var(--text-primary);
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		cursor: pointer;
		transition:
			background-color 0.15s,
			color 0.15s;

		// Selected and hovered tabs take their element's nav colours
		@each $element in fire, water, earth, wind, dark, light {
			&.element-#{$element} {
				&.active,
				&:hover:not(.active) {
					background: var(--#{$element}-nav-selected-bg);
					color: var(--#{$element}-nav-selected-text);
				}
			}
		}
	}

	.element-icon {
		width: 16px;
		height: 16px;
	}
</style>

<script lang="ts">
	import type { LocalizedName } from '$lib/types/api/entities'
	import { getLocale } from '$lib/paraglide/runtime'
	import { ELEMENT_DISPLAY_ORDER, getElementLabel, getElementKey } from '$lib/utils/element'

	interface Props {
		raidName: LocalizedName
		elements: number[]
		editable?: boolean
		onToggle?: (element: number) => void
	}

	let { raidName, elements, editable = false, onToggle }: Props = $props()

	const locale = $derived(getLocale() as 'en' | 'ja')
	const displayName = $derived(raidName[locale] || raidName.en || '')
</script>

<div class="raid-element-row">
	<span class="raid-name">{displayName}</span>
	<div class="element-badges">
		{#each ELEMENT_DISPLAY_ORDER as el (el)}
			{@const active = elements.includes(el)}
			{#if editable}
				<button
					class="element-toggle element-{getElementKey(el)}"
					class:active
					onclick={() => onToggle?.(el)}
					type="button"
				>
					{getElementLabel(el)}
				</button>
			{:else if active}
				<span class="element-badge element-{getElementKey(el)}">
					{getElementLabel(el)}
				</span>
			{/if}
		{/each}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.raid-element-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: spacing.$unit spacing.$unit-2x;
		gap: spacing.$unit;
	}

	.raid-name {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-primary);
		flex-shrink: 0;
	}

	.element-badges {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.element-badge,
	.element-toggle {
		display: inline-block;
		padding: 2px 8px;
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		border: none;

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

	.element-toggle {
		cursor: pointer;
		opacity: 0.25;
		transition: opacity 0.15s;

		&.active {
			opacity: 1;
		}

		&:hover {
			opacity: 0.8;
		}

		&.active:hover {
			opacity: 0.9;
		}
	}
</style>

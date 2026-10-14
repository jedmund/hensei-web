<script lang="ts">
	/**
	 * GuideEffectSearchRow - a guidebook effect in the search results: its
	 * icon, name, rarity, whether it stacks and how many the run holds.
	 * Picking it adds it to the guidebook.
	 */
	import Icon from '$lib/components/Icon.svelte'
	import { appLocale } from '$lib/utils/locale'
	import * as m from '$lib/paraglide/messages'
	import type { GuideEffect } from '$lib/types/api/solomonis'
	import GuideEffectIcon from './GuideEffectIcon.svelte'
	import { formatGuideEffectName } from './guidebook'
	import { rarityLabel } from './labels'

	interface Props {
		effect: GuideEffect
		/** How many of this effect the run's guidebook holds */
		held: number
		/** False once a non-stacking effect is held */
		canAdd: boolean
		onSelect: () => void
	}

	let { effect, held, canAdd, onSelect }: Props = $props()
</script>

<button type="button" class="guide-effect-search-row" disabled={!canAdd} onclick={onSelect}>
	<GuideEffectIcon {effect} size="small" />
	<span class="info">
		<span class="name">{formatGuideEffectName(effect, null, appLocale())}</span>
		<span class="meta">
			{rarityLabel(effect.rarity)} ·
			{effect.stackable
				? m.solomonis_web_guidebook_stackable()
				: m.solomonis_web_guidebook_not_stackable()}
			{#if held > 0}
				· <span class="held">{m.solomonis_web_guidebook_held({ count: held })}</span>
			{/if}
		</span>
	</span>
	{#if canAdd}
		<Icon name="plus" size={16} class="add-icon" />
	{/if}
</button>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.guide-effect-search-row {
		width: 100%;
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit;
		border: none;
		border-radius: $input-corner;
		background: transparent;
		color: var(--text-primary);
		font: inherit;
		cursor: pointer;
		transition: background-color 0.15s ease-out;
		text-align: left;

		&:hover:not(:disabled) {
			background: var(--list-cell-bg-hover);
		}

		&:active:not(:disabled) {
			transform: scale(0.99);
		}

		&:disabled {
			cursor: default;
			opacity: 0.6;
		}

		:global(.add-icon) {
			flex-shrink: 0;
			color: var(--text-tertiary);
		}
	}

	.info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		min-width: 0;
	}

	.name {
		font-size: $font-small;
		line-height: 1.4;
		overflow-wrap: anywhere;
	}

	.meta {
		font-size: $font-tiny;
		color: var(--text-secondary);
	}

	.held {
		font-weight: $bold;
		color: var(--accent-blue);
	}
</style>

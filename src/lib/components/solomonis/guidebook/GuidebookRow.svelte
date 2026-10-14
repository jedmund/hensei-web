<script lang="ts">
	import type { GuidebookEntry } from '$lib/types/api/solomonis'
	import { appLocale } from '$lib/utils/locale'
	import * as m from '$lib/paraglide/messages'
	import GuideEffectIcon from './GuideEffectIcon.svelte'
	import { formatGuideEffectName } from './guidebook'

	interface Props {
		entry: GuidebookEntry
		/** Pickup position, shown in pickup-order view. */
		order?: number | null
		/** Opens the entry for editing; the item is static without it. */
		onclick?: () => void
	}

	let { entry, order = null, onclick }: Props = $props()

	const name = $derived(formatGuideEffectName(entry.effect, entry.displayValue, appLocale()))
</script>

{#snippet content()}
	{#if order !== null}
		<span class="order">{order}</span>
	{/if}
	<GuideEffectIcon effect={entry.effect} />
	<span class="text">
		<span class="name">{name}</span>
		{#if entry.inherited || entry.note}
			<span class="meta">
				{#if entry.inherited}
					<span class="inherited">{m.solomonis_web_guidebook_inherited()}</span>
				{/if}
				{#if entry.note}
					<span class="note">{entry.note}</span>
				{/if}
			</span>
		{/if}
	</span>
	{#if entry.count > 1 || entry.effect.stackable}
		<span class="count">×{entry.count}</span>
	{/if}
{/snippet}

{#if onclick}
	<button type="button" class="guide-effect-item editable {entry.effect.rarity}" {onclick}>
		{@render content()}
	</button>
{:else}
	<div class="guide-effect-item {entry.effect.rarity}">
		{@render content()}
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.guide-effect-item {
		display: flex;
		align-items: center;
		gap: $unit;
		width: 100%;
		min-height: $unit-6x;
		padding: $unit $unit-2x $unit $unit;
		border: none;
		border-radius: $card-corner;
		// A light wash instead of a border; cursed effects are tinted red
		background: var(--input-bound-bg);
		color: var(--text-primary);
		text-align: left;
		font: inherit;

		&.cursed {
			background: color-mix(in srgb, var(--danger) 12%, var(--input-bound-bg));
		}

		&.editable {
			cursor: pointer;
			transition: background-color 0.15s ease-out;

			&:hover {
				background: var(--input-bound-bg-hover);
			}

			&.cursed:hover {
				background: color-mix(in srgb, var(--danger) 18%, var(--input-bound-bg-hover));
			}

			&:focus-visible {
				outline: 2px solid var(--focus-ring);
				outline-offset: 1px;
			}
		}
	}

	.order {
		min-width: $unit-2x;
		font-size: $font-small;
		font-weight: $bold;
		color: var(--text-tertiary);
		text-align: right;
	}

	.text {
		display: flex;
		flex: 1;
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
		display: flex;
		flex-wrap: wrap;
		gap: $unit;
		font-size: $font-tiny;
		color: var(--text-secondary);
	}

	.inherited {
		font-weight: $bold;
		color: var(--accent-blue);
	}

	.note {
		overflow-wrap: anywhere;
	}

	.count {
		flex-shrink: 0;
		font-size: $font-regular;
		font-weight: $bold;
		color: var(--text-secondary);
	}
</style>

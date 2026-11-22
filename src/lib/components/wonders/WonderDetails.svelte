<script lang="ts">
	/**
	 * WonderDetails - a Wonder's description (first, since every Wonder has
	 * one), then what it does: its bonuses (leveled and scaling Wonders,
	 * computed by the API) or its effects (fixed Wonders, the game's text).
	 */
	import { m } from '$lib/paraglide/messages'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import WonderBonusList from './WonderBonusList.svelte'
	import { wonderEffectTexts, wonderText } from '$lib/features/wonders/labels'
	import type { Wonder, WonderBonus } from '$lib/types/api/wonder'

	interface Props {
		wonder: Wonder
		bonuses: WonderBonus[]
	}

	let { wonder, bonuses }: Props = $props()

	const effects = $derived(wonderEffectTexts(wonder))
	const description = $derived(wonderText(wonder.description))
</script>

{#if description !== '—'}
	<DetailsSection title={m.wonders_description_title()}>
		<p class="description">{description}</p>
	</DetailsSection>
{/if}

{#if bonuses.length > 0}
	<DetailsSection title={m.wonders_bonuses_title()}>
		<WonderBonusList {bonuses} />
	</DetailsSection>
{/if}

{#if effects.length > 0}
	<DetailsSection title={m.wonders_effects_title()}>
		<ul class="effects">
			{#each effects as effect, i (i)}
				<li>{effect}</li>
			{/each}
		</ul>
	</DetailsSection>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	// No bullets or extra inset: lines up with the section title, like the
	// description
	.effects {
		display: flex;
		flex-direction: column;
		gap: $unit;
		margin: 0;
		padding: 0 $unit;
		list-style: none;
		font-size: $font-regular;
		color: var(--text-primary);
	}

	// Lines up with the section title, which DetailsSection insets by $unit
	.description {
		margin: 0;
		padding: 0 $unit;
		font-size: $font-regular;
		color: var(--text-secondary);
		white-space: pre-line;
	}
</style>

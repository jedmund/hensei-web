<script lang="ts">
	/**
	 * WonderDetails - what a Wonder does: its bonuses (leveled and scaling
	 * Wonders, computed by the API) or its effects (fixed Wonders, the
	 * game's text), then its description.
	 */
	import { m } from '$lib/paraglide/messages'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import WonderBonusList from './WonderBonusList.svelte'
	import { wonderText } from '$lib/features/wonders/labels'
	import type { Wonder, WonderBonus } from '$lib/types/api/wonder'

	interface Props {
		wonder: Wonder
		bonuses: WonderBonus[]
		/** Leave out the flavor text (the team pane lists several Wonders) */
		showDescription?: boolean
	}

	let { wonder, bonuses, showDescription = true }: Props = $props()

	const effects = $derived(
		[...wonder.effects]
			.sort((a, b) => a.position - b.position)
			.map((e) => wonderText(e.text))
			.filter((text) => text !== '—')
	)
	const description = $derived(wonderText(wonder.description))
</script>

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

{#if showDescription && description !== '—'}
	<DetailsSection title={m.wonders_description_title()}>
		<p class="description">{description}</p>
	</DetailsSection>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.effects {
		display: flex;
		flex-direction: column;
		gap: $unit;
		margin: 0;
		padding: 0 $unit-2x 0 calc($unit-2x + $unit-2x);
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

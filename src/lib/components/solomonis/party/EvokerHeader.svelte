<script lang="ts">
	/**
	 * EvokerHeader - the top of the details pane: the route Evoker's portrait
	 * and name over the zone and pledge, with a note when the Evoker isn't in
	 * the party's grid.
	 */
	import * as m from '$lib/paraglide/messages'
	import { getCharacterImage } from '$lib/utils/images'
	import { appLocale } from '$lib/utils/locale'
	import type { SolomonisExpedition } from '$lib/types/api/solomonis'
	import { solomonisName } from './solomonisParty'

	interface Props {
		expedition: SolomonisExpedition
		/** The route Evoker isn't one of the party's characters */
		missingFromGrid?: boolean
	}

	let { expedition, missingFromGrid = false }: Props = $props()

	const locale = appLocale()
	const name = $derived(solomonisName(expedition.routeEvoker.name, locale))

	// "Allotropic Microcosm · Pledge 3", as on the raid tile
	const meta = $derived(
		[
			solomonisName(expedition.zone.name, locale),
			expedition.pledgeLevel > 0
				? m.solomonis_web_party_pledge_short({ level: expedition.pledgeLevel })
				: null
		]
			.filter(Boolean)
			.join(' · ')
	)
</script>

<div class="evoker-header">
	<div class="evoker">
		<img
			src={getCharacterImage(expedition.routeEvoker.granblueId, 'square')}
			alt=""
			class="image"
		/>
		<div class="details">
			<span class="name">{name}</span>
			<span class="meta">{meta}</span>
		</div>
	</div>
	{#if missingFromGrid}
		<p class="notice">{m.solomonis_web_party_not_in_grid({ name })}</p>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.evoker-header {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		padding: 0 $unit-2x;
	}

	.evoker {
		display: flex;
		align-items: center;
		gap: $unit;
	}

	.image {
		width: 48px;
		height: 48px;
		border-radius: $item-corner-small;
	}

	.details {
		display: flex;
		flex-direction: column;
		gap: $unit-fourth;
	}

	.name {
		font-size: $font-regular;
		font-weight: $bold;
		color: var(--text-primary);
	}

	.meta {
		font-size: $font-small;
		color: var(--text-tertiary);
	}

	.notice {
		margin: 0;
		font-size: $font-small;
		color: var(--text-secondary);
	}
</style>

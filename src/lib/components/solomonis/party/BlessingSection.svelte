<script lang="ts">
	/**
	 * BlessingSection - an expedition's blessings in arcana order, each with
	 * its cost, effect and level, under the total cost against the limit.
	 */
	import { createQuery } from '@tanstack/svelte-query'
	import { solomonisQueries } from '$lib/api/queries/solomonis.queries'
	import * as m from '$lib/paraglide/messages'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import LevelSegments from '$lib/components/ui/LevelSegments.svelte'
	import { appLocale } from '$lib/utils/locale'
	import type { SolomonisExpedition } from '$lib/types/api/solomonis'
	import BlessingRow from './BlessingRow.svelte'
	import { solomonisName } from './solomonisParty'

	interface Props {
		expedition: SolomonisExpedition
	}

	let { expedition }: Props = $props()

	const locale = appLocale()

	// The party's blessings carry level and cost; the effect text comes from
	// the catalogue (shared with the blessing picker's query).
	const blessingCatalogue = createQuery(() => solomonisQueries.blessings())

	function catalogueBlessing(blessingId: string) {
		return blessingCatalogue.data?.blessings.find((bl) => bl.id === blessingId)
	}

	function blessingDescription(blessingId: string, levelId: string) {
		return catalogueBlessing(blessingId)?.levels.find((l) => l.id === levelId)?.description
	}

	function blessingMaxLevel(blessingId: string): number | null {
		const levels = catalogueBlessing(blessingId)?.levels ?? []
		return levels.length > 0 ? Math.max(...levels.map((l) => l.level)) : null
	}

	const blessings = $derived(
		[...expedition.blessings].sort((a, b) => a.blessing.arcanaNumber - b.blessing.arcanaNumber)
	)
</script>

<DetailsSection
	title={m.solomonis_web_party_blessings_title()}
	titleSuffix={`(${expedition.blessingCostTotal} / ${expedition.blessingCostLimit})`}
	empty={blessings.length === 0}
	emptyMessage={m.solomonis_web_party_blessings_none()}
>
	<ul class="blessing-list">
		{#each blessings as b (b.blessing.id)}
			{@const description = blessingDescription(b.blessing.id, b.levelId)}
			<li>
				<BlessingRow
					slug={b.blessing.slug}
					name={solomonisName(b.blessing.name, locale)}
					subtitle={m.solomonis_web_party_blessing_cost({ cost: b.cost })}
					description={description ? solomonisName(description, locale) : null}
				>
					{#snippet trailing()}
						{@const max = blessingMaxLevel(b.blessing.id)}
						{#if max}
							<LevelSegments
								level={b.level}
								{max}
								label={m.solomonis_web_party_level_of({ level: b.level, max })}
								valueText={m.solomonis_web_party_level({ level: b.level })}
							/>
						{:else}
							<span class="blessing-level">{m.solomonis_web_party_level({ level: b.level })}</span>
						{/if}
					{/snippet}
				</BlessingRow>
			</li>
		{/each}
	</ul>
</DetailsSection>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.blessing-list {
		display: flex;
		flex-direction: column;
		gap: $unit-3x;
		margin: 0;
		padding: 0 $unit;
		list-style: none;
	}

	.blessing-level {
		font-size: $font-regular;
		font-weight: $medium;
		color: var(--text-primary);
	}
</style>

<script lang="ts">
	/**
	 * SolomonisDetailsPane - the Evoking Solomonis sidebar pane: route Evoker,
	 * zone, pledge, outcome and blessings, plus whatever an imported report
	 * brought (end time, turns, spaces visited, guidebook). Opened from the
	 * raid tile and the team settings pane; Edit pushes EditSolomonisPane on
	 * top of it.
	 */
	import { onMount } from 'svelte'
	import { createQuery } from '@tanstack/svelte-query'
	import { solomonisQueries } from '$lib/api/queries/solomonis.queries'
	import * as m from '$lib/paraglide/messages'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import BlessingRow from './BlessingRow.svelte'
	import LevelSegments from '$lib/components/ui/LevelSegments.svelte'
	import SolomonisGuidebook from '$lib/components/solomonis/guidebook/SolomonisGuidebook.svelte'
	import { getCharacterImage } from '$lib/utils/images'
	import { appLocale } from '$lib/utils/locale'
	import {
		useUpdatePartyBlessings,
		useUpdateSolomonisExpedition
	} from '$lib/api/mutations/solomonis.mutations'
	import type { Party } from '$lib/types/api/party'
	import type { SolomonisOutcome } from '$lib/types/api/solomonis'
	import { openEditSolomonisPane } from './openSolomonisPanes'
	import {
		hasStats,
		isFullExpedition,
		routeEvokerMissingFromGrid,
		solomonisName,
		spaceStats,
		type SpaceStatKey
	} from './solomonisParty'

	interface Props {
		/** Reads the party page's party, so the pane follows its updates. */
		getParty: () => Party
		canEdit: boolean
		paneId?: string
	}

	let { getParty, canEdit, paneId }: Props = $props()

	const party = $derived(getParty())

	const mutations = {
		expedition: useUpdateSolomonisExpedition(),
		blessings: useUpdatePartyBlessings()
	}

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

	const locale = appLocale()
	const expedition = $derived(isFullExpedition(party.solomonis) ? party.solomonis : null)
	const missingFromGrid = $derived(routeEvokerMissingFromGrid(party))
	const canWrite = $derived(canEdit && party.id !== 'new')

	const SPACE_LABELS: Record<SpaceStatKey, () => string> = {
		battle: m.solomonis_web_party_space_battle,
		strong: m.solomonis_web_party_space_strong,
		terrifying: m.solomonis_web_party_space_terrifying,
		ruler: m.solomonis_web_party_space_ruler,
		boss: m.solomonis_web_party_space_boss,
		event: m.solomonis_web_party_space_event,
		healing: m.solomonis_web_party_space_healing,
		chest: m.solomonis_web_party_space_chest,
		teleporter: m.solomonis_web_party_space_teleporter,
		special: m.solomonis_web_party_space_special
	}

	const OUTCOME_LABELS: Record<SolomonisOutcome, () => string> = {
		miasma_1: m.solomonis_web_party_outcome_miasma_1,
		miasma_2: m.solomonis_web_party_outcome_miasma_2,
		cleared: m.solomonis_web_party_outcome_cleared
	}

	// "Allotropic Microcosm · Pledge 3", as on the raid tile
	const headerMeta = $derived(
		expedition
			? [
					solomonisName(expedition.zone.name, locale),
					expedition.pledgeLevel > 0
						? m.solomonis_web_party_pledge_short({ level: expedition.pledgeLevel })
						: null
				]
					.filter(Boolean)
					.join(' · ')
			: ''
	)

	function openEditPane() {
		openEditSolomonisPane(party, mutations)
	}

	onMount(() => {
		if (!canWrite) return
		if (paneId) sidebar.setActionForPane(paneId, openEditPane, m.action_edit())
		else sidebar.setAction(openEditPane, m.action_edit())
	})

	function orDash(value: string | number | null | undefined): string {
		return value === null || value === undefined ? '—' : String(value)
	}
</script>

<div class="solomonis-details">
	{#if !expedition}
		<p class="empty-state">{canWrite ? m.solomonis_web_party_no_expedition() : '—'}</p>
	{:else}
		<div class="evoker">
			<img
				src={getCharacterImage(expedition.routeEvoker.granblueId, 'square')}
				alt=""
				class="evoker-image"
			/>
			<div class="evoker-details">
				<span class="evoker-name">{solomonisName(expedition.routeEvoker.name, locale)}</span>
				<span class="evoker-meta">{headerMeta}</span>
			</div>
		</div>
		{#if missingFromGrid}
			<p class="notice">
				{m.solomonis_web_party_not_in_grid({
					name: solomonisName(expedition.routeEvoker.name, locale)
				})}
			</p>
		{/if}

		<div class="rows expedition-rows">
			<DetailRow label={m.solomonis_web_party_outcome()}>
				<span class="outcome {expedition.outcome ?? 'not-set'}">
					{expedition.outcome
						? OUTCOME_LABELS[expedition.outcome]()
						: m.solomonis_web_party_not_set()}
				</span>
			</DetailRow>
			{#if party.turnCount != null}
				<DetailRow label={m.solomonis_web_party_turns()} value={party.turnCount} />
			{/if}
		</div>

		<hr class="divider" />

		<DetailsSection
			title={m.solomonis_web_party_blessings_title()}
			titleSuffix={`(${expedition.blessingCostTotal} / ${expedition.blessingCostLimit})`}
			empty={expedition.blessings.length === 0}
			emptyMessage={m.solomonis_web_party_blessings_none()}
		>
			<ul class="blessing-list">
				{#each [...expedition.blessings].sort((a, b) => a.blessing.arcanaNumber - b.blessing.arcanaNumber) as b (b.blessing.id)}
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
									<span class="blessing-level"
										>{m.solomonis_web_party_level({ level: b.level })}</span
									>
								{/if}
							{/snippet}
						</BlessingRow>
					</li>
				{/each}
			</ul>
		</DetailsSection>

		{#if hasStats(expedition.stats)}
			<hr class="divider" />

			<DetailsSection title={m.solomonis_web_party_spaces()}>
				<div class="rows">
					{#each spaceStats(expedition.stats) as stat (stat.key)}
						<DetailRow label={SPACE_LABELS[stat.key]()} value={stat.count} />
					{/each}
					<DetailRow
						label={m.solomonis_web_party_shop_purchases()}
						value={orDash(expedition.stats.shopPurchases)}
					/>
					<DetailRow
						label={m.solomonis_web_party_points_earned()}
						value={orDash(expedition.stats.pointsEarned)}
					/>
				</div>
			</DetailsSection>
		{/if}

		{#if expedition.guidebook.length > 0}
			<hr class="divider" />

			<div class="guidebook">
				<SolomonisGuidebook {party} canEdit={canWrite} />
			</div>
		{/if}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.solomonis-details {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		padding: $unit-2x 0;
	}

	.empty-state {
		margin: 0;
		padding: 0 $unit-2x;
		font-size: $font-regular;
		color: var(--text-tertiary);
	}

	.evoker {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: 0 $unit-2x;
	}

	.evoker-image {
		width: 48px;
		height: 48px;
		border-radius: $item-corner-small;
	}

	.evoker-details {
		display: flex;
		flex-direction: column;
		gap: $unit-fourth;
	}

	.evoker-name {
		font-size: $font-regular;
		font-weight: $bold;
		color: var(--text-primary);
	}

	.evoker-meta {
		font-size: $font-small;
		color: var(--text-tertiary);
	}

	.notice {
		margin: 0;
		padding: 0 $unit-2x;
		font-size: $font-small;
		color: var(--text-secondary);
	}

	.rows {
		display: flex;
		flex-direction: column;
	}

	// Lined up with the DetailsSection rows below
	.expedition-rows {
		padding: 0 $unit;
	}

	// Cleared in green, the miasma stages in Arcarum purple, Not set muted
	.outcome {
		font-weight: $medium;

		&.cleared {
			color: var(--wind-text);
		}

		&.miasma_1,
		&.miasma_2 {
			color: var(--extra-purple-primary);
		}

		&.not-set {
			color: var(--text-secondary);
		}
	}

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

	.divider {
		margin: 0;
		border: none;
		border-top: 1px solid var(--border-subtle);
	}

	.guidebook {
		padding: 0 $unit-2x;
	}
</style>

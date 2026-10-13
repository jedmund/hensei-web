<script lang="ts">
	/**
	 * SolomonisDetailsPane - the Evoking Solomonis sidebar pane: kind, route
	 * Evoker, zone, pledge, blessings, and for runs the report fields, stats and
	 * guidebook. Opened from the raid tile and the team settings pane; editing
	 * pushes EditSolomonisPane / EditBlessingsPane on top of it.
	 */
	import { onMount } from 'svelte'
	import * as m from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import SolomonisGuidebook from '$lib/components/solomonis/guidebook/SolomonisGuidebook.svelte'
	import { getCharacterImage } from '$lib/utils/images'
	import { appLocale } from '$lib/utils/locale'
	import {
		useUpdatePartyBlessings,
		useUpdateSolomonisExpedition
	} from '$lib/api/mutations/solomonis.mutations'
	import type { Party } from '$lib/types/api/party'
	import type { SolomonisMidboss } from '$lib/types/api/solomonis'
	import { openEditBlessingsPane, openEditSolomonisPane } from './openSolomonisPanes'
	import {
		MAX_BOSSES_DEFEATED,
		formatJst,
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

	const updateExpedition = useUpdateSolomonisExpedition()
	const updateBlessings = useUpdatePartyBlessings()

	const locale = appLocale()
	const expedition = $derived(isFullExpedition(party.solomonis) ? party.solomonis : null)
	const isRun = $derived(expedition?.kind === 'run')
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

	const MIDBOSS_LABELS: Record<SolomonisMidboss, () => string> = {
		banes_gate: m.solomonis_web_party_midboss_banes_gate,
		infernobringer: m.solomonis_web_party_midboss_infernobringer,
		beast_of_anathema: m.solomonis_web_party_midboss_beast_of_anathema
	}

	function openEditPane() {
		openEditSolomonisPane(party, updateExpedition)
	}

	onMount(() => {
		if (!canWrite) return
		if (paneId) sidebar.setActionForPane(paneId, openEditPane, m.action_edit())
		else sidebar.setAction(openEditPane, m.action_edit())
	})

	function openBlessingsPane() {
		openEditBlessingsPane(party, updateBlessings)
	}

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
				<span class="evoker-meta">
					{expedition.kind === 'run'
						? m.solomonis_web_party_kind_run()
						: m.solomonis_web_party_kind_build()}
					· {solomonisName(expedition.zone.name, locale)}
				</span>
			</div>
		</div>
		{#if missingFromGrid}
			<p class="notice">
				{m.solomonis_web_party_not_in_grid({
					name: solomonisName(expedition.routeEvoker.name, locale)
				})}
			</p>
		{/if}

		<DetailsSection title={m.solomonis_web_party_title()}>
			<div class="rows">
				<DetailRow
					label={m.solomonis_web_party_pledge()}
					value={expedition.pledgeLevel === 0
						? m.solomonis_web_party_pledge_none()
						: m.solomonis_web_party_level({ level: expedition.pledgeLevel })}
				/>
			</div>
		</DetailsSection>

		<hr class="divider" />

		<DetailsSection
			title={m.solomonis_web_party_blessings()}
			empty={expedition.blessings.length === 0}
			emptyMessage={m.solomonis_web_party_blessings_none()}
		>
			{#snippet action()}
				<div class="section-action">
					<span class="cost">
						{m.solomonis_web_party_blessing_cost_total({
							total: expedition.blessingCostTotal,
							limit: expedition.blessingCostLimit
						})}
					</span>
					{#if canWrite}
						<Button variant="ghost" size="small" onclick={openBlessingsPane}>
							{m.action_edit()}
						</Button>
					{/if}
				</div>
			{/snippet}
			<div class="rows">
				{#each [...expedition.blessings].sort((a, b) => a.blessing.arcanaNumber - b.blessing.arcanaNumber) as b (b.blessing.id)}
					<DetailRow
						label={solomonisName(b.blessing.name, locale)}
						value={`${m.solomonis_web_party_level({ level: b.level })} · ${m.solomonis_web_party_blessing_cost({ cost: b.cost })}`}
					/>
				{/each}
			</div>
		</DetailsSection>

		{#if isRun}
			<hr class="divider" />

			<DetailsSection title={m.solomonis_web_party_section_run()}>
				<div class="rows">
					<DetailRow
						label={m.solomonis_web_party_outcome()}
						value={expedition.outcome === 'cleared'
							? m.solomonis_web_party_outcome_cleared()
							: expedition.outcome === 'failed'
								? m.solomonis_web_party_outcome_failed()
								: '—'}
					/>
					<DetailRow
						label={m.solomonis_web_party_bosses_defeated()}
						value={expedition.bossesDefeated === null
							? '—'
							: m.solomonis_web_party_bosses_value({
									count: expedition.bossesDefeated,
									max: MAX_BOSSES_DEFEATED
								})}
					/>
					<DetailRow
						label={m.solomonis_web_party_midboss()}
						value={expedition.midboss ? MIDBOSS_LABELS[expedition.midboss]() : '—'}
					/>
					<DetailRow
						label={m.solomonis_web_party_expedition_level()}
						value={orDash(expedition.expeditionLevel)}
					/>
					<DetailRow
						label={m.solomonis_web_party_ended_at()}
						value={formatJst(expedition.endedAt) ?? '—'}
					/>
					<DetailRow label={m.solomonis_web_party_turns()} value={orDash(party.turnCount)} />
					<DetailRow label={m.solomonis_web_party_build_party()}>
						{#if expedition.buildParty}
							<a href={localizeHref(`/teams/${expedition.buildParty.shortcode}`)}>
								{expedition.buildParty.name || m.party_untitled()}
							</a>
						{:else}
							—
						{/if}
					</DetailRow>
				</div>
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

	.section-action {
		display: flex;
		align-items: center;
		gap: $unit;
	}

	.cost {
		font-size: $font-small;
		color: var(--text-secondary);
		font-variant-numeric: tabular-nums;
	}

	.rows {
		display: flex;
		flex-direction: column;
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

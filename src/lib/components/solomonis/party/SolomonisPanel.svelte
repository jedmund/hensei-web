<script lang="ts">
	/**
	 * SolomonisPanel - the Evoking Solomonis section of the party page: kind,
	 * route Evoker, zone, pledge, blessings, and for runs the report fields and
	 * stats. Editing opens EditSolomonisPane / EditBlessingsPane in the sidebar.
	 */
	import * as m from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'
	import InfoTile from '$lib/components/party/info/InfoTile.svelte'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import Button from '$lib/components/ui/Button.svelte'
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
		party: Party
		canEdit: boolean
	}

	let { party, canEdit }: Props = $props()

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

	function openBlessingsPane() {
		openEditBlessingsPane(party, updateBlessings)
	}

	function orDash(value: string | number | null | undefined): string {
		return value === null || value === undefined ? '—' : String(value)
	}
</script>

<InfoTile label={m.solomonis_web_party_title()} class="solomonis-panel">
	{#snippet headerAction()}
		{#if canWrite}
			<Button variant="ghost" size="small" onclick={openEditPane}>{m.action_edit()}</Button>
		{/if}
	{/snippet}

	{#if !expedition}
		<span class="empty-state">{canWrite ? m.solomonis_web_party_no_expedition() : '—'}</span>
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

		<div class="rows">
			<DetailRow
				label={m.solomonis_web_party_pledge()}
				value={expedition.pledgeLevel === 0
					? m.solomonis_web_party_pledge_none()
					: m.solomonis_web_party_level({ level: expedition.pledgeLevel })}
			/>
		</div>

		<section class="group">
			<div class="group-header">
				<h4>{m.solomonis_web_party_blessings()}</h4>
				<span class="cost">
					{m.solomonis_web_party_blessing_cost_total({
						total: expedition.blessingCostTotal,
						limit: expedition.blessingCostLimit
					})}
				</span>
				{#if canWrite}
					<Button variant="ghost" size="small" onclick={openBlessingsPane}>
						{m.solomonis_web_party_blessings_edit()}
					</Button>
				{/if}
			</div>
			{#if expedition.blessings.length === 0}
				<span class="empty-state">{m.solomonis_web_party_blessings_none()}</span>
			{:else}
				<div class="rows">
					{#each [...expedition.blessings].sort((a, b) => a.blessing.arcanaNumber - b.blessing.arcanaNumber) as b (b.blessing.id)}
						<DetailRow
							label={solomonisName(b.blessing.name, locale)}
							value={`${m.solomonis_web_party_level({ level: b.level })} · ${m.solomonis_web_party_blessing_cost({ cost: b.cost })}`}
						/>
					{/each}
				</div>
			{/if}
		</section>

		{#if isRun}
			<section class="group">
				<div class="group-header">
					<h4>{m.solomonis_web_party_section_run()}</h4>
				</div>
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

				{#if hasStats(expedition.stats)}
					<div class="group-header">
						<h4>{m.solomonis_web_party_spaces()}</h4>
					</div>
					<div class="rows stats">
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
				{/if}
			</section>
		{/if}
	{/if}
</InfoTile>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.empty-state {
		font-size: $font-regular;
		color: var(--text-tertiary);
	}

	.evoker {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit 0;
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
		font-size: $font-small;
		font-weight: $bold;
		color: var(--text-primary);
	}

	.evoker-meta {
		font-size: $font-small;
		color: var(--text-tertiary);
	}

	.notice {
		margin: 0;
		font-size: $font-small;
		color: var(--text-secondary);
	}

	.group {
		display: flex;
		flex-direction: column;
		margin-top: $unit;
	}

	.group-header {
		display: flex;
		align-items: center;
		gap: $unit;
		min-height: 30px;

		h4 {
			margin: 0;
			flex: 1;
			font-size: $font-small;
			font-weight: $medium;
			color: var(--text-secondary);
		}
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

	.stats {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		column-gap: $unit-2x;

		@media (max-width: 768px) {
			grid-template-columns: 1fr;
		}
	}
</style>

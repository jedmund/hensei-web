<script lang="ts">
	import InfoTile from './InfoTile.svelte'
	import type { Raid } from '$lib/types/api/entities'
	import type { RaidFull } from '$lib/types/api/raid'
	import { getCharacterImage } from '$lib/utils/images/characters'
	import { getRaidImage } from '$lib/utils/images/raids'
	import { getElementLabel } from '$lib/utils/element'
	import { appLocale, localizedName } from '$lib/utils/locale'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import EditRaidPane from '$lib/components/sidebar/EditRaidPane.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import * as m from '$lib/paraglide/messages'
	import type { SolomonisExpedition } from '$lib/types/api/solomonis'
	import { solomonisName } from '$lib/components/solomonis/party/solomonisParty'

	interface Props {
		raid?: Raid
		canEdit?: boolean
		onclick?: () => void
		/** Callback when a raid is selected via EditRaidPane */
		onRaidSelect?: (raid: RaidFull | null) => void
		/** An Evoking Solomonis party's expedition: the tile shows its route Evoker */
		expedition?: SolomonisExpedition | null
		/** Opens the Evoking Solomonis details pane */
		onViewDetails?: () => void
	}

	let {
		raid,
		canEdit = false,
		onclick,
		onRaidSelect,
		expedition = null,
		onViewDetails
	}: Props = $props()

	const locale = appLocale()
	const solomonisMeta = $derived(
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

	const isEmpty = $derived(!raid)
	const showAdd = $derived(canEdit && isEmpty)

	const raidName = $derived(() => {
		if (!raid) return null
		return localizedName(raid.name)
	})

	const elementLabel = $derived(raid ? getElementLabel(raid.element) : null)
	// Solomonis zones have no level or element, so show only the parts a raid has.
	const raidMeta = $derived(
		raid
			? [raid.level ? `Lv. ${raid.level}` : null, raid.element ? elementLabel : null]
					.filter(Boolean)
					.join(' · ')
			: ''
	)

	function openEditRaidPane() {
		sidebar.openWithComponent(
			m.pane_select_raid(),
			EditRaidPane,
			{
				currentRaid: raid,
				onSelect: (selected: RaidFull | null) => {
					// Close first: picking a Solomonis zone opens the expedition pane
					sidebar.close()
					onRaidSelect?.(selected)
				}
			},
			{ scrollable: true }
		)
	}
</script>

<InfoTile label={m.party_raid_label()} class="raid-tile" {showAdd} onAdd={openEditRaidPane}>
	{#snippet headerAction()}
		{#if (expedition && onViewDetails) || (canEdit && raid)}
			<div class="header-actions">
				{#if expedition && onViewDetails}
					<Button variant="ghost" size="small" onclick={onViewDetails}>
						{m.context_view_details()}
					</Button>
				{/if}
				{#if canEdit && raid}
					<Button variant="ghost" size="small" onclick={openEditRaidPane}>{m.action_edit()}</Button>
				{/if}
			</div>
		{/if}
	{/snippet}
	{#if raid && expedition}
		<button type="button" class="raid-info" {onclick}>
			<img
				src={getCharacterImage(expedition.routeEvoker.granblueId, 'square')}
				alt=""
				class="evoker-image"
			/>
			<div class="raid-details">
				<span class="raid-name">{solomonisName(expedition.routeEvoker.name, locale)}</span>
				<span class="raid-meta">{solomonisMeta}</span>
			</div>
		</button>
	{:else if raid}
		<button type="button" class="raid-info" {onclick}>
			<img src={getRaidImage(raid.slug)} alt="" class="raid-image" />
			<div class="raid-details">
				<span class="raid-name">{raidName()}</span>
				{#if raidMeta}
					<span class="raid-meta">{raidMeta}</span>
				{/if}
			</div>
		</button>
	{:else}
		<span class="empty-state">{canEdit ? m.party_add_raid() : m.party_raid_empty()}</span>
	{/if}
</InfoTile>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	.raid-info {
		display: flex;
		align-items: center;
		gap: $unit;
		margin: 0 (-$unit) (-$unit) (-$unit);
		padding: $unit;
		border-radius: $item-corner;
		background: none;
		border: none;
		cursor: pointer;
		color: inherit;
		font: inherit;
		text-align: left;
		width: calc(100% + #{$unit * 2});
		@include smooth-transition($duration-quick, background-color);

		&:hover {
			background: var(--button-bg);
		}

		&:focus-visible {
			outline: 2px solid var(--focus-ring);
			outline-offset: 2px;
		}
	}

	.raid-image {
		height: 60px;
		width: auto;
		border-radius: $item-corner-small;
	}

	.evoker-image {
		width: 60px;
		height: 60px;
		border-radius: $item-corner-small;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: $unit-half;
	}

	.raid-details {
		display: flex;
		flex-direction: column;
		gap: $unit-fourth;
	}

	.raid-name {
		font-size: $font-small;
		font-weight: $bold;
		color: var(--text-primary);
	}

	.raid-meta {
		font-size: $font-small;
		color: var(--text-tertiary);
	}

	.empty-state {
		font-size: $font-regular;
		color: var(--text-tertiary);
	}
</style>

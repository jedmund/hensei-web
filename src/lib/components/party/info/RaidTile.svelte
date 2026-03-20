<script lang="ts">
	import InfoTile from './InfoTile.svelte'
	import type { Raid } from '$lib/types/api/entities'
	import type { RaidFull } from '$lib/types/api/raid'
	import { getRaidImage } from '$lib/utils/images'
	import { getElementLabel } from '$lib/utils/element'
	import { localizedName } from '$lib/utils/locale'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import EditRaidPane from '$lib/components/sidebar/EditRaidPane.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		raid?: Raid
		canEdit?: boolean
		onclick?: () => void
		/** Callback when a raid is selected via EditRaidPane */
		onRaidSelect?: (raid: RaidFull | null) => void
	}

	let { raid, canEdit = false, onclick, onRaidSelect }: Props = $props()

	const isEmpty = $derived(!raid)
	const showAdd = $derived(canEdit && isEmpty)

	const raidName = $derived(() => {
		if (!raid) return null
		return localizedName(raid.name)
	})

	const elementLabel = $derived(raid ? getElementLabel(raid.element) : null)

	function openEditRaidPane() {
		sidebar.openWithComponent(
			m.pane_select_raid(),
			EditRaidPane,
			{
				currentRaid: raid,
				onSelect: (selected: RaidFull | null) => {
					onRaidSelect?.(selected)
					sidebar.close()
				}
			},
			{ scrollable: true }
		)
	}
</script>

<InfoTile label={m.party_raid_label()} class="raid-tile" {showAdd} onAdd={openEditRaidPane}>
	{#snippet headerAction()}
		{#if canEdit && raid}
			<Button variant="ghost" size="small" onclick={openEditRaidPane}>{m.action_edit()}</Button>
		{/if}
	{/snippet}
	{#if raid}
		<button type="button" class="raid-info" onclick={onclick}>
			<img src={getRaidImage(raid.slug)} alt="" class="raid-image" />
			<div class="raid-details">
				<span class="raid-name">{raidName()}</span>
				<span class="raid-meta">Lv. {raid.level} · {elementLabel}</span>
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
	}

	.raid-image {
		height: 60px;
		width: auto;
		border-radius: $item-corner;
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

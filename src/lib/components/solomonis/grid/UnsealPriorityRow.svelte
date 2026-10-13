<script lang="ts">
	/**
	 * UnsealPriorityRow - a sealed weapon or summon in the unseal priority
	 * pane: its place in the order, image, name and slot, with a drag handle
	 * for editors.
	 */
	import Icon from '$lib/components/Icon.svelte'
	import { getSummonImage, getWeaponImage } from '$lib/utils/images'
	import { localizedName } from '$lib/utils/locale'
	import * as m from '$lib/paraglide/messages'
	import type { GridSummon, GridWeapon } from '$lib/types/api/party'
	import { circledNumber, type PriorityEntry } from './seal'

	interface Props {
		entry: PriorityEntry
		/** 1-based place in the list */
		rank: number
		/** Shows the drag handle */
		canEdit?: boolean
	}

	let { entry, rank, canEdit = false }: Props = $props()

	const image = $derived(
		entry.type === 'weapon'
			? getWeaponImage((entry.item as GridWeapon).weapon?.granblueId, 'grid')
			: getSummonImage((entry.item as GridSummon).summon?.granblueId, 'wide')
	)

	const name = $derived(
		entry.type === 'weapon'
			? localizedName((entry.item as GridWeapon).weapon?.name)
			: localizedName((entry.item as GridSummon).summon?.name)
	)

	const slot = $derived.by(() => {
		const position = String(entry.position + 1)
		return entry.type === 'weapon'
			? m.solomonis_web_grid_weapon_slot({ position })
			: m.solomonis_web_grid_summon_slot({ position })
	})
</script>

<div class="unseal-priority-row" data-testid="unseal-priority-row">
	<span class="rank">{circledNumber(rank)}</span>
	<img class="thumb" src={image} alt="" />
	<span class="text">
		<span class="name">{name}</span>
		<span class="slot">{slot}</span>
	</span>
	{#if canEdit}
		<Icon name="menu" size={14} class="handle" />
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.unseal-priority-row {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit-half spacing.$unit;
		border-radius: layout.$item-corner;
		background: var(--button-contained-bg);
	}

	.rank {
		flex: 0 0 24px;
		text-align: center;
		font-size: 1.8rem;
		font-weight: typography.$bold;
		color: var(--text-secondary);
	}

	.thumb {
		flex: 0 0 auto;
		width: 64px;
		height: auto;
		border-radius: layout.$item-corner-small;
	}

	.unseal-priority-row :global(.handle) {
		flex: 0 0 auto;
		margin-right: spacing.$unit-half;
		color: var(--text-secondary);
	}

	.text {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
		text-align: left;
	}

	.name {
		font-size: typography.$font-small;
		color: var(--text-primary);
		overflow-wrap: anywhere;
	}

	.slot {
		font-size: typography.$font-tiny;
		color: var(--text-tertiary);
	}
</style>

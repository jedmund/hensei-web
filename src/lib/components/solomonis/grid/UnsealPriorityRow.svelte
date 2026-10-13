<script lang="ts">
	/**
	 * UnsealPriorityRow - a sealed weapon or summon in the unseal priority
	 * pane: its rank (when ranked), image, name and slot, with a button that
	 * adds it to the ranking or takes it out.
	 */
	import Button from '$lib/components/ui/Button.svelte'
	import { getSummonImage, getWeaponImage } from '$lib/utils/images'
	import { localizedName } from '$lib/utils/locale'
	import * as m from '$lib/paraglide/messages'
	import type { GridSummon, GridWeapon } from '$lib/types/api/party'
	import { circledNumber, type PriorityEntry } from './seal'

	interface Props {
		entry: PriorityEntry
		/** 1-based rank; null for an unranked entry */
		rank: number | null
		/** Adds an unranked entry to the ranking; no button without it */
		onAdd?: (() => void) | undefined
		/** Takes a ranked entry out of the ranking; no button without it */
		onRemove?: (() => void) | undefined
	}

	let { entry, rank, onAdd, onRemove }: Props = $props()

	const image = $derived(
		entry.type === 'weapon'
			? getWeaponImage((entry.item as GridWeapon).weapon?.granblueId, 'grid')
			: getSummonImage((entry.item as GridSummon).summon?.granblueId, 'grid')
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
	<span class="rank" aria-hidden={rank === null}>
		{rank !== null ? circledNumber(rank) : ''}
	</span>
	<img class="thumb" class:summon={entry.type === 'summon'} src={image} alt="" />
	<span class="text">
		<span class="name">{name}</span>
		<span class="slot">{slot}</span>
	</span>
	{#if onRemove}
		<Button
			variant="ghost"
			size="small"
			iconOnly
			icon="close"
			title={m.solomonis_web_grid_priority_remove()}
			aria-label={m.solomonis_web_grid_priority_remove()}
			onclick={onRemove}
		/>
	{:else if onAdd}
		<Button
			variant="ghost"
			size="small"
			iconOnly
			icon="plus"
			title={m.solomonis_web_grid_priority_add()}
			aria-label={m.solomonis_web_grid_priority_add()}
			onclick={onAdd}
		/>
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
		color: var(--text-primary);
	}

	.thumb {
		flex: 0 0 auto;
		width: 64px;
		height: auto;
		border-radius: layout.$item-corner-small;

		&.summon {
			width: 56px;
		}
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

<script lang="ts">
	/**
	 * UnsealPriorityRow - a sealed weapon or summon in the unseal priority
	 * pane: its place in the order, image and name, with a drag handle
	 * for editors.
	 */
	import Icon from '$lib/components/Icon.svelte'
	import { getWeaponImage } from '$lib/utils/images/weapons'
	import { getSummonImage } from '$lib/utils/images/summons'
	import { localizedName } from '$lib/utils/locale'
	import type { GridSummon, GridWeapon } from '$lib/types/api/party'
	import PriorityNumber from './PriorityNumber.svelte'
	import type { PriorityEntry } from './seal'

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
</script>

<div class="unseal-priority-row" data-testid="unseal-priority-row">
	<PriorityNumber value={rank} />
	<img class="thumb" src={image} alt="" />
	<span class="name">{name}</span>
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

	.thumb {
		flex: 0 0 auto;
		width: 64px;
		height: auto;
		border-radius: layout.$item-corner-small;
	}

	.unseal-priority-row :global(.handle) {
		flex: 0 0 auto;
		margin-right: spacing.$unit-half;
		color: var(--text-tertiary);
	}

	.name {
		flex: 1;
		min-width: 0;
		text-align: left;
		font-size: typography.$font-small;
		color: var(--text-primary);
		overflow-wrap: anywhere;
	}
</style>

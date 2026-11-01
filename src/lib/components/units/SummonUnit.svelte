<script lang="ts">
	import type { GridSummon } from '$lib/types/api/party'
	import { usePartyContext } from '$lib/types/party-context'
	import UnitFrame from './UnitFrame.svelte'
	import OrphanedBadge from './OrphanedBadge.svelte'
	import { getPlaceholderImage } from '$lib/utils/images/core'
	import { getSummonTransformation, getSummonImage } from '$lib/utils/images/summons'
	import { seriesHasUlbArt } from '$lib/utils/summonSeries'
	import { openSummonEditSidebar } from '$lib/features/details/openDetailsSidebar.svelte'
	import { getElementClassName } from '$lib/utils/element'
	import * as m from '$lib/paraglide/messages'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { useUnitActions } from './useUnitActions.svelte'
	import { useUnitDuplicate } from './useUnitDuplicate.svelte'
	import { useUnitSeal } from './useUnitSeal.svelte'
	import quickSummonFilled from '$src/assets/icons/quick-summon/filled.svg'
	import quickSummonEmpty from '$src/assets/icons/quick-summon/empty.svg'

	interface Props {
		item?: GridSummon | undefined
		position: number
		notInCollection?: boolean
		inCollection?: boolean
		sizeOverride?: 'main' | 'grid' | undefined
		/** Shows the slot greyed out and closed to edits (the support summon in Arcarum) */
		disabled?: boolean
		/** Explains a disabled slot on hover */
		disabledTooltip?: string | undefined
	}

	let {
		item,
		position,
		notInCollection = false,
		inCollection = false,
		sizeOverride = undefined,
		disabled = false,
		disabledTooltip = undefined
	}: Props = $props()

	const ctx = usePartyContext()
	const actions = useUnitActions({
		type: 'summon',
		ctx,
		item: () => item,
		position: () => position,
		entity: () => item?.summon
	})
	const duplicate = useUnitDuplicate({
		type: 'summon',
		ctx,
		item: () => item,
		allowed: () => position !== 6,
		linkedToCollection: () => !!item?.collectionSummonId
	})

	// Evoking Solomonis: seal state (no support summon in the mode)
	const seal = useUnitSeal({
		type: 'summon',
		ctx,
		item: () => item,
		position: () => position
	})

	// Use position (not data flags) to determine sizing — position is authoritative
	let isMainSized = $derived(
		sizeOverride ? sizeOverride === 'main' : position === -1 || position === 6
	)

	let imageUrl = $derived.by(() => {
		const variant = isMainSized ? 'main' : 'grid'
		const transformation = getSummonTransformation(
			item?.summon?.granblueId,
			item?.uncapLevel,
			item?.transcendenceStep,
			seriesHasUlbArt(item?.summon?.series)
		)
		return getSummonImage(item?.summon?.granblueId, variant, transformation)
	})

	// Determine element class for focus ring
	let elementClass = $derived(getElementClassName(item?.summon?.element))

	function editItem() {
		if (!item) return
		openSummonEditSidebar(item, actions.partyRefs())
	}

	// Quick summon badge — visible on main and grid positions, not friend or subaura
	let showQuickSummon = $derived(item && position !== undefined && position < 4)

	async function toggleQuickSummon(e: MouseEvent) {
		e.stopPropagation()
		if (!item?.id || !ctx?.canEdit()) return
		try {
			await ctx.services.gridService.updateQuickSummon(item.id, !item.quickSummon)
		} catch (err) {
			console.error('Error toggling quick summon:', err)
			toast.error(extractErrorMessage(err, 'Failed to update quick summon'))
		}
	}
</script>

<UnitFrame
	type="summon"
	{item}
	entity={item?.summon}
	{position}
	{actions}
	{duplicate}
	{seal}
	{elementClass}
	accentElement={item?.summon?.element}
	{imageUrl}
	placeholderImage={getPlaceholderImage(
		'summon',
		position === -1 || position === 6 ? 'main' : 'grid'
	)}
	selected={actions.isSelected}
	{notInCollection}
	{inCollection}
	{disabled}
	{disabledTooltip}
	onEdit={ctx?.canEdit() ? editItem : undefined}
	frameClass={[
		'summon',
		{
			main: isMainSized && position === -1,
			friend: isMainSized && position === 6,
			cell: !isMainSized
		}
	]}
>
	{#snippet badges()}
		{#if item?.orphaned}
			<OrphanedBadge />
		{/if}
	{/snippet}

	{#snippet wrapperExtras()}
		{#if showQuickSummon && ctx?.canEdit()}
			<button
				class="quick-summon"
				class:active={item?.quickSummon}
				class:main={position === -1}
				onclick={toggleQuickSummon}
			>
				<img
					class="quick-summon-icon filled"
					src={quickSummonFilled}
					alt={m.details_quick_summon()}
				/>
				<img
					class="quick-summon-icon empty"
					src={quickSummonEmpty}
					alt={m.details_quick_summon()}
				/>
			</button>
		{:else if item?.quickSummon}
			<img
				class="quick-summon static"
				class:main={position === -1}
				src={quickSummonFilled}
				alt={m.details_quick_summon()}
			/>
		{/if}
	{/snippet}
</UnitFrame>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/unit' as unit;

	.quick-summon {
		top: -2%;
		right: 28%;
		width: spacing.$unit-5x;
		height: spacing.$unit-5x;

		&.main {
			width: spacing.$unit-6x;
			height: spacing.$unit-6x;
		}
	}

	@include unit.unit-toggle-badge(quick-summon);
</style>

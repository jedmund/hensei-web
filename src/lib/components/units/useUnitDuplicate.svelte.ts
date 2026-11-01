/**
 * Duplicate a weapon or summon into the first empty sub slot, then select
 * the next empty slot. Items linked to a collection record ask first, via
 * DuplicateCollectionDialog (bind its `open` to `dialogOpen`).
 *
 * @example
 * ```ts
 * const duplicate = useUnitDuplicate({
 *   type: 'summon',
 *   ctx,
 *   item: () => item,
 *   allowed: () => position !== 6,
 *   linkedToCollection: () => !!item?.collectionSummonId
 * })
 * ```
 */
import type { GridWeapon, GridSummon } from '$lib/types/api/party'
import type { PartyContext } from '$lib/types/party-context'
import { GridType } from '$lib/types/enums'
import { findNextEmptySlot, SLOT_NOT_FOUND } from '$lib/utils/gridHelpers'
import { useAsyncAction } from '$lib/utils/asyncAction.svelte'

interface UseUnitDuplicateArgs {
	type: 'weapon' | 'summon'
	ctx: PartyContext
	item: () => GridWeapon | GridSummon | undefined
	/** Type-specific rule for whether this item can be duplicated at all */
	allowed: () => boolean
	/** Whether the item is linked to a collection record */
	linkedToCollection: () => boolean
}

// Sub slots a duplicate can land in: weapons 0-8, summons 0-3
const SUB_SLOT_COUNT = { weapon: 9, summon: 4 } as const

export type UnitDuplicate = ReturnType<typeof useUnitDuplicate>

export function useUnitDuplicate(args: UseUnitDuplicateArgs) {
	const { type, ctx } = args
	const slotCount = SUB_SLOT_COUNT[type]
	const gridType = type === 'weapon' ? GridType.Weapon : GridType.Summon

	// Duplicate: find the first empty sub slot
	const firstEmptySlot = $derived.by(() => {
		const party = ctx.getParty()
		const items = type === 'weapon' ? party.weapons : party.summons
		const occupied =
			items?.filter((i) => i.position >= 0 && i.position < slotCount).map((i) => i.position) ?? []
		for (let i = 0; i < slotCount; i++) {
			if (!occupied.includes(i)) return i
		}
		return undefined
	})

	const canDuplicate = $derived(!!args.item() && firstEmptySlot !== undefined && args.allowed())

	let dialogOpen = $state(false)

	const action = useAsyncAction(async () => {
		const item = args.item()
		if (!item?.id || firstEmptySlot === undefined) return
		if (type === 'weapon') {
			await ctx.services.gridService.duplicateWeapon(item.id, firstEmptySlot)
		} else {
			await ctx.services.gridService.duplicateSummon(item.id, firstEmptySlot)
		}
		const nextSlot = findNextEmptySlot(ctx.getParty(), gridType, firstEmptySlot)
		if (nextSlot !== SLOT_NOT_FOUND) {
			ctx.setSelectedSlot?.(nextSlot)
		}
	}, `Failed to duplicate ${type}`)

	function duplicate() {
		if (!args.item()?.id || firstEmptySlot === undefined) return
		if (args.linkedToCollection()) {
			dialogOpen = true
			return
		}
		void action.run()
	}

	return {
		get canDuplicate() {
			return canDuplicate
		},
		get busy() {
			return action.busy
		},
		get dialogOpen() {
			return dialogOpen
		},
		set dialogOpen(open: boolean) {
			dialogOpen = open
		},
		duplicate,
		/** Runs the duplicate once the user confirms the collection dialog */
		run: action.run
	}
}

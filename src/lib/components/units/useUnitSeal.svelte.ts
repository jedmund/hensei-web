/**
 * Evoking Solomonis seal state for a weapon or summon slot, including the
 * Extra slots: what the overlay shows, whether an editor can mark the item
 * sealed or unsealed, and the toggle itself. The support summon has no seal
 * in the mode.
 *
 * @example
 * ```ts
 * const seal = useUnitSeal({
 *   type: 'weapon',
 *   ctx,
 *   item: () => item,
 *   position: () => position
 * })
 * ```
 */
import type { GridWeapon, GridSummon } from '$lib/types/api/party'
import type { PartyContext } from '$lib/types/party-context'
import {
	FRIEND_SUMMON_POSITION,
	getExpedition,
	slotSeal,
	type SealItemType
} from '$lib/components/solomonis/grid/seal'
import { nextSealState, writeSealState } from '$lib/components/solomonis/grid/sealActions'

interface UseUnitSealArgs {
	type: SealItemType
	ctx: PartyContext
	item: () => GridWeapon | GridSummon | undefined
	position: () => number
}

export type UnitSeal = ReturnType<typeof useUnitSeal>

export function useUnitSeal(args: UseUnitSealArgs) {
	const { type, ctx } = args

	const seal = $derived.by(() => {
		const expedition = getExpedition(ctx?.getParty())
		if (!expedition) return null
		const position = args.position()
		if (type === 'summon' && position === FRIEND_SUMMON_POSITION) return null
		return slotSeal(expedition, type, position, args.item())
	})

	// Editors mark a non-starting item sealed or unsealed from the lock or the menu
	const canToggle = $derived(!!args.item() && !!seal?.editable && !!ctx?.canEdit())

	function toggle() {
		const item = args.item()
		if (!item || !seal || !ctx) return
		void writeSealState(ctx, type, item, nextSealState(seal.state))
	}

	return {
		type,
		get item() {
			return args.item()
		},
		get seal() {
			return seal
		},
		get canToggle() {
			return canToggle
		},
		toggle
	}
}

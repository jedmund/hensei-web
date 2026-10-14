/**
 * Writes behind the seal controls on a Solomonis party's weapons and
 * summons: the lock over the image and the context menu.
 */
import type { GridSummon, GridWeapon } from '$lib/types/api/party'
import type { PartyContext } from '$lib/types/party-context'
import type { SealItemType } from './seal'

export type WritableSealState = 'sealed' | 'unsealed'

/**
 * Records a slot as sealed or unsealed through the grid item endpoints.
 * gridService reports a failure with a toast, so errors stop here.
 */
export async function writeSealState(
	ctx: PartyContext,
	type: SealItemType,
	item: GridWeapon | GridSummon,
	sealState: WritableSealState
): Promise<void> {
	const party = ctx.getParty()
	try {
		if (type === 'weapon') {
			await ctx.services.gridService.updateWeapon(party.id, item.id, { sealState })
		} else {
			await ctx.services.gridService.updateSummon(party.id, item.id, { sealState })
		}
	} catch {
		// Already reported
	}
}

/** What the lock toggles to: a sealed slot unseals, anything else seals. */
export function nextSealState(current: string | null): WritableSealState {
	return current === 'sealed' ? 'unsealed' : 'sealed'
}

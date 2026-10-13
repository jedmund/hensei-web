<script lang="ts">
	/**
	 * Unsealed/sealed control under a Solomonis party's weapon or summon. A
	 * slot with no recorded state (unknown) shows no selection. Writes go through
	 * the existing grid item update endpoints.
	 */
	import type { GridSummon, GridWeapon } from '$lib/types/api/party'
	import type { SealState } from '$lib/types/api/solomonis'
	import { usePartyContext } from '$lib/types/party-context'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import * as m from '$lib/paraglide/messages'
	import type { SealItemType } from './seal'

	interface Props {
		type: SealItemType
		item: GridWeapon | GridSummon
		sealState: SealState | null
	}

	let { type, item, sealState }: Props = $props()

	const ctx = usePartyContext()
	let saving = $state(false)

	async function handleChange(value: string) {
		if (value !== 'unsealed' && value !== 'sealed') return
		if (value === sealState || saving) return
		const party = ctx.getParty()
		saving = true
		try {
			if (type === 'weapon') {
				await ctx.services.gridService.updateWeapon(party.id, item.id, { sealState: value })
			} else {
				await ctx.services.gridService.updateSummon(party.id, item.id, { sealState: value })
			}
		} catch {
			// gridService already reports the failure with a toast
		} finally {
			saving = false
		}
	}
</script>

<div class="seal-state-control" aria-label={m.solomonis_web_grid_seal_state()}>
	<SegmentedControl
		value={sealState ?? ''}
		onValueChange={handleChange}
		variant="background"
		size="xsmall"
		grow
	>
		<Segment value="unsealed" disabled={saving}>{m.solomonis_web_grid_unsealed()}</Segment>
		<Segment value="sealed" disabled={saving}>{m.solomonis_web_grid_sealed()}</Segment>
	</SegmentedControl>
</div>

<style lang="scss">
	.seal-state-control {
		width: 100%;
	}
</style>

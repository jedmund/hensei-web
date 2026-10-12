/**
 * Openers for the Solomonis sidebar panes, shared by the panel and the party
 * page (which opens the expedition pane when a Solomonis zone is picked as
 * the raid, since the route Evoker decides the zone).
 */
import { toast } from 'svelte-sonner'
import * as m from '$lib/paraglide/messages'
import { sidebar } from '$lib/stores/sidebar.svelte'
import { extractErrorMessage } from '$lib/utils/errors'
import type { Party } from '$lib/types/api/party'
import type { SolomonisExpeditionInput } from '$lib/types/api/solomonis'
import type {
	useUpdatePartyBlessings,
	useUpdateSolomonisExpedition
} from '$lib/api/mutations/solomonis.mutations'
import EditSolomonisPane from './EditSolomonisPane.svelte'
import EditBlessingsPane from './EditBlessingsPane.svelte'
import { isFullExpedition } from './solomonisParty'

export function openEditSolomonisPane(
	party: Party,
	mutation: ReturnType<typeof useUpdateSolomonisExpedition>
) {
	sidebar.openWithComponent(m.solomonis_web_party_title(), EditSolomonisPane, {
		party,
		onSave: (solomonis: SolomonisExpeditionInput) => {
			mutation
				.mutateAsync({ partyId: party.id, shortcode: party.shortcode, solomonis })
				.catch((err: unknown) =>
					toast.error(extractErrorMessage(err, m.solomonis_web_party_save_failed()))
				)
		}
	})
}

export function openEditBlessingsPane(
	party: Party,
	mutation: ReturnType<typeof useUpdatePartyBlessings>
) {
	sidebar.openWithComponent(m.solomonis_web_party_blessings(), EditBlessingsPane, {
		blessings: isFullExpedition(party.solomonis) ? party.solomonis.blessings : [],
		onSave: (blessingLevelIds: string[]) => {
			mutation
				.mutateAsync({ partyId: party.id, shortcode: party.shortcode, blessingLevelIds })
				.catch((err: unknown) =>
					toast.error(extractErrorMessage(err, m.solomonis_web_party_blessings_save_failed()))
				)
		}
	})
}

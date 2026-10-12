/**
 * Openers for the Solomonis sidebar panes, shared by the panel and the party
 * page (which opens the expedition pane when a Solomonis zone is picked as
 * the raid, since the route Evoker decides the zone).
 */
import { toast } from 'svelte-sonner'
import * as m from '$lib/paraglide/messages'
import { sidebar } from '$lib/stores/sidebar.svelte'
import type { Party } from '$lib/types/api/party'
import type { SolomonisExpeditionInput } from '$lib/types/api/solomonis'
import type {
	useUpdatePartyBlessings,
	useUpdateSolomonisExpedition
} from '$lib/api/mutations/solomonis.mutations'
import EditSolomonisPane from './EditSolomonisPane.svelte'
import EditBlessingsPane from './EditBlessingsPane.svelte'
import { isFullExpedition, solomonisErrorMessage } from './solomonisParty'

/** The party a write goes to: its id and shortcode. */
export interface PartyTarget {
	id: string
	shortcode: string
}

/**
 * Opens the expedition pane. On a party that isn't saved yet (`/teams/new`),
 * pass `ensurePartyExists`: the party is created first, then the expedition
 * is written to it.
 */
export function openEditSolomonisPane(
	party: Party,
	mutation: ReturnType<typeof useUpdateSolomonisExpedition>,
	ensurePartyExists?: () => Promise<PartyTarget>
) {
	sidebar.openWithComponent(m.solomonis_web_party_title(), EditSolomonisPane, {
		party,
		onSave: async (solomonis: SolomonisExpeditionInput) => {
			try {
				const target: PartyTarget =
					party.id === 'new' && ensurePartyExists ? await ensurePartyExists() : party
				await mutation.mutateAsync({
					partyId: target.id,
					shortcode: target.shortcode,
					solomonis
				})
			} catch (err: unknown) {
				toast.error(solomonisErrorMessage(err, m.solomonis_web_party_save_failed()))
			}
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
					toast.error(solomonisErrorMessage(err, m.solomonis_web_party_blessings_save_failed()))
				)
		}
	})
}

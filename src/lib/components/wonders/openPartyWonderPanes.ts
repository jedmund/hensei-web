/**
 * Openers for a team's Wonder panes: the details pane (from the Wonders
 * tile) and the edit pane (from the tile or the details pane's Edit).
 */
import { m } from '$lib/paraglide/messages'
import { showStackedPane } from '$lib/stores/stackedPanes'
import type { Party } from '$lib/types/api/party'
import type { PartyWonderInput } from '$lib/types/api/wonder'
import type { useUpdatePartyWonders } from '$lib/api/mutations/wonder.mutations'
import PartyWondersPane from './PartyWondersPane.svelte'
import EditWondersPane from './EditWondersPane.svelte'

export type PartyWondersMutation = ReturnType<typeof useUpdatePartyWonders>

/** `getParty` keeps the pane in step with the party page. */
export function openPartyWondersPane(getParty: () => Party, canEdit: boolean) {
	showStackedPane(m.wonders_title(), PartyWondersPane, { getParty, canEdit })
}

/**
 * Opens the edit pane. Saving replaces the party's whole set through
 * `PUT /parties/:id/wonders`; the mutation toasts its own errors.
 */
export function openEditWondersPane(party: Party, mutation: PartyWondersMutation) {
	showStackedPane(m.wonders_party_edit_title(), EditWondersPane, {
		party,
		onSave: (wonders: PartyWonderInput[]) => {
			mutation.mutate({ partyId: party.id, shortcode: party.shortcode, wonders })
		}
	})
}

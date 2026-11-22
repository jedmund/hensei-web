/**
 * Openers for a team's Wonder panes: the details pane (from the Wonders
 * tile) and the edit pane (from the tile or the details pane's Edit).
 * `getParty` keeps each pane in step with the party page.
 */
import { m } from '$lib/paraglide/messages'
import { showStackedPane } from '$lib/stores/stackedPanes'
import type { Party } from '$lib/types/api/party'
import PartyWondersPane from './PartyWondersPane.svelte'
import EditWondersPane from './EditWondersPane.svelte'

export function openPartyWondersPane(getParty: () => Party, canEdit: boolean) {
	showStackedPane(m.wonders_title(), PartyWondersPane, { getParty, canEdit })
}

/** Opens the edit pane, which saves each change through `PUT /parties/:id/wonders`. */
export function openEditWondersPane(getParty: () => Party) {
	showStackedPane(m.wonders_party_edit_title(), EditWondersPane, { getParty })
}

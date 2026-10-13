/**
 * Openers for the Solomonis sidebar panes, shared by the details pane and the
 * party page (which opens the expedition pane when a Solomonis zone is picked
 * as the raid, since the route Evoker decides the zone).
 */
import type { Component } from 'svelte'
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
import SolomonisDetailsPane from './SolomonisDetailsPane.svelte'
import { isFullExpedition, solomonisErrorMessage } from './solomonisParty'

/**
 * Shows a Solomonis pane: on top of the open sidebar (so Back returns to,
 * say, the details pane), or as a fresh sidebar when none is open.
 */
export function showSolomonisPane(
	title: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	component: Component<any>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	props: Record<string, any>
) {
	if (sidebar.state.open && !sidebar.paneStack.isEmpty) {
		sidebar.push({ id: crypto.randomUUID(), title, component, props, scrollable: true })
	} else {
		sidebar.openWithComponent(title, component, props)
	}
}

/** Leaves a Solomonis pane: back to the pane below it, or closes the sidebar. */
export function finishSolomonisPane() {
	if (sidebar.paneStack.depth > 1) sidebar.pop()
	else sidebar.close()
}

/**
 * Opens the Evoking Solomonis details pane: the expedition, blessings, run
 * details and guidebook. `getParty` keeps it in step with the party page.
 */
export function openSolomonisDetailsPane(getParty: () => Party, canEdit: boolean) {
	showSolomonisPane(m.solomonis_web_party_title(), SolomonisDetailsPane, { getParty, canEdit })
}

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
	showSolomonisPane(m.solomonis_web_party_title(), EditSolomonisPane, {
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
	showSolomonisPane(m.solomonis_web_party_blessings(), EditBlessingsPane, {
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

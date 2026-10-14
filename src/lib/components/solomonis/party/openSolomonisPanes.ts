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
import SolomonisDetailsPane from './SolomonisDetailsPane.svelte'
import { solomonisErrorMessage } from './solomonisParty'

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
 * Opens the Evoking Solomonis details pane: the expedition, blessings, report
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

/** What the edit pane's Save hands back: null for a part that didn't change. */
export interface SolomonisPaneChanges {
	expedition: SolomonisExpeditionInput | null
	blessingLevelIds: string[] | null
}

/** The two writes behind the edit pane's Save. */
export interface SolomonisMutations {
	expedition: ReturnType<typeof useUpdateSolomonisExpedition>
	blessings: ReturnType<typeof useUpdatePartyBlessings>
}

/**
 * Opens the Evoking Solomonis edit pane (D25). Saving writes the expedition,
 * then the blessings, since blessings need the expedition to exist. On a
 * party that isn't saved yet (`/teams/new`), pass `ensurePartyExists`: the
 * party is created first.
 */
export function openEditSolomonisPane(
	party: Party,
	mutations: SolomonisMutations,
	ensurePartyExists?: () => Promise<PartyTarget>
) {
	showSolomonisPane(m.solomonis_web_party_title(), EditSolomonisPane, {
		party,
		onSave: async ({ expedition, blessingLevelIds }: SolomonisPaneChanges) => {
			let target: PartyTarget
			try {
				target = party.id === 'new' && ensurePartyExists ? await ensurePartyExists() : party
				if (expedition) {
					await mutations.expedition.mutateAsync({
						partyId: target.id,
						shortcode: target.shortcode,
						solomonis: expedition
					})
				}
			} catch (err: unknown) {
				toast.error(solomonisErrorMessage(err, m.solomonis_web_party_save_failed()))
				return
			}

			if (!blessingLevelIds) return
			try {
				await mutations.blessings.mutateAsync({
					partyId: target.id,
					shortcode: target.shortcode,
					blessingLevelIds
				})
			} catch {
				// The blessings mutation toasts its own errors
			}
		}
	})
}

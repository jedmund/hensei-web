import type { Party } from '$lib/types/api/party'
import { sidebar } from '$lib/stores/sidebar.svelte'
import CalculatorPane from '$lib/components/sidebar/CalculatorPane.svelte'
import * as m from '$lib/paraglide/messages'

/** Opens the skill calculator for a saved party; no-op for unsaved ones. */
export function openCalculatorPane(party: Party) {
	if (!party.shortcode) return
	sidebar.openWithComponent(
		m.pane_skill_boosts(),
		CalculatorPane,
		{ shortcode: party.shortcode, element: party.element },
		{ scrollable: true }
	)
}

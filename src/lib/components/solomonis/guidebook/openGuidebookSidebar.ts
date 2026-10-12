/**
 * Opens the sidebar panes for editing a run's guidebook. Lives with the
 * guidebook components rather than in features/search so the Solomonis lane
 * owns it.
 */

import { sidebar } from '$lib/stores/sidebar.svelte'
import * as m from '$lib/paraglide/messages'
import type { GuideEffect, GuidebookEntry } from '$lib/types/api/solomonis'
import GuideEffectSearchContent from './GuideEffectSearchContent.svelte'
import GuideEffectEditPane from './GuideEffectEditPane.svelte'
import type { GuidebookEntryPatch } from './guidebook'

interface GuideEffectSearchOptions {
	/** The run's current guidebook, so results show what's held. */
	entries: () => GuidebookEntry[]
	/** Called for each pick. The sidebar stays open so effects can be stacked. */
	onSelect: (effect: GuideEffect) => void
}

export function openGuideEffectSearchSidebar({ entries, onSelect }: GuideEffectSearchOptions) {
	sidebar.openWithComponent(m.solomonis_web_guidebook_search_title(), GuideEffectSearchContent, {
		entries,
		onSelect
	})
}

interface GuidebookEntryEditOptions {
	entry: GuidebookEntry
	onSave: (patch: GuidebookEntryPatch) => void
	onRemove: () => void
}

export function openGuidebookEntrySidebar({ entry, onSave, onRemove }: GuidebookEntryEditOptions) {
	sidebar.openWithComponent(m.solomonis_web_guidebook_edit_title(), GuideEffectEditPane, {
		entry,
		onSave,
		onRemove
	})
}

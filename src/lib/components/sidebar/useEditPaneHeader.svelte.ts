/**
 * Register the pane header's save action + unsaved-changes hook for an edit
 * pane that has a `stats` / `notes` tab pair.
 *
 * On the Notes tab the stats sub-pane is unmounted, so calling its save would
 * be a no-op. Note/role edits persist inline as the user types, so the header
 * Save button just dismisses the pane for parity with other edit panes.
 *
 * @example
 * ```ts
 * useEditPaneHeader({
 *   paneId: () => paneId,
 *   activeTab: () => activeTab,
 *   elementName: () => elementName,
 *   saveStats: () => editPaneRef?.save(),
 *   hasChanges: () => editPaneRef?.getHasChanges() ?? false,
 *   onCancel
 * })
 * ```
 */
import { untrack } from 'svelte'
import { sidebar } from '$lib/stores/sidebar.svelte'
import * as m from '$lib/paraglide/messages'

type ElementName = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined

interface UseEditPaneHeaderArgs {
	paneId: () => string | undefined
	activeTab: () => 'stats' | 'notes'
	elementName: () => ElementName
	saveStats: () => void
	hasChanges: () => boolean
	onCancel?: (() => void) | undefined
}

export function useEditPaneHeader(args: UseEditPaneHeaderArgs) {
	$effect(() => {
		const el = args.elementName()
		const tab = args.activeTab()
		untrack(() => {
			const paneId = args.paneId()
			if (!paneId) return
			const handler = tab === 'notes' ? () => args.onCancel?.() : args.saveStats
			sidebar.setActionForPane(paneId, handler, m.action_save(), el)
			sidebar.paneStack.updatePaneById(paneId, {
				hasUnsavedChanges: () => (tab === 'notes' ? false : args.hasChanges())
			})
		})
	})
}

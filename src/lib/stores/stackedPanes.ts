/**
 * Panes opened from a party page or another pane: shown on top of the open
 * sidebar (so Back returns to, say, a details pane), or as a fresh sidebar
 * when none is open. Leaving goes back to the pane below, or closes.
 *
 * @module stores/stackedPanes
 */
import type { Component } from 'svelte'
import { sidebar } from '$lib/stores/sidebar.svelte'
import { uuid } from '$lib/utils/uuid'

export function showStackedPane(
	title: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	component: Component<any>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	props: Record<string, any>
) {
	if (sidebar.state.open && !sidebar.paneStack.isEmpty) {
		sidebar.push({ id: uuid(), title, component, props, scrollable: true })
	} else {
		sidebar.openWithComponent(title, component, props)
	}
}

/** Leaves a stacked pane: back to the pane below it, or closes the sidebar. */
export function finishStackedPane() {
	if (sidebar.paneStack.depth > 1) sidebar.pop()
	else sidebar.close()
}

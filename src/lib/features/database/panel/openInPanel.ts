/**
 * Opening a record in the database side panel from a list.
 */
import { goto } from '$app/navigation'
import { readOpen, relativeHref, withOpen } from './panelUrl'

/** Phones open the full page instead of the panel. */
export const PANEL_MIN_QUERY = '(min-width: 769px)'

type ClickLike = Pick<MouseEvent, 'button' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>

/**
 * Whether a click on a list row should open the panel. Modified and
 * middle clicks keep their browser meaning (new tab/window), and phones
 * get the full page.
 */
export function opensInPanel(event: ClickLike | null, wideEnough: boolean): boolean {
	if (!wideEnough) return false
	if (!event) return true
	if (event.button !== 0) return false
	return !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
}

/**
 * Show `id` in the panel. The first open pushes a history entry so Back
 * closes the panel; switching records while it's open replaces it.
 */
export function openInPanel(url: URL, id: string, state: App.PageState): Promise<void> {
	const alreadyOpen = readOpen(url) !== null
	return goto(relativeHref(withOpen(url, id)), {
		noScroll: true,
		keepFocus: true,
		replaceState: alreadyOpen,
		state: alreadyOpen ? state : { recordPanel: true }
	})
}

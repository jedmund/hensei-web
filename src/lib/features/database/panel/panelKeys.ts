/**
 * Keyboard handling for the record panel. Pure so it can be unit tested.
 */

export type PanelKeyAction = 'next' | 'prev' | 'close' | 'edit' | 'save' | 'cancel'

const NON_TEXT_INPUT_TYPES = new Set([
	'button',
	'checkbox',
	'color',
	'file',
	'image',
	'radio',
	'range',
	'reset',
	'submit'
])

/** True when typing into `target` would be swallowed by a shortcut. */
export function isTextField(target: EventTarget | null): boolean {
	if (!target || typeof (target as Element).closest !== 'function') return false
	const el = target as HTMLElement
	if (el.isContentEditable) return true
	if (el.closest('[contenteditable=""], [contenteditable="true"]')) return true
	const tag = el.tagName
	if (tag === 'TEXTAREA' || tag === 'SELECT') return true
	if (tag === 'INPUT') {
		const type = ((el as HTMLInputElement).type || 'text').toLowerCase()
		return !NON_TEXT_INPUT_TYPES.has(type)
	}
	return false
}

export interface PanelKeyContext {
	/** Focus is inside the panel (arrows only step from there; in the list they scroll) */
	focusInPanel: boolean
	/** The panel shows the edit form: ⌘S saves, Esc stops editing, e does nothing */
	editing?: boolean
}

type KeyEventLike = Pick<
	KeyboardEvent,
	| 'key'
	| 'target'
	| 'metaKey'
	| 'ctrlKey'
	| 'altKey'
	| 'shiftKey'
	| 'defaultPrevented'
	| 'isComposing'
>

export function panelKeyAction(
	event: KeyEventLike,
	context: PanelKeyContext
): PanelKeyAction | null {
	if (event.defaultPrevented || event.isComposing) return null
	const editing = context.editing ?? false
	// ⌘S / ctrl+S saves from anywhere in the form, text fields included
	if (
		editing &&
		(event.metaKey || event.ctrlKey) &&
		!event.altKey &&
		event.key.toLowerCase() === 's'
	) {
		return 'save'
	}
	if (event.metaKey || event.ctrlKey || event.altKey) return null
	// Esc stops editing even from a text field; it would only blur it otherwise
	if (editing && event.key === 'Escape') return 'cancel'
	if (isTextField(event.target)) return null

	switch (event.key) {
		case 'j':
			return event.shiftKey ? null : 'next'
		case 'k':
			return event.shiftKey ? null : 'prev'
		case 'e':
			return event.shiftKey || editing ? null : 'edit'
		case 'Escape':
			return 'close'
		case 'ArrowDown':
			return context.focusInPanel ? 'next' : null
		case 'ArrowUp':
			return context.focusInPanel ? 'prev' : null
		default:
			return null
	}
}

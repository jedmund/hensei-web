/**
 * Pure decisions for the unsaved-changes guard on database edit pages.
 */

export type GuardDecision = 'allow' | 'native' | 'confirm'

/**
 * What to do with a navigation away from a form.
 * `leave` (closing the tab, reloading, typing a URL) can only use the
 * browser's own prompt; in-app navigations get our confirmation dialog.
 */
export function guardDecision(dirty: boolean, released: boolean, type: string): GuardDecision {
	if (!dirty || released) return 'allow'
	return type === 'leave' ? 'native' : 'confirm'
}

/** Comparable form state. */
export function snapshot(value: unknown): string {
	return JSON.stringify(value) ?? ''
}

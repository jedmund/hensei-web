/**
 * Unsaved-changes guard for database edit pages.
 *
 * Create it during component init with a getter for the form state, call
 * `reset()` whenever the form is (re)populated from the record, `release()`
 * right before navigating away after a successful save, and render
 * `<UnsavedChangesDialog guard={...} />`.
 */
import { untrack } from 'svelte'
import { beforeNavigate, goto } from '$app/navigation'
import { guardDecision, snapshot } from './unsavedChanges'

export class UnsavedChangesGuard {
	/** The confirmation dialog is showing */
	confirming = $state(false)

	#read: () => unknown
	#baseline: string | null = null
	#released = false
	#pending: { url: URL; delta: number | undefined } | null = null

	constructor(read: () => unknown) {
		this.#read = read
		beforeNavigate((navigation) => {
			const decision = guardDecision(this.dirty, this.#released, navigation.type)
			if (decision === 'allow') return
			navigation.cancel()
			if (decision === 'confirm' && navigation.to) {
				this.#pending = {
					url: navigation.to.url,
					delta: navigation.type === 'popstate' ? navigation.delta : undefined
				}
				this.confirming = true
			}
		})
	}

	get dirty(): boolean {
		return this.#baseline !== null && untrack(() => snapshot(this.#read())) !== this.#baseline
	}

	/** Treat the current form state as saved. */
	reset() {
		this.#baseline = untrack(() => snapshot(this.#read()))
	}

	/** Let navigations through from now on (after saving). */
	release() {
		this.#released = true
	}

	/** Discard the changes and carry on with the navigation that was stopped. */
	discard() {
		const pending = this.#pending
		this.#pending = null
		this.confirming = false
		this.#released = true
		if (!pending) return
		if (pending.delta) history.go(pending.delta)
		else if (pending.url.origin !== location.origin) location.href = pending.url.href
		else goto(pending.url)
	}

	/** Stay on the page. */
	keep() {
		this.#pending = null
		this.confirming = false
	}
}

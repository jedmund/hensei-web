import type { Snippet, Component } from 'svelte'
import {
	PaneStackStore,
	type PaneConfig,
	type OverflowMenuItem,
	type ElementType
} from '$lib/stores/paneStack.svelte'

// Standard sidebar width
export const SIDEBAR_WIDTH = '420px'

interface OpenWithComponentOptions {
	scrollable?: boolean
	onsave?: () => void
	saveLabel?: string
	element?: ElementType
	onback?: () => void
	image?: string
	persistOnTabSwitch?: boolean
}

interface SidebarState {
	open: boolean
	activeItemId: string | undefined
	/** Whether an unsaved-changes confirmation dialog should be shown */
	confirmationRequested: boolean
	/** Action to run if the user confirms (e.g. close sidebar, navigate away) */
	pendingAction: (() => void) | null
}

/**
 * SidebarStore
 *
 * Manages the sidebar open/close state and its pane stack.
 * The sidebar always uses a pane stack internally - even a "single pane"
 * is just a stack with one item.
 */
class SidebarStore {
	state = $state<SidebarState>({
		open: false,
		activeItemId: undefined,
		confirmationRequested: false,
		pendingAction: null
	})

	/** The pane stack for sidebar navigation */
	paneStack = new PaneStackStore()

	/** Timeout ID for delayed pane stack clear after close animation */
	private clearTimeoutId: ReturnType<typeof setTimeout> | null = null

	/**
	 * Open the sidebar with a snippet content (legacy API)
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	open(title?: string, content?: Snippet, scrollable = true) {
		// Cancel any pending clear from a previous close()
		this.cancelPendingClear()

		// For snippet content, we don't use the pane stack
		// This is for backwards compatibility
		this.state.open = true
		// Clear any existing panes
		this.paneStack.clear()
	}

	/**
	 * Open the sidebar with a component as the root pane
	 */
	openWithComponent(
		title: string,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		component: Component<any>,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		props?: Record<string, any>,
		options?: OpenWithComponentOptions | boolean
	) {
		// Cancel any pending clear from a previous close()
		this.cancelPendingClear()

		// Handle backward compatibility where 4th param was scrollable boolean
		const opts: OpenWithComponentOptions =
			typeof options === 'boolean' ? { scrollable: options } : (options ?? {})

		// Build the pane config
		const paneConfig: PaneConfig = {
			id: crypto.randomUUID(),
			title,
			image: opts.image,
			component,
			props,
			onback: opts.onback,
			scrollable: opts.scrollable ?? true,
			persistOnTabSwitch: opts.persistOnTabSwitch,
			action: opts.onsave
				? {
						label: opts.saveLabel ?? 'Done',
						handler: opts.onsave,
						element: opts.element
					}
				: undefined
		}

		// Reset the pane stack with this as the root pane
		this.paneStack.reset(paneConfig)
		this.state.open = true

		// Extract and store the item ID if it's a details sidebar
		if (props?.item?.id) {
			this.state.activeItemId = String(props.item.id)
		}
	}

	/**
	 * Push a new pane onto the sidebar's pane stack
	 */
	push(config: PaneConfig) {
		this.paneStack.push(config)
	}

	/**
	 * Pop the current pane from the sidebar's pane stack
	 */
	pop(): boolean {
		return this.paneStack.pop()
	}

	/**
	 * Close the sidebar
	 */
	close() {
		this.state.open = false
		this.state.activeItemId = undefined
		this.dismissConfirmation()
		// Clear pane stack after animation completes
		this.clearTimeoutId = setTimeout(() => {
			this.paneStack.clear()
			this.clearTimeoutId = null
		}, 300)
	}

	/**
	 * Request to close the sidebar from a tab switch or similar action.
	 * Respects `persistOnTabSwitch` on the current pane.
	 * If unsaved changes exist, shows a confirmation dialog.
	 */
	requestClose() {
		if (this.paneStack.currentPane?.persistOnTabSwitch) return

		if (this.paneStack.anyPaneHasUnsavedChanges) {
			this.requestConfirmation(() => this.close())
		} else {
			this.close()
		}
	}

	/**
	 * Show the unsaved-changes confirmation dialog with a pending action.
	 * All unsaved-changes dialogs go through this single entry point.
	 */
	requestConfirmation(action: () => void) {
		this.state.confirmationRequested = true
		this.state.pendingAction = action
	}

	/**
	 * User confirmed — run the pending action and dismiss the dialog.
	 */
	confirmPendingAction() {
		const action = this.state.pendingAction
		this.state.confirmationRequested = false
		this.state.pendingAction = null
		action?.()
	}

	/**
	 * User cancelled — dismiss the dialog without running the action.
	 */
	dismissConfirmation() {
		this.state.confirmationRequested = false
		this.state.pendingAction = null
	}

	/**
	 * Cancel any pending pane stack clear from a previous close()
	 */
	private cancelPendingClear() {
		if (this.clearTimeoutId) {
			clearTimeout(this.clearTimeoutId)
			this.clearTimeoutId = null
		}
	}

	/**
	 * Toggle the sidebar open/close state
	 */
	toggle() {
		if (this.state.open) {
			this.close()
		} else {
			this.state.open = true
		}
	}

	/**
	 * Update the action button for the current pane
	 * @param handler - Click handler, or undefined to show disabled button
	 * @param label - Button label (defaults to 'Done')
	 * @param element - Element type for styling
	 * @param show - Whether to show the button at all (defaults to true if label provided)
	 */
	setAction(
		handler: (() => void) | undefined,
		label?: string,
		element?: ElementType,
		show: boolean = true
	) {
		const panes = this.paneStack.panes
		const currentIndex = panes.length - 1
		if (currentIndex >= 0 && panes[currentIndex]) {
			this.paneStack.updatePaneAt(currentIndex, {
				action:
					show && label
						? {
								label,
								handler: handler ?? (() => {}),
								element,
								disabled: !handler
							}
						: undefined
			})
		}
	}

	/**
	 * Set the action button for a specific pane by ID.
	 * Use this when the pane may not be on top of the stack.
	 */
	setActionForPane(
		paneId: string,
		handler: (() => void) | undefined,
		label?: string,
		element?: ElementType,
		show: boolean = true
	) {
		const action =
			show && label
				? {
						label,
						handler: handler ?? (() => {}),
						element,
						disabled: !handler
					}
				: undefined
		this.paneStack.updatePaneById(paneId, { action })
	}

	/**
	 * Clear the action button for the current pane
	 */
	clearAction() {
		this.setAction(undefined)
	}

	/**
	 * Set the overflow menu items for the current pane
	 */
	setOverflowMenu(items: OverflowMenuItem[] | undefined) {
		const panes = this.paneStack.panes
		const currentIndex = panes.length - 1
		if (currentIndex >= 0 && panes[currentIndex]) {
			this.paneStack.updatePaneAt(currentIndex, { overflowMenu: items })
		}
	}

	/**
	 * Set the overflow menu items for a specific pane by ID.
	 * Use this when the pane may not be on top of the stack.
	 */
	setOverflowMenuForPane(paneId: string, items: OverflowMenuItem[] | undefined) {
		this.paneStack.updatePaneById(paneId, { overflowMenu: items })
	}

	/**
	 * Clear the overflow menu for the current pane
	 */
	clearOverflowMenu() {
		this.setOverflowMenu(undefined)
	}

	// Getters for reactive access
	get isOpen() {
		return this.state.open
	}

	get activeItemId() {
		return this.state.activeItemId
	}

	get confirmationRequested() {
		return this.state.confirmationRequested
	}

	// Backwards compatibility getters (delegate to pane stack)
	get title() {
		return this.paneStack.currentPane?.title
	}

	get component() {
		return this.paneStack.currentPane?.component
	}

	get componentProps() {
		return this.paneStack.currentPane?.props
	}

	get scrollable() {
		return this.paneStack.currentPane?.scrollable ?? true
	}

	get onsave() {
		return this.paneStack.currentPane?.action?.handler
	}

	get saveLabel() {
		return this.paneStack.currentPane?.action?.label
	}

	get element() {
		return this.paneStack.currentPane?.action?.element
	}

	get onback() {
		return this.paneStack.currentPane?.onback
	}

	// Legacy getter for content (not used with pane stack)
	get content(): Snippet | undefined {
		return undefined
	}
}

export const sidebar = new SidebarStore()

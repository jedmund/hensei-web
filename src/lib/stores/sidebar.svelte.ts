import type { Snippet, Component } from 'svelte'
import {
	PaneStackStore,
	type PaneConfig,
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
}

interface SidebarState {
	open: boolean
	activeItemId: string | undefined
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
		activeItemId: undefined
	})

	/** The pane stack for sidebar navigation */
	paneStack = new PaneStackStore()

	/**
	 * Open the sidebar with a snippet content (legacy API)
	 */
	open(title?: string, content?: Snippet, scrollable = true) {
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
		component: Component<any, any, any>,
		props?: Record<string, any>,
		options?: OpenWithComponentOptions | boolean
	) {
		// Handle backward compatibility where 4th param was scrollable boolean
		const opts: OpenWithComponentOptions =
			typeof options === 'boolean' ? { scrollable: options } : options ?? {}

		// Build the pane config
		const paneConfig: PaneConfig = {
			id: crypto.randomUUID(),
			title,
			component,
			props,
			onback: opts.onback,
			scrollable: opts.scrollable ?? true,
			action:
				opts.onsave ?
					{
						label: opts.saveLabel ?? 'Done',
						handler: opts.onsave,
						element: opts.element
					}
				:	undefined
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
		// Clear pane stack after animation
		setTimeout(() => {
			this.paneStack.clear()
		}, 300)
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
	 */
	setAction(
		onsave: (() => void) | undefined,
		saveLabel?: string,
		element?: ElementType
	) {
		const currentPane = this.paneStack.currentPane
		if (currentPane) {
			this.paneStack.updateCurrentProps({})
			// Update action on current pane
			const panes = this.paneStack.panes
			const currentIndex = panes.length - 1
			if (currentIndex >= 0 && panes[currentIndex]) {
				panes[currentIndex] = {
					...panes[currentIndex],
					action:
						onsave ?
							{
								label: saveLabel ?? 'Done',
								handler: onsave,
								element
							}
						:	undefined
				}
			}
		}
	}

	/**
	 * Clear the action button for the current pane
	 */
	clearAction() {
		this.setAction(undefined)
	}

	// Getters for reactive access
	get isOpen() {
		return this.state.open
	}

	get activeItemId() {
		return this.state.activeItemId
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

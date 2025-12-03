import type { Component } from 'svelte'

/**
 * Pane Stack Store
 *
 * Manages a stack of panes for iOS-style navigation within the sidebar.
 * Supports push/pop operations with animated transitions.
 */

export type ElementType = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

export interface PaneConfig {
	/** Unique identifier for this pane */
	id: string
	/** Title displayed in the pane header */
	title: string
	/** Component to render in the pane */
	component: Component<any, any, any>
	/** Props to pass to the component */
	props?: Record<string, any>
	/** Optional callback when back is clicked (for root pane) */
	onback?: () => void
	/** Optional save/action button configuration */
	action?: {
		label: string
		handler: () => void
		element?: ElementType
	}
	/** Whether this pane's content should scroll */
	scrollable?: boolean
}

interface PaneStackState {
	/** Stack of panes (last is active/visible) */
	panes: PaneConfig[]
	/** Whether an animation is in progress */
	isAnimating: boolean
	/** Direction of current animation */
	animationDirection: 'push' | 'pop' | null
}

class PaneStackStore {
	state = $state<PaneStackState>({
		panes: [],
		isAnimating: false,
		animationDirection: null
	})

	/** Animation duration in ms - should match CSS */
	private readonly ANIMATION_DURATION = 300

	/**
	 * Push a new pane onto the stack
	 */
	push(config: PaneConfig) {
		if (this.state.isAnimating) return

		this.state.isAnimating = true
		this.state.animationDirection = 'push'
		this.state.panes = [...this.state.panes, config]

		// Clear animation state after transition completes
		setTimeout(() => {
			this.state.isAnimating = false
			this.state.animationDirection = null
		}, this.ANIMATION_DURATION)
	}

	/**
	 * Pop the top pane from the stack
	 * Returns true if a pane was popped, false if stack was empty
	 */
	pop(): boolean {
		if (this.state.isAnimating) return false
		if (this.state.panes.length <= 1) {
			// If only root pane, call its onback if defined
			const rootPane = this.state.panes[0]
			if (rootPane?.onback) {
				rootPane.onback()
			}
			return false
		}

		this.state.isAnimating = true
		this.state.animationDirection = 'pop'

		// Remove the top pane after animation starts
		setTimeout(() => {
			this.state.panes = this.state.panes.slice(0, -1)
			this.state.isAnimating = false
			this.state.animationDirection = null
		}, this.ANIMATION_DURATION)

		return true
	}

	/**
	 * Pop all panes until reaching the pane with the given id
	 */
	popTo(id: string) {
		const index = this.state.panes.findIndex((p) => p.id === id)
		if (index === -1 || index === this.state.panes.length - 1) return

		if (this.state.isAnimating) return

		this.state.isAnimating = true
		this.state.animationDirection = 'pop'

		setTimeout(() => {
			this.state.panes = this.state.panes.slice(0, index + 1)
			this.state.isAnimating = false
			this.state.animationDirection = null
		}, this.ANIMATION_DURATION)
	}

	/**
	 * Pop to the root pane
	 */
	popToRoot() {
		if (this.state.panes.length <= 1) return
		this.popTo(this.state.panes[0]?.id ?? '')
	}

	/**
	 * Clear the entire stack
	 */
	clear() {
		this.state.panes = []
		this.state.isAnimating = false
		this.state.animationDirection = null
	}

	/**
	 * Replace the entire stack with a new root pane
	 */
	reset(config: PaneConfig) {
		this.state.panes = [config]
		this.state.isAnimating = false
		this.state.animationDirection = null
	}

	/**
	 * Update props for the current (top) pane
	 */
	updateCurrentProps(props: Record<string, any>) {
		if (this.state.panes.length === 0) return

		const currentIndex = this.state.panes.length - 1
		const currentPane = this.state.panes[currentIndex]
		if (currentPane) {
			this.state.panes[currentIndex] = {
				...currentPane,
				props: { ...currentPane.props, ...props }
			}
		}
	}

	// Getters for reactive access
	get panes() {
		return this.state.panes
	}

	get currentPane(): PaneConfig | undefined {
		return this.state.panes[this.state.panes.length - 1]
	}

	get isAnimating() {
		return this.state.isAnimating
	}

	get animationDirection() {
		return this.state.animationDirection
	}

	get depth() {
		return this.state.panes.length
	}

	get isEmpty() {
		return this.state.panes.length === 0
	}

	get canGoBack() {
		return this.state.panes.length > 1 || !!this.state.panes[0]?.onback
	}
}

/**
 * Create a new pane stack instance
 * Use this to create isolated pane stacks for different contexts
 */
export function createPaneStack() {
	return new PaneStackStore()
}

// Default global pane stack for sidebar
export const paneStack = new PaneStackStore()

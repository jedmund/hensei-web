import type { Snippet, Component } from 'svelte'

// Standard sidebar width
export const SIDEBAR_WIDTH = '420px'

interface SidebarState {
	open: boolean
	title: string | undefined
	content: Snippet | undefined
	component: Component<any, any, any> | undefined
	componentProps: Record<string, any> | undefined
	scrollable: boolean
	activeItemId: string | undefined
	onsave: (() => void) | undefined
	saveLabel: string | undefined
	element: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined
	onback: (() => void) | undefined
}

interface OpenWithComponentOptions {
	scrollable?: boolean
	onsave?: () => void
	saveLabel?: string
	element?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
	onback?: () => void
}

class SidebarStore {
	state = $state<SidebarState>({
		open: false,
		title: undefined,
		content: undefined,
		component: undefined,
		componentProps: undefined,
		scrollable: true,
		activeItemId: undefined,
		onsave: undefined,
		saveLabel: undefined,
		element: undefined,
		onback: undefined
	})

	open(title?: string, content?: Snippet, scrollable = true) {
		this.state.open = true
		this.state.title = title
		this.state.content = content
		this.state.component = undefined
		this.state.componentProps = undefined
		this.state.scrollable = scrollable
	}

	openWithComponent(
		title: string,
		component: Component<any, any, any>,
		props?: Record<string, any>,
		options?: OpenWithComponentOptions | boolean
	) {
		// Handle backward compatibility where 4th param was scrollable boolean
		const opts: OpenWithComponentOptions =
			typeof options === 'boolean' ? { scrollable: options } : options ?? {}

		this.state.open = true
		this.state.title = title
		this.state.component = component
		this.state.componentProps = props
		this.state.content = undefined
		this.state.scrollable = opts.scrollable ?? true
		this.state.onsave = opts.onsave
		this.state.saveLabel = opts.saveLabel
		this.state.element = opts.element
		this.state.onback = opts.onback
		// Extract and store the item ID if it's a details sidebar
		if (props?.item?.id) {
			this.state.activeItemId = String(props.item.id)
		}
	}

	close() {
		this.state.open = false
		this.state.activeItemId = undefined
		// Clear content after animation
		setTimeout(() => {
			this.state.title = undefined
			this.state.content = undefined
			this.state.component = undefined
			this.state.componentProps = undefined
			this.state.onsave = undefined
			this.state.saveLabel = undefined
			this.state.element = undefined
			this.state.onback = undefined
		}, 300)
	}

	toggle() {
		if (this.state.open) {
			this.close()
		} else {
			this.open()
		}
	}

	/** Update the right accessory action button dynamically */
	setAction(
		onsave: (() => void) | undefined,
		saveLabel?: string,
		element?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
	) {
		this.state.onsave = onsave
		this.state.saveLabel = saveLabel
		this.state.element = element
	}

	/** Clear the right accessory action button */
	clearAction() {
		this.state.onsave = undefined
		this.state.saveLabel = undefined
		this.state.element = undefined
	}

	get isOpen() {
		return this.state.open
	}

	get title() {
		return this.state.title
	}

	get content() {
		return this.state.content
	}

	get component() {
		return this.state.component
	}

	get componentProps() {
		return this.state.componentProps
	}

	get scrollable() {
		return this.state.scrollable ?? true
	}

	get activeItemId() {
		return this.state.activeItemId
	}

	get onsave() {
		return this.state.onsave
	}

	get saveLabel() {
		return this.state.saveLabel
	}

	get element() {
		return this.state.element
	}

	get onback() {
		return this.state.onback
	}
}

export const sidebar = new SidebarStore()

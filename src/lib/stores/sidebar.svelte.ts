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
}

class SidebarStore {
	state = $state<SidebarState>({
		open: false,
		title: undefined,
		content: undefined,
		component: undefined,
		componentProps: undefined,
		scrollable: true,
		activeItemId: undefined
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
		scrollable = true
	) {
		this.state.open = true
		this.state.title = title
		this.state.component = component
		this.state.componentProps = props
		this.state.content = undefined
		this.state.scrollable = scrollable
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
		}, 300)
	}

	toggle() {
		if (this.state.open) {
			this.close()
		} else {
			this.open()
		}
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
}

export const sidebar = new SidebarStore()

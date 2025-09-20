import type { Snippet, Component } from 'svelte'

// Standard sidebar width
export const SIDEBAR_WIDTH = '420px'

interface SidebarState {
	open: boolean
	title?: string
	content?: Snippet
	component?: Component
	componentProps?: Record<string, any>
}

class SidebarStore {
	state = $state<SidebarState>({
		open: false,
		title: undefined,
		content: undefined,
		component: undefined,
		componentProps: undefined
	})

	open(title?: string, content?: Snippet) {
		this.state.open = true
		this.state.title = title
		this.state.content = content
		this.state.component = undefined
		this.state.componentProps = undefined
	}

	openWithComponent(title: string, component: Component, props?: Record<string, any>) {
		this.state.open = true
		this.state.title = title
		this.state.component = component
		this.state.componentProps = props
		this.state.content = undefined
	}

	close() {
		this.state.open = false
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
}

export const sidebar = new SidebarStore()
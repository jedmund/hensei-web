import type { Snippet } from 'svelte'

// Standard sidebar width
export const SIDEBAR_WIDTH = '420px'

interface SidebarState {
	open: boolean
	title?: string
	content?: Snippet
}

class SidebarStore {
	state = $state<SidebarState>({
		open: false,
		title: undefined,
		content: undefined
	})

	open(title?: string, content?: Snippet) {
		this.state.open = true
		this.state.title = title
		this.state.content = content
	}

	close() {
		this.state.open = false
		// Clear content after animation
		setTimeout(() => {
			this.state.title = undefined
			this.state.content = undefined
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
}

export const sidebar = new SidebarStore()
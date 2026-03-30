import type { Editor } from '@tiptap/core'

class LinkDialogStore {
	open = $state(false)
	editor = $state<Editor | null>(null)
	initialUrl = $state('')

	show(editor: Editor, initialUrl = '') {
		this.editor = editor
		this.initialUrl = initialUrl
		this.open = true
	}

	close() {
		this.open = false
		this.editor = null
		this.initialUrl = ''
	}

	apply(url: string) {
		if (this.editor && url) {
			this.editor.chain().focus().toggleLink({ href: url }).run()
		}
		this.close()
	}
}

export const linkDialogState = new LinkDialogStore()

import type { Editor } from '@tiptap/core'

class LinkDialogStore {
	open = $state(false)
	editor = $state<Editor | null>(null)
	initialUrl = $state('')
	initialText = $state('')
	hasSelection = $state(false)

	show(editor: Editor, initialUrl = '', initialText = '') {
		this.editor = editor
		this.initialUrl = initialUrl
		this.initialText = initialText
		this.hasSelection = initialText.length > 0
		this.open = true
	}

	close() {
		this.open = false
		this.editor = null
		this.initialUrl = ''
		this.initialText = ''
		this.hasSelection = false
	}

	apply(url: string, text?: string) {
		if (this.editor && url) {
			if (text) {
				// Insert new text with link mark
				this.editor
					.chain()
					.focus()
					.insertContent({
						type: 'text',
						text,
						marks: [{ type: 'link', attrs: { href: url } }]
					})
					.run()
			} else {
				// Wrap existing selection with link
				this.editor.chain().focus().toggleLink({ href: url }).run()
			}
		}
		this.close()
	}
}

export const linkDialogState = new LinkDialogStore()

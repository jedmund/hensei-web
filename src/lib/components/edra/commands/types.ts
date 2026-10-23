import type { Editor } from '@tiptap/core'
import type { LucideIcon } from '@lucide/svelte'

export interface EdraToolBarCommands {
	name: string
	icon: LucideIcon
	tooltip?: string
	shortCut?: string
	onClick?: (editor: Editor) => void
	turnInto?: (editor: Editor, pos: number) => void
	isActive?: (editor: Editor) => boolean
	clickable?: (editor: Editor) => boolean
}

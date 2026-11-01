/**
 * Helpers for loading stored descriptions into the Tiptap editor.
 *
 * Rendering descriptions to HTML lives in `descriptionHtml.ts`; this module
 * only covers what the editor needs.
 */
import type { Content } from '@tiptap/core'
import * as m from '$lib/paraglide/messages'
import type { Description } from '$lib/types/api/party'

/**
 * Turns a stored description into editor content. Party descriptions are
 * Tiptap JSON serialized to a string; item notes are the Tiptap JSON object
 * itself. Strings that aren't JSON are legacy plain text and are wrapped in a
 * single paragraph.
 */
export function descriptionToContent(
	raw: string | Description | null | undefined
): Content | undefined {
	if (!raw) return undefined
	if (typeof raw !== 'string') return raw as Content
	try {
		return JSON.parse(raw)
	} catch {
		return {
			type: 'doc',
			content: [{ type: 'paragraph', content: [{ type: 'text', text: raw }] }]
		}
	}
}

type IsActive = (name: string, attrs?: Record<string, unknown>) => boolean

/** Label for the toolbar's text style dropdown, given the editor's `isActive`. */
export function textStyleLabel(isActive: IsActive): string {
	if (isActive('heading', { level: 1 })) return m.editor_heading_1()
	if (isActive('heading', { level: 2 })) return m.editor_heading_2()
	if (isActive('heading', { level: 3 })) return m.editor_heading_3()
	return m.editor_paragraph()
}

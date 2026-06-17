/**
 * EntityMention Extension
 *
 * Extends Tiptap's Mention extension to handle game entity mentions
 * (characters, weapons, summons). Renders as a span in the editor;
 * the read-only DescriptionRenderer handles linking to gbf.wiki.
 */
import Mention from '@tiptap/extension-mention'
import { mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { localizedName } from '$lib/utils/locale'
import { mentionChipAttrs } from './mentions/index.js'
import type { MentionToken } from './mentions/index.js'

export const EntityMention = Mention.extend({
	name: 'mention',

	addProseMirrorPlugins() {
		const parentPlugins = this.parent?.() ?? []
		return [
			...parentPlugins,
			new Plugin({
				key: new PluginKey('mentionPasteTransform'),
				props: {
					transformPastedHTML(html: string) {
						// Convert <a data-type="mention" ...> to <span data-type="mention" ...>
						// so ProseMirror's DOMParser recognizes them as mention nodes
						// instead of the Link mark consuming the <a> tag
						return html.replace(
							/<a\b([^>]*?\bdata-type="mention"[^>]*)>(.*?)<\/a>/gi,
							'<span$1>$2</span>'
						)
					}
				}
			})
		]
	},

	addAttributes() {
		return {
			...this.parent?.(),
			id: {
				default: null,
				parseHTML: (element: HTMLElement) => {
					const raw = element.getAttribute('data-id')
					if (!raw) return null
					try {
						return JSON.parse(raw)
					} catch {
						return raw
					}
				},
				renderHTML: (attributes: Record<string, unknown>) => {
					if (!attributes.id) return {}
					return {
						'data-id':
							typeof attributes.id === 'object' ? JSON.stringify(attributes.id) : attributes.id
					}
				}
			}
		}
	},

	renderHTML({ node, HTMLAttributes }) {
		const id = node.attrs.id

		// Localized name for display text
		const localized = localizedName(id?.name)
		const displayName = localized !== '—' ? localized : (id?.granblue_en ?? 'Unknown')

		// Normalize the type for legacy nodes that stored `searchableType` instead.
		const token = {
			...id,
			type: id?.type ?? id?.searchableType?.toLowerCase() ?? 'unknown'
		} as MentionToken

		return [
			'span',
			mergeAttributes(mentionChipAttrs(token), this.options.HTMLAttributes, HTMLAttributes),
			displayName
		]
	}
})

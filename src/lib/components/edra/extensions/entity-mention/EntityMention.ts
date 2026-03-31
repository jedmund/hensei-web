/**
 * EntityMention Extension
 *
 * Extends Tiptap's Mention extension to handle game entity mentions
 * (characters, weapons, summons). Renders as a span in the editor;
 * the read-only DescriptionRenderer handles linking to gbf.wiki.
 */
import Mention from '@tiptap/extension-mention'
import { mergeAttributes } from '@tiptap/core'
import { localizedName } from '$lib/utils/locale'

/** Element ID to slug mapping */
const ELEMENT_SLUGS: Record<number, string> = {
	0: 'null',
	1: 'wind',
	2: 'fire',
	3: 'water',
	4: 'earth',
	5: 'dark',
	6: 'light'
}

/**
 * Gets the element slug from various attribute formats
 * Handles both legacy (object with slug) and new (numeric) formats
 */
function getElementSlug(element: unknown): string {
	if (!element) return 'null'

	// Handle object format: { id: number, slug: string, ... }
	if (typeof element === 'object' && element !== null && 'slug' in element) {
		return (element as { slug: string }).slug
	}

	// Handle numeric format
	if (typeof element === 'number') {
		return ELEMENT_SLUGS[element] ?? 'null'
	}

	return 'null'
}

export const EntityMention = Mention.extend({
	name: 'mention',

	renderHTML({ node, HTMLAttributes }) {
		const id = node.attrs.id

		// Localized name for display text
		const localized = localizedName(id?.name)
		const displayName = localized !== '—' ? localized : (id?.granblue_en ?? 'Unknown')

		// Get element slug for styling
		const elementSlug = getElementSlug(id?.element)

		// Get entity type for additional styling/tracking
		const entityType = id?.type ?? id?.searchableType?.toLowerCase() ?? 'unknown'

		return [
			'span',
			mergeAttributes(
				{ 'data-type': this.name },
				{ 'data-element': elementSlug },
				{ 'data-entity-type': entityType },
				this.options.HTMLAttributes,
				HTMLAttributes
			),
			displayName
		]
	}
})

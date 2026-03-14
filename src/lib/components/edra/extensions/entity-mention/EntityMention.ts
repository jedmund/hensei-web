/**
 * EntityMention Extension
 *
 * Extends Tiptap's Mention extension to handle game entity mentions
 * (characters, weapons, summons). Renders as clickable links to gbf.wiki.
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

		// English name for wiki URL (wiki is English-only)
		const wikiName = id?.name?.en ?? id?.granblue_en ?? 'Unknown'

		// Localized name for display text
		const localized = localizedName(id?.name)
		const displayName = localized !== '—' ? localized : (id?.granblue_en ?? 'Unknown')

		// Get element slug for styling
		const elementSlug = getElementSlug(id?.element)

		// Get entity type for additional styling/tracking
		const entityType = id?.type ?? id?.searchableType?.toLowerCase() ?? 'unknown'

		return [
			'a',
			mergeAttributes(
				{
					href: `https://gbf.wiki/${encodeURIComponent(wikiName.replace(/ /g, '_'))}`,
					target: '_blank',
					rel: 'noopener noreferrer'
				},
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

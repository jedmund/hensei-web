import type { JSONContent } from '@tiptap/core'
import { localizedName } from '$lib/utils/locale'

/**
 * The first line of a party description, for previews: the first non-empty
 * paragraph or heading of the stored Tiptap JSON, or the first non-empty line
 * of a legacy plain-text description.
 */
export interface DescriptionPreview {
	text: string
	/** Content follows the first line */
	hasMore: boolean
}

const NONE: DescriptionPreview = { text: '', hasMore: false }

/** Inline text: plain text, or a mention's name */
function nodeText(node: JSONContent): string {
	if (node.type === 'text') return node.text ?? ''
	if (node.type === 'mention') {
		const id = node.attrs?.id as
			{ name?: { en?: string; ja?: string }; granblue_en?: string } | undefined
		const name = localizedName(id?.name)
		return name !== '—' ? name : (id?.granblue_en ?? '')
	}
	return ''
}

function blockText(block: JSONContent): string {
	return block.content?.map(nodeText).join('') ?? ''
}

const isTextBlock = (node: JSONContent) => node.type === 'paragraph' || node.type === 'heading'

export function descriptionPreview(content: string | null | undefined): DescriptionPreview {
	if (!content) return NONE

	try {
		const json = JSON.parse(content) as JSONContent
		if (json.type !== 'doc' || !json.content?.length) return NONE

		const first = json.content.findIndex((node) => isTextBlock(node) && blockText(node).trim())
		if (first === -1) return NONE

		// Lists, blockquotes and the like count as more
		const hasMore = json.content
			.slice(first + 1)
			.some((node) => (isTextBlock(node) ? blockText(node).trim().length > 0 : true))

		return { text: blockText(json.content[first]!).trim(), hasMore }
	} catch {
		const lines = content
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean)
		return { text: lines[0] ?? '', hasMore: lines.length > 1 }
	}
}

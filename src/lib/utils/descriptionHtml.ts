import type { JSONContent } from '@tiptap/core'
import { localizedName } from '$lib/utils/locale'
import { escapeHtml, safeHref } from '$lib/utils/safeHtml'
import {
	mentionChipAttrs,
	mentionHref
} from '$lib/components/edra/extensions/entity-mention/mentions/index.js'
import type { MentionToken } from '$lib/components/edra/extensions/entity-mention/mentions/index.js'
import * as m from '$lib/paraglide/messages'

/**
 * Renders stored Tiptap descriptions to HTML for `{@html}`.
 *
 * Descriptions are user-supplied JSON, so every value that reaches the markup
 * must be escaped, passed through `safeHref`, or checked against a fixed set
 * (e.g. heading levels).
 */

export interface ParsedDescription {
	html: string
	entities: Map<number, MentionToken>
}

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6]

function headingLevel(raw: unknown): number {
	return typeof raw === 'number' && HEADING_LEVELS.includes(raw) ? raw : 1
}

// Convert TipTap JSON to HTML, collecting mention entities as a side effect
// The collector map is passed in rather than mutating module-level state
function jsonToHtml(
	node: JSONContent,
	collector: Map<number, MentionToken>,
	counter: { value: number },
	truncate: boolean
): string {
	if (!node) return ''

	const children = () =>
		(node.content || []).map((n) => jsonToHtml(n, collector, counter, truncate)).join('')

	// Handle text nodes
	if (node.type === 'text') {
		let text = escapeHtml(node.text)

		// Apply marks (formatting)
		if (node.marks) {
			node.marks.forEach((mark) => {
				switch (mark.type) {
					case 'bold':
						text = `<strong>${text}</strong>`
						break
					case 'italic':
						text = `<em>${text}</em>`
						break
					case 'strike':
						text = `<s>${text}</s>`
						break
					case 'underline':
						text = `<u>${text}</u>`
						break
					case 'highlight':
						text = `<mark>${text}</mark>`
						break
					case 'link':
						text = `<a href="${safeHref(mark.attrs?.href)}" target="_blank" rel="noopener noreferrer">${text}</a>`
						break
					case 'code':
						text = `<code>${text}</code>`
						break
				}
			})
		}
		return text
	}

	// Handle different node types
	switch (node.type) {
		case 'doc':
			return children()

		case 'paragraph': {
			const content = children()
			return `<p>${content || '<br>'}</p>`
		}

		case 'heading': {
			// The level is interpolated into the tag name, so only 1–6 are allowed.
			const level = headingLevel(node.attrs?.level)
			return `<h${level}>${children()}</h${level}>`
		}

		case 'bulletList':
			return `<ul>${children()}</ul>`

		case 'orderedList':
			return `<ol>${children()}</ol>`

		case 'listItem':
			return `<li>${children()}</li>`

		case 'blockquote':
			return `<blockquote>${children()}</blockquote>`

		case 'codeBlock': {
			const codeContent = (node.content || []).map((n) => escapeHtml(n.text)).join('')
			return `<pre><code>${codeContent}</code></pre>`
		}

		case 'hardBreak':
			return '<br>'

		case 'horizontalRule':
			return '<hr>'

		case 'youtube': {
			const videoUrl = typeof node.attrs?.src === 'string' ? node.attrs.src : ''
			// Extract video ID from various YouTube URL formats
			let videoId = ''

			// Handle different YouTube URL formats
			const patterns = [
				/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
				/youtube\.com\/watch\?.*v=([^&\n?#]+)/
			]

			for (const pattern of patterns) {
				const match = videoUrl.match(pattern)
				if (match?.[1]) {
					videoId = match[1]
					break
				}
			}

			// If we couldn't extract an ID, or for the truncated view, show a link instead of embed
			if (!videoId || truncate) {
				return `<p><a href="${safeHref(videoUrl)}" target="_blank" rel="noopener noreferrer">${m.description_view_video()}</a></p>`
			}

			// Embed YouTube video with responsive iframe
			const safeVideoId = encodeURIComponent(videoId)
			return `<div class="video-wrapper">
					<iframe
						src="https://www.youtube.com/embed/${safeVideoId}"
						title="${escapeHtml(m.tooltip_youtube_video())}"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						allowfullscreen
					></iframe>
				</div>`
		}

		case 'mention': {
			// Handle game item / skill mentions
			const attrs = node.attrs?.id
			const token: MentionToken = {
				type: attrs?.type ?? attrs?.searchableType?.toLowerCase() ?? 'unknown',
				granblue_id: attrs?.granblue_id ?? '',
				name: attrs?.name ?? { en: 'Unknown', ja: 'Unknown' },
				element: attrs?.element,
				proficiency: attrs?.proficiency,
				season: attrs?.season,
				series: attrs?.series,
				styleSwap: attrs?.styleSwap,
				skill: attrs?.skill
			}
			const mentionName = localizedName(token.name)
			const displayName = mentionName !== '—' ? mentionName : (attrs?.granblue_en ?? 'Unknown')

			// Store the token for the hover tooltip.
			const idx = counter.value++
			collector.set(idx, token)

			// Shared chip attributes (data-type/element/entity-type/skill-color) come
			// from the single helper so the chip matches the editor node exactly.
			const chipAttrs = Object.entries(mentionChipAttrs(token))
				.map(([key, value]) => `${key}="${escapeHtml(value)}"`)
				.join(' ')
			const entityJson = escapeHtml(JSON.stringify(token))
			const shared = `class="mention" ${chipAttrs} data-id="${entityJson}" data-mention-index="${idx}"`

			// Skills have no wiki page, so they render as a non-linking span.
			const href = mentionHref(token)
			if (href) {
				return `<a href="${safeHref(href)}" target="_blank" rel="noopener noreferrer" ${shared}>${escapeHtml(displayName)}</a>`
			}
			return `<span ${shared}>${escapeHtml(displayName)}</span>`
		}

		default:
			// For unknown types, try to render content if it exists
			return node.content ? children() : ''
	}
}

/**
 * Parses a stored description (Tiptap JSON or plain text) into HTML plus the
 * mention entities referenced by `data-mention-index`.
 */
export function parseDescription(content?: string, truncate = false): ParsedDescription {
	if (!content) return { html: '', entities: new Map() }

	const collector = new Map<number, MentionToken>()
	const counter = { value: 0 }

	// Try to parse as JSON first
	try {
		const json = JSON.parse(content) as JSONContent
		return { html: jsonToHtml(json, collector, counter, truncate), entities: collector }
	} catch {
		// If not JSON, treat as plain text
		// Convert double newlines to paragraphs and single newlines to br tags
		const paragraphs = content.split('\n\n')
		const formatted = paragraphs
			.map((p) => {
				const lines = p.split('\n').map((line) => escapeHtml(line))
				return `<p>${lines.join('<br />')}</p>`
			})
			.join('')
		return { html: formatted, entities: collector }
	}
}

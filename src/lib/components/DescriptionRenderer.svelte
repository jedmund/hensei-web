<script lang="ts">
	import type { JSONContent } from '@tiptap/core'
	import { localizedName } from '$lib/utils/locale'
	import { computePosition, flip, shift, offset } from '@floating-ui/dom'
	import MentionTooltip from '$lib/components/ui/MentionTooltip.svelte'
	import * as m from '$lib/paraglide/messages'

	interface MentionEntity {
		granblue_id: string
		name: { en: string; ja: string }
		type: string
		element: { id: number; slug: string }
		proficiency?: number | number[]
		season?: number | null
		series?: number[] | { id: string; slug: string; name: { en: string; ja: string } }[] | null
		styleSwap?: boolean
	}

	interface Props {
		content?: string
		truncate?: boolean
		maxLines?: number
	}

	let { content, truncate = false, maxLines = 3 }: Props = $props()

	// Tooltip state
	let tooltipEntity: MentionEntity | null = $state(null)
	let tooltipVisible = $state(false)
	let tooltipEl: HTMLDivElement | null = $state(null)
	let containerEl: HTMLDivElement | null = $state(null)

	// Convert TipTap JSON to HTML, collecting mention entities as a side effect
	// The collector map is passed in rather than mutating module-level state
	function jsonToHtml(
		node: JSONContent,
		collector: Map<number, MentionEntity>,
		counter: { value: number }
	): string {
		if (!node) return ''

		// Handle text nodes
		if (node.type === 'text') {
			let text = node.text || ''

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
							text = `<a href="${mark.attrs?.href}" target="_blank" rel="noopener noreferrer">${text}</a>`
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
				return (node.content || []).map((n) => jsonToHtml(n, collector, counter)).join('')

			case 'paragraph': {
				const content = (node.content || []).map((n) => jsonToHtml(n, collector, counter)).join('')
				return `<p>${content || '<br>'}</p>`
			}

			case 'heading': {
				const level = node.attrs?.level || 1
				const headingContent = (node.content || [])
					.map((n) => jsonToHtml(n, collector, counter))
					.join('')
				return `<h${level}>${headingContent}</h${level}>`
			}

			case 'bulletList': {
				const listItems = (node.content || [])
					.map((n) => jsonToHtml(n, collector, counter))
					.join('')
				return `<ul>${listItems}</ul>`
			}

			case 'orderedList': {
				const orderedItems = (node.content || [])
					.map((n) => jsonToHtml(n, collector, counter))
					.join('')
				return `<ol>${orderedItems}</ol>`
			}

			case 'listItem': {
				const itemContent = (node.content || [])
					.map((n) => jsonToHtml(n, collector, counter))
					.join('')
				return `<li>${itemContent}</li>`
			}

			case 'blockquote': {
				const quoteContent = (node.content || [])
					.map((n) => jsonToHtml(n, collector, counter))
					.join('')
				return `<blockquote>${quoteContent}</blockquote>`
			}

			case 'codeBlock': {
				const codeContent = (node.content || []).map((n) => n.text || '').join('')
				return `<pre><code>${codeContent}</code></pre>`
			}

			case 'hardBreak':
				return '<br>'

			case 'horizontalRule':
				return '<hr>'

			case 'youtube': {
				const videoUrl = node.attrs?.src || ''
				// Extract video ID from various YouTube URL formats
				let videoId = ''

				// Handle different YouTube URL formats
				const patterns = [
					/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
					/youtube\.com\/watch\?.*v=([^&\n?#]+)/
				]

				for (const pattern of patterns) {
					const match = videoUrl.match(pattern)
					if (match) {
						videoId = match[1]
						break
					}
				}

				// If we couldn't extract an ID, fall back to link
				if (!videoId) {
					return `<p><a href="${videoUrl}" target="_blank" rel="noopener noreferrer">${m.description_view_video()}</a></p>`
				}

				// For truncated view, show a link instead of embed
				if (truncate) {
					return `<p><a href="${videoUrl}" target="_blank" rel="noopener noreferrer">${m.description_view_video()}</a></p>`
				}

				// Embed YouTube video with responsive iframe
				return `<div class="video-wrapper">
					<iframe
						src="https://www.youtube.com/embed/${videoId}"
						title="${m.tooltip_youtube_video()}"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						allowfullscreen
					></iframe>
				</div>`
			}

			case 'mention': {
				// Handle game item mentions
				const attrs = node.attrs?.id
				const wikiName = attrs?.name?.en || attrs?.granblue_en || 'Unknown'
				const mentionName = localizedName(attrs?.name)
				const displayName = mentionName !== '—' ? mentionName : attrs?.granblue_en || 'Unknown'
				const wikiUrl = `https://gbf.wiki/${wikiName}`
				const elementSlug = attrs?.element?.slug ?? ''
				const entityType = attrs?.type ?? ''

				// Store entity data for tooltip
				const idx = counter.value++
				collector.set(idx, {
					granblue_id: attrs?.granblue_id ?? '',
					name: attrs?.name ?? { en: wikiName, ja: wikiName },
					type: entityType,
					element: attrs?.element ?? { id: 0, slug: 'null' },
					proficiency: attrs?.proficiency,
					season: attrs?.season,
					series: attrs?.series,
					styleSwap: attrs?.styleSwap
				})

				return `<a href="${wikiUrl}" target="_blank" rel="noopener noreferrer" class="mention" data-element="${elementSlug}" data-entity-type="${entityType}" data-mention-index="${idx}">${displayName}</a>`
			}

			default:
				// For unknown types, try to render content if it exists
				if (node.content) {
					return (node.content || []).map((n) => jsonToHtml(n, collector, counter)).join('')
				}
				return ''
		}
	}

	// Parse content - handle both JSON and plain text
	function parseContent(content?: string): {
		html: string
		entities: Map<number, MentionEntity>
	} {
		if (!content) return { html: '', entities: new Map() }

		const collector = new Map<number, MentionEntity>()
		const counter = { value: 0 }

		// Try to parse as JSON first
		try {
			const json = JSON.parse(content) as JSONContent
			return { html: jsonToHtml(json, collector, counter), entities: collector }
		} catch {
			// If not JSON, treat as plain text
			// Convert double newlines to paragraphs and single newlines to br tags
			const paragraphs = content.split('\n\n')
			const formatted = paragraphs
				.map((p) => {
					const lines = p.split('\n')
					return `<p>${lines.join('<br />')}</p>`
				})
				.join('')
			return { html: formatted, entities: collector }
		}
	}

	const parsed = $derived(parseContent(content))
	const parsedHTML = $derived(parsed.html)
	const mentionEntities = $derived(parsed.entities)

	// Tooltip hover handlers
	function handleMentionEnter(event: MouseEvent) {
		const target = (event.target as HTMLElement).closest?.('.mention[data-mention-index]')
		if (!target) return

		const index = Number((target as HTMLElement).dataset.mentionIndex)
		const entity = mentionEntities.get(index)
		if (!entity) return

		tooltipEntity = entity
		tooltipVisible = true

		// Position tooltip using Floating UI
		requestAnimationFrame(() => {
			if (!tooltipEl) return
			computePosition(target as HTMLElement, tooltipEl, {
				placement: 'top',
				middleware: [offset(8), flip(), shift({ padding: 8 })]
			}).then(({ x, y }) => {
				if (tooltipEl) {
					tooltipEl.style.left = `${x}px`
					tooltipEl.style.top = `${y}px`
				}
			})
		})
	}

	function handleMentionLeave(event: MouseEvent) {
		const related = event.relatedTarget as HTMLElement | null
		if (related?.closest?.('.mention-tooltip-wrapper')) return
		tooltipVisible = false
		tooltipEntity = null
	}

	function handleTooltipLeave(event: MouseEvent) {
		const related = event.relatedTarget as HTMLElement | null
		if (related?.closest?.('.mention[data-mention-index]')) return
		tooltipVisible = false
		tooltipEntity = null
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="description-content"
	class:truncate
	style={truncate ? `--max-lines: ${maxLines}` : ''}
	bind:this={containerEl}
	onmouseenter={handleMentionEnter}
	onmouseover={handleMentionEnter}
	onmouseleave={handleMentionLeave}
>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html parsedHTML}
</div>

{#if tooltipEntity}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="mention-tooltip-wrapper" bind:this={tooltipEl} onmouseleave={handleTooltipLeave}>
		<MentionTooltip entity={tooltipEntity} visible={tooltipVisible} />
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/typography' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;

	.description-content {
		color: var(--text-primary);
		font-size: $font-regular;
		line-height: 1.6;

		// Basic HTML styling for generated content
		:global {
			p {
				margin: 0 0 $unit 0;

				&:last-child {
					margin-bottom: 0;
				}
			}

			h1,
			h2,
			h3 {
				font-weight: $bold;
				margin: $unit 0 $unit-half 0;
			}

			h1 {
				font-size: $font-xlarge;
			}

			h2 {
				font-size: $font-large;
			}

			h3 {
				font-size: $font-medium;
			}

			strong,
			b {
				font-weight: $bold;
			}

			em,
			i {
				font-style: italic;
			}

			a {
				color: var(--accent-blue);
				text-decoration: none;

				&:hover {
					text-decoration: underline;
				}
			}

			mark {
				background: rgba(255, 237, 76, 0.3);
				color: var(--text-primary);
				padding: 0 $unit-fourth;
				border-radius: $input-corner;
				font-weight: $medium;
			}

			.mention {
				padding: 2px $unit-half;
				border-radius: $input-corner;
				text-decoration: none;
				font-weight: $medium;
				background: var(--null-mention-bg);
				color: var(--text-primary);
				transition:
					background 0.15s,
					opacity 0.15s;

				&:hover {
					opacity: 0.8;
					text-decoration: none;
				}

				&[data-element='wind'] {
					background: var(--wind-mention-bg);
					color: var(--wind-text);
				}

				&[data-element='fire'] {
					background: var(--fire-mention-bg);
					color: var(--fire-text);
				}

				&[data-element='water'] {
					background: var(--water-mention-bg);
					color: var(--water-text);
				}

				&[data-element='earth'] {
					background: var(--earth-mention-bg);
					color: var(--earth-text);
				}

				&[data-element='dark'] {
					background: var(--dark-mention-bg);
					color: var(--dark-text);
				}

				&[data-element='light'] {
					background: var(--light-mention-bg);
					color: var(--light-text);
				}
			}

			ul,
			ol {
				margin: 0 0 $unit 0;
				padding-left: $unit-3x;
			}

			li {
				margin: $unit-half 0;
			}

			code {
				background: var(--button-bg);
				padding: 2px $unit-half;
				border-radius: $input-corner;
				font-family: monospace;
				font-size: 0.9em;
			}

			pre {
				background: var(--button-bg);
				padding: $unit;
				border-radius: $card-corner;
				overflow-x: auto;
				margin: $unit 0;

				code {
					background: none;
					padding: 0;
				}
			}

			blockquote {
				border-left: 3px solid var(--accent-blue);
				padding-left: $unit-2x;
				margin: $unit 0;
				font-style: italic;
				color: var(--text-secondary);
			}

			hr {
				border: none;
				border-top: 1px solid var(--button-bg);
				margin: $unit-2x 0;
			}

			// Responsive YouTube video embed
			.video-wrapper {
				position: relative;
				padding-bottom: 56.25%; // 16:9 aspect ratio
				height: 0;
				overflow: hidden;
				margin: $unit 0;
				border-radius: $card-corner;
				background: var(--button-bg);

				iframe {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					border: 0;
					border-radius: $card-corner;
				}
			}
		}

		&.truncate {
			display: -webkit-box;
			-webkit-line-clamp: var(--max-lines, 3);
			line-clamp: var(--max-lines, 3);
			-webkit-box-orient: vertical;
			overflow: hidden;
			text-overflow: ellipsis;

			// Hide block elements that might break truncation
			:global {
				pre,
				blockquote,
				ul,
				ol {
					display: inline;
				}
			}
		}
	}

	.mention-tooltip-wrapper {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 9999;
		pointer-events: auto;
	}
</style>
